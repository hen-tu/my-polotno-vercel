import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
// removed assetUrls import — this panel uses resolveAssetUrl instead

const TEMPLATE_ASSET_BASE =
  'https://media.githubusercontent.com/media/hen-tu/polotno-assets-cf/clean-assets/templates';

const getCleanAssetUrl = (url) => {
  if (!url) return url;

  return url.replace(
    'https://hen-tu.github.io/polotno-assets-cf/templates/',
    `${TEMPLATE_ASSET_BASE}/`
  );
};

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

const templateJsonCache = new Map();

const TemplatesPanel = observer(({ store }) => {
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Toggles + active values
  const [categoryFilterOn, setCategoryFilterOn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [setFilterOn, setSetFilterOn] = useState(false);
  const [activeSet, setActiveSet] = useState(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.toLowerCase());
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Load templates + optional auto-load by URL (?template=slug)
  useEffect(() => {
    fetch(`${ASSET_BASE_URL}/templates/index.json?v=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const usableTemplates = data.filter((t) => {
          return (
            t.id !== 'sample-template' &&
            !(t.jsonUrl || '').includes('sample-card.json') &&
            !(t.previewUrl || '').includes('sample-template.png')
          );
        });

        setTemplates(usableTemplates);

        const params = new URLSearchParams(window.location.search);
        const slug = params.get('template');

        if (slug) {
          const match = usableTemplates.find((t) => t.id === slug);
          if (match) {
            // Set context but do NOT auto-enable toggles
            setActiveCategory(match.category || null);
            setActiveSet(match.set || null);
            setSetFilterOn(Boolean(match.set));

            getTemplateJson(match)
              .then((json) => {
                runInAction(() => {
                  store.loadJSON(json);
                });
              })
              .catch((err) => {
                console.error('Failed to auto-load template from URL:', err);
              });
          } else {
            console.warn(`Template with id "${slug}" not found.`);
          }
        }
      })
      .catch((err) => console.error('Failed to load templates:', err));
  }, [store]);

  // Filtering (AND logic if both toggles are on)
  const filteredTemplates = templates.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(debouncedQuery);

    const matchesCategory =
      !categoryFilterOn || (t.category && t.category === activeCategory);

    const matchesSet =
      !setFilterOn || (t.set && t.set === activeSet);

    return matchesQuery && matchesCategory && matchesSet;
  });

  // Reusable tiny switch UI (same look as your category toggle)
  const Toggle = ({ enabled, onToggle, disabled }) => (
    <div
      onClick={() => {
        if (!disabled) onToggle(!enabled);
      }}
      style={{
        width: 36,
        height: 20,
        backgroundColor: enabled ? '#4caf50' : '#ccc',
        borderRadius: 20,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.2s',
      }}
      aria-checked={enabled}
      role="switch"
    >
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          top: 2,
          left: enabled ? 18 : 2,
          transition: 'left 0.2s',
        }}
      />
    </div>
  );

  const getTemplateJson = async (t) => {
    const url = resolveAssetUrl(t.jsonUrl);

    if (templateJsonCache.has(url)) {
      return templateJsonCache.get(url);
    }

    const promise = fetch(url).then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

      const text = await res.text();

      if (text.startsWith('version https://git-lfs.github.com/spec/v1')) {
        throw new Error(`Template JSON is still an LFS pointer: ${url}`);
      }

      if (text.trim().startsWith('<')) {
        throw new Error(`Template JSON returned HTML instead of JSON: ${url}`);
      }

      return JSON.parse(text);
    });

    templateJsonCache.set(url, promise);
    return promise;
  };

  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          style={{
            marginBottom: 8,
            width: '100%',
            padding: 8,
            fontSize: 14,
            borderRadius: 6,
            border: '1px solid #ccc',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle
              enabled={categoryFilterOn}
              disabled={!activeCategory}
              onToggle={(val) => {
                if (activeCategory) setCategoryFilterOn(val);
              }}
            />
            <span>
              More designs in this category{' '}
              {activeCategory && (
                <span style={{ fontStyle: 'italic', color: '#555' }}>
                  ({activeCategory})
                </span>
              )}
            </span>
          </label>

          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Toggle
              enabled={setFilterOn}
              disabled={!activeSet}
              onToggle={(val) => {
                if (activeSet) setSetFilterOn(val);
              }}
            />
            <span>
              More designs in this set{' '}
              {activeSet && (
                <span style={{ fontStyle: 'italic', color: '#555' }}>
                  ({activeSet})
                </span>
              )}
            </span>
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="asset-masonry">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((t, index) => (
              <div
                key={t.id}
                className="asset-thumb-card"
                onClick={async () => {
                  try {
                    const json = await getTemplateJson(t);

                    runInAction(() => {
                      store.loadJSON(json);
                    });

                    setActiveCategory(t.category || null);
                    setActiveSet(t.set || null);
                    setSetFilterOn(Boolean(t.set));
                  } catch (err) {
                    console.error('Failed to load template:', err);
                  }
                }}
              >
                <img
                  loading={index < 8 ? 'eager' : 'lazy'}
                  decoding="async"
                  src={resolveAssetUrl(t.previewUrl)}
                  alt={t.name || ''}
                  className="asset-thumb-image"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = placeholderDataUrl('No preview');
                  }}
                />
                <div className="asset-thumb-label">{t.name}</div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#777',
                fontSize: 14,
                padding: '20px 0',
              }}
            >
              No templates found
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TemplatesPanel;
