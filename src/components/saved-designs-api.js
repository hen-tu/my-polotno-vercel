const WOO_BASE = 'https://tuteachercenter.org';
const ACCOUNT_EVENT_PREFIX = 'POL_ACCOUNT_';

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function postToParentRpc(type, payload = {}, { timeoutMs = 30000 } = {}) {
  const requestId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', onMessage);
      reject(new Error(`${type} timed out`));
    }, timeoutMs);

    function onMessage(event) {
      const msg = event.data || {};
      if (msg.requestId !== requestId) return;

      clearTimeout(timeout);
      window.removeEventListener('message', onMessage);

      const response = msg.payload ?? msg;
      resolve(response);
    }

    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type, requestId, payload }, '*');
  });
}

async function directAjax(action, payload = {}) {
  const config = window.TTC_POL_ACCOUNT_SAVE;

  if (!config?.ajaxUrl || !config?.nonce) {
    throw new Error('Account saving must be opened from the Teacher Center website.');
  }

  const form = new FormData();
  form.set('action', action);
  form.set('nonce', config.nonce);

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.set(key, String(value));
  });

  const res = await fetch(config.ajaxUrl, {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });

  const data = await res.json().catch(() => null);
  if (!data) {
    throw new Error(`Account save request failed with HTTP ${res.status}.`);
  }

  return data;
}

async function ajax(action, payload = {}) {
  const messageType = `${ACCOUNT_EVENT_PREFIX}${action.replace('ttc_polotno_account_', '').toUpperCase()}`;

  if (inIframe()) {
    return postToParentRpc(messageType, payload);
  }

  return directAjax(action, payload);
}

function normalizeResponse(response) {
  if (!response) {
    throw new Error('Empty response from saved designs.');
  }

  if (response.ok === false) {
    const error = new Error(response.message || response.error || 'Request failed');
    error.response = response;
    error.code = response.code;
    error.loginUrl = response.login_url;
    throw error;
  }

  if (response.success === false) {
    const payload = response.data || {};
    const error = new Error(payload.message || payload.error || 'Request failed');
    error.response = payload;
    error.code = payload.code;
    error.loginUrl = payload.login_url;
    throw error;
  }

  return response.data || response;
}

export function redirectToLogin(loginUrl) {
  const fallback = `${WOO_BASE}/my-account/?redirect_to=${encodeURIComponent(`${WOO_BASE}/create/`)}`;
  const url = loginUrl || fallback;

  if (inIframe()) {
    window.parent.location.href = url;
  } else {
    window.location.href = url;
  }
}

export async function listAccountDesigns() {
  return normalizeResponse(await ajax('ttc_polotno_account_list', {}));
}

export async function getAccountDesign(designId) {
  return normalizeResponse(
    await ajax('ttc_polotno_account_get', { design_id: designId })
  );
}

export async function saveAccountDesign({ designId, title, designJson, previewPng, saveAsCopy = false }) {
  return normalizeResponse(
    await ajax('ttc_polotno_account_save', {
      design_id: designId || '',
      title: title || '',
      design_json: designJson || '',
      preview_png: previewPng || '',
      save_as_copy: saveAsCopy ? '1' : '',
    })
  );
}

export async function deleteAccountDesign(designId) {
  return normalizeResponse(
    await ajax('ttc_polotno_account_delete', { design_id: designId })
  );
}

export function announceCurrentAccountDesign(design) {
  window.dispatchEvent(
    new CustomEvent('ttc-polotno-current-design', {
      detail: design,
    })
  );
}

export function announceSavedDesignsRefresh() {
  window.dispatchEvent(new CustomEvent('ttc-polotno-saved-designs-refresh'));
}
