import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import { action } from 'mobx';
import templates from './my-text-templates';

const cardStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: 10,
  marginBottom: 10,
  background: '#ffffff',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
};

const previewStyle = {
  fontSize: 12,
  color: '#5f6b7a',
  lineHeight: 1.35,
  marginTop: 4,
};

const normalizeFontWeight = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value >= 600 ? 'bold' : 'normal';
  return 'normal';
};

const MyTextPanel = observer(({ store }) => {
  const addText = action(({
    text,
    fontSize = 40,
    fontFamily = 'Lato',
    y = 100,
    x = 100,
    width,
    fill,
    align,
    fontWeight,
    fontStyle,
    lineHeight,
  }) => {
    const page = store?.activePage;
    if (!page) return;

    const element = {
      type: 'text',
      text: String(text ?? ''),
      fontSize,
      fontFamily,
      x,
      y,
    };

    if (Number.isFinite(width) && width > 0) element.width = width;
    if (fill) element.fill = fill;
    if (align) element.align = align;
    if (fontWeight !== undefined) {
      element.fontWeight = normalizeFontWeight(fontWeight);
    }
    if (typeof fontStyle === 'string') element.fontStyle = fontStyle;
    if (Number.isFinite(lineHeight) && lineHeight > 0) {
      element.lineHeight = lineHeight;
    }

    page.addElement(element);
  });

  const addQuickText = (text, fontSize) => {
    const page = store?.activePage;
    if (!page) return;

    const pageWidth = page.computedWidth || page.width || 900;
    const horizontalPadding = 40;

    addText({
      text,
      fontSize,
      fontFamily: 'Lato',
      x: horizontalPadding,
      y: 100,
      width: Math.max(120, pageWidth - horizontalPadding * 2),
      align: 'left',
      lineHeight: 1.15,
    });
  };

  const addTemplate = (template) => {
    const page = store?.activePage;
    if (!page) return;

    const parts = Array.isArray(template?.parts)
      ? template.parts
      : [
          {
            text: template?.text || template?.label || 'Add text',
            fontSize: template?.fontSize || 32,
            fontFamily: template?.fontFamily || 'Lato',
          },
        ];

    const pageWidth = page.computedWidth || page.width || 900;
    const usableWidth = Math.max(280, Math.min(pageWidth - 140, 900));
    const startX = Math.max(40, (pageWidth - usableWidth) / 2);
    let currentY = 100;

    parts.forEach((part) => {
      const fontSize = Number(part?.fontSize) || 32;
      const text = String(part?.text ?? '');
      const lines = Math.max(1, text.split('\n').length);
      const lineHeight = Number(part?.lineHeight) || 1.15;
      const estimatedHeight = fontSize * lines * lineHeight;

      addText({
        text,
        fontSize,
        fontFamily: part?.fontFamily || 'Lato',
        x: Number.isFinite(part?.x) ? part.x : startX,
        y: currentY,
        width: Number.isFinite(part?.width) ? part.width : usableWidth,
        fill: part?.fill || '#111111',
        align: part?.align || 'center',
        fontWeight: part?.fontWeight,
        fontStyle: part?.fontStyle,
        lineHeight,
      });

      currentY += estimatedHeight + (Number(part?.gapAfter) || 12);
    });
  };

  return (
    <div className="ttc-panel ttc-panel-scroll ttc-text-panel">
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#394b59',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Quick Text
        </div>

        <div className="ttc-panel-button-stack">
          <Button
            className="ttc-panel-action"
            onClick={() => addQuickText('Add a header', 48)}
          >
            Add Header
          </Button>
          <Button
            className="ttc-panel-action"
            onClick={() => addQuickText('Add a little bit of body text', 24)}
          >
            Add Body Text
          </Button>
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: '#d8e1e8',
          margin: '12px 0 14px',
        }}
      />

      {templates.map((template, index) => (
        <div
          key={`${template?.label || 'quote'}-${index}`}
          style={{
            ...cardStyle,
            borderLeft: `5px solid ${template?.accent || '#7c3aed'}`,
          }}
          onClick={() => addTemplate(template)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              addTemplate(template);
            }
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: '#182026',
              marginBottom: 4,
            }}
          >
            {template?.label}
          </div>
          <div style={previewStyle}>{template?.preview}</div>
          <div style={{ marginTop: 8 }}>
            <Button
              small
              minimal
              intent="primary"
              className="ttc-quote-action"
              onClick={(event) => {
                event.stopPropagation();
                addTemplate(template);
              }}
            >
              Add Quote
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
});

MyTextPanel.title = 'Text';
MyTextPanel.icon = 'text';

export default MyTextPanel;
