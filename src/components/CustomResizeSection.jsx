// src/components/CustomResizeSection.jsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';

const sizes = [
  { name: 'Standard (8.5 × 11 in)', width: 2550, height: 3300 },
  { name: 'Tabloid (11 × 17 in)', width: 3300, height: 5100 },
  { name: 'Large Photo (13 × 19 in)', width: 3900, height: 5700 },
  { name: 'Poster (18 × 24 in)', width: 5400, height: 7200 },
  { name: 'Oaktag (24 × 28 in)', width: 7200, height: 8400 },
];

const CustomResizeSection = observer(({ store }) => {
  const page = store?.activePage;

  if (!store || !page) {
    return <div className="ttc-panel-error">Resize panel could not load.</div>;
  }

  return (
    <div className="ttc-panel ttc-panel-scroll">
      <div className="ttc-panel-section">
        <div className="ttc-panel-section-title">Resize page</div>
        <div className="ttc-panel-button-stack">
          {sizes.map((size) => (
            <Button
              key={size.name}
              fill
              large
              onClick={() => page.set({ width: size.width, height: size.height })}
            >
              {size.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default CustomResizeSection;
