import React, { useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dialog, InputGroup, Menu, MenuItem, Popover, Spinner } from '@blueprintjs/core';
import { Icon } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) page.set({ width: w, height: h });
});

// Helper: convert Blob → base64 data URL (data:application/pdf;base64,...)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================
// Woo product + variation map
// ============================
const PRODUCT_ID = 199649;

// Key format: size|amt|color|paper  (USING WOO SLUG VALUES)
const VARIATION_MAP = {
  // --- SOFT ---
  '22x28|1|color|soft': 199650,

  '11x17|1|black-and-white|soft': 199665,
  '8-5x11|1|black-and-white|soft': 199666,
  '11x17|1|color|soft': 199667,
  '8-5x11|1|color|soft': 199668,
  '8-5x11|2|black-and-white|soft': 199669,
  '8-5x11|2|color|soft': 199670,
  '8-5x11|35|black-and-white|soft': 199671,
  '8-5x11|35|color|soft': 199672,
  '8-5x11|4|black-and-white|soft': 199673,
  '8-5x11|4|color|soft': 199674,
  '8-5x11|9|black-and-white|soft': 199675,
  '8-5x11|9|color|soft': 199676,

  // --- HARD ---
  '11x17|1|black-and-white|hard': 199651,
  '13x19|1|black-and-white|hard': 199652,
  '8-5x11|1|black-and-white|hard': 199653,
  '11x17|1|color|hard': 199654,
  '13x19|1|color|hard': 199655,
  '8-5x11|1|color|hard': 199656,
  '8-5x11|2|black-and-white|hard': 199657,
  '8-5x11|2|color|hard': 199658,
  '8-5x11|35|black-and-white|hard': 199659,
  '8-5x11|35|color|hard': 199660,
  '8-5x11|4|black-and-white|hard': 199661,
  '8-5x11|4|color|hard': 199662,
  '8-5x11|9|black-and-white|hard': 199663,
  '8-5x11|9|color|hard': 199664,
};

/**
 * ✅ Price map (same keys as VARIATION_MAP)
 * Fill these with your actual Woo prices.
 * Based on your page source earlier, examples were:
 * 22x28 color soft = 11.50
 * 13x19 BW hard = 1.85
 * 8.5x11 BW soft = 0.08
 * etc.
 */
const PRICE_MAP = {
  // --- SOFT ---
  '22x28|1|color|soft': 11.5,

  '11x17|1|black-and-white|soft': 0.25,
  '8-5x11|1|black-and-white|soft': 0.08,
  '11x17|1|color|soft': 0.95,
  '8-5x11|1|color|soft': 0.55,
  '8-5x11|2|black-and-white|soft': 0.08,
  '8-5x11|2|color|soft': 0.55,
  '8-5x11|35|black-and-white|soft': 0.08,
  '8-5x11|35|color|soft': 0.55,
  '8-5x11|4|black-and-white|soft': 0.08,
  '8-5x11|4|color|soft': 0.55,
  '8-5x11|9|black-and-white|soft': 0.08,
  '8-5x11|9|color|soft': 0.55,

  // --- HARD ---
  '11x17|1|black-and-white|hard': 0.55,
  '13x19|1|black-and-white|hard': 1.85,
  '8-5x11|1|black-and-white|hard': 0.25,
  '11x17|1|color|hard': 1.5,
  '13x19|1|color|hard': 3,
  '8-5x11|1|color|hard': 0.65,
  '8-5x11|2|black-and-white|hard': 0.25,
  '8-5x11|2|color|hard': 0.65,
  '8-5x11|35|black-and-white|hard': 0.25,
  '8-5x11|35|color|hard': 0.65,
  '8-5x11|4|black-and-white|hard': 0.25,
  '8-5x11|4|color|hard': 0.65,
  '8-5x11|9|black-and-white|hard': 0.25,
  '8-5x11|9|color|hard': 0.65,
};

function resolveVariationId({ size, amtPerPage, printColor, paperType }) {
  const key = `${size}|${amtPerPage}|${printColor}|${paperType}`;
  return VARIATION_MAP[key] || null;
}

function resolvePrice({ size, amtPerPage, printColor, paperType }) {
  const key = `${size}|${amtPerPage}|${printColor}|${paperType}`;
  return PRICE_MAP[key]; // undefined => not available / not mapped
}

// Build a list of variations so we can compute "possible options"
const ALL_VARIATIONS = Object.keys(VARIATION_MAP).map((key) => {
  const [size, amtPerPage, printColor, paperType] = key.split('|');
  return { key, size, amtPerPage, printColor, paperType };
});

function optionBtnStyle(isPossible) {
  return {
    opacity: isPossible ? 1 : 0.35,
    textDecoration: isPossible ? 'none' : 'line-through',
  };
}

function formatMoney(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '';
  return `$${n.toFixed(2)}`;
}

const TopNav = observer(({ store }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const resizeButtonRef = useRef(null);

  // Options modal state
  const [optionsOpen, setOptionsOpen] = useState(false);

  // IMPORTANT: these are WOO SLUG values from your page source
  const [optSize, setOptSize] = useState('8-5x11');
  const [optAmt, setOptAmt] = useState('1');
  const [optColor, setOptColor] = useState('black-and-white');
  const [optPaper, setOptPaper] = useState('hard');

  // compute possible Amt/Color/Paper based ONLY on selected size
  const possibleBySize = useMemo(() => {
    const rows = ALL_VARIATIONS.filter((v) => v.size === optSize);
    return {
      amts: new Set(rows.map((v) => v.amtPerPage)),
      colors: new Set(rows.map((v) => v.printColor)),
      papers: new Set(rows.map((v) => v.paperType)),
    };
  }, [optSize]);

  // If size changes and previous selection becomes invalid, snap it
  const normalizeSelectionForSize = (newSize) => {
    const rows = ALL_VARIATIONS.filter((v) => v.size === newSize);
    const amts = new Set(rows.map((v) => v.amtPerPage));
    const colors = new Set(rows.map((v) => v.printColor));
    const papers = new Set(rows.map((v) => v.paperType));

    const pickFirst = (set, fallback) => {
      const arr = Array.from(set);
      return arr.length ? arr[0] : fallback;
    };

    if (!amts.has(optAmt)) setOptAmt(pickFirst(amts, '1'));
    if (!colors.has(optColor)) setOptColor(pickFirst(colors, 'black-and-white'));
    if (!papers.has(optPaper)) setOptPaper(pickFirst(papers, 'hard'));
  };

  const sizeOptions = [
    { value: '11x17', label: '11"×17"' },
    { value: '13x19', label: '13"×19"' },
    { value: '22x28', label: '22"×28"' },
    { value: '8-5x11', label: '8.5"×11"' },
  ];

  const handleResize = (w, h) => {
    applyResize(store, w, h);
    setDialogOpen(false);
  };

  const handleCustomResize = () => {
    const width = parseFloat(customWidth) * 72;
    const height = parseFloat(customHeight) * 72;
    if (!isNaN(width) && !isNaN(height)) handleResize(width, height);
  };

  const handleDownloadImage = () => {
    const dataURL = store.toDataURL();
    downloadFile(dataURL, 'design.png');
  };

  const handleDownloadPDF = async () => {
    if (typeof store.toPDFBlob !== 'function') {
      alert('PDF export is not available in this build.');
      return;
    }
    const blob = await store.toPDFBlob();
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'design.pdf');
    URL.revokeObjectURL(url);
  };

  // Save the print PNG and the editable Polotno template JSON via REST.
  const saveDesignToWP = async () => {
    const token = import.meta.env.VITE_POLOTNO_WP_TOKEN;
    if (!token) {
      throw new Error('Missing VITE_POLOTNO_WP_TOKEN (set it in .env locally and in Vercel env vars).');
    }

    // Make sure fonts/images are fully loaded before creating the order artwork.
    await store.waitLoading();

    const pngBase64 = await store.toDataURL({
      mimeType: 'image/png',
      quality: 1,
    });

    // Send the native editable Polotno design as a JSON string.
    // Sending a string avoids WordPress/PHP nested-object parsing edge cases.
    const designJson = JSON.stringify(store.toJSON());

    // No PDF is needed for this order flow.
    const pdfBase64 = '';

    const res = await fetch('https://tuteachercenter.org/wp-json/polotno/v1/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Polotno-Token': token,
      },
      body: JSON.stringify({
        pngBase64,
        pdfBase64,
        designJson,
      }),
    });

    const responseText = await res.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Save endpoint returned invalid JSON (HTTP ${res.status}).`);
    }

    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || `Save failed (HTTP ${res.status})`);
    }

    // Do not add the product to the cart unless BOTH files were saved.
    // This prevents the editable template from failing silently.
    if (!data.json_saved || !data.json_url) {
      throw new Error(
        data.json_warning ||
          'The PNG saved, but the editable template did not. Update/activate the Polotno Editable Order Files plugin.'
      );
    }

    return data;
  };

  const handleTestSave = async () => {
    setPopupLoading(true);
    try {
      const data = await saveDesignToWP();
      console.log('✅ REST save OK:', data);
      alert(
        `Saved!\nDesign ID: ${data.design_id}\nPNG: ${data.png_url || ''}\nTemplate: ${data.json_url || ''}`
      );
    } catch (err) {
      console.error('❌ REST save test failed:', err);
      alert(`REST save failed:\n${err.message || err}`);
    } finally {
      setPopupLoading(false);
    }
  };

  const currentVariationId = useMemo(() => {
    return resolveVariationId({
      size: optSize,
      amtPerPage: optAmt,
      printColor: optColor,
      paperType: optPaper,
    });
  }, [optSize, optAmt, optColor, optPaper]);

  const currentPrice = useMemo(() => {
    return resolvePrice({
      size: optSize,
      amtPerPage: optAmt,
      printColor: optColor,
      paperType: optPaper,
    });
  }, [optSize, optAmt, optColor, optPaper]);

  const isCurrentSelectionValid = !!currentVariationId;

  const handleConfirmAddToCart = async () => {
    console.log('🛒 Confirm & Add to Cart clicked');
    setPopupLoading(true);

    try {
      if (!currentVariationId) {
        alert('That combination is not available.');
        return;
      }

      const saved = await saveDesignToWP();
      const designId = saved.design_id;

      // Woo expects form-encoded for wc-ajax add_to_cart
      const form = new URLSearchParams();
      form.set('product_id', String(PRODUCT_ID));
      form.set('variation_id', String(currentVariationId));
      form.set('quantity', '1');

      // variation attributes
      form.set('attribute_pa_size', String(optSize));
      form.set('attribute_pa_amt-per-page', String(optAmt));
      form.set('attribute_pa_print-color', String(optColor));
      form.set('attribute_pa_paper-type', String(optPaper));

      // Explicitly send all file references into WooCommerce.
      form.set('polotno_design_id', String(designId));
      form.set('polotno_json_url', String(saved.json_url || ''));
      form.set('polotno_png_url', String(saved.png_url || ''));

      const res = await fetch('https://tuteachercenter.org/?wc-ajax=add_to_cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: form.toString(),
        credentials: 'include', // IMPORTANT: keeps Woo session cookies
      });

      const data = await res.json();

      if (!data || data.error) {
        throw new Error(data?.message || 'Add to cart failed');
      }

      // Update Woo cart fragments + trigger mini-cart open (theme/plugin listens for this)
      if (data.fragments) {
        Object.keys(data.fragments).forEach((selector) => {
          const html = data.fragments[selector];
          const el = document.querySelector(selector);
          if (el) el.outerHTML = html;
        });
      }

      // Fire Woo events that many themes use to open the mini cart
      if (window.jQuery) {
        window.jQuery(document.body).trigger('added_to_cart', [
          data.fragments,
          data.cart_hash,
          null,
        ]);
      } else {
        document.body.dispatchEvent(new CustomEvent('added_to_cart'));
      }

      // optional: close modal after success
      setOptionsOpen(false);
    } catch (err) {
      console.error('❌ Add to cart failed:', err);
      alert(err?.message || 'Could not add to cart. Please try again.');
    } finally {
      setPopupLoading(false);
    }
  };

  const downloadMenu = (
    <Menu>
      <MenuItem text="Save as Image" onClick={handleDownloadImage} />
      <MenuItem text="Save as PDF" onClick={handleDownloadPDF} />
      <MenuItem text="Test Save (Dev)" onClick={handleTestSave} />
    </Menu>
  );

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '50px',
          background: 'linear-gradient(to right, #488fcc, #ce3c4f)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          boxSizing: 'border-box',
          color: 'white',
          gap: '12px',
        }}
      >
        <a href="https://tuteachercenter.org" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.webp" alt="Logo" style={{ height: '30px' }} />
        </a>

        <Button
          minimal
          elementRef={resizeButtonRef}
          onClick={() => setDialogOpen(true)}
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: 'white',
            padding: '9px 14px',
            borderRadius: '3px',
            background: 'transparent',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          RESIZE
        </Button>

        <div style={{ flex: 1 }} />

        <Popover content={downloadMenu} position="bottom-right">
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#ce3c4f',
              border: '1px solid white',
              padding: '9px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease-in-out',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = '#ce3c4f';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ce3c4f';
              e.currentTarget.style.color = 'white';
            }}
          >
            <Icon icon="download" />
            Download
          </button>
        </Popover>

        <Button
          onClick={() => setOptionsOpen(true)}
          style={{
            marginLeft: '8px',
            textTransform: 'uppercase',
            color: '#ce3d50',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #ce3d50',
            padding: '6px 12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fceced')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          Add to Cart
        </Button>
      </div>

      {popupLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Spinner intent="primary" size={100} />
        </div>
      )}

      {/* Print Options Modal */}
      <Dialog
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        title="Print Options"
        canOutsideClickClose={!popupLoading}
        enforceFocus
      >
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Size</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sizeOptions.map((o) => (
                <Button
                  key={o.value}
                  active={optSize === o.value}
                  onClick={() => {
                    setOptSize(o.value);
                    normalizeSelectionForSize(o.value);
                  }}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Amount Per Page</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['1', '2', '4', '9', '35'].map((v) => {
                const isPossible = possibleBySize.amts.has(v);
                return (
                  <Button
                    key={v}
                    active={optAmt === v}
                    disabled={!isPossible}
                    style={optionBtnStyle(isPossible)}
                    onClick={() => setOptAmt(v)}
                  >
                    {v}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Print Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'black-and-white', label: 'Black and White' },
                { value: 'color', label: 'Color' },
              ].map((o) => {
                const isPossible = possibleBySize.colors.has(o.value);
                return (
                  <Button
                    key={o.value}
                    active={optColor === o.value}
                    disabled={!isPossible}
                    style={optionBtnStyle(isPossible)}
                    onClick={() => setOptColor(o.value)}
                  >
                    {o.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Paper Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'hard', label: 'Hard' },
                { value: 'soft', label: 'Soft' },
              ].map((o) => {
                const isPossible = possibleBySize.papers.has(o.value);
                return (
                  <Button
                    key={o.value}
                    active={optPaper === o.value}
                    disabled={!isPossible}
                    style={optionBtnStyle(isPossible)}
                    onClick={() => setOptPaper(o.value)}
                  >
                    {o.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* ✅ Price only (no selection box) */}
          <div style={{ marginTop: 2, fontSize: 14 }}>
            <strong>Price:</strong>{' '}
            {typeof currentPrice === 'number' ? (
              <span>{formatMoney(currentPrice)}</span>
            ) : isCurrentSelectionValid ? (
              <span>(price not mapped yet)</span>
            ) : (
              <span style={{ color: '#b00020' }}>Not available</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <Button onClick={() => setOptionsOpen(false)} disabled={popupLoading}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={popupLoading}
              disabled={!isCurrentSelectionValid}
              onClick={() => {
                setOptionsOpen(false);
                handleConfirmAddToCart();
              }}
            >
              Confirm & Add to Cart
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Resize Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Resize Canvas"
        autoFocus
        enforceFocus
        canOutsideClickClose
        style={{
          width: '320px',
          position: 'absolute',
          top: '60px',
          left: resizeButtonRef.current?.getBoundingClientRect().left ?? 100,
          zIndex: 9999,
        }}
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button onClick={() => handleResize(612, 792)}>8.5″ × 11″ (Letter)</Button>
          <Button onClick={() => handleResize(792, 1224)}>11″ × 17″ (Double)</Button>
          <Button onClick={() => handleResize(936, 1368)}>13″ × 19″ (Small Poster)</Button>
          <Button onClick={() => handleResize(1296, 1728)}>18″ × 24″ (Large Poster)</Button>
          <Button onClick={() => handleResize(1728, 2016)}>24″ × 28″ (Oaktag)</Button>
          <hr />
          <div style={{ display: 'flex', gap: '8px' }}>
            <InputGroup placeholder="Width (inches)" value={customWidth} onChange={(e) => setCustomWidth(e.target.value)} />
            <InputGroup placeholder="Height (inches)" value={customHeight} onChange={(e) => setCustomHeight(e.target.value)} />
          </div>
          <Button intent="primary" style={{ backgroundColor: '#488FCC', padding: '9px 14px' }} onClick={handleCustomResize}>
            Apply Custom Size
          </Button>
        </div>
      </Dialog>
    </>
  );
});

export default TopNav;