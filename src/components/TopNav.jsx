import React, { useMemo, useRef, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, Dialog, InputGroup, Spinner } from '@blueprintjs/core';
import { Icon } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import {
  announceCurrentAccountDesign,
  announceSavedDesignsRefresh,
  clearLoginDraft,
  getAccountStatus,
  redirectToLogin,
  saveAccountDesign,
  saveLoginDraft,
} from './saved-designs-api';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) page.set({ width: w, height: h });
});

// ============================
// Woo product + variation map
// ============================
const REGULAR_PRINT_PRODUCT_ID = 199649;
const CUSTOM_POSTER_PRODUCT_ID = 206073;

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


// Poster-printing rates used by both the app preview and the Woo server snippet.
const POSTER_RATES = {
  paper: {
    24: 0.5,
    42: 0.75,
    60: 1.15,
  },
  canvas: {
    42: 1.0,
    60: 1.35,
  },
};

const POSTER_MAX_MESSAGE =
  'Maximum size: We can print posters up to 60" wide or 60" tall. Please adjust your dimensions so that at least one side is 60" or less.';

function roundUpPosterInch(value) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return Math.ceil(number);
}

function pickPosterRoll(material, neededWidth) {
  const rates = POSTER_RATES[material] || POSTER_RATES.paper;
  const rolls = Object.keys(rates)
    .map(Number)
    .sort((a, b) => a - b);

  return rolls.find((roll) => neededWidth <= roll) || null;
}

function calculatePosterPrice(material, rawWidth, rawHeight) {
  const safeMaterial = material === 'canvas' ? 'canvas' : 'paper';
  const width = roundUpPosterInch(rawWidth);
  const height = roundUpPosterInch(rawHeight);

  if (!width || !height) {
    return {
      ok: false,
      error: 'Please enter both width and height.',
    };
  }

  // One side may be longer than 60" because that side can run down the roll.
  // The design is impossible only when neither side can fit across a 60" roll.
  if (width > 60 && height > 60) {
    return {
      ok: false,
      error: POSTER_MAX_MESSAGE,
    };
  }

  const rates = POSTER_RATES[safeMaterial];

  // Option A: width across the roll, height charged as print length.
  let optionA = null;
  const rollA = pickPosterRoll(safeMaterial, width);
  if (rollA && rates[rollA]) {
    optionA = {
      orientation: 'width_on_roll',
      roll: rollA,
      rate: rates[rollA],
      charged: height,
      rollDimension: width,
      price: Number((rates[rollA] * height).toFixed(2)),
    };
  }

  // Option B: height across the roll, width charged as print length.
  let optionB = null;
  const rollB = pickPosterRoll(safeMaterial, height);
  if (rollB && rates[rollB]) {
    optionB = {
      orientation: 'height_on_roll',
      roll: rollB,
      rate: rates[rollB],
      charged: width,
      rollDimension: height,
      price: Number((rates[rollB] * width).toFixed(2)),
    };
  }

  if (!optionA && !optionB) {
    return {
      ok: false,
      error: POSTER_MAX_MESSAGE,
    };
  }

  // Match the PHP calculator exactly: choose B only when it is strictly cheaper.
  let chosen = optionA || optionB;
  if (optionA && optionB) {
    chosen = optionB.price < optionA.price ? optionB : optionA;
  }

  return {
    ok: true,
    material: safeMaterial,
    width,
    height,
    ...chosen,
  };
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
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileDialogMode, setFileDialogMode] = useState('new');
  const [fileName, setFileName] = useState('');
  const [currentAccountDesignId, setCurrentAccountDesignId] = useState(null);
  const [currentAccountDesignTitle, setCurrentAccountDesignTitle] = useState('');
  const [fileSaving, setFileSaving] = useState(false);
  const [fileSaveError, setFileSaveError] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const [loginRedirecting, setLoginRedirecting] = useState(false);

  // Options modal
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [cartSuccessOpen, setCartSuccessOpen] = useState(false);
  const [printMode, setPrintMode] = useState('regular');

  // Regular-printing selections (Woo variation slugs)
  const [optSize, setOptSize] = useState('8-5x11');
  const [optAmt, setOptAmt] = useState('1');
  const [optColor, setOptColor] = useState('black-and-white');
  const [optPaper, setOptPaper] = useState('hard');

  // Custom poster selections for product 206073.
  const [posterMaterial, setPosterMaterial] = useState('paper');
  const [posterWidth, setPosterWidth] = useState('');
  const [posterHeight, setPosterHeight] = useState('');

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

  const posterQuote = useMemo(
    () => calculatePosterPrice(posterMaterial, posterWidth, posterHeight),
    [posterMaterial, posterWidth, posterHeight]
  );

  useEffect(() => {
    const handleCurrentDesign = (event) => {
      const detail = event.detail || {};
      if (!('id' in detail) && !detail.title) return;
      setCurrentAccountDesignId(detail.id || null);
      setCurrentAccountDesignTitle(detail.title || 'Saved Design');
      setFileName(detail.title || 'Saved Design');
    };

    window.addEventListener('ttc-polotno-current-design', handleCurrentDesign);
    return () => {
      window.removeEventListener('ttc-polotno-current-design', handleCurrentDesign);
    };
  }, []);

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

  const handleDownloadPDF = async () => {
    try {
      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      if (typeof store.toPDFDataURL === 'function') {
        const dataURL = await store.toPDFDataURL();

        if (!dataURL || !String(dataURL).startsWith('data:application/pdf')) {
          console.error('Invalid PDF export:', dataURL);
          alert('PDF export failed. Please try again.');
          return;
        }

        downloadFile(dataURL, 'design.pdf');
        return;
      }

      if (typeof store.saveAsPDF === 'function') {
        await store.saveAsPDF({ fileName: 'design.pdf' });
        return;
      }

      alert('PDF export is not available in this build.');
    } catch (err) {
      console.error('PDF download failed:', err);
      alert('PDF download failed. Please try again.');
    }
  };

  const handleDownloadTemplate = async () => {
  try {
    if (typeof store.waitLoading === 'function') {
      await store.waitLoading();
    }

    const json = store.toJSON();
    const jsonString = JSON.stringify(json, null, 2);

    const blob = new Blob([jsonString], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    downloadFile(url, 'design-template.json');
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Template JSON download failed:', err);
    alert('Template download failed. Please try again.');
  }
};

  const handleDownloadImage = async () => {
    try {
      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      const dataURL = await store.toDataURL({
        mimeType: 'image/png',
        quality: 1,
        pixelRatio: 2,
      });

      if (!dataURL || !String(dataURL).startsWith('data:image/png')) {
        console.error('Invalid PNG export:', dataURL);
        alert('PNG export failed. Please try again.');
        return;
      }

      downloadFile(dataURL, 'design.png');
    } catch (err) {
      console.error('PNG download failed:', err);
      alert('PNG download failed. Please try again.');
    }
  };

  // Save the PNG first through the existing parent-page RPC.
  // Keep a serialized copy of the editable JSON so it can also be handed off
  // during add-to-cart. This works even when an older parent save handler only
  // forwards pngBase64 to WordPress.
  const saveDesignToWP = async () => {
    if (typeof store.waitLoading === 'function') {
      await store.waitLoading();
    }

    const pngBase64 = await store.toDataURL({
      mimeType: 'image/png',
      quality: 1,
    });

    const designJson = JSON.stringify(store.toJSON());

    const result = await postToParentRpc(
      'POL_SAVE_DESIGN',
      { pngBase64, designJson },
      { timeoutMs: 30000 }
    );

    if (!result || !result.ok) {
      throw new Error(
        result && result.error ? result.error : 'Save failed'
      );
    }

    const data = result.data;

    if (!data || !data.success) {
      throw new Error(
        data && data.error ? data.error : 'Save failed'
      );
    }

    return { ...data, designJson };
  };

  const buildAccountSavePayload = async () => {
    if (typeof store.waitLoading === 'function') {
      await store.waitLoading();
    }

    const designJson = JSON.stringify(store.toJSON());
    let previewPng = '';

    // Account saves only need a small thumbnail preview. A full PNG makes saves
    // feel very slow on large designs, so use a small JPEG and keep the preview
    // optional if the browser fails to render it.
    try {
      previewPng = await store.toDataURL({
        mimeType: 'image/jpeg',
        quality: 0.72,
        pixelRatio: 0.22,
      });

      if (!previewPng || !String(previewPng).startsWith('data:image/')) {
        previewPng = '';
      }
    } catch (err) {
      console.warn('Saved-design preview could not be generated:', err);
      previewPng = '';
    }

    return { designJson, previewPng };
  };

  const showLoginRequired = (err) => {
    setLoginUrl(err?.loginUrl || err?.response?.login_url || '');
    setLoginDialogOpen(true);
  };

  const preserveCurrentDesignAndLogIn = async () => {
    setLoginRedirecting(true);

    try {
      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      saveLoginDraft({
        designJson: JSON.stringify(store.toJSON()),
        title: currentAccountDesignTitle || fileName || 'Untitled Design',
      });
    } catch (err) {
      console.warn('Could not preserve design before login:', err);
    }

    redirectToLogin(loginUrl);
  };

  const doAccountSave = async ({ title, saveAsCopy = false }) => {
    const safeTitle = String(title || '').trim();
    if (!safeTitle) {
      setFileSaveError('Please enter a file name.');
      return;
    }

    setFileSaving(true);
    setFileSaveError('');

    try {
      const status = await getAccountStatus();
      if (!status?.logged_in) {
        const error = new Error('Please log in to save your design.');
        error.code = 'not_logged_in';
        error.loginUrl = status?.login_url;
        throw error;
      }

      const payload = await buildAccountSavePayload();
      const data = await saveAccountDesign({
        designId: saveAsCopy ? null : currentAccountDesignId,
        title: safeTitle,
        designJson: payload.designJson,
        previewPng: payload.previewPng,
        saveAsCopy,
      });

      const saved = {
        id: data.id,
        title: data.title || safeTitle,
      };

      setCurrentAccountDesignId(saved.id);
      setCurrentAccountDesignTitle(saved.title);
      setFileName(saved.title);
      setFileDialogOpen(false);
      announceCurrentAccountDesign(saved);
      announceSavedDesignsRefresh();
      clearLoginDraft();
    } catch (err) {
      if (err.code === 'not_logged_in') {
        setFileDialogOpen(false);
        showLoginRequired(err);
      } else {
        setFileSaveError(err.message || 'Could not save this design.');
      }
    } finally {
      setFileSaving(false);
    }
  };

  const handleFileSave = async () => {
    if (!currentAccountDesignId) {
      setFileDialogMode('new');
      setFileName(currentAccountDesignTitle || 'Untitled Design');
      setFileSaveError('');
      setFileDialogOpen(true);
      return;
    }

    await doAccountSave({
      title: currentAccountDesignTitle || fileName || 'Untitled Design',
      saveAsCopy: false,
    });
  };

  const handleFileSaveCopy = () => {
    setFileDialogMode('copy');
    setFileName(
      currentAccountDesignTitle
        ? `${currentAccountDesignTitle} copy`
        : 'Untitled Design copy'
    );
    setFileSaveError('');
    setFileDialogOpen(true);
  };

  const openSavedDesignsPanel = () => {
    if (typeof store.openSidePanel === 'function') {
      store.openSidePanel('saved-designs');
    }
    announceSavedDesignsRefresh();
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
    if (!optionsOpen || printMode !== 'regular') return;

    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      updatePrice(selection);
    }, 250);

    return () => {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsOpen, printMode, selection]);

  const openOptions = async () => {
    if (printMode === 'regular' && !resolveVariationId(selection)) {
      const nearest = findNearestValid(selection);
      if (nearest) {
        setOptSize(nearest.size);
        setOptAmt(nearest.amtPerPage);
        setOptColor(nearest.printColor);
        setOptPaper(nearest.paperType);
      }
    }

    setOptionsOpen(true);

    if (printMode === 'regular') {
      setTimeout(() => {
        updatePrice({
          size: optSize,
          amtPerPage: optAmt,
          printColor: optColor,
          paperType: optPaper,
        });
      }, 0);
    }
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

  // Confirm → save design → add either regular printing or a custom poster.
  const handleConfirmAddToCart = async () => {
    console.log('🛒 Confirm & Add to Cart clicked');
    setPopupLoading(true);

    try {
      let productId;
      let variationId = 0;
      let attributes = {};
      let customFields = {};

      if (printMode === 'poster') {
        if (!posterQuote.ok) {
          alert(posterQuote.error || 'Please enter valid poster dimensions.');
          return;
        }

        productId = CUSTOM_POSTER_PRODUCT_ID;

        // These names exactly match the existing Woo poster calculator snippet.
        customFields = {
          ld_calc_material: String(posterQuote.material),
          ld_calc_w: String(posterQuote.width),
          ld_calc_h: String(posterQuote.height),
          ld_calc_roll: String(posterQuote.roll),
          ld_calc_price: String(posterQuote.price),
          ld_calc_rate: String(posterQuote.rate),
          ld_calc_charged: String(posterQuote.charged),
          ld_calc_orientation: String(posterQuote.orientation),
        };

        // The current WordPress parent bridge forwards the attributes object
        // into the Woo add-to-cart request, so include the fields there too.
        attributes = customFields;
      } else {
        variationId = resolveVariationId(selection);
        if (!variationId) {
          alert('That combination is not available.');
          return;
        }

        productId = REGULAR_PRINT_PRODUCT_ID;
        attributes = {
          attribute_pa_size: String(selection.size),
          'attribute_pa_amt-per-page': String(selection.amtPerPage),
          'attribute_pa_print-color': String(selection.printColor),
          'attribute_pa_paper-type': String(selection.paperType),
        };
      }

      const saved = await saveDesignToWP();
      const designId = saved.design_id;
      const designJson = saved.designJson;

      // Some parent-page bridge versions forward only a fixed set of
      // top-level fields. Put the editable JSON inside attributes too, because
      // that object is already forwarded for both regular and poster orders.
      // The WordPress bridge removes this helper field before Woo variation
      // processing and saves it as design-{id}.json.
      const rpcAttributes = {
        ...attributes,
        polotno_design_json: designJson,
      };

      if (inIframe()) {
        console.log('📨 RPC to parent for AJAX add-to-cart');

        await postToParentRpc(
          'POL_ADD_TO_CART',
          {
            product_id: productId,
            variation_id: variationId,
            quantity: 1,
            attributes: rpcAttributes,
            polotno_design_id: designId,
            designJson,
            polotno_design_json: designJson,
            ...customFields,
          },
          { timeoutMs: 30000 }
        );

        setOptionsOpen(false);
        setCartSuccessOpen(true);
        return;
      }

      // Standalone fallback: send the same fields through a Woo add-to-cart URL.
      const params = new URLSearchParams();
      params.set('add-to-cart', String(productId));
      params.set('quantity', '1');
      params.set('polotno_design_id', String(designId));

      if (variationId) {
        params.set('variation_id', String(variationId));
      }

      Object.entries(attributes).forEach(([key, value]) => {
        params.set(key, String(value));
      });

      Object.entries(customFields).forEach(([key, value]) => {
        params.set(key, String(value));
      });

      window.location.href = `${WOO_BASE}/?${params.toString()}`;
    } catch (err) {
      console.error('❌ Add to cart failed:', err);
      alert(`Could not save/add to cart.\n\n${err?.message || err}`);
    } finally {
      setPopupLoading(false);
    }
  };

  const fileMenu = (
    <Menu>
      <MenuItem
        icon="floppy-disk"
        text={currentAccountDesignId ? 'Save' : 'Save'}
        label={currentAccountDesignId ? 'Update file' : 'Name file'}
        onClick={handleFileSave}
      />
      <MenuItem
        icon="duplicate"
        text="Save as Copy"
        onClick={handleFileSaveCopy}
      />
      <MenuItem
        icon="folder-open"
        text="My Saved Designs"
        onClick={openSavedDesignsPanel}
      />
    </Menu>
  );

  const downloadMenu = (
    <Menu>
      <MenuItem text="Image" onClick={handleDownloadImage} />
      <MenuItem text="PDF" onClick={handleDownloadPDF} />
      <MenuItem text="Template" onClick={handleDownloadTemplate} />
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

  const canUndo = Boolean(store.history?.canUndo);
  const canRedo = Boolean(store.history?.canRedo);

  const historyButtonStyle = {
    width: '36px',
    minWidth: '36px',
    height: '36px',
    minHeight: '36px',
    padding: 0,
    border: 0,
    borderRadius: '4px',
    color: 'white',
    background: 'transparent',
    boxShadow: 'none',
  };

  const resizePopoverContent = (
    <div className="ttc-panel ttc-resize-popover">
      <div className="ttc-resize-popover-title">Resize Canvas</div>

      <div className="ttc-resize-preset-list">
        <Button className="ttc-panel-action" onClick={() => handleResize(612, 792)}>
          8.5″ × 11″ (Letter)
        </Button>
        <Button className="ttc-panel-action" onClick={() => handleResize(792, 1224)}>
          11″ × 17″ (Double)
        </Button>
        <Button className="ttc-panel-action" onClick={() => handleResize(936, 1368)}>
          13″ × 19″ (Small Poster)
        </Button>
        <Button className="ttc-panel-action" onClick={() => handleResize(1296, 1728)}>
          18″ × 24″ (Large Poster)
        </Button>
        <Button className="ttc-panel-action" onClick={() => handleResize(1728, 2016)}>
          24″ × 28″ (Oaktag)
        </Button>
      </div>

      <div className="ttc-resize-divider" />

      <div className="ttc-resize-custom-row">
        <InputGroup
          className="ttc-resize-input"
          placeholder="Width (inches)"
          value={customWidth}
          onChange={(e) => setCustomWidth(e.target.value)}
        />
        <InputGroup
          className="ttc-resize-input"
          placeholder="Height (inches)"
          value={customHeight}
          onChange={(e) => setCustomHeight(e.target.value)}
        />
      </div>

      <Button
        className="ttc-panel-action ttc-panel-action-primary"
        onClick={handleCustomResize}
      >
        Apply Custom Size
      </Button>
    </div>
  );

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '56px',
          background: 'linear-gradient(to right, #488fcc, #ce3c4f)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          boxSizing: 'border-box',
          color: 'white',
          gap: '12px',
        }}
      >
        <a href={WOO_BASE} style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.webp" alt="Logo" style={{ height: '34px' }} />
        </a>

        <Popover content={fileMenu} position="bottom-left" minimal usePortal>
          <Button
            minimal
            style={{
              fontWeight: 'bold',
              fontSize: '17px',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '3px',
              background: 'transparent',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            FILE
          </Button>
        </Popover>

        <Popover
          content={resizePopoverContent}
          isOpen={dialogOpen}
          onInteraction={(nextOpen) => setDialogOpen(nextOpen)}
          position="bottom-left"
          minimal
          usePortal
          popoverClassName="ttc-resize-popover-shell"
        >
          <Button
            minimal
            style={{
              fontWeight: 'bold',
              fontSize: '17px',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '3px',
              background: 'transparent',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            RESIZE
          </Button>
        </Popover>

        <div
          aria-label="Undo and redo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          <Button
            minimal
            icon={<Icon icon="undo" color={canUndo ? '#ffffff' : '#9ca3af'} />}
            title="Undo"
            aria-label="Undo"
            disabled={!canUndo}
            onClick={() => store.history.undo()}
            style={{ ...historyButtonStyle, opacity: 1 }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          />
          <Button
            minimal
            icon={<Icon icon="redo" color={canRedo ? '#ffffff' : '#9ca3af'} />}
            title="Redo"
            aria-label="Redo"
            disabled={!canRedo}
            onClick={() => store.history.redo()}
            style={{ ...historyButtonStyle, opacity: 1 }}
            onMouseOver={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          />
        </div>

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

      {/* Account Save Dialog */}
      <Dialog
        isOpen={fileDialogOpen}
        onClose={() => setFileDialogOpen(false)}
        title={fileDialogMode === 'copy' ? 'Save a Copy' : 'Name This Design'}
        canOutsideClickClose={!fileSaving}
        enforceFocus
        className="ttc-cart-dialog ttc-file-save-dialog"
      >
        <div className="ttc-cart-dialog-body">
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>File Name</div>
            <InputGroup
              autoFocus
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  doAccountSave({
                    title: fileName,
                    saveAsCopy: fileDialogMode === 'copy',
                  });
                }
              }}
              placeholder="Untitled Design"
            />
          </div>

          {fileSaveError ? (
            <div className="ttc-file-save-error">{fileSaveError}</div>
          ) : null}

          <div className="ttc-cart-dialog-actions">
            <Button onClick={() => setFileDialogOpen(false)} disabled={fileSaving}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={fileSaving}
              onClick={() =>
                doAccountSave({
                  title: fileName,
                  saveAsCopy: fileDialogMode === 'copy',
                })
              }
            >
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Login Required Dialog */}
      <Dialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        title="Log in required"
        canOutsideClickClose={!loginRedirecting}
        enforceFocus
        className="ttc-cart-dialog ttc-file-save-dialog ttc-login-required-dialog"
      >
        <div className="ttc-cart-dialog-body">
          <div className="ttc-login-required-message">
            Please log in to save your design.
          </div>
          <div className="ttc-login-required-note">
            Your current design will be restored after you log in.
          </div>
          <div className="ttc-cart-dialog-actions">
            <Button onClick={() => setLoginDialogOpen(false)} disabled={loginRedirecting}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={loginRedirecting}
              onClick={preserveCurrentDesignAndLogIn}
            >
              Log in
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Print Options Modal */}
      <Dialog
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        title="Print Options"
        canOutsideClickClose={!popupLoading}
        enforceFocus
        className="ttc-cart-dialog"
      >
        <div className="ttc-cart-dialog-body">
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Printing Type</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                active={printMode === 'regular'}
                onClick={() => {
                  setPrintMode('regular');
                  updatePrice(selection);
                }}
              >
                Regular Printing
              </Button>
              <Button
                active={printMode === 'poster'}
                onClick={() => setPrintMode('poster')}
              >
                Poster Printing
              </Button>
            </div>
          </div>

          {printMode === 'regular' ? (
            <>
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

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', marginTop: 8, paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Price</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {resolveVariationId(selection)
                      ? fmtMoney(resolvePrice(selection)) || 'Price not mapped'
                      : 'Not available'}
                  </div>
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
            </>
          ) : (
            <>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Paper Type</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Button
                    active={posterMaterial === 'paper'}
                    onClick={() => setPosterMaterial('paper')}
                  >
                    Paper
                  </Button>
                  <Button
                    active={posterMaterial === 'canvas'}
                    onClick={() => setPosterMaterial('canvas')}
                  >
                    Canvas
                  </Button>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Width (inches)</div>
                  <InputGroup
                    type="number"
                    min={1}
                    step="0.01"
                    inputMode="decimal"
                    value={posterWidth}
                    onChange={(e) => setPosterWidth(e.target.value)}
                  />
                </div>

                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Height (inches)</div>
                  <InputGroup
                    type="number"
                    min={1}
                    step="0.01"
                    inputMode="decimal"
                    value={posterHeight}
                    onChange={(e) => setPosterHeight(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.45 }}>
                Dimensions are rounded up to the nearest whole inch for pricing. Both printing
                directions are calculated, and the cheaper price is used.
              </div>

              {posterQuote.ok ? (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.12)', marginTop: 4, paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span>Priced size</span>
                    <strong>
                      {posterQuote.width}″ × {posterQuote.height}″
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span>Chosen roll</span>
                    <strong>{posterQuote.roll}″</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span>Rate</span>
                    <strong>{fmtMoney(posterQuote.rate)} / inch</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span>Charged inches</span>
                    <strong>{posterQuote.charged}″</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      borderTop: '1px solid rgba(0,0,0,0.08)',
                      paddingTop: 10,
                      fontSize: 18,
                    }}
                  >
                    <strong>Price</strong>
                    <strong>{fmtMoney(posterQuote.price)}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#b00020', fontSize: 13, fontWeight: 600 }}>
                  {posterQuote.error}
                </div>
              )}
            </>
          )}

          <div className="ttc-cart-dialog-actions">
            <Button onClick={() => setOptionsOpen(false)} disabled={popupLoading}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={popupLoading}
              disabled={
                printMode === 'regular'
                  ? !resolveVariationId(selection)
                  : !posterQuote.ok
              }
              onClick={handleConfirmAddToCart}
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
        className="ttc-cart-dialog ttc-cart-success-dialog"
      >
        <div className="ttc-cart-dialog-body ttc-cart-success-body">
          <div style={{ fontSize: 15, lineHeight: 1.5 }}>
            Your design was added to your cart.
          </div>

          <div className="ttc-cart-dialog-actions">
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


    </>
  );
});

export default TopNav;