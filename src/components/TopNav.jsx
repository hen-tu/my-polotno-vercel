import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  Popover,
  Menu,
  MenuItem,
  InputGroup,
  PopoverInteractionKind,
  Position,
} from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

// MobX-safe resize action
const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) {
    page.width = w;
    page.height = h;
  }
});

const TopNav = observer(({ store }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
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
    setPopoverOpen(false);
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
          justifyContent: 'space-between',
          padding: '0 16px',
          boxSizing: 'border-box',
          color: 'white',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Logo */}
        <a
          href="https://tuteachercenter.org"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <img src="/logo.webp" alt="Logo" style={{ height: '30px' }} />
        </a>

        {/* Resize Button + Popover */}
        <Popover
          isOpen={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          interactionKind={PopoverInteractionKind.CLICK}
          position={Position.BOTTOM_LEFT}
          content={
            <div
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'white',
                borderRadius: '8px',
                minWidth: '240px',
              }}
            >
              {[
                { label: '8.5" × 11" (Letter)', w: 612, h: 792 },
                { label: '11" × 17" (Double)', w: 792, h: 1224 },
                { label: '13" × 19" (Small Poster)', w: 936, h: 1368 },
                { label: '18" × 24" (Large Poster)', w: 1296, h: 1728 },
                { label: '24" × 28" (Oaktag)', w: 1728, h: 2016 },
              ].map(({ label, w, h }) => (
                <Button
                  key={label}
                  onClick={() => handleResize(w, h)}
                  style={{
                    paddingTop: '9px',
                    paddingBottom: '9px',
                    border: 'none',
                    boxShadow: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Button>
              ))}

              <hr />

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: '1 1 100px' }}>
                  <InputGroup
                    placeholder="Width"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    rightElement={<span style={{ padding: '0 6px' }}>in</span>}
                  />
                </div>
                <div style={{ flex: '1 1 100px' }}>
                  <InputGroup
                    placeholder="Height"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    rightElement={<span style={{ padding: '0 6px' }}>in</span>}
                  />
                </div>
              </div>

              <Button
                intent="primary"
                onClick={handleCustomResize}
                style={{
                  backgroundColor: '#488FCC',
                  color: 'white',
                  paddingTop: '9px',
                  paddingBottom: '9px',
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                Apply Custom Size
              </Button>
            </div>
          }
        >
          <Button
            minimal
            elementRef={resizeButtonRef}
            onClick={() => setPopoverOpen(!popoverOpen)}
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
        </Popover>

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
            Download
          </button>
        </Popover>
      </div>
    </>
  );
});

export default TopNav;