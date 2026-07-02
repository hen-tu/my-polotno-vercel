import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { assetIndexUrl, assetUrl } from '../assetUrls';

const ASSET_BASE_URL = 'https://hen-tu.github.io/polotno-assets-cf';

function resolveAssetUrl(value) {
  if (!value) return '';

  const url = String(value).trim();

  // If index already gives a full URL, use it as-is
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Otherwise treat it as a relative asset path
  return `${ASSET_BASE_URL}/${url.replace(/^\/+/, '')}`;
}

function placeholderDataUrl(text = 'No image') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">
      <rect width="100%" height="100%" fill="#f3f3f3"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="13" fill="#777">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const photosCache = { data: null };

const PhotosPanelComponent = observer(({ store, query, setQuery }) => {
  console.log('🚀 PhotosPanel component function run');

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(!photosCache.data);

  useEffect(() => {
    console.log('📡 Fetching photo list...');
    if (photosCache.data) {
      setPhotos(photosCache.data);
      return;
    }

    fetch(assetIndexUrl('photos/index.json'))
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        const unique = Array.from(new Map(data.map(p => [p.id, { ...p }])).values());
        photosCache.data = unique;
        setPhotos(unique);
      })
      .catch((err) => console.error('Failed to load photos list:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (p) => {
    const page = store.activePage;
    if (!page) return;

    const imageUrl = resolveAssetUrl(p.url || p.previewUrl);

    if (!imageUrl) {
      console.error('Photo has no usable URL:', p);
      return;
    }

    const pageW = page.computedWidth;
    const pageH = page.computedHeight;

    const imgW = p.width || 600;
    const imgH = p.height || 400;

    const padding = 40;
    const maxW = pageW - padding * 2;
    const maxH = pageH - padding * 2;

    const scale = Math.min(maxW / imgW, maxH / imgH, 1);

    const finalW = imgW * scale;
    const finalH = imgH * scale;

    runInAction(() => {
      page.addElement({
        type: 'image',
        src: imageUrl,
        width: finalW,
        height: finalH,
        x: (pageW - finalW) / 2,
        y: (pageH - finalH) / 2,
      });
    });
  };
    
  const filteredPhotos = photos.filter((p) =>
    (p.name || '').toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.panelContainer, height: '100%', maxHeight: '100vh' }}>
      <div style={styles.searchWrapper}>
        <input
          type="text"
          placeholder="Search photos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.scrollableContent}>
        <div className="asset-masonry">
          {filteredPhotos.map((p, index) => (
            <div
              key={`${p.id}-${p.url}`}
              className="asset-thumb-card"
              onClick={() => handleClick(p)}
            >
              <img
                loading={index < 8 ? 'eager' : 'lazy'}
                decoding="async"
                src={resolveAssetUrl(p.previewUrl || p.url)}
                alt={p.name || ''}
                className="asset-thumb-image"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholderDataUrl('No image');
                }}
              />
              <div className="asset-thumb-label">{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const PhotosPanel = React.memo(PhotosPanelComponent);

const styles = {
  panelContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loader: {
    fontSize: '1.2rem',
    color: '#555',
  },
  searchWrapper: {
    padding: '8px 12px',
    borderBottom: '1px solid #ddd',
    background: '#fff',
  },
  searchInput: {
    width: '100%',
    padding: '6px 8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  },
};

export default PhotosPanel;