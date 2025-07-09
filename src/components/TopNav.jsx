// src/components/TopNav.jsx

import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Tooltip,
  Popover,
  Menu,
  MenuItem,
  InputGroup,
} from '@blueprintjs/core';

import '@blueprintjs/core/lib/css/blueprint.css'; // 🔹 Required for Blueprint UI

console.log('✅ TopNav is rendering');

const inchToPx = (inches) => inches * 96;

const PRESETS = [
  { label: '8.5" × 11" (Letter)', width: 8.5, height: 11 },
  { label: '11" × 17" (Double)', width: 11, height: 17 },
  { label: '13" × 19" (Small Poster)', width: 13, height: 19 },
  { label: '18" × 24" (Large Poster)', width: 18, height: 24 },
  { label: '24" × 28" (Oaktag)', width: 24, height: 28 },
];

const TopNav = observer(({ store }) => {
  const [widthInches, setWidthInches] = useState('');
  const [heightInches, setHeightInches] = useState('');

  const handleUndo = () => store.history.undo();
  const handleRedo = () => store.history.redo();

  const applyResize = (w, h) => {
    store.width = inchToPx(w);
    store.height = inchToPx(h);
  };

  const handleCustomResize = () => {
    const w = parseFloat(widthInches);
    const h = parseFloat(heightInches);
    if (!isNaN(w) && !isNaN(h)) {
      applyResize(w, h);
    }
  };

  const resizeMenu = (
    <Menu style={{ padding: '12px', width: '240px' }}>
      {PRESETS.map((preset) => (
        <MenuItem
          key={preset.label}
          text={preset.label}
          onClick={() => applyResize(preset.width, preset.height)}
        />
      ))}
      <div style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 4, fontWeight: 600 }}>
          Custom size (inches)
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <InputGroup
            placeholder="Width"
            value={widthInches}
            onChange={(e) => setWidthInches(e.target.value)}
            style={{ width: '80px' }}
          />
          <InputGroup
            placeholder="Height"
            value={heightInches}
            onChange={(e) => setHeightInches(e.target.value)}
            style={{ width: '80px' }}
          />
        </div>
        <Button small fill onClick={handleCustomResize}>
          Resize
        </Button>
      </div>
    </Menu>
  );

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
      {/* Left section: Logo + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />

        <Tooltip
          content={store.history.canUndo ? 'Undo' : 'Nothing to undo'}
          hoverOpenDelay={300}
        >
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
            className={
              store.history.canUndo ? 'undo-button active' : 'undo-button disabled'
            }
          />
        </Tooltip>

        <Tooltip
          content={store.history.canRedo ? 'Redo' : 'Nothing to redo'}
          hoverOpenDelay={300}
        >
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
            className={
              store.history.canRedo ? 'redo-button active' : 'redo-button disabled'
            }
          />
        </Tooltip>

        <Popover content={resizeMenu} position="bottom">
          <Button
            icon="resize-video"
            style={{
              background: 'transparent',
              color: 'white',
            }}
          >
            Resize
          </Button>
        </Popover>
      </div>

      {/* Right spacer */}
      <div style={{ flex: 1 }} />
    </div>
  );
});

export default TopNav;