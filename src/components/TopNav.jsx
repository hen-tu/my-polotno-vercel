import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, InputGroup } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';

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

  const handleDownloadImage = () => {
    const dataURL = store.toDataURL();
    downloadFile(dataURL, 'design.png');
  };

  const handleDownloadPDF = async () => {
    const pdfData = await store.saveAsPDF();
    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, 'design.pdf');
    URL.revokeObjectURL(url);
  };

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
        <div style={{ marginBottom: 4, fontWeight: 600 }}>Custom size (inches)</div>
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

  const downloadMenu = (
    <Menu>
      <MenuItem text="Save as Image" onClick={handleDownloadImage} />
      <MenuItem text="Save as PDF" onClick={handleDownloadPDF} />
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
        boxSizing: 'border-box',
        color: 'white',
      }}
    >
      {/* Left: Logo + Resize */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <a href="https://tuteachercenter.org">
          <img src="/logo.webp" alt="Logo" style={{ height: '30px' }} />
        </a>

        <Popover content={resizeMenu} position="bottom-left">
          <Button icon="resize-video" style={{ background: 'transparent', color: 'white' }}>
            Resize
          </Button>
        </Popover>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: Download Popover */}
      <Popover content={downloadMenu} position="bottom-right">
        <button
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
      </Popover>
    </div>
  );
});

export default TopNav;