// src/components/MyTextPanel.jsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import templates from './my-text-templates';

const MyTextPanel = observer(({ store }) => {
  const addText = (text, fontSize = 40, fontFamily = 'Lato', yOffset = 0) => {
    store.activePage.addElement({
      type: 'text',
      text,
      fontSize,
      fontFamily,
      x: 100,
      y: 100 + yOffset,
    });
  };

  return (
    <div style={{ padding: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Button onClick={() => addText('Add a header', 48)}>Add Header</Button>
        <Button onClick={() => addText('Add a subheading', 36)}>Add Subhead</Button>
        <Button onClick={() => addText('Add a little bit of body text', 24)}>Add Body Text</Button>
      </div>
      <hr style={{ margin: '12px 0' }} />
      {templates.map((t, i) => (
        <Button
          key={i}
          onClick={() => {
            if (t.multi && Array.isArray(t.parts)) {
              t.parts.forEach((part, index) => {
                addText(
                  part.text,
                  part.fontSize || 32,
                  part.fontFamily || 'Lato',
                  index * 50
                );
              });
            } else {
              addText(t.text, t.fontSize || 32, t.fontFamily || 'Lato');
            }
          }}
          style={{ marginBottom: '6px' }}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
});

MyTextPanel.title = 'Text';
MyTextPanel.icon = 'text';

export default MyTextPanel;