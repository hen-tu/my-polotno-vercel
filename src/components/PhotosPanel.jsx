// src/components/PhotosPanel.jsx
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { InputGroup, Spinner } from '@blueprintjs/core';

const photosCache = { data: null };

const PhotosPanelComponent = observer(({ store, query, setQuery }) => {
  const [photos, setPhotos] = useState(photosCache.data || []);
  const [loading, setLoading] = useState(!photosCache.data);
  const [error, setError] = useState('');

  useEffect(() => {
    if (photosCache.data) return;

    let cancelled = false;
    fetch('photos/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const unique = Array.from(
          new Map((Array.isArray(data) ? data : []).map((photo) => [photo.id, { ...photo }])).values()
        );
        photosCache.data = unique;
        setPhotos(unique);
      })
      .catch((err) => {
        console.error('Failed to load photos list:', err);
        if (!cancelled) setError('Photos could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = action((photo) => {
    const page = store.activePage;
    if (!page) return;

    const pageW = page.computedWidth;
    const pageH = page.computedHeight;
    const image = new window.Image();
    image.src = photo.url;

    image.onload = action(() => {
      const padding = 40;
      const maxW = pageW - padding * 2;
      const maxH = pageH - padding * 2;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1);
      const finalW = image.width * scale;
      const finalH = image.height * scale;

      page.addElement({
        type: 'image',
        src: photo.url,
        width: finalW,
        height: finalH,
        x: (pageW - finalW) / 2,
        y: (pageH - finalH) / 2,
      });
    });

    image.onerror = () => {
      console.error('Failed to load image for sizing:', photo.url);
    };
  });

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPhotos = photos.filter((photo) =>
    String(photo.name || '').toLowerCase().includes(normalizedQuery)
  );

  return (
    <div className="ttc-panel">
      <div className="ttc-panel-fixed">
        <InputGroup
          fill
          large
          leftIcon="search"
          placeholder="Search photos"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search photos"
          className="ttc-panel-search"
        />
        {!loading && (
          <div className="ttc-panel-count">
            Showing {filteredPhotos.length} of {photos.length}
          </div>
        )}
      </div>

      {error && <div className="ttc-panel-error">{error}</div>}

      <div className="ttc-panel-content">
        {loading ? (
          <div className="ttc-panel-loading">
            <Spinner size={34} />
            <span>Loading photos…</span>
          </div>
        ) : filteredPhotos.length ? (
          <div className="ttc-asset-grid">
            {filteredPhotos.map((photo) => (
              <button
                type="button"
                key={`${photo.id}-${photo.url}`}
                className="ttc-asset-card"
                onClick={() => handleClick(photo)}
                title={photo.name}
              >
                <div className="ttc-asset-preview-wrap">
                  <img
                    loading="lazy"
                    src={photo.previewUrl}
                    alt={photo.name || 'Photo'}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        'https://via.placeholder.com/160x110?text=No+Image';
                    }}
                    className="ttc-asset-preview"
                  />
                </div>
                <span className="ttc-asset-label">{photo.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ttc-panel-empty">No photos found</div>
        )}
      </div>
    </div>
  );
});

export default React.memo(PhotosPanelComponent);
