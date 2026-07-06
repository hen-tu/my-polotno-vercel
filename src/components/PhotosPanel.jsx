import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { assetIndexUrl, assetUrl } from '../assetUrls';

const photosCache = { data: null };

function placeholderDataUrl(text = 'No image') {
  const safeText = String(text).replace(/[<>&]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#64748b" font-family="Arial, sans-serif" font-size="16">${safeText}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function resolvePhotoUrl(value, { version = false } = {}) {
  if (!value) return '';
  return assetUrl(String(value).trim(), { version });
}

const PhotosPanelComponent = observer(({ store, query, setQuery }) => {
  const [photos, setPhotos] = useState(photosCache.data || []);
  const [loading, setLoading] = useState(!photosCache.data);

  useEffect(() => {
    if (photosCache.data) {
      setPhotos(photosCache.data);
      setLoading(false);
      return;
    }

    fetch(assetIndexUrl('photos/index.json'))
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const unique = Array.from(
          new Map(rows.map((photo) => [photo.id, { ...photo }])).values()
        );

        photosCache.data = unique;
        setPhotos(unique);
      })
      .catch((error) => console.error('Failed to load images list:', error))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (photo) => {
    const page = store.activePage;
    if (!page) return;

    const imageUrl = resolvePhotoUrl(photo.url || photo.previewUrl, {
      version: true,
    });
    if (!imageUrl) {
      console.error('Image has no usable URL:', photo);
      return;
    }

    const pageWidth = page.computedWidth;
    const pageHeight = page.computedHeight;
    const imageWidth = Number(photo.width) || 600;
    const imageHeight = Number(photo.height) || 400;
    const padding = 40;
    const maxWidth = pageWidth - padding * 2;
    const maxHeight = pageHeight - padding * 2;
    const scale = Math.min(
      maxWidth / imageWidth,
      maxHeight / imageHeight,
      1
    );
    const finalWidth = imageWidth * scale;
    const finalHeight = imageHeight * scale;

    runInAction(() => {
      page.addElement({
        type: 'image',
        src: imageUrl,
        width: finalWidth,
        height: finalHeight,
        x: (pageWidth - finalWidth) / 2,
        y: (pageHeight - finalHeight) / 2,
      });
    });
  };

  const filteredPhotos = photos.filter((photo) =>
    String(photo.name || '')
      .toLowerCase()
      .includes(String(query || '').toLowerCase())
  );

  if (loading) {
    return (
      <div className="ttc-panel-loader">
        <div className="spinner" aria-label="Loading images" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: 12, paddingBottom: 10 }}>
        <input
          type="text"
          placeholder="Search images..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="ttc-panel-search"
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div className="asset-masonry">
          {filteredPhotos.length > 0 ? (
            filteredPhotos.map((photo) => (
              <button
                type="button"
                key={`${photo.id}-${photo.url}`}
                className="asset-thumb-card"
                onClick={() => handleClick(photo)}
                aria-label={`Add ${photo.name}`}
              >
                <img
                  loading="lazy"
                  src={
                    resolvePhotoUrl(photo.previewUrl || photo.url, {
                      version: true,
                    }) || placeholderDataUrl('No image')
                  }
                  alt={photo.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = placeholderDataUrl('No image');
                  }}
                  className="asset-thumb-image"
                />
                <span className="asset-thumb-label">{photo.name}</span>
              </button>
            ))
          ) : (
            <div className="ttc-empty-grid-message">No images found</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default React.memo(PhotosPanelComponent);
