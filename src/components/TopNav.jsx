import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, InputGroup } from '@blueprintjs/core';

const inchToPx = (inches) => inches * 96;

const PRESETS = [
  { label: '8.5" × 11" (Letter)', width: 8.5, height: 11 },
  { label: '11" × 17" (Tabloid)', width: 11, height: 17 },
  { label: '18" × 24" (Poster)', width: 18, height: 24 },
];

const TopNav = observer(({ store }) => {
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  const applyResize = (w, h) => {
    store.width = inchToPx(w);
    store.height = inchToPx(h);
  };

  const handleCustomResize = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    if (!isNaN(w) && !isNaN(h)) {
      applyResize(w, h);
    }
  };

  const resizeMenu = (
    <Menu style={{ padding: 12, width: 250 }}>
      {PRESETS.map(({ label, width, height }) => (
        <MenuItem
          key={label}
          text={label}
          onClick={() => applyResize(width, height)}
        />
      ))}
      <div style={{ paddingTop: 10 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
          Custom size (inches)
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <InputGroup
            placeholder="Width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            style={{ width: '80px' }}
          />
          <InputGroup
            placeholder="Height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            style={{ width: '80px' }}
          />
        </div>
        <Button small fill intent="primary" onClick={handleCustomResize}>
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
        background: 'linear-gradient(to right, #488fcc, #ce3c4f)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        color: 'white',
        boxSizing: 'border-box',
      }}
    >
      <a href="https://tuteachercenter.org">
        <img src="/logo.webp" alt="Logo" style={{ height: '30px' }} />
      </a>

      <Popover content={resizeMenu} position="bottom-left">
  <div
    style={{
      padding: '6px 16px',
      marginLeft: '12px',
      backgroundColor: 'transparent',
      color: 'white',
      border: 'none',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      fontSize: '16px',
      borderRadius: '3%',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    Resize
  </div>
</Popover>


      <div style={{ flex: 1 }} />
    </div>
  );
});

export default TopNav;