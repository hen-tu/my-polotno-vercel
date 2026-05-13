// src/App.jsx
import React, { useEffect } from 'react';
import { createStore } from 'polotno/model/store';
import {
  PolotnoContainer,
  SidePanelWrap,
  WorkspaceWrap,
} from 'polotno';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { Workspace } from 'polotno/canvas/workspace';
import { runInAction } from 'mobx';

import TopNav from './components/TopNav';
import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';
import { assetIndexUrl, assetUrl } from './assetUrls';
import BackgroundPanel from './components/BackgroundPanel';

// ✅ Create store
const store = createStore({ showCredit: false });
store.addPage();

// sections
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
  {
  ...getSectionByName('background'),
    title: 'Background',
    Panel: BackgroundPanel,
  },
  getSectionByName('upload'),
  getSectionByName('layers'),
].filter(Boolean);

export default function App() {
  useEffect(() => {
    // Open Templates panel by default
    if (typeof store.openSidePanel === 'function') {
      store.openSidePanel('templates');
    }

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('template');

    if (!slug) return;

    const loadTemplateFromUrl = async () => {
      try {
        console.log('Loading template from URL:', slug);

        const indexRes = await fetch(assetIndexUrl('templates/index.json'));
        if (!indexRes.ok) {
          throw new Error(`Template index HTTP ${indexRes.status}`);
        }

        const templates = await indexRes.json();
        const match = templates.find((t) => t.id === slug);

        if (!match) {
          console.warn(`Template with id "${slug}" not found.`);
          return;
        }

        const templateRes = await fetch(assetUrl(match.jsonUrl, { version: true }));
        if (!templateRes.ok) {
          throw new Error(`Template JSON HTTP ${templateRes.status}`);
        }

        const json = await templateRes.json();

        runInAction(() => {
          store.loadJSON(json);
        });

        if (typeof store.waitLoading === 'function') {
          await store.waitLoading();
        }

        console.log('Template loaded from URL:', slug);
      } catch (err) {
        console.error('Failed to load template from URL:', err);
      }
    };

    loadTemplateFromUrl();
  }, []);

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