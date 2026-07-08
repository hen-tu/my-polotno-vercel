import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Dialog, Spinner } from '@blueprintjs/core';
import {
  announceCurrentAccountDesign,
  deleteAccountDesign,
  getAccountDesign,
  listAccountDesigns,
  redirectToLogin,
} from './saved-designs-api';

function parseDesignJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  return JSON.parse(value);
}

const SavedDesignsPanel = observer(({ store }) => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDesigns = useCallback(async () => {
    setLoading(true);
    setError('');
    setLoginUrl('');

    try {
      const data = await listAccountDesigns();
      setDesigns(Array.isArray(data.designs) ? data.designs : []);
    } catch (err) {
      if (err.code === 'not_logged_in') {
        setLoginUrl(err.loginUrl || '');
        setError('Please log in to see your saved designs.');
      } else {
        setError(err.message || 'Saved designs could not be loaded.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDesigns();

    const refresh = () => loadDesigns();
    window.addEventListener('ttc-polotno-saved-designs-refresh', refresh);

    return () => {
      window.removeEventListener('ttc-polotno-saved-designs-refresh', refresh);
    };
  }, [loadDesigns]);

  const openDesign = async (design) => {
    setBusyId(design.id);
    setError('');

    try {
      const data = await getAccountDesign(design.id);
      const json = parseDesignJson(data.design_json);

      if (!json) {
        throw new Error('This saved design is missing its editable JSON.');
      }

      store.loadJSON(json);

      if (typeof store.waitLoading === 'function') {
        await store.waitLoading();
      }

      announceCurrentAccountDesign({
        id: data.id || design.id,
        title: data.title || design.title,
      });
    } catch (err) {
      if (err.code === 'not_logged_in') {
        setLoginUrl(err.loginUrl || '');
        setError('Please log in to open saved designs.');
      } else {
        setError(err.message || 'Could not open saved design.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const askDeleteDesign = (design) => {
    setDeleteTarget(design);
  };

  const confirmDeleteDesign = async () => {
    const design = deleteTarget;
    if (!design) return;

    setBusyId(design.id);
    setError('');

    try {
      await deleteAccountDesign(design.id);
      setDesigns((prev) => prev.filter((item) => item.id !== design.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Could not delete saved design.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="ttc-panel ttc-saved-designs-panel">
        <div className="ttc-panel-scroll">
        <div className="ttc-saved-designs-header">
          <div>
            <div className="ttc-saved-designs-title">My Files</div>
            <div className="ttc-saved-designs-subtitle">Saved to your account</div>
          </div>
          <Button className="ttc-panel-action" small onClick={loadDesigns} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="ttc-panel-loader">
            <Spinner size={24} />
          </div>
        ) : error ? (
          <div className="ttc-saved-designs-message">
            <div>{error}</div>
            {loginUrl ? (
              <Button
                className="ttc-panel-action ttc-panel-action-primary"
                onClick={() => redirectToLogin(loginUrl)}
              >
                Log in to save
              </Button>
            ) : null}
          </div>
        ) : designs.length === 0 ? (
          <div className="ttc-saved-designs-message">
            <strong>No saved files yet.</strong>
            <span>Use File → Save to save your current design.</span>
          </div>
        ) : (
          <div className="asset-masonry ttc-saved-designs-grid">
            {designs.map((design) => (
              <div key={design.id} className="ttc-saved-design-card">
                <button
                  type="button"
                  className="asset-thumb-card ttc-saved-design-thumb"
                  onClick={() => openDesign(design)}
                  disabled={busyId === design.id}
                >
                  {design.preview_url ? (
                    <img
                      className="asset-thumb-image"
                      src={design.preview_url}
                      alt={design.title}
                    />
                  ) : (
                    <div className="ttc-saved-design-no-preview">No preview</div>
                  )}
                  <span className="asset-thumb-label">{design.title}</span>
                </button>

                <div className="ttc-saved-design-name" title={design.title}>
                  {design.title}
                </div>

                <div className="ttc-saved-design-actions">
                  <Button
                    className="ttc-saved-design-mini-action"
                    small
                    onClick={() => openDesign(design)}
                    loading={busyId === design.id}
                  >
                    Open
                  </Button>
                  <Button
                    className="ttc-saved-design-mini-action"
                    small
                    onClick={() => askDeleteDesign(design)}
                    disabled={busyId === design.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete saved design"
        className="ttc-cart-dialog ttc-file-save-dialog ttc-delete-design-dialog"
        canOutsideClickClose={busyId !== deleteTarget?.id}
        enforceFocus
      >
        <div className="ttc-cart-dialog-body">
          <div className="ttc-login-required-message">
            Delete “{deleteTarget?.title || 'this design'}”?
          </div>
          <div className="ttc-login-required-note">
            This will remove the saved design from your account. This cannot be undone.
          </div>
          <div className="ttc-cart-dialog-actions">
            <Button onClick={() => setDeleteTarget(null)} disabled={busyId === deleteTarget?.id}>
              Cancel
            </Button>
            <Button
              intent="primary"
              loading={busyId === deleteTarget?.id}
              onClick={confirmDeleteDesign}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
});

SavedDesignsPanel.title = 'My Files';
SavedDesignsPanel.icon = 'folder-close';

export default SavedDesignsPanel;
