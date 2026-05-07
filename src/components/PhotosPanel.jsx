import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { assetIndexUrl, assetUrl } from '../assetUrls';

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

  const handleClick = action((p) => {
    const page = store.activePage;
    if (!page) return;

    const pageW = page.computedWidth;
    const pageH = page.computedHeight;

    const img = new window.Image();
    img.src = assetUrl(p.url, { version: true });

    img.onload = () => {
      const imgW = img.width;
      const imgH = img.height;

      const padding = 40;
      const maxW = pageW - padding * 2;
      const maxH = pageH - padding * 2;

      const scale = Math.min(maxW / imgW, maxH / imgH, 1); // Never scale up

      const finalW = imgW * scale;
      const finalH = imgH * scale;

      page.addElement({
        type: 'image',
        src: assetUrl(p.url, { version: true }),
        width: finalW,
        height: finalH,
        x: (pageW - finalW) / 2,
        y: (pageH - finalH) / 2,
      });
    };

    img.onerror = () => {
      console.error('Failed to load image for sizing:', assetUrl(p.url, { version: true }));
    };
  });

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
        <div style={styles.grid}>
          {filteredPhotos.map((p) => (
            <div
              key={`${p.id}-${p.url}`}
              style={styles.thumbWrapper}
              onClick={() => handleClick(p)}
            >
              <img
                loading="lazy"
                src={assetUrl(p.previewUrl || p.url, { version: true })}
                alt={p.name || p.id || 'Photo'}
                onError={(e) => {
                  const fallback = assetUrl(p.url, { version: true });

                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                style={styles.thumbImage}
              />
              <div style={styles.thumbLabel}>{p.name}</div>
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
  grid: {
    padding: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 12,
  },
  thumbWrapper: {
    cursor: 'pointer',
    textAlign: 'center',
    border: '1px solid #ddd',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  thumbImage: {
    width: '100%',
    height: 80,
    objectFit: 'cover',
    backgroundColor: '#f0f0f0',
  },
  thumbLabel: {
    padding: 4,
    fontSize: 12,
  },
};

export default PhotosPanel;