import React, { useMemo, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, Dialog, InputGroup, Spinner } from '@blueprintjs/core';
import { Icon } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) page.set({ width: w, height: h });
});

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

const WOO_BASE = 'https://tuteachercenter.org';

// ---------- helpers ----------
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
  return PRICE_MAP[key];
}

function fmtMoney(n) {
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  return `$${num.toFixed(2)}`;
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// For option availability:
function existsMatchingVariation(current, overrides = {}) {
  const s = { ...current, ...overrides };
  const keys = Object.keys(VARIATION_MAP);

  return keys.some((k) => {
    const [size, amt, color, paper] = k.split('|');
    return (
      String(s.size) === size &&
      String(s.amtPerPage) === amt &&
      String(s.printColor) === color &&
      String(s.paperType) === paper
    );
  });
}

// Find first valid variation key for a partially invalid selection (auto-fix)
function findNearestValid(current) {
  const keys = Object.keys(VARIATION_MAP).map((k) => {
    const [size, amtPerPage, printColor, paperType] = k.split('|');
    return { size, amtPerPage, printColor, paperType };
  });

  const scored = keys
    .map((v) => {
      let score = 0;
      if (v.size === current.size) score += 3;
      if (v.paperType === current.paperType) score += 2;
      if (v.printColor === current.printColor) score += 1;
      if (v.amtPerPage === current.amtPerPage) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored[0]?.v || null;
}

// -----------------------------
// postMessage RPC helper
// -----------------------------
function postToParentRpc(type, payload, { timeoutMs = 9000 } = {}) {
  const requestId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error(`${type} timed out`));
    }, timeoutMs);

    function onMessage(event) {
      const msg = event.data || {};
      if (msg.requestId !== requestId) return;

      // We accept either:
      // 1) { type: "POL_*_RESULT", requestId, payload: {...} }
      // 2) { requestId, ok: true/false, ... }  (looser)
      clearTimeout(t);
      window.removeEventListener('message', onMessage);

      const p = msg.payload ?? msg;

      if (p && p.ok === false) {
        reject(new Error(p.error || 'Request failed'));
        return;
      }
      resolve(p);
    }

    window.addEventListener('message', onMessage);

    // Send to parent. Your bridge/plugin should validate origin on its side.
    window.parent.postMessage({ type, requestId, payload }, '*');
  });
}

// Extract numeric price from Woo variation response (robust)
function extractPriceNumberFromVariation(variation) {
  if (!variation) return null;

  // common fields
  const candidates = [
    variation.display_price,
    variation.display_regular_price,
    variation.price,
    variation.sale_price,
    variation.regular_price,
  ];

  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }

  // sometimes price_html includes number; don't rely on it.
  return null;
}

const TopNav = observer(({ store }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [popupLoading, setPopupLoading] = useState(false);
  const resizeButtonRef = useRef(null);

  // Options modal
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [cartSuccessOpen, setCartSuccessOpen] = useState(false);

  // selections (Woo slugs)
  const [optSize, setOptSize] = useState('8-5x11');
  const [optAmt, setOptAmt] = useState('1');
  const [optColor, setOptColor] = useState('black-and-white');
  const [optPaper, setOptPaper] = useState('hard');

  // price
  const [priceLoading, setPriceLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null); // number|null
  const [priceError, setPriceError] = useState('');

  // debounce timer for price
  const priceTimerRef = useRef(null);

  const selection = useMemo(
    () => ({
      size: optSize,
      amtPerPage: optAmt,
      printColor: optColor,
      paperType: optPaper,
    }),
    [optSize, optAmt, optColor, optPaper]
  );

  const isCurrentComboValid = useMemo(() => {
    return !!resolveVariationId(selection);
  }, [selection]);

  // availability helpers
  const avail = useMemo(() => {
    const cur = selection;
    return {
      size: (v) => existsMatchingVariation(cur, { size: v }),
      amt: (v) => existsMatchingVariation(cur, { amtPerPage: v }),
      color: (v) => existsMatchingVariation(cur, { printColor: v }),
      paper: (v) => existsMatchingVariation(cur, { paperType: v }),
    };
  }, [selection]);

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

  // Save design via parent-page RPC (NO CORS) and return { success, design_id, png_url }
  const saveDesignToWP = async () => {
    const pngBase64 = await store.toDataURL({ mimeType: 'image/png', quality: 1 });

    // Call the WP-domain bridge (same-origin) via postMessage RPC
    const result = await postToParentRpc("POL_SAVE_DESIGN", { pngBase64 }, { timeoutMs: 30000 });

    if (!result || !result.ok) {
      throw new Error((result && result.error) ? result.error : "Save failed");
    }

    // result.data is the JSON returned by /wp-json/polotno/v1/save
    // { success:true, design_id, png_url }
    const data = result.data;

    if (!data || !data.success) {
      throw new Error((data && data.error) ? data.error : "Save failed");
    }

    return data;
  };

  // ✅ Price updater from local PRICE_MAP
  // No WooCommerce lookup, no postMessage, no timeout.
  const updatePrice = (nextSelection) => {
    setPriceError('');
    setPriceLoading(false);

    // If combo invalid, don't show a price
    if (!resolveVariationId(nextSelection)) {
      setCurrentPrice(null);
      setPriceError('This combination is not available.');
      return;
    }

    const priceNum = resolvePrice(nextSelection);

    if (typeof priceNum === 'number' && !Number.isNaN(priceNum)) {
      setCurrentPrice(priceNum);
    } else {
      setCurrentPrice(null);
      setPriceError('Price not mapped yet for this selection.');
    }
  };

  // Debounced price updates while modal is open
  useEffect(() => {
    if (!optionsOpen) return;

    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      updatePrice(selection);
    }, 250);

    return () => {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsOpen, selection]);

  const openOptions = async () => {
    // If current combo is invalid, snap to a valid nearest.
    if (!resolveVariationId(selection)) {
      const nearest = findNearestValid(selection);
      if (nearest) {
        setOptSize(nearest.size);
        setOptAmt(nearest.amtPerPage);
        setOptColor(nearest.printColor);
        setOptPaper(nearest.paperType);
      }
    }

    setOptionsOpen(true);

    // initial price load using the (possibly updated) selection
    setTimeout(() => {
      updatePrice({
        size: optSize,
        amtPerPage: optAmt,
        printColor: optColor,
        paperType: optPaper,
      });
    }, 0);
  };

  // When you click an option:
  const setOptionSafely = (patch) => {
    const next = { ...selection, ...patch };

    if (resolveVariationId(next)) {
      if (patch.size !== undefined) setOptSize(patch.size);
      if (patch.amtPerPage !== undefined) setOptAmt(patch.amtPerPage);
      if (patch.printColor !== undefined) setOptColor(patch.printColor);
      if (patch.paperType !== undefined) setOptPaper(patch.paperType);

      updatePrice(next);
      return;
    }

    const nearest = findNearestValid(next);
    if (!nearest) return;

    const forced = { ...nearest, ...patch };
    const final = resolveVariationId(forced) ? forced : nearest;

    setOptSize(final.size);
    setOptAmt(final.amtPerPage);
    setOptColor(final.printColor);
    setOptPaper(final.paperType);

    updatePrice(final);
  };

  // ✅ Confirm → save → add to cart via parent postMessage (NO CORS)
  // Fallback: redirect add-to-cart if not in iframe
  const handleConfirmAddToCart = async () => {
    console.log('🛒 Confirm & Add to Cart clicked');
    setPopupLoading(true);

    try {
      const variationId = resolveVariationId(selection);
      if (!variationId) {
        alert('That combination is not available.');
        return;
      }

      const saved = await saveDesignToWP();
      const designId = saved.design_id;

      const attributes = {
        attribute_pa_size: String(selection.size),
        'attribute_pa_amt-per-page': String(selection.amtPerPage),
        'attribute_pa_print-color': String(selection.printColor),
        'attribute_pa_paper-type': String(selection.paperType),
      };

      // If embedded on WP page, ask parent to add-to-cart and open side cart
      if (inIframe()) {
        console.log('📨 RPC to parent for AJAX add-to-cart');

        // Prefer the new RPC message:
        await postToParentRpc('POL_ADD_TO_CART', {
          product_id: PRODUCT_ID,
          variation_id: variationId,
          quantity: 1,
          attributes,
          polotno_design_id: designId,
        });

        setOptionsOpen(false);
        setCartSuccessOpen(true);
        return;
      }

      // Fallback: redirect add-to-cart (standalone)
      const params = new URLSearchParams();
      params.set('add-to-cart', String(PRODUCT_ID));
      params.set('variation_id', String(variationId));
      params.set('quantity', '1');

      params.set('attribute_pa_size', String(selection.size));
      params.set('attribute_pa_amt-per-page', String(selection.amtPerPage));
      params.set('attribute_pa_print-color', String(selection.printColor));
      params.set('attribute_pa_paper-type', String(selection.paperType));

      params.set('polotno_design_id', String(designId));

      window.location.href = `${WOO_BASE}/?${params.toString()}`;
    } catch (err) {
      console.error('❌ Add to cart failed:', err);
      alert(`Could not save/add to cart.\n\n${err?.message || err}`);
    } finally {
      setPopupLoading(false);
    }
  };

  const downloadMenu = (
    <Menu>
      <MenuItem text="Save as Image" onClick={handleDownloadImage} />
    </Menu>
  );

  // UI helper: strike/fade unavailable values, but allow click
  const OptionButton = ({ active, disabledLook, onClick, children }) => (
    <Button
      active={active}
      onClick={onClick}
      style={{
        opacity: disabledLook ? 0.45 : 1,
        textDecoration: disabledLook ? 'line-through' : 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </Button>
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
        <a href={WOO_BASE} style={{ display: 'flex', alignItems: 'center' }}>
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
          onClick={openOptions}
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
              {[
                { v: '8-5x11', label: '8.5"×11"' },
                { v: '11x17', label: '11"×17"' },
                { v: '13x19', label: '13"×19"' },
                { v: '22x28', label: '22"×28"' },
              ].map((o) => (
                <OptionButton
                  key={o.v}
                  active={optSize === o.v}
                  disabledLook={!avail.size(o.v)}
                  onClick={() => setOptionSafely({ size: o.v })}
                >
                  {o.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Amount Per Page</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['1', '2', '4', '9', '35'].map((v) => (
                <OptionButton
                  key={v}
                  active={optAmt === v}
                  disabledLook={!avail.amt(v)}
                  onClick={() => setOptionSafely({ amtPerPage: v })}
                >
                  {v}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Print Color</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <OptionButton
                active={optColor === 'black-and-white'}
                disabledLook={!avail.color('black-and-white')}
                onClick={() => setOptionSafely({ printColor: 'black-and-white' })}
              >
                Black and White
              </OptionButton>
              <OptionButton
                active={optColor === 'color'}
                disabledLook={!avail.color('color')}
                onClick={() => setOptionSafely({ printColor: 'color' })}
              >
                Color
              </OptionButton>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Paper Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <OptionButton
                active={optPaper === 'hard'}
                disabledLook={!avail.paper('hard')}
                onClick={() => setOptionSafely({ paperType: 'hard' })}
              >
                Hard
              </OptionButton>
              <OptionButton
                active={optPaper === 'soft'}
                disabledLook={!avail.paper('soft')}
                onClick={() => setOptionSafely({ paperType: 'soft' })}
              >
                Soft
              </OptionButton>
            </div>
          </div>

          {/* spacing + divider line above price */}
          <div style={{ marginTop: 8 }} />
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', marginTop: 4 }} />
          <div style={{ marginTop: 10 }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Price</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {resolveVariationId(selection)
              ? (fmtMoney(resolvePrice(selection)) || 'Price not mapped')
              : 'Not available'}
            </div>
          </div>

          {priceError ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>{priceError}</div>
          ) : null}

          {!isCurrentComboValid ? (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              That exact combination isn’t available — pick any option that isn’t crossed out.
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <Button onClick={() => setOptionsOpen(false)} disabled={popupLoading}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={popupLoading}
              disabled={!resolveVariationId(selection)}
              onClick={() => {
                handleConfirmAddToCart();
              }}
            >
              Confirm & Add to Cart
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add to Cart Success Dialog */}
      <Dialog
        isOpen={cartSuccessOpen}
        onClose={() => setCartSuccessOpen(false)}
        title="Added to Cart"
        canOutsideClickClose
      >
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>
            Your design was added to your cart.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button onClick={() => setCartSuccessOpen(false)}>
              Keep Editing
            </Button>

            <Button
              intent="primary"
              onClick={() => {
                window.parent.location.href = 'https://tuteachercenter.org/cart-2/';
              }}
            >
              Go to Cart
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
            <InputGroup
              placeholder="Width (inches)"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
            />
            <InputGroup
              placeholder="Height (inches)"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
            />
          </div>
          <Button
            intent="primary"
            style={{ backgroundColor: '#488FCC', padding: '9px 14px' }}
            onClick={handleCustomResize}
          >
            Apply Custom Size
          </Button>
        </div>
      </Dialog>
    </>
  );
});

export default TopNav;