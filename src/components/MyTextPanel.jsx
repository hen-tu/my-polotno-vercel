import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
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

const MyTextPanel = observer(({ store }) => {
  const getPage = () => store?.activePage;

  const addText = ({
    text,
    fontSize = 40,
    fontFamily = 'Lato',
    yOffset = 0,
    fill = '#111111',
    align = 'left',
    width,
    x,
    fontWeight = 400,
    fontStyle = 'normal',
    lineHeight = 1.2,
  }) => {
    const page = getPage();
    if (!page) return;

    const pageWidth = page.computedWidth || page.width || 900;
    const usableWidth = width || Math.max(360, pageWidth - 180);
    const startX = x ?? Math.max(40, (pageWidth - usableWidth) / 2);

    page.addElement({
      type: 'text',
      text,
      fontSize,
      fontFamily,
      x: startX,
      y: 90 + yOffset,
      width: usableWidth,
      fill,
      align,
      fontWeight,
      fontStyle,
      lineHeight,
    });
  };

  const addQuickText = (text, fontSize = 40, fontFamily = 'Lato') => {
    addText({
      text,
      fontSize,
      fontFamily,
      align: 'left',
      fill: '#111111',
      width: 700,
      x: 100,
      yOffset: 0,
    });
  };

  const addTemplate = (template) => {
    const page = getPage();
    if (!page) return;

    const pageWidth = page.computedWidth || page.width || 900;
    const usableWidth = Math.max(360, Math.min(pageWidth - 140, 900));
    const startX = Math.max(40, (pageWidth - usableWidth) / 2);

    let currentY = 0;

    template.parts.forEach((part) => {
      const text = part.text || '';
      const fontSize = part.fontSize || 32;
      const lines = text.split('\n').length;
      const estimatedHeight = fontSize * lines * (part.lineHeight || 1.15);

      addText({
        text,
        fontSize,
        fontFamily: part.fontFamily || 'Lato',
        yOffset: currentY,
        fill: part.fill || '#111111',
        align: part.align || 'center',
        width: part.width || usableWidth,
        x: part.x ?? startX,
        fontWeight: part.fontWeight || 400,
        fontStyle: part.fontStyle || 'normal',
        lineHeight: part.lineHeight || 1.15,
      });

      currentY += estimatedHeight + (part.gapAfter ?? 12);
    });
  };

  return (
    <div
      style={{
        padding: 12,
        height: '100%',
        overflowY: 'auto',
        background: '#f8fafc',
      }}
    >
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

        <div style={{ display: 'grid', gap: 8 }}>
          <Button onClick={() => addQuickText('Add a header', 48, 'Lato')}>
            Add Header
          </Button>
          <Button onClick={() => addQuickText('Add a subheading', 36, 'Lato')}>
            Add Subhead
          </Button>
          <Button
            onClick={() =>
              addQuickText('Add a little bit of body text', 24, 'Lato')
            }
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

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#394b59',
          marginBottom: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Sidebar Quote Templates
      </div>

      {templates.map((template, index) => (
        <div
          key={index}
          style={{
            ...cardStyle,
            borderLeft: `5px solid ${template.accent || '#7c3aed'}`,
          }}
          onClick={() => addTemplate(template)}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: '#182026',
              marginBottom: 4,
            }}
          >
            {template.label}
          </div>

          <div style={previewStyle}>{template.preview}</div>

          <div style={{ marginTop: 8 }}>
            <Button
              small
              minimal
              intent="primary"
              onClick={(e) => {
                e.stopPropagation();
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