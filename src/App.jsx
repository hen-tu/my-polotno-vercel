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

const store = createStore({ showCredit: false });
store.addPage();

// Custom sidebar sections (excluding "resize")
const MY_SECTIONS = [
  {
    ...DEFAULT_SECTIONS.find((s) => s.name === 'templates'),
    title: 'My Templates',
    Panel: TemplatesPanel,
  },
  {
    ...DEFAULT_SECTIONS.find((s) => s.name === 'photos'),
    Panel: PhotosPanelWrapper,
  },
  {
    ...DEFAULT_SECTIONS.find((s) => s.name === 'text'),
    Panel: MyTextPanel,
  },
  ...DEFAULT_SECTIONS.filter(
    (s) => !['text', 'templates', 'photos', 'resize'].includes(s.name)
  ),
];

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