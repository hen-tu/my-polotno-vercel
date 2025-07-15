// src/App.jsx

import React from 'react';
import { createStore } from 'polotno/model/store';
import {
  PolotnoContainer,
  SidePanelWrap,
  WorkspaceWrap,
} from 'polotno';
import { SidePanel } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { Workspace } from 'polotno/canvas/workspace';

import TopNav from './components/TopNav';
import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';

// Create the store
const store = createStore({ showCredit: false });
store.addPage();

// Build sections manually without 'resize'
const MY_SECTIONS = [
  {
    name: 'templates',
    icon: 'file',
    title: 'My Templates',
    Panel: TemplatesPanel,
  },
  {
    name: 'photos',
    icon: 'image',
    title: 'Photos',
    Panel: PhotosPanelWrapper,
  },
  {
    name: 'text',
    icon: 'font',
    title: 'Text',
    Panel: MyTextPanel,
  },
  { name: 'elements' },
  { name: 'background' },
  { name: 'uploads' },
  { name: 'layers' }, // ✅ added back
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