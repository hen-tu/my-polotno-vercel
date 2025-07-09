// src/components/ResizeButton.jsx

import React, { useState } from 'react';
import { Button, Popover, Menu, MenuItem, InputGroup } from '@blueprintjs/core';

const inchToPx = (inches) => inches * 96;

const PRESETS = [
  { label: '8.5" × 11" (Letter)', width: 8.5, height: 11 },
  { label: '11" × 17" (Double)', width: 11, height: 17 },
  { label: '13" × 19" (Small Poster)', width: 13, height: 19 },
  { label: '18" × 24" (Large Poster)', width: 18, height: 24 },
  { label: '24" × 28" (Oaktag)', width: 24, height: 28 },
];

const ResizeButton = ({ store }) => {
  const [widthInches, setWidthInches] = useState('');
  const [heightInches, setHeightInches] = useState('');

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

  const menu = (
    <Menu style={{ padding: '12px', width: '220px' }}>
      {PRESETS.map((preset) => (
        <MenuItem
          key={preset.label}
          text={preset.label}
          onClick={() => applyResize(preset.width, preset.height)}
        />
      ))}
      <div style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 4 }}>Custom size (inches):</div>
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
    <Popover content={menu} position="bottom">
      <Button icon="resize-video">Resize</Button>
    </Popover>
  );
};

export default ResizeButton;