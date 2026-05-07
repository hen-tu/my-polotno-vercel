export const ASSET_BASE_URL =
  import.meta.env.VITE_ASSET_BASE_URL ||
  'https://hen-tu.github.io/polotno-assets-cf';

// Change this when you update the asset repo and need to bust GitHub Pages/browser cache.
export const ASSET_VERSION = '22f8024';

export function withAssetVersion(url) {
  if (!url) return '';

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${ASSET_VERSION}`;
}

export function assetUrl(url, options = {}) {
  const { version = false } = options;

  if (!url) return '';

  let finalUrl;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    finalUrl = url;
  } else {
    finalUrl = `${ASSET_BASE_URL}/${url.replace(/^\/+/, '')}`;
  }

  return version ? withAssetVersion(finalUrl) : finalUrl;
}

export function assetIndexUrl(path) {
  return withAssetVersion(`${ASSET_BASE_URL}/${path.replace(/^\/+/, '')}`);
}