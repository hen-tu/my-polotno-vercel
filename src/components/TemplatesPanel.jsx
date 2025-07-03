import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

const TemplatesPanel = observer(({ store }) => {
  const [templates, setTemplates] = useState([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [categoryFilterOn, setCategoryFilterOn] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.toLowerCase());
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    fetch('templates/index.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTemplates(data);

        const params = new URLSearchParams(window.location.search);
        const slug = params.get('template');

        if (slug) {
          const match = data.find((t) => t.id === slug);
          if (match) {
            setActiveCategory(match.category || null); // don't enable toggle
            fetch(match.jsonUrl)
              .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
              })
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

  const filteredTemplates = templates.filter((t) => {
    const matchesQuery = t.name.toLowerCase().includes(debouncedQuery);
    const matchesCategory = !categoryFilterOn || (t.category && t.category === activeCategory);
    return matchesQuery && matchesCategory;
  });

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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              onClick={() => {
                if (activeCategory) setCategoryFilterOn(!categoryFilterOn);
              }}
              style={{
                width: 36,
                height: 20,
                backgroundColor: categoryFilterOn ? '#4caf50' : '#ccc',
                borderRadius: 20,
                position: 'relative',
                cursor: activeCategory ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: 2,
                  left: categoryFilterOn ? 18 : 2,
                  transition: 'left 0.2s',
                }}
              />
            </div>
            More designs in this category
            {activeCategory && (
              <span style={{ fontStyle: 'italic', color: '#555' }}>({activeCategory})</span>
            )}
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Showing {filteredTemplates.length} of {templates.length} templates
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 12,
          }}
        >
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((t) => (
              <div
                key={t.id}
                onClick={async () => {
                  try {
                    const res = await fetch(t.jsonUrl);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const json = await res.json();
                    runInAction(() => {
                      store.loadJSON(json);
                    });
                    await store.waitLoading();
                    setActiveCategory(t.category || null);
                  } catch (err) {
                    console.error('Failed to load template:', err);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <img
                  src={t.previewUrl}
                  alt={t.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/120x80?text=No+Preview';
                  }}
                  style={{
                    width: '100%',
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    backgroundColor: '#f0f0f0',
                  }}
                />
                <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
              </div>
            ))
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
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