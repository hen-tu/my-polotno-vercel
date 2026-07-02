// src/components/saved-designs-api.js

const AJAX_URL = `${window.location.origin}/wp-admin/admin-ajax.php`;
let sessionPromise = null;

export class PolotnoAccountError extends Error {
  constructor(message, code = 'UNKNOWN', extra = {}) {
    super(message);
    this.name = 'PolotnoAccountError';
    this.code = code;
    Object.assign(this, extra);
  }
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new PolotnoAccountError(
      `The website returned an invalid response (${response.status}).`,
      'INVALID_RESPONSE',
      { responseText: text }
    );
  }
}

export async function getPolotnoAccountSession(force = false) {
  if (force) sessionPromise = null;

  if (!sessionPromise) {
    const url = new URL(AJAX_URL);
    url.searchParams.set('action', 'ttc_polotno_session');
    url.searchParams.set('return_url', window.location.href);
    url.searchParams.set('_', String(Date.now()));

    sessionPromise = fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload = await readJsonResponse(response);
        if (!payload.success) {
          throw new PolotnoAccountError(
            payload?.data?.message || 'Could not check your account.',
            payload?.data?.code || 'SESSION_FAILED'
          );
        }
        return payload.data;
      })
      .catch((error) => {
        sessionPromise = null;
        throw error;
      });
  }

  return sessionPromise;
}

async function accountRequest(action, fields = {}) {
  const session = await getPolotnoAccountSession();

  if (!session.logged_in) {
    throw new PolotnoAccountError(
      'Please log in to save designs to your account.',
      'LOGIN_REQUIRED',
      { login_url: session.login_url }
    );
  }

  const form = new FormData();
  form.set('action', action);
  form.set('nonce', session.nonce);

  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  });

  const response = await fetch(AJAX_URL, {
    method: 'POST',
    body: form,
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await readJsonResponse(response);

  if (!payload.success) {
    const code = payload?.data?.code || 'REQUEST_FAILED';

    if (code === 'BAD_NONCE') {
      await getPolotnoAccountSession(true);
    }

    throw new PolotnoAccountError(
      payload?.data?.message || 'The request could not be completed.',
      code,
      { login_url: payload?.data?.login_url }
    );
  }

  return payload.data;
}

export function listSavedDesigns() {
  return accountRequest('ttc_polotno_list_designs');
}

export function getSavedDesign(id) {
  return accountRequest('ttc_polotno_get_design', { id });
}

export function saveAccountDesign({ id = 0, name, design, previewBase64 }) {
  return accountRequest('ttc_polotno_save_design', {
    id,
    name,
    design,
    preview_base64: previewBase64,
  });
}

export function deleteSavedDesign(id) {
  return accountRequest('ttc_polotno_delete_design', { id });
}

export function goToAccountLogin(errorOrSession) {
  const loginUrl = errorOrSession?.login_url;
  if (loginUrl) {
    window.location.href = loginUrl;
  }
}
