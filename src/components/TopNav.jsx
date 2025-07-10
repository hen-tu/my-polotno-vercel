import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';

console.log('✅ TopNav loaded');

const TopNav = observer(({ store }) => {
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
      {/* Left: Logo */}
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <a href="https://tuteachercenter.org" target="_blank" rel="noopener noreferrer">
    <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />
  </a>
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