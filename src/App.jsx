// src/App.jsx
import React from 'react';
import { createStore } from 'polotno/model/store';
import {
  PolotnoContainer,
  SidePanelWrap,
  WorkspaceWrap,
} from 'polotno';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { Workspace } from 'polotno/canvas/workspace';

// 🧠 Create Polotno store once outside component
const store = createStore({ showCredit: false });
store.addPage(); // ensures activePage exists

// 🧪 Simple debug panel for Resize tab
const DebugResizePanel = () => (
  <div style={{ padding: 16, color: 'green' }}>
    ✅ Resize panel loaded (debug mode)
  </div>
);

// ✅ Define sidebar sections using known-safe templates/photos and debug resize
const MY_SECTIONS = [
  {
    name: 'resize',
    title: 'Resize',
    Panel: DebugResizePanel,
  },
  {
    ...DEFAULT_SECTIONS.find((s) => s.name === 'templates'),
  },
  {
    ...DEFAULT_SECTIONS.find((s) => s.name === 'photos'),
  },
];

export default function App() {
  return (
    <PolotnoContainer>
      <SidePanelWrap>
        <SidePanel store={store} sections={MY_SECTIONS} />
      </SidePanelWrap>
      <WorkspaceWrap>
        <Toolbar store={store} />
        <Workspace store={store} />
      </WorkspaceWrap>
    </PolotnoContainer>
  );
}