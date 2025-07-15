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

//sections
console.log('Available section names:', DEFAULT_SECTIONS.map((s) => s.name));

const getSectionByName = (name) =>
  DEFAULT_SECTIONS.find((s) => s.name === name);

const MY_SECTIONS = [
  {
    ...getSectionByName('templates'),
    title: 'My Templates',
    Panel: TemplatesPanel,
  },
  {
    ...getSectionByName('photos'),
    Panel: PhotosPanelWrapper,
  },
  {
    ...getSectionByName('text'),
    Panel: MyTextPanel,
  },
  getSectionByName('elements'),
  getSectionByName('background'),
  getSectionByName('upload'),
  getSectionByName('layers'),
].filter(Boolean);


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