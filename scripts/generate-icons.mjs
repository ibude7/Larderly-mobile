/**
 * Generates native app icon assets from assets/app-logo-mark.svg.
 * Run: npm run generate-icons
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assets = path.join(root, 'assets');

const BACKGROUND = '#F4F2EE';
const MARK_SVG = fs.readFileSync(path.join(assets, 'app-logo-mark.svg'), 'utf8');
const MONO_SVG = fs.readFileSync(path.join(assets, 'app-logo-monochrome.svg'), 'utf8');

/** Extract inner SVG content (everything inside the root <svg>). */
function innerSvg(svg) {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function render(svg, size, background = 'transparent') {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background,
  });
  return resvg.render().asPng();
}

function centeredMark(size, scale) {
  const markSize = size * scale;
  const offset = (size - markSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${offset} ${offset}) scale(${markSize / 48})">
      ${innerSvg(MARK_SVG)}
    </g>
  </svg>`;
}

function centeredMono(size, scale) {
  const markSize = size * scale;
  const offset = (size - markSize) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${offset} ${offset}) scale(${markSize / 48})">
      ${innerSvg(MONO_SVG)}
    </g>
  </svg>`;
}

function solidBackground(size, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${color}"/></svg>`;
}

function writePng(filename, buffer) {
  fs.writeFileSync(path.join(assets, filename), buffer);
  console.log(`wrote ${filename}`);
}

writePng('icon.png', render(MARK_SVG, 1024));
writePng('android-icon-foreground.png', render(centeredMark(1024, 0.66), 1024));
writePng('android-icon-background.png', render(solidBackground(1024, BACKGROUND), 1024, BACKGROUND));
writePng('android-icon-monochrome.png', render(centeredMono(1024, 0.5), 1024));
writePng('splash-icon.png', render(centeredMark(1024, 0.55), 1024));
writePng('favicon.png', render(MARK_SVG, 48));

console.log('Done — app icons generated from app logo mark.');
