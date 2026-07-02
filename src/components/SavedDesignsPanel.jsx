// src/components/SavedDesignsPanel.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Spinner } from '@blueprintjs/core';
import {
  deleteSavedDesign,
  getPolotnoAccountSession,
  getSavedDesign,
  goToAccountLogin,
  listSavedDesigns,
} from './saved-designs-api';

const SavedDesignsPanel = observer(({ store }) => {
  const [session, setSession] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(0);
  const [error, setError] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextSession = await getPolotnoAccountSession();
      setSession(nextSession);

      if (!nextSession.logged_in) {
        setDesigns([]);
        return;
      }

      const data = await listSavedDesigns();
      setDesigns(data.designs || []);
    } catch (err) {
      console.error('Could not load saved designs:', err);
      setError(err.message || 'Could not load saved designs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();

    const refresh = () => loadList();
    window.addEventListener('ttc-polotno-design-saved', refresh);
    window.addEventListener('ttc-polotno-design-deleted', refresh);

    return () => {
      window.removeEventListener('ttc-polotno-design-saved', refresh);
      window.removeEventListener('ttc-polotno-design-deleted', refresh);
    };
  }, [loadList]);

  const openDesign = async (item) => {
    setBusyId(item.id);
    setError('');

    try {
      const data = await getSavedDesign(item.id);
      store.loadJSON(data.design);
      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      window.dispatchEvent(
        new CustomEvent('ttc-polotno-design-loaded', {
          detail: {
            id: data.item.id,
            name: data.item.name,
          },
        })
      );
    } catch (err) {
      console.error('Could not open saved design:', err);
      setError(err.message || 'Could not open that design.');
    } finally {
      setBusyId(0);
    }
  };

  const removeDesign = async (item) => {
    const confirmed = window.confirm(
      `Delete “${item.name}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(item.id);
    setError('');

    try {
      await deleteSavedDesign(item.id);
      setDesigns((current) => current.filter((design) => design.id !== item.id));
      window.dispatchEvent(
        new CustomEvent('ttc-polotno-design-deleted', {
          detail: { id: item.id },
        })
      );
    } catch (err) {
      console.error('Could not delete saved design:', err);
      setError(err.message || 'Could not delete that design.');
    } finally {
      setBusyId(0);
    }
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <Spinner size={34} />
        <div style={{ marginTop: 10 }}>Loading saved designs…</div>
      </div>
    );
  }

  if (session && !session.logged_in) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyTitle}>Save designs to your account</div>
        <div style={styles.emptyText}>
          Log in to open and continue editing your saved designs from any device.
        </div>
        <Button intent="primary" onClick={() => goToAccountLogin(session)}>
          Log In
        </Button>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Saved Designs</div>
          <div style={styles.subtitle}>{designs.length} saved</div>
        </div>
        <Button minimal icon="refresh" onClick={loadList} title="Refresh" />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {designs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyTitle}>No saved designs yet</div>
          <div style={styles.emptyText}>
            Use the Save button at the top of the editor and give your design a name.
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {designs.map((item) => (
            <div key={item.id} style={styles.card}>
              <button
                type="button"
                onClick={() => openDesign(item)}
                style={styles.previewButton}
                disabled={busyId === item.id}
                aria-label={`Open ${item.name}`}
              >
                {item.preview_url ? (
                  <img src={item.preview_url} alt="" style={styles.preview} />
                ) : (
                  <div style={styles.noPreview}>No preview</div>
                )}
                {busyId === item.id && (
                  <div style={styles.busyOverlay}>
                    <Spinner size={30} />
                  </div>
                )}
              </button>

              <div style={styles.cardBody}>
                <div style={styles.name} title={item.name}>
                  {item.name}
                </div>
                <div style={styles.modified}>{item.modified_display}</div>
                <div style={styles.actions}>
                  <Button
                    small
                    intent="primary"
                    onClick={() => openDesign(item)}
                    disabled={busyId === item.id}
                  >
                    Open
                  </Button>
                  <Button
                    small
                    minimal
                    intent="danger"
                    icon="trash"
                    onClick={() => removeDesign(item)}
                    disabled={busyId === item.id}
                    title="Delete"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

const styles = {
  panel: {
    height: '100%',
    overflowY: 'auto',
    padding: 12,
    boxSizing: 'border-box',
    background: '#fff',
  },
  centered: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    color: '#555',
    textAlign: 'center',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontWeight: 700, fontSize: 17 },
  subtitle: { color: '#777', fontSize: 12, marginTop: 2 },
  error: {
    background: '#fff1f1',
    border: '1px solid #e7b6b6',
    color: '#9b1c1c',
    borderRadius: 5,
    padding: 9,
    marginBottom: 10,
    fontSize: 13,
  },
  emptyState: {
    margin: 12,
    padding: 20,
    border: '1px dashed #c9c9c9',
    borderRadius: 8,
    textAlign: 'center',
    background: '#fafafa',
  },
  emptyTitle: { fontWeight: 700, marginBottom: 7 },
  emptyText: { color: '#666', fontSize: 13, lineHeight: 1.45, marginBottom: 14 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid #d9d9d9',
    borderRadius: 7,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
  },
  previewButton: {
    display: 'block',
    width: '100%',
    height: 105,
    padding: 0,
    margin: 0,
    border: 0,
    borderRadius: 0,
    background: '#f2f2f2',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  },
  noPreview: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: 12,
  },
  busyOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.78)',
  },
  cardBody: { padding: 9 },
  name: {
    fontWeight: 650,
    fontSize: 13,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  modified: { fontSize: 11, color: '#777', marginTop: 3 },
  actions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
};

export default SavedDesignsPanel;
