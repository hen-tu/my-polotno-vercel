// src/components/HebrewFontFamily.jsx
import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import {
  getFontsList,
  globalFonts,
  isGoogleFontChanged,
} from 'polotno/utils/fonts';
import {
  getGoogleFontImage,
  getGoogleFontsListAPI,
} from 'polotno/config';

const HEBREW_FONT_NAMES = new Set([
  'Gveret Levin',
  'Karantina',
  'Huninn',
  'Playpen Sans Hebrew',
  'Secular One',
  'Suez One',
  'Noto Serif Hebrew',
  'Noto Sans Hebrew',
  'IBM Plex Sans Hebrew',
  'Libertinus Math',
  'Noto Rashi Hebrew',
  'Heebo',
  'David Libre',
  'Frank Ruhl Libre',
  'Fredoka',
  'Amatic SC',
  'Assistant',
  'Bellefair',
  'Bona Nova SC',
  'Cardo',
  'Alef',
  'Tinos',
  'Hebrew Script',
]);

const normalize = (value) =>
  String(value || '').trim().toLocaleLowerCase();

export const isHebrewFont = (fontFamily) => {
  const name = String(fontFamily || '').trim();

  return (
    HEBREW_FONT_NAMES.has(name) ||
    /^rubik(?:\s|$)/i.test(name) ||
    /hebrew/i.test(name)
  );
};

const matchesSearch = (fontFamily, query) => {
  if (fontFamily === '_divider') return !query;

  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const searchable = [
    fontFamily,
    ...(isHebrewFont(fontFamily) ? ['hebrew', 'עברית'] : []),
  ]
    .join(' ')
    .toLocaleLowerCase();

  return searchable.includes(normalizedQuery);
};

let cachedGoogleFonts = null;

const loadGoogleFonts = async () => {
  if (cachedGoogleFonts) return cachedGoogleFonts;

  const response = await fetch(getGoogleFontsListAPI());
  if (!response.ok) {
    throw new Error(`Font list request failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  cachedGoogleFonts = Array.isArray(data) ? data : [];
  return cachedGoogleFonts;
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
    if (showGooglePreview || fontFamily === '_divider') return;

    Promise.resolve(store.loadFont(fontFamily)).catch((error) => {
      console.warn(`Could not load font "${fontFamily}" for preview.`, error);
    });
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
      style={{ height: 20, maxWidth: 185, objectFit: 'contain' }}
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
  const [hebrewOnly, setHebrewOnly] = useState(false);

  const filteredFonts = useMemo(
    () =>
      fonts.filter((fontFamily) => {
        if (fontFamily === '_divider') {
          return !hebrewOnly && !query;
        }

        if (hebrewOnly && !isHebrewFont(fontFamily)) {
          return false;
        }

        return matchesSearch(fontFamily, query);
      }),
    [fonts, hebrewOnly, query]
  );

  const hebrewCount = useMemo(
    () => fonts.filter((fontFamily) => isHebrewFont(fontFamily)).length,
    [fonts]
  );

  const popoverContent = (
    <div style={{ width: 250 }}>
      <div
        style={{
          padding: 8,
          borderBottom: '1px solid #d9d9d9',
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            aria-pressed={hebrewOnly}
            onClick={() => setHebrewOnly((value) => !value)}
            style={{
              border: hebrewOnly ? '1px solid #2e8bf0' : '1px solid #9ebfe0',
              background: hebrewOnly ? '#2e8bf0' : '#eef6ff',
              color: hebrewOnly ? '#fff' : '#155a92',
              borderRadius: 999,
              padding: '5px 11px',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            Hebrew
          </button>

          {hebrewOnly && (
            <span style={{ fontSize: 11, color: '#666' }}>
              {hebrewCount} fonts
            </span>
          )}
        </div>

        <SearchInput value={query} onChange={setQuery} />
      </div>

      <div style={{ paddingTop: 5 }}>
        {filteredFonts.length > 0 ? (
          <FixedSizeList
            innerElementType={MenuList}
            height={Math.min(400, 30 * filteredFonts.length) + 10}
            width={250}
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
          <div style={{ padding: 14, color: '#666' }}>
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
  const [googleFonts, setGoogleFonts] = useState(() =>
    Array.from(getFontsList())
  );

  useEffect(() => {
    let cancelled = false;

    if (isGoogleFontChanged()) {
      setGoogleFonts(Array.from(getFontsList()));
      return undefined;
    }

    loadGoogleFonts()
      .then((fonts) => {
        if (!cancelled) setGoogleFonts(fonts);
      })
      .catch((error) => {
        console.error('Could not load the Google Fonts list.', error);
        if (!cancelled) setGoogleFonts(Array.from(getFontsList()));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTextElements =
    Array.isArray(elements) && elements.length
      ? elements
      : store.selectedElements.filter((element) => element.type === 'text');

  if (!selectedTextElements.length) return null;

  const availableFonts = store.fonts
    .concat(globalFonts)
    .map((font) => font.fontFamily)
    .concat(googleFonts);

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

  const activeFont = selectedTextElements[0].fontFamily;
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
          selectedTextElements.forEach((element) => {
            element.set({ fontFamily });
          });
        });
      }}
    />
  );
});

export default HebrewFontFamily;
