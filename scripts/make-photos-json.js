// scripts/make-photos-json.js

import fs from 'fs';
import path from 'path';

// 1. Read the filenames list
const lines = fs
  .readFileSync(path.resolve('photos/filenames.txt'), 'utf-8')
  .split(/\r?\n/)
  .filter((l) => l.trim());

// 2. Map each into your JSON shape
const photos = lines.map((filename) => {
  const id = filename.replace(/\.[^/.]+$/, '');
  const name = id.replace(/-/g, ' ');
  const url = `https://raw.githubusercontent.com/hen-tu/polotno-assets-cf/main/photos/${filename}`;
  return { id, name, url, previewUrl: url };
});

// 3. Ensure output dir exists
const outDir = path.resolve('public/photos');
fs.mkdirSync(outDir, { recursive: true });

// 4. Write the JSON file, pretty‑printed
fs.writeFileSync(
  path.join(outDir, 'index.json'),
  JSON.stringify(photos, null, 2),
  'utf-8'
);

console.log(`✔  Wrote ${photos.length} entries to publichttps://raw.githubusercontent.com/hen-tu/polotno-assets-cf/main/photos/index.json`);
