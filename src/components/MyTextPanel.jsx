// src/components/MyTextPanel.jsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import templates from './my-text-templates';

const MyTextPanel = observer(({ store }) => {
  const addText = (text, fontSize = 40, fontFamily = 'Lato', yOffset = 0) => {
    store.activePage?.addElement({
      type: 'text',
      text,
      fontSize,
      fontFamily,
      x: 100,
      y: 100 + yOffset,
    });
  };

  return (
    <div className="ttc-panel ttc-panel-scroll">
      <div className="ttc-panel-section">
        <div className="ttc-panel-section-title">Add text</div>
        <div className="ttc-panel-button-stack">
          <Button fill large onClick={() => addText('Add a headline', 48)}>
            Add Headline
          </Button>
          <Button fill large onClick={() => addText('Add a subheading', 36)}>
            Add Subheading
          </Button>
          <Button fill large onClick={() => addText('Add a little bit of body text', 24)}>
            Add Body Text
          </Button>
        </div>
      </div>

      <div className="ttc-panel-divider" />

      <div className="ttc-panel-section">
        <div className="ttc-panel-section-title">Ready-made text</div>
        <div className="ttc-panel-button-stack">
          {templates.map((template, index) => (
            <Button
              key={`${template.label}-${index}`}
              fill
              onClick={() => {
                if (template.multi && Array.isArray(template.parts)) {
                  template.parts.forEach((part, partIndex) => {
                    addText(
                      part.text,
                      part.fontSize || 32,
                      part.fontFamily || 'Lato',
                      partIndex * 50
                    );
                  });
                } else {
                  addText(
                    template.text,
                    template.fontSize || 32,
                    template.fontFamily || 'Lato'
                  );
                }
              }}
            >
              {template.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});

MyTextPanel.title = 'Text';
MyTextPanel.icon = 'text';

export default MyTextPanel;
