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

const makeGradient = (angle, start, end) =>
  `linear-gradient(${angle}deg, ${start}, ${end})`;

const isValidCssColor = (value) => {
  if (!value) return false;
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return true;
  }
  return CSS.supports('color', value);
};

const BackgroundPanel = observer(({ store }) => {
  const [mode, setMode] = useState('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientStart, setGradientStart] = useState('#488fcc');
  const [gradientEnd, setGradientEnd] = useState('#ce3c4f');
  const [gradientAngle, setGradientAngle] = useState(90);

  const backgroundValue = useMemo(() => {
    if (mode === 'gradient') {
      return makeGradient(gradientAngle, gradientStart, gradientEnd);
    }
    return solidColor;
  }, [mode, solidColor, gradientStart, gradientEnd, gradientAngle]);

  const applyToCurrentPage = action((value) => {
    const page = store?.activePage;
    if (!page) return;
    page.set({ background: value });
  });

  const chooseSolidMode = () => {
    setMode('solid');
    applyToCurrentPage(solidColor);
  };

  const chooseGradientMode = () => {
    setMode('gradient');
    applyToCurrentPage(makeGradient(gradientAngle, gradientStart, gradientEnd));
  };

  const chooseSolidColor = (color) => {
    setMode('solid');
    setSolidColor(color);
    if (isValidCssColor(color)) {
      applyToCurrentPage(color);
    }
  };

  const changeGradientStart = (color) => {
    setMode('gradient');
    setGradientStart(color);
    if (isValidCssColor(color)) {
      applyToCurrentPage(makeGradient(gradientAngle, color, gradientEnd));
    }
  };

  const changeGradientEnd = (color) => {
    setMode('gradient');
    setGradientEnd(color);
    if (isValidCssColor(color)) {
      applyToCurrentPage(makeGradient(gradientAngle, gradientStart, color));
    }
  };

  const changeGradientAngle = (angle) => {
    setMode('gradient');
    setGradientAngle(angle);
    applyToCurrentPage(makeGradient(angle, gradientStart, gradientEnd));
  };

  const applyBackgroundToAllPages = action(() => {
    if (!store?.pages?.length) return;
    store.pages.forEach((page) => {
      page.set({ background: backgroundValue });
    });
  });

  const resetToWhite = action(() => {
    const page = store?.activePage;
    if (!page) return;
    page.set({ background: '#ffffff' });
    setMode('solid');
    setSolidColor('#ffffff');
  });

  return (
    <div className="ttc-panel ttc-panel-scroll ttc-background-panel">
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button
          type="button"
          className={`ttc-panel-action ttc-panel-tab${mode === 'solid' ? ' is-active' : ''}`}
          onClick={chooseSolidMode}
        >
          Solid
        </button>
        <button
          type="button"
          className={`ttc-panel-action ttc-panel-tab${mode === 'gradient' ? ' is-active' : ''}`}
          onClick={chooseGradientMode}
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
                onClick={() => chooseSolidColor(color)}
                className="ttc-color-swatch"
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

          <div style={{ fontWeight: 700, margin: '40px 0 8px' }}>
            Custom Color (click to choose)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="color"
              value={solidColor}
              onChange={(event) => chooseSolidColor(event.target.value)}
              style={{ width: 46, height: 36, padding: 0, border: 0 }}
            />
            <input
              type="text"
              value={solidColor}
              onChange={(event) => chooseSolidColor(event.target.value)}
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
                onChange={(event) => changeGradientStart(event.target.value)}
                style={{ width: 46, height: 36, padding: 0, border: 0 }}
              />
              <input
                type="text"
                value={gradientStart}
                onChange={(event) => changeGradientStart(event.target.value)}
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
                onChange={(event) => changeGradientEnd(event.target.value)}
                style={{ width: 46, height: 36, padding: 0, border: 0 }}
              />
              <input
                type="text"
                value={gradientEnd}
                onChange={(event) => changeGradientEnd(event.target.value)}
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
              onChange={(event) => changeGradientAngle(Number(event.target.value))}
              style={{ width: '100%' }}
            />
          </label>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
        <button
          type="button"
          className="ttc-panel-action ttc-panel-action-primary"
          onClick={applyBackgroundToAllPages}
        >
          Apply to all pages
        </button>
        <button
          type="button"
          className="ttc-panel-action"
          onClick={resetToWhite}
        >
          Back to white
        </button>
      </div>
    </div>
  );
});

BackgroundPanel.title = 'Background';
BackgroundPanel.icon = 'style';

export default BackgroundPanel;
