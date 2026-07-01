// src/components/BackgroundPanel.jsx
import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';

const PRESET_COLORS = [
  '#ffffff',
  '#f7f4ef',
  '#f2f1ed',
  '#fceced',
  '#fff4cc',
  '#dff3ff',
  '#dff7ea',
  '#eadfff',
  '#ffdfe8',
  '#1f2937',
  '#111827',
  '#000000',
];

const tabButtonStyle = (active) => ({
  appearance: 'none',
  border: active ? '1px solid #2e8bf0' : '1px solid #d0d7de',
  borderRadius: 999,
  background: active ? '#2e8bf0' : '#ffffff',
  color: active ? '#ffffff' : '#333333',
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
});

const actionButtonStyle = (primary = false) => ({
  appearance: 'none',
  width: '100%',
  border: primary ? '1px solid #2e8bf0' : '1px solid #c9c9c9',
  borderRadius: 6,
  background: primary ? '#2e8bf0' : '#ffffff',
  color: primary ? '#ffffff' : '#333333',
  padding: '9px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});

const BackgroundPanel = observer(({ store }) => {
  const [mode, setMode] = useState('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientStart, setGradientStart] = useState('#488fcc');
  const [gradientEnd, setGradientEnd] = useState('#ce3c4f');
  const [gradientAngle, setGradientAngle] = useState(90);

  const backgroundValue = useMemo(() => {
    if (mode === 'gradient') {
      return `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
    }
    return solidColor;
  }, [mode, solidColor, gradientStart, gradientEnd, gradientAngle]);

  const applyBackground = action(() => {
    const page = store?.activePage;
    if (!page) return;
    page.set({ background: backgroundValue });
  });

  const applyBackgroundToAllPages = action(() => {
    if (!store?.pages?.length) return;
    store.pages.forEach((page) => {
      page.set({ background: backgroundValue });
    });
  });

  const removeBackground = action(() => {
    const page = store?.activePage;
    if (!page) return;
    page.set({ background: '#ffffff' });
    setMode('solid');
    setSolidColor('#ffffff');
  });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button
          type="button"
          style={tabButtonStyle(mode === 'solid')}
          onClick={() => setMode('solid')}
        >
          Solid
        </button>
        <button
          type="button"
          style={tabButtonStyle(mode === 'gradient')}
          onClick={() => setMode('gradient')}
        >
          Gradient
        </button>
      </div>

      {mode === 'solid' ? (
        <>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Background color</div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              marginBottom: 14,
            }}
          >
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color}`}
                title={color}
                onClick={() => setSolidColor(color)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: color,
                  border:
                    solidColor.toLowerCase() === color.toLowerCase()
                      ? '3px solid #2e8bf0'
                      : '1px solid #b9b9b9',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={solidColor}
              onChange={(event) => setSolidColor(event.target.value)}
              style={{ width: 46, height: 36, padding: 0, border: 0 }}
            />
            <input
              type="text"
              value={solidColor}
              onChange={(event) => setSolidColor(event.target.value)}
              aria-label="Background color value"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '8px 10px',
                border: '1px solid #c9c9c9',
                borderRadius: 5,
                fontSize: 14,
              }}
            />
          </div>
        </>
      ) : (
        <>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Gradient colors</div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>
              First color
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="color"
                value={gradientStart}
                onChange={(event) => setGradientStart(event.target.value)}
                style={{ width: 46, height: 36, padding: 0, border: 0 }}
              />
              <input
                type="text"
                value={gradientStart}
                onChange={(event) => setGradientStart(event.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 10px',
                  border: '1px solid #c9c9c9',
                  borderRadius: 5,
                  fontSize: 14,
                }}
              />
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>
              Second color
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="color"
                value={gradientEnd}
                onChange={(event) => setGradientEnd(event.target.value)}
                style={{ width: 46, height: 36, padding: 0, border: 0 }}
              />
              <input
                type="text"
                value={gradientEnd}
                onChange={(event) => setGradientEnd(event.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 10px',
                  border: '1px solid #c9c9c9',
                  borderRadius: 5,
                  fontSize: 14,
                }}
              />
            </div>
          </label>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Angle</span>
              <span>{gradientAngle}°</span>
            </span>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={gradientAngle}
              onChange={(event) => setGradientAngle(Number(event.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </>
      )}

      <div
        style={{
          height: 68,
          margin: '18px 0',
          borderRadius: 7,
          border: '1px solid #d3d3d3',
          background: backgroundValue,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" style={actionButtonStyle(true)} onClick={applyBackground}>
          Apply to this page
        </button>
        <button type="button" style={actionButtonStyle(false)} onClick={applyBackgroundToAllPages}>
          Apply to all pages
        </button>
        <button type="button" style={actionButtonStyle(false)} onClick={removeBackground}>
          Reset to white
        </button>
      </div>
    </div>
  );
});

BackgroundPanel.title = 'Background';
BackgroundPanel.icon = 'style';

export default BackgroundPanel;
