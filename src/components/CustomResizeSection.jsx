// src/components/CustomResizeSection.jsx
import React from 'react';
import { observer } from 'mobx-react-lite';

const sizes = [
  { name: 'Standard (8.5x11\")', width: 2550, height: 3300 },
  { name: 'Tabloid (11x17\")', width: 3300, height: 5100 },
  { name: 'Large Photo (13x19\")', width: 3900, height: 5700 },
  { name: 'Poster (18x24\")', width: 5400, height: 7200 },
  { name: 'Oaktag (24x28\")', width: 7200, height: 8400 },
];

const CustomResizeSection = observer((props) => {
  const store = props?.store;
  const page = store?.activePage;

  // Safety check to avoid crash
  if (!store || !page) {
    return <div style={{ padding: 16, color: 'red' }}>Resize panel failed to load. (No store or page)</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 12 }}>Resize Page</h3>
      {sizes.map((size) => (
        <button
          key={size.name}
          onClick={() => {
            page.set({ width: size.width, height: size.height });
          }}
          style={{
            display: 'block',
            margin: '8px 0',
            padding: '10px',
            fontSize: '14px',
            width: '100%',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#f7f7f7',
          }}
        >
          {size.name}
        </button>
      ))}
    </div>
  );
});

export default CustomResizeSection;