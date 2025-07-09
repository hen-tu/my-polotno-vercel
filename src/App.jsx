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

import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';

const store = createStore({ showCredit: false });
store.addPage();

// ⬇️ Custom sidebar sections
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
  // include all remaining default sections except the ones already customized:
  ...DEFAULT_SECTIONS.filter(
    (s) => !['text', 'templates', 'photos'].includes(s.name)
  ),
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