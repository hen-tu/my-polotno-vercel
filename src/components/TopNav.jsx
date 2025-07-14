import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, Dialog, InputGroup } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

// ✅ Define the MobX action OUTSIDE the component
const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) {
    page.width = w;
    page.height = h;
  }
});

const TopNav = observer(({ store }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

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

  const downloadMenu = (
    <Menu>
      <MenuItem text="Save as Image" onClick={handleDownloadImage} />
      <MenuItem text="Save as PDF" onClick={handleDownloadPDF} />
    </Menu>
  );

  const handleResize = (w, h) => {
    applyResize(store, w, h); // ✅ Calls the MobX action
    setDialogOpen(false);     // ✅ Separate from MobX action
  };

  const handleCustomResize = () => {
    const width = parseFloat(customWidth) * 72;
    const height = parseFloat(customHeight) * 72;
    if (!isNaN(width) && !isNaN(height)) {
      handleResize(width, height);
    }
  };

  return (
    <>
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
          gap: '12px',
        }}
      >
        {/* Logo */}
        <a href="https://tuteachercenter.org" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.webp" alt="Logo" style={{ height: '30px' }} />
        </a>

        {/* Resize Button */}
        <Button
          minimal
          onClick={() => setDialogOpen(true)}
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: 'white',
            borderRadius: '3%',
            background: 'transparent',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          RESIZE
        </Button>

        <div style={{ flex: 1 }} />

        {/* Download Button */}
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

      {/* Resize Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Resize Canvas"
        style={{ width: '320px' }}
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button onClick={() => handleResize(612, 792)}>8.5" × 11" (Letter)</Button>
          <Button onClick={() => handleResize(792, 1224)}>11" × 17" (Double)</Button>
          <Button onClick={() => handleResize(936, 1368)}>13" × 19" (Small Poster)</Button>
          <Button onClick={() => handleResize(1296, 1728)}>18" × 24" (Large Poster)</Button>
          <Button onClick={() => handleResize(1728, 2016)}>24" × 28" (Oaktag)</Button>

          <hr />

          <div style={{ display: 'flex', gap: '8px' }}>
            <InputGroup
              placeholder="Width (inches)"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
            />
            <InputGroup
              placeholder="Height (inches)"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
            />
          </div>
          <Button intent="primary" onClick={handleCustomResize}>
            Apply Custom Size
          </Button>
        </div>
      </Dialog>
    </>
  );
});

export default TopNav;