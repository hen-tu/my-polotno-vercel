// src/App.jsx
import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { createStore } from 'polotno/model/store';
import {
  PolotnoContainer,
  SidePanelWrap,
  WorkspaceWrap,
} from 'polotno';
import {
  SidePanel,
  DEFAULT_SECTIONS,
  SectionTab,
} from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { Workspace } from 'polotno/canvas/workspace';
import { PageControls as DefaultPageControls } from 'polotno/canvas/page-controls';
import { Icon } from '@blueprintjs/core';

import TopNav from './components/TopNav';
import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';
import SavedDesignsPanel from './components/SavedDesignsPanel';
import { getSavedDesign } from './components/saved-designs-api';

// Create the Polotno store once for the full editor.
const store = createStore({ showCredit: false });
store.addPage();

const getSectionByName = (name) =>
  DEFAULT_SECTIONS.find((section) => section.name === name);

const SavedDesignsSection = {
  name: 'saved-designs',
  Tab: (props) => (
    <SectionTab name="Saved Designs" {...props}>
      <Icon icon="floppy-disk" />
    </SectionTab>
  ),
  Panel: SavedDesignsPanel,
};

const MY_SECTIONS = [
  {
    ...getSectionByName('templates'),
    title: 'My Templates',
    Panel: TemplatesPanel,
  },
  SavedDesignsSection,
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

// Keeps Polotno's normal page controls and adds a clear page-number badge.
// The badge is editor UI only; it does not become part of the printed design.
const NumberedPageControls = observer((props) => {
  const totalPages = store.pages.length;
  const pageIndex = store.pages.indexOf(props.page);

  return (
    <>
      <DefaultPageControls {...props} />
      {totalPages > 1 && pageIndex >= 0 && (
        <div
          className="ttc-page-number-wrap"
          style={{
            top: `${Math.max(4, props.yPadding - 42)}px`,
            left: `${props.xPadding}px`,
            width: `${props.width}px`,
          }}
        >
          <div className="ttc-page-number-badge">
            PAGE {pageIndex + 1} OF {totalPages}
          </div>
        </div>
      )}
    </>
  );
});

function SavedDesignAutoLoader({ editorStore }) {
  const attemptedIdRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedId = Number.parseInt(params.get('saved') || '', 10);

    if (!savedId || attemptedIdRef.current === savedId) return;
    attemptedIdRef.current = savedId;

    let cancelled = false;

    (async () => {
      try {
        const data = await getSavedDesign(savedId);
        if (cancelled) return;

        editorStore.loadJSON(data.design);
        if (typeof editorStore.waitLoading === 'function') {
          await editorStore.waitLoading();
        }

        if (!cancelled) {
          window.dispatchEvent(
            new CustomEvent('ttc-polotno-design-loaded', {
              detail: {
                id: data.item.id,
                name: data.item.name,
              },
            })
          );
        }
      } catch (error) {
        console.error('Could not auto-load saved design:', error);
        if (!cancelled) {
          window.alert(error.message || 'Could not open that saved design.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editorStore]);

  return null;
}

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
      <SavedDesignAutoLoader editorStore={store} />

      <div style={{ height: '50px', flexShrink: 0 }}>
        <TopNav store={store} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <SidePanelWrap>
          <SidePanel store={store} sections={MY_SECTIONS} />
        </SidePanelWrap>
        <WorkspaceWrap>
          <Toolbar store={store} />
          <Workspace
            store={store}
            pageGap={72}
            components={{ PageControls: NumberedPageControls }}
          />
        </WorkspaceWrap>
      </div>
    </PolotnoContainer>
  );
}
