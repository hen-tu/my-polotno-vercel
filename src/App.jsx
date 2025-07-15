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

import TopNav from './components/TopNav';
import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';

// ✅ Create store
const store = createStore({ showCredit: false });
store.addPage();

// ✅ Helper to get safe default section
const getDefaultSection = (name) =>
  DEFAULT_SECTIONS.find((s) => s.name === name);

// ✅ Build custom sidebar
const MY_SECTIONS = [
  {
    ...getDefaultSection('templates'),
    title: 'My Templates',
    Panel: TemplatesPanel,
  },
  {
    ...getDefaultSection('photos'),
    Panel: PhotosPanelWrapper,
  },
  {
    ...getDefaultSection('text'),
    Panel: MyTextPanel,
  },
  getDefaultSection('elements'),
  getDefaultSection('background'),
  getDefaultSection('uploads'),
  getDefaultSection('layers'),
].filter(Boolean); // ✅ Filters out any undefined sections

export default function App() {
  return (
    <PolotnoContainer
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '50px', flexShrink: 0 }}>
        <TopNav store={store} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <SidePanelWrap>
          <SidePanel store={store} sections={MY_SECTIONS} />
        </SidePanelWrap>
        <WorkspaceWrap>
          <Toolbar store={store} />
          <Workspace store={store} />
        </WorkspaceWrap>
      </div>
    </PolotnoContainer>
  );
}