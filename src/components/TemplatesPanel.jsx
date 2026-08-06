import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { assetIndexUrl, assetUrl } from '../assetUrls';

const TEMPLATE_MEDIA_BASE =
  'https://media.githubusercontent.com/media/hen-tu/polotno-assets-cf/clean-assets/templates';
const TEMPLATE_RAW_BASE =
  'https://raw.githubusercontent.com/hen-tu/polotno-assets-cf/clean-assets/templates';
const TEMPLATE_PAGES_PREFIX =
  'https://hen-tu.github.io/polotno-assets-cf/templates/';

const templateJsonCache = new Map();

// Rendering every filtered template at once fires an image fetch for each
// one on panel open. Render incrementally instead, and load more as the
// user scrolls near the bottom.
const TEMPLATES_PAGE_SIZE = 60;

function placeholderDataUrl(text = 'No preview') {
  const safeText = String(text).replace(/[<>&]/g, '');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="160">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#64748b" font-family="Arial, sans-serif" font-size="16">${safeText}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function uniqueUrls(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

const CANDIDATE_FETCH_TIMEOUT_MS = 6000;

// A slow-but-not-yet-failed candidate (e.g. a stalled request) would otherwise
// block the whole fallback chain until the browser's own timeout. Cap each
// attempt so a slow candidate is skipped quickly instead of stalling the rest.
function fetchWithTimeout(url, timeoutMs = CANDIDATE_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function getTemplateAssetCandidates(value, { version = false } = {}) {
  if (!value) return [];

  const original = String(value).trim();
  const resolved = assetUrl(original, { version });
  const unversioned = assetUrl(original);

  const mediaUrl = unversioned.startsWith(TEMPLATE_PAGES_PREFIX)
    ? unversioned.replace(TEMPLATE_PAGES_PREFIX, `${TEMPLATE_MEDIA_BASE}/`)
    : '';

  const rawUrl = unversioned.startsWith(TEMPLATE_PAGES_PREFIX)
    ? unversioned.replace(TEMPLATE_PAGES_PREFIX, `${TEMPLATE_RAW_BASE}/`)
    : '';

  // The media URL matches the route that worked before for Git LFS assets.
  // The original/Pages and raw URLs remain as fallbacks.
  return uniqueUrls([mediaUrl, resolved, rawUrl, unversioned]);
}

function setNextImageSource(event, candidates) {
  const image = event.currentTarget;
  const currentIndex = Number(image.dataset.fallbackIndex || 0);
  const nextIndex = currentIndex + 1;

  if (nextIndex < candidates.length) {
    image.dataset.fallbackIndex = String(nextIndex);
    image.src = candidates[nextIndex];
    return;
  }

  image.onerror = null;
  image.src = placeholderDataUrl('No preview');
}

const TemplatesPanel = observer(({ store }) => {
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilterOn, setCategoryFilterOn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [setFilterOn, setSetFilterOn] = useState(false);
  const [activeSet, setActiveSet] = useState(null);
  const [visibleCount, setVisibleCount] = useState(TEMPLATES_PAGE_SIZE);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const getTemplateJson = async (template) => {
    const candidates = getTemplateAssetCandidates(template.jsonUrl, {
      version: true,
    });

    if (!candidates.length) {
      throw new Error('Template has no JSON URL.');
    }

    const cacheKey = candidates.join('|');
    if (templateJsonCache.has(cacheKey)) {
      return templateJsonCache.get(cacheKey);
    }

    const promise = (async () => {
      let lastError = null;

      for (const url of candidates) {
        try {
          const response = await fetchWithTimeout(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} for ${url}`);
          }

          const text = await response.text();
          if (text.startsWith('version https://git-lfs.github.com/spec/v1')) {
            throw new Error(`Template JSON is still an LFS pointer: ${url}`);
          }
          if (text.trim().startsWith('<')) {
            throw new Error(`Template JSON returned HTML instead of JSON: ${url}`);
          }

          return JSON.parse(text);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error('Unable to load template JSON.');
    })();

    templateJsonCache.set(cacheKey, promise);
    return promise;
  };

  useEffect(() => {
    fetch(assetIndexUrl('templates/index.json'))
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const usableTemplates = rows.filter(
          (template) =>
            template.id !== 'sample-template' &&
            !String(template.jsonUrl || '').includes('sample-card.json') &&
            !String(template.previewUrl || '').includes('sample-template.png')
        );

        setTemplates(usableTemplates);

        const slug = new URLSearchParams(window.location.search).get('template');
        if (!slug) return;

        const match = usableTemplates.find((template) => template.id === slug);
        if (!match) {
          console.warn(`Template with id "${slug}" not found.`);
          return;
        }

        setActiveCategory(match.category || null);
        setActiveSet(match.set || null);
        setSetFilterOn(Boolean(match.set));

        getTemplateJson(match)
          .then((json) => {
            runInAction(() => store.loadJSON(json));
          })
          .catch((error) => {
            console.error('Failed to auto-load template from URL:', error);
          });
      })
      .catch((error) => console.error('Failed to load templates:', error));
  }, [store]);

  const filteredTemplates = templates.filter((template) => {
    const name = String(template.name || '').toLowerCase();
    const matchesQuery = name.includes(debouncedQuery);
    const matchesCategory =
      !categoryFilterOn ||
      (template.category && template.category === activeCategory);
    const matchesSet =
      !setFilterOn || (template.set && template.set === activeSet);

    return matchesQuery && matchesCategory && matchesSet;
  });

  // Show the first page again whenever the filters change what's in the list.
  useEffect(() => {
    setVisibleCount(TEMPLATES_PAGE_SIZE);
  }, [debouncedQuery, categoryFilterOn, activeCategory, setFilterOn, activeSet]);

  const visibleTemplates = filteredTemplates.slice(0, visibleCount);
  const hasMoreTemplates = visibleCount < filteredTemplates.length;

  useEffect(() => {
    if (!hasMoreTemplates) return undefined;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((count) => count + TEMPLATES_PAGE_SIZE);
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreTemplates]);

  const openTemplate = async (template) => {
    try {
      const json = await getTemplateJson(template);
      runInAction(() => store.loadJSON(json));

      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      setActiveCategory(template.category || null);
      setActiveSet(template.set || null);
      setSetFilterOn(Boolean(template.set));
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const Toggle = ({ enabled, onToggle, disabled }) => (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onToggle(!enabled);
      }}
      className="ttc-toggle"
      disabled={disabled}
      aria-checked={enabled}
      role="switch"
      style={{ backgroundColor: enabled ? '#2e8bf0' : '#cbd5e1' }}
    >
      <span style={{ left: enabled ? 18 : 2 }} />
    </button>
  );

  return (
    <div
      style={{
        padding: 12,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates..."
          className="ttc-panel-search"
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            marginTop: 10,
          }}
        >
          <label
            style={{
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Toggle
              enabled={categoryFilterOn}
              disabled={!activeCategory}
              onToggle={(value) => {
                if (activeCategory) setCategoryFilterOn(value);
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

          <label
            style={{
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Toggle
              enabled={setFilterOn}
              disabled={!activeSet}
              onToggle={(value) => {
                if (activeSet) setSetFilterOn(value);
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

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div className="asset-masonry">
          {visibleTemplates.length > 0 ? (
            visibleTemplates.map((template) => {
              const previewCandidates = getTemplateAssetCandidates(
                template.previewUrl,
                { version: true }
              );

              return (
                <button
                  type="button"
                  key={template.id}
                  onClick={() => openTemplate(template)}
                  className="asset-thumb-card"
                  aria-label={`Open ${template.name}`}
                >
                  <img
                    src={
                      previewCandidates[0] || placeholderDataUrl('No preview')
                    }
                    alt={template.name}
                    loading="lazy"
                    data-fallback-index="0"
                    onError={(event) =>
                      setNextImageSource(event, previewCandidates)
                    }
                    className="asset-thumb-image"
                  />
                  <span className="asset-thumb-label">{template.name}</span>
                </button>
              );
            })
          ) : (
            <div className="ttc-empty-grid-message">No templates found</div>
          )}
        </div>
        {hasMoreTemplates && <div ref={loadMoreRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
});

export default TemplatesPanel;
