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

// Helper: get default panel for a given section name
const getDefaultSection = (name) =>
  DEFAULT_SECTIONS.find((s) => s.name === name);


// Build sections manually without 'resize'
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
  getDefaultSection('layers'), // ✅ safely included now
].filter(Boolean); // remove any undefined in case any name doesn’t exist

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