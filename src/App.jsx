// src/App.jsx

import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { createStore } from 'polotno/model/store';
import { replaceGlobalFonts } from 'polotno/config';
import {
  PolotnoContainer,
  SidePanelWrap,
  WorkspaceWrap,
} from 'polotno';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { Workspace } from 'polotno/canvas/workspace';
import { PageControls as DefaultPageControls } from 'polotno/canvas/page-controls';
import { runInAction } from 'mobx';

import TopNav from './components/TopNav';
import MyTextPanel from './components/MyTextPanel';
import TemplatesPanel from './components/TemplatesPanel';
import PhotosPanelWrapper from './components/PhotosPanelWrapper';
import { assetIndexUrl, assetUrl } from './assetUrls';
import BackgroundPanel from './components/BackgroundPanel';
import HebrewFontFamily from './components/HebrewFontFamily';

const CUSTOM_FONTS = [
  {
    fontFamily: 'Gveret Levin',
    url: '/fonts/GveretLevin-Regular-hebrew.ttf',
  },
  {
    fontFamily: 'Hebrew Script',
    url: '/fonts/Hebrew%20Script.otf',
  },
  {
    fontFamily: 'Huninn',
    url: '/fonts/Huninn-Regular-hebrew.ttf',
  },
  {
    fontFamily: 'Karantina',
    styles: [
      {
        src: 'url("/fonts/Karantina-Light-Hebrew.ttf")',
        fontStyle: 'normal',
        fontWeight: '300',
      },
      {
        src: 'url("/fonts/Karantina-Regular-hebrew.ttf")',
        fontStyle: 'normal',
        fontWeight: '400',
      },
      {
        src: 'url("/fonts/Karantina-Bold-Hebrew.ttf")',
        fontStyle: 'normal',
        fontWeight: '700',
      },
    ],
  },
  {
    fontFamily: 'Playpen Sans Hebrew',
    styles: [
      {
        src: 'url("/fonts/PlaypenSansHebrew-VariableFont_wght.ttf")',
        fontStyle: 'normal',
        fontWeight: '400',
      },
      {
        src: 'url("/fonts/PlaypenSansHebrew-VariableFont_wght.ttf")',
        fontStyle: 'normal',
        fontWeight: '700',
      },
    ],
  },
];

// This adds the local fonts without removing Polotno's default Google Fonts.
replaceGlobalFonts(CUSTOM_FONTS);

// Create store
const store = createStore({ showCredit: false });
store.addPage();

// Keep Polotno's normal page controls and add a noticeable page-count label.
// The label only appears when the document contains more than one page.
const PageControls = observer((props) => {
  const totalPages = store.pages.length;

  if (totalPages <= 1) {
    return <DefaultPageControls {...props} />;
  }

  const pageIndex = store.pages.indexOf(props.page);
  const currentPage = pageIndex >= 0 ? pageIndex + 1 : 1;

  return (
    <>
      <DefaultPageControls {...props} />
      <div
        aria-label={`Page ${currentPage} of ${totalPages}`}
        style={{
          position: 'absolute',
          top: `${props.yPadding}px`,
          left: `${props.xPadding}px`,
          transform: 'translateY(calc(-100% - 6px))',
          zIndex: 20,
          padding: '4px 10px',
          borderRadius: '999px',
          background: '#5f6368',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {currentPage} of {totalPages}
      </div>
    </>
  );
});

// Sections
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
    title: 'Images',
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
    // Open Templates by default after the side panel mounts.
    // The defaultSection prop below handles the initial render; this also
    // prevents Polotno from falling back to Photos during startup.
    const openTemplates = () => {
      if (typeof store.openSidePanel === 'function') {
        store.openSidePanel('templates');
      }
    };

    openTemplates();
    const frameId = window.requestAnimationFrame(openTemplates);
    const timeoutId = window.setTimeout(openTemplates, 50);

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('template');

    const cleanupDefaultOpen = () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };

    if (!slug) {
      return cleanupDefaultOpen;
    }

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

        const templateRes = await fetch(
          assetUrl(match.jsonUrl, { version: true })
        );
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
    return cleanupDefaultOpen;
  }, []);

  useEffect(() => {
    // Polotno's Upload panel is rendered dynamically. Add a narrow class only
    // to its "Add file" button so it matches the custom panel buttons without
    // changing sidebar navigation or thumbnail buttons.
    const markUploadButton = () => {
      document.querySelectorAll('button').forEach((button) => {
        const label = String(button.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

        if (label === 'add file') {
          button.classList.add('ttc-upload-add-file');
        }
      });
    };

    markUploadButton();
    const observer = new MutationObserver(markUploadButton);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
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
      <div style={{ height: '56px', flexShrink: 0 }}>
        <TopNav store={store} />
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <SidePanelWrap>
          <SidePanel
            store={store}
            sections={MY_SECTIONS}
            defaultSection="templates"
          />
        </SidePanelWrap>

        <WorkspaceWrap>
          <Toolbar
            store={store}
            components={{ TextFontFamily: HebrewFontFamily }}
          />
          <Workspace
            store={store}
            components={{ PageControls }}
          />
        </WorkspaceWrap>
      </div>
    </PolotnoContainer>
  );
}
