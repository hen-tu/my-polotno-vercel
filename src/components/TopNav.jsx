import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Tooltip } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';

console.log('✅ TopNav loaded');

const TopNav = observer(({ store }) => {
  const handleUndo = () => {
    store.history.undo();
  };

  const handleRedo = () => {
    store.history.redo();
  };

  const handleDownload = () => {
    const dataURL = store.toDataURL();
    downloadFile(dataURL, 'design.png');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '50px',
        minHeight: '50px',
        maxHeight: '50px',
        background: 'linear-gradient(to right, #488fcc, #ce3c4f)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        boxSizing: 'border-box',
        color: 'white',
        flexShrink: 0,
      }}
    >
      {/* Left section: Logo + Undo/Redo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />

        <Tooltip content={store.history.canUndo ? 'Undo' : 'Nothing to undo'} hoverOpenDelay={300}>
          <Button
            icon="undo"
            onClick={handleUndo}
            disabled={!store.history.canUndo}
            style={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              pointerEvents: store.history.canUndo ? 'auto' : 'none',
            }}
            className={store.history.canUndo ? 'undo-button active' : 'undo-button disabled'}
          />
        </Tooltip>

        <Tooltip content={store.history.canRedo ? 'Redo' : 'Nothing to redo'} hoverOpenDelay={300}>
          <Button
            icon="redo"
            onClick={handleRedo}
            disabled={!store.history.canRedo}
            style={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              pointerEvents: store.history.canRedo ? 'auto' : 'none',
            }}
            className={store.history.canRedo ? 'redo-button active' : 'redo-button disabled'}
          />
        </Tooltip>
      </div>

      {/* Spacer to push download button right */}
      <div style={{ flex: 1 }} />

      {/* Right: Styled Download Button */}
      <button
        onClick={handleDownload}
        style={{
          borderRadius: '28px',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#ce3c4f',
          border: '2px solid white',
          padding: '6px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.2s ease-in-out',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#ce3c4f';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#ce3c4f';
          e.target.style.color = 'white';
        }}
      >
        Download
      </button>
    </div>
  );
});

export default TopNav;