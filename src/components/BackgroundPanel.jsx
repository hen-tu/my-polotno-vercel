// src/components/BackgroundPanel.jsx

import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import { Button } from '@blueprintjs/core';

const PRESET_COLORS = [
  '#ffffff',
  '#f7f7f7',
  '#eeeeee',
  '#000000',
  '#4f6bff',
  '#488fcc',
  '#ce3c4f',
  '#ff884d',
  '#75d256',
  '#ffd84d',
  '#b95add',
  '#f7b7c8',
];

const tabButtonStyle = (active) => ({
  padding: '10px 18px',
  borderRadius: 999,
  border: active ? '1px solid #488fcc' : '1px solid #d0d7de',
  background: active ? '#488fcc' : '#f6f8fa',
  color: active ? '#ffffff' : '#344054',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  minWidth: 100,
});

const applyBackground = action((store, background) => {
  const page = store.activePage;
  if (!page) return;

  page.set({ background });
});

const applyBackgroundToAllPages = action((store, background) => {
  store.pages.forEach((page) => {
    page.set({ background });
  });
});

const BackgroundPanel = observer(({ store }) => {
  const [mode, setMode] = useState('solid');

  const [solidColor, setSolidColor] = useState('#ffffff');

  const [gradientStart, setGradientStart] = useState('#ffffff');
  const [gradientEnd, setGradientEnd] = useState('#ce3c4f');
  const [gradientAngle, setGradientAngle] = useState(90);

  const gradientValue = useMemo(() => {
    return `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
  }, [gradientAngle, gradientStart, gradientEnd]);

  const currentBackground = store.activePage?.background || '#ffffff';

  const setSolidBackground = (color) => {
    setSolidColor(color);
    applyBackground(store, color);
  };

  const setGradientBackground = ({ start, end, angle } = {}) => {
    const nextStart = start ?? gradientStart;
    const nextEnd = end ?? gradientEnd;
    const nextAngle = angle ?? gradientAngle;

    setGradientStart(nextStart);
    setGradientEnd(nextEnd);
    setGradientAngle(nextAngle);

    applyBackground(
      store,
      `linear-gradient(${nextAngle}deg, ${nextStart}, ${nextEnd})`
    );
  };

  return (
    <div
      style={{
        padding: 14,
        height: '100%',
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Background</h3>

    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
    <button
        type="button"
        style={tabButtonStyle(mode === 'solid')}
        onClick={() => {
        setMode('solid');
        applyBackground(store, solidColor);
        }}
    >
        Solid
    </button>

    <button
        type="button"
        style={tabButtonStyle(mode === 'gradient')}
        onClick={() => {
        setMode('gradient');
        applyBackground(store, gradientValue);
        }}
    >
        Gradient
    </button>
    </div>

      <div
        style={{
          height: 95,
          borderRadius: 8,
          border: '1px solid #ccc',
          background: mode === 'solid' ? solidColor : gradientValue,
          marginBottom: 14,
        }}
      />

      {mode === 'solid' && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Solid color</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={solidColor}
              onChange={(e) => setSolidBackground(e.target.value)}
              style={{
                width: 42,
                height: 34,
                padding: 0,
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />

            <input
              value={solidColor}
              onChange={(e) => setSolidBackground(e.target.value)}
              style={{
                flex: 1,
                padding: '7px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSolidBackground(color)}
                title={color}
                style={{
                  height: 28,
                  borderRadius: 4,
                  border:
                    color === '#ffffff'
                      ? '1px solid #ccc'
                      : '1px solid transparent',
                  background: color,
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </>
      )}

      {mode === 'gradient' && (
        <>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Linear gradient</div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            First color
          </label>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={gradientStart}
              onChange={(e) => setGradientBackground({ start: e.target.value })}
              style={{
                width: 42,
                height: 34,
                padding: 0,
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />

            <input
              value={gradientStart}
              onChange={(e) => setGradientBackground({ start: e.target.value })}
              style={{
                flex: 1,
                padding: '7px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            Second color
          </label>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="color"
              value={gradientEnd}
              onChange={(e) => setGradientBackground({ end: e.target.value })}
              style={{
                width: 42,
                height: 34,
                padding: 0,
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />

            <input
              value={gradientEnd}
              onChange={(e) => setGradientBackground({ end: e.target.value })}
              style={{
                flex: 1,
                padding: '7px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>

          <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            Angle: {gradientAngle}°
          </label>

          <input
            type="range"
            min="0"
            max="360"
            value={gradientAngle}
            onChange={(e) =>
              setGradientBackground({ angle: Number(e.target.value) })
            }
            style={{ width: '100%', marginBottom: 14 }}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[0, 45, 90, 135, 180].map((angle) => (
              <Button
                key={angle}
                small
                onClick={() => setGradientBackground({ angle })}
              >
                {angle}°
              </Button>
            ))}
          </div>
        </>
      )}

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 12 }}>
        <Button
          small
          fill
          onClick={() => applyBackgroundToAllPages(store, currentBackground)}
        >
          Apply to all pages
        </Button>
      </div>
    </div>
  );
});

BackgroundPanel.title = 'Background';
BackgroundPanel.icon = 'style';

export default BackgroundPanel;