import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, InputGroup, Card } from '@blueprintjs/core';
import { Icon } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

// ✅ Define MobX-safe action outside component
const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) {
    page.width = w;
    page.height = h;
  }
});

const TopNav = observer(({ store }) => {
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [resizeOpen, setResizeOpen] = useState(false);
  const resizeButtonRef = useRef(null);

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
    applyResize(store, w, h);
    setResizeOpen(false);
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

        {/* RESIZE Button with popover */}
        <Popover
          isOpen={resizeOpen}
          onClose={() => setResizeOpen(false)}
          content={
            <Card style={{ padding: '16px', width: '300px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button style={{ padding: '9px 0' }} onClick={() => handleResize(612, 792)}>
                  8.5″ × 11″ (Letter)
                </Button>
                <Button style={{ padding: '9px 0' }} onClick={() => handleResize(792, 1224)}>
                  11″ × 17″ (Double)
                </Button>
                <Button style={{ padding: '9px 0' }} onClick={() => handleResize(936, 1368)}>
                  13″ × 19″ (Small Poster)
                </Button>
                <Button style={{ padding: '9px 0' }} onClick={() => handleResize(1296, 1728)}>
                  18″ × 24″ (Large Poster)
                </Button>
                <Button style={{ padding: '9px 0' }} onClick={() => handleResize(1728, 2016)}>
                  24″ × 28″ (Oaktag)
                </Button>

                <hr />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <InputGroup
                    placeholder='Width (in)'
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                  />
                  <InputGroup
                    placeholder='Height (in)'
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                  />
                </div>
                <Button
                  intent="primary"
                  style={{
                    backgroundColor: '#488FCC',
                    border: 'none',
                    padding: '9px 0',
                  }}
                  onClick={handleCustomResize}
                >
                  Apply Custom Size
                </Button>
              </div>
            </Card>
          }
          position="bottom-left"
          targetProps={{ ref: resizeButtonRef }}
        >
          <Button
            minimal
            style={{
              fontWeight: 'bold',
              fontSize: '16px',
              color: 'white',
              borderRadius: '3%',
              background: 'transparent',
              padding: '9px 12px',
            }}
            onClick={() => setResizeOpen(!resizeOpen)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            ref={resizeButtonRef}
          >
            RESIZE
          </Button>
        </Popover>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Download Button */}
        <Popover content={downloadMenu} position="bottom-right">
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              color: 'white',
              backgroundColor: '#ce3c4f',
              border: '1px solid white',
              padding: '9px 16px',
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
            <Icon icon="download" />
            Download
          </button>
        </Popover>
      </div>
    </>
  );
});

export default TopNav;