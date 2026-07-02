// src/components/TemplatesPanel.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { InputGroup, Spinner, Switch } from '@blueprintjs/core';

const markAsNewUnsavedDesign = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('saved');
  window.history.replaceState({}, '', url.toString());
  window.dispatchEvent(new CustomEvent('ttc-polotno-new-design'));
};

const TemplatesPanel = observer(({ store }) => {
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const [categoryFilterOn, setCategoryFilterOn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [setFilterOn, setSetFilterOn] = useState(false);
  const [activeSet, setActiveSet] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let cancelled = false;

    fetch('templates/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(async (data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setTemplates(list);

        const params = new URLSearchParams(window.location.search);
        const slug = params.get('template');
        if (!slug) return;

        const match = list.find((template) => template.id === slug);
        if (!match) {
          console.warn(`Template with id "${slug}" not found.`);
          return;
        }

        setActiveCategory(match.category || null);
        setActiveSet(match.set || null);

        const response = await fetch(match.jsonUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (cancelled) return;

        runInAction(() => store.loadJSON(json));
        if (typeof store.waitLoading === 'function') await store.waitLoading();
        markAsNewUnsavedDesign();
      })
      .catch((err) => {
        console.error('Failed to load templates:', err);
        if (!cancelled) setError('Templates could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [store]);

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const name = String(template.name || '').toLowerCase();
        const matchesQuery = name.includes(debouncedQuery);
        const matchesCategory =
          !categoryFilterOn || template.category === activeCategory;
        const matchesSet = !setFilterOn || template.set === activeSet;
        return matchesQuery && matchesCategory && matchesSet;
      }),
    [
      templates,
      debouncedQuery,
      categoryFilterOn,
      activeCategory,
      setFilterOn,
      activeSet,
    ]
  );

  const openTemplate = async (template) => {
    setBusyId(template.id);
    setError('');

    try {
      const response = await fetch(template.jsonUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();

      runInAction(() => store.loadJSON(json));
      if (typeof store.waitLoading === 'function') await store.waitLoading();
      markAsNewUnsavedDesign();

      setActiveCategory(template.category || null);
      setActiveSet(template.set || null);
    } catch (err) {
      console.error('Failed to load template:', err);
      setError('That template could not be opened.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="ttc-panel">
      <div className="ttc-panel-fixed">
        <InputGroup
          fill
          large
          leftIcon="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates"
          aria-label="Search templates"
          className="ttc-panel-search"
        />

        <div className="ttc-panel-filters">
          <Switch
            checked={categoryFilterOn}
            disabled={!activeCategory}
            onChange={(event) => setCategoryFilterOn(event.target.checked)}
            label={
              activeCategory
                ? `More in category: ${activeCategory}`
                : 'More designs in this category'
            }
          />
          <Switch
            checked={setFilterOn}
            disabled={!activeSet}
            onChange={(event) => setSetFilterOn(event.target.checked)}
            label={
              activeSet
                ? `More in set: ${activeSet}`
                : 'More designs in this set'
            }
          />
        </div>

        <div className="ttc-panel-count">
          Showing {filteredTemplates.length} of {templates.length}
        </div>
      </div>

      {error && <div className="ttc-panel-error">{error}</div>}

      <div className="ttc-panel-content">
        {loading ? (
          <div className="ttc-panel-loading">
            <Spinner size={34} />
            <span>Loading templates…</span>
          </div>
        ) : filteredTemplates.length ? (
          <div className="ttc-asset-grid ttc-template-grid">
            {filteredTemplates.map((template) => (
              <button
                type="button"
                key={template.id}
                className="ttc-asset-card"
                onClick={() => openTemplate(template)}
                disabled={busyId === template.id}
                title={template.name}
              >
                <div className="ttc-asset-preview-wrap">
                  <img
                    src={template.previewUrl}
                    alt={template.name || 'Template'}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        'https://via.placeholder.com/160x110?text=No+Preview';
                    }}
                    className="ttc-asset-preview ttc-template-preview"
                  />
                  {busyId === template.id && (
                    <div className="ttc-asset-busy">
                      <Spinner size={28} />
                    </div>
                  )}
                </div>
                <span className="ttc-asset-label">{template.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ttc-panel-empty">No templates found</div>
        )}
      </div>
    </div>
  );
});

export default TemplatesPanel;
