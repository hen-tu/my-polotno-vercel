import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Popover, Menu, MenuItem, Dialog, InputGroup, Position } from '@blueprintjs/core';
import { Icon } from '@blueprintjs/core';
import { downloadFile } from 'polotno/utils/download';
import { action } from 'mobx';

console.log('✅ TopNav loaded');

const applyResize = action((store, w, h) => {
  const page = store.activePage;
  if (page) {
    page.set({ width: w, height: h });
  }
});

const TopNav = observer(({ store }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [showModal, setShowModal] = useState(false);
  const resizeButtonRef = useRef(null);

  const handleResize = (w, h) => {
    applyResize(store, w, h);
    setDialogOpen(false);
  };

  const handleCustomResize = () => {
    const width = parseFloat(customWidth) * 72;
    const height = parseFloat(customHeight) * 72;
    if (!isNaN(width) && !isNaN(height)) {
      handleResize(width, height);
    }
  };

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

  const handleAddToCart = async () => {
    setShowModal(true);

    setTimeout(async () => {
      const pdfBuffer = await store.saveAsPDF();
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64PDF = reader.result;
        const iframe = document.getElementById('woo-iframe');
        if (iframe) {
          iframe.contentWindow.postMessage(
            {
              type: 'SET_PDF',
              pdfBase64: base64PDF,
            },
            '*'
          );
        }
      };

      reader.readAsDataURL(pdfBlob);
    }, 800);
  };

  const downloadMenu = (
    <Menu>
      <MenuItem text="Save as Image" onClick={handleDownloadImage} />
      <MenuItem text="Save as PDF" onClick={handleDownloadPDF} />
    </Menu>
  );

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
          elementRef={resizeButtonRef}
          onClick={() => setDialogOpen(true)}
          style={{
            fontWeight: 'bold',
            fontSize: '16px',
            color: 'white',
            padding: '9px 14px',
            borderRadius: '3px',
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

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          style={{
            marginLeft: '8px',
            textTransform: 'uppercase',
            color: '#ce3d50',
            backgroundColor: '#ffffff',
            borderRadius: '4px',
            border: '1px solid #ce3d50',
            padding: '6px 12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fceced')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          Add to Cart
        </Button>
      </div>

      {/* Resize Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Resize Canvas"
        autoFocus
        enforceFocus
        canOutsideClickClose
        style={{
          width: '320px',
          position: 'absolute',
          top: '60px',
          left: resizeButtonRef.current?.getBoundingClientRect().left ?? 100,
          zIndex: 9999,
        }}
      >
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button onClick={() => handleResize(612, 792)}>8.5″ × 11″ (Letter)</Button>
          <Button onClick={() => handleResize(792, 1224)}>11″ × 17″ (Double)</Button>
          <Button onClick={() => handleResize(936, 1368)}>13″ × 19″ (Small Poster)</Button>
          <Button onClick={() => handleResize(1296, 1728)}>18″ × 24″ (Large Poster)</Button>
          <Button onClick={() => handleResize(1728, 2016)}>24″ × 28″ (Oaktag)</Button>

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
          <Button
            intent="primary"
            style={{ backgroundColor: '#488FCC', padding: '9px 14px' }}
            onClick={handleCustomResize}
          >
            Apply Custom Size
          </Button>
        </div>
      </Dialog>

      {/* Add to Cart Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: '90%',
              height: '90%',
              backgroundColor: '#fff',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 2,
                background: '#ce3d50',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              ✖
            </button>
            <iframe
              id="woo-iframe"
              src="https://tuteachercenter.org/product/customizer-order/"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
});

export default TopNav;
