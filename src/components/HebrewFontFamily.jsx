// src/components/HebrewFontFamily.jsx
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Position,
  Tooltip,
} from '@blueprintjs/core';
import { CaretDown, Search } from '@blueprintjs/icons';
import { FixedSizeList } from 'react-window';
import useSWR from 'swr';
import {
  getFontsList,
  globalFonts,
  isGoogleFontChanged,
} from 'polotno/utils/fonts';
import {
  getGoogleFontImage,
  getGoogleFontsListAPI,
} from 'polotno/config';

// Searching either "hebrew" or "עברית" will surface every font listed here.
// Font names must match the names Polotno uses in its font list.
export const HEBREW_FONT_TAGS = {
  'Gveret Levin': ['hebrew', 'עברית'],
  Karantina: ['hebrew', 'עברית'],
  Huninn: ['hebrew', 'עברית'],
  'Playpen Sans Hebrew': ['hebrew', 'עברית'],
  'Secular One': ['hebrew', 'עברית'],
  'Suez One': ['hebrew', 'עברית'],
  'Noto Serif Hebrew': ['hebrew', 'עברית'],
  'Noto Sans Hebrew': ['hebrew', 'עברית'],
  'IBM Plex Sans Hebrew': ['hebrew', 'עברית'],
  'Libertinus Math': ['hebrew', 'עברית'],
  'Noto Rashi Hebrew': ['hebrew', 'עברית'],
  Heebo: ['hebrew', 'עברית'],
  'David Libre': ['hebrew', 'עברית'],
  'Frank Ruhl Libre': ['hebrew', 'עברית'],
  Fredoka: ['hebrew', 'עברית'],
  'Amatic SC': ['hebrew', 'עברית'],
  Assistant: ['hebrew', 'עברית'],
  Bellefair: ['hebrew', 'עברית'],
  'Bona Nova SC': ['hebrew', 'עברית'],
  Cardo: ['hebrew', 'עברית'],
  Alef: ['hebrew', 'עברית'],
  Tinos: ['hebrew', 'עברית'],
  'Hebrew Script': ['hebrew', 'עברית'],
};

const FALLBACK_GOOGLE_FONTS = getFontsList();
const fontListCache = {};

const fetcher = (url) => {
  if (fontListCache[url]) {
    return Promise.resolve(fontListCache[url]);
  }

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Font list request failed: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      fontListCache[url] = data;
      return data;
    });
};

const normalizeSearch = (value) => String(value || '').trim().toLowerCase();

const fontMatchesSearch = (fontFamily, query) => {
  if (fontFamily === '_divider') return !query;

  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;

  const tags = HEBREW_FONT_TAGS[fontFamily] || [];
  const searchableText = [fontFamily, ...tags].join(' ').toLowerCase();

  return searchableText.includes(normalizedQuery);
};

const SearchInput = ({ value, onChange }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <InputGroup
      leftIcon={<Search />}
      inputRef={inputRef}
      value={value}
      placeholder="Search fonts..."
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

const FontItem = ({
  fontFamily,
  active,
  onSelect,
  store,
  isCustom,
}) => {
  const [showGooglePreview, setShowGooglePreview] = useState(!isCustom);

  useEffect(() => {
    if (!showGooglePreview) {
      store.loadFont(fontFamily).catch((error) => {
        console.warn(`Could not load font "${fontFamily}" for preview.`, error);
      });
    }
  }, [fontFamily, showGooglePreview, store]);

  if (fontFamily === '_divider') {
    return (
      <div style={{ paddingTop: 10 }}>
        <MenuDivider />
      </div>
    );
  }

  const label = showGooglePreview ? (
    <img
      src={getGoogleFontImage(fontFamily)}
      alt={fontFamily}
      onError={() => setShowGooglePreview(false)}
      style={{ height: 20, maxWidth: 175, objectFit: 'contain' }}
    />
  ) : (
    <span>{fontFamily}</span>
  );

  return (
    <MenuItem
      text={label}
      active={active}
      onClick={onSelect}
      style={{ fontFamily: `"${fontFamily}"` }}
    />
  );
};

const MenuList = forwardRef((props, ref) => <Menu ulRef={ref} {...props} />);
MenuList.displayName = 'MenuList';

const HebrewAwareFontMenu = ({
  store,
  fonts,
  activeFont,
  activeFontLabel,
  onFontSelect,
}) => {
  const [query, setQuery] = useState('');

  const filteredFonts = useMemo(
    () => fonts.filter((fontFamily) => fontMatchesSearch(fontFamily, query)),
    [fonts, query]
  );

  const popoverContent = (
    <div>
      <SearchInput value={query} onChange={setQuery} />

      <div style={{ paddingTop: 5 }}>
        {filteredFonts.length > 0 ? (
          <FixedSizeList
            innerElementType={MenuList}
            height={Math.min(400, 30 * filteredFonts.length) + 10}
            width={230}
            itemCount={filteredFonts.length}
            itemSize={30}
          >
            {({ index, style }) => {
              const fontFamily = filteredFonts[index];
              const isCustom =
                store.fonts.some((font) => font.fontFamily === fontFamily) ||
                globalFonts.some((font) => font.fontFamily === fontFamily);

              return (
                <div style={style}>
                  <FontItem
                    fontFamily={fontFamily}
                    active={activeFont === fontFamily}
                    onSelect={() => onFontSelect(fontFamily)}
                    store={store}
                    isCustom={isCustom}
                  />
                </div>
              );
            }}
          </FixedSizeList>
        ) : (
          <div style={{ width: 230, padding: 14, color: '#666' }}>
            No fonts found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Popover content={popoverContent} position={Position.BOTTOM}>
      <Tooltip content="Font family" position={Position.BOTTOM}>
        <Button
          text={activeFontLabel}
          rightIcon={<CaretDown />}
          minimal
          style={{
            marginRight: 5,
            fontFamily: `"${activeFont}"`,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxHeight: 30,
          }}
          aria-label="Font family"
        />
      </Tooltip>
    </Popover>
  );
};

const HebrewFontFamily = observer(({ elements, store }) => {
  const googleFontsChanged = isGoogleFontChanged();
  const { data: googleFonts = [], mutate } = useSWR(
    getGoogleFontsListAPI(),
    fetcher,
    {
      isPaused: () => googleFontsChanged,
      fallbackData: [],
    }
  );

  useEffect(() => {
    mutate();
  }, [googleFontsChanged, mutate]);

  const availableFonts = store.fonts
    .concat(globalFonts)
    .map((font) => font.fontFamily)
    .concat(
      googleFonts.length && !googleFontsChanged
        ? googleFonts
        : Array.from(FALLBACK_GOOGLE_FONTS)
    );

  const usedFonts = [];
  store.find((element) => {
    if (element.type === 'text') {
      usedFonts.push(element.fontFamily);
    }
    return false;
  });

  const fonts = Array.from(
    new Set([...usedFonts, '_divider', ...availableFonts])
  );

  const activeFont = elements[0].fontFamily;
  const activeFontLabel =
    activeFont.length > 15 ? `${activeFont.slice(0, 15)}...` : activeFont;

  return (
    <HebrewAwareFontMenu
      fonts={fonts}
      activeFont={activeFont}
      activeFontLabel={activeFontLabel}
      store={store}
      onFontSelect={(fontFamily) => {
        store.history.transaction(() => {
          elements.forEach((element) => {
            element.set({ fontFamily });
          });
        });
      }}
    />
  );
});

export default HebrewFontFamily;
