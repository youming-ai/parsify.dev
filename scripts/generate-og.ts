/**
 * Generate the Open Graph card at public/opengraph-image.png.
 *
 * Run once whenever the brand or copy changes:
 *   bun run generate:og
 *
 * Output is a real 1200×630 PNG (the standard Open Graph dimensions),
 * which keeps Twitter / Facebook / LinkedIn previews from cropping.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const BRAND_ORANGE = '#f54e00';
const BG = '#0a0a0a';
const FG = '#fafafa';
const MUTED = '#a3a3a3';
const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  const fontDir = resolve(process.cwd(), 'node_modules/@fontsource/inter/files');
  const [regular, bold, extraBold] = await Promise.all([
    readFile(resolve(fontDir, 'inter-latin-400-normal.woff')),
    readFile(resolve(fontDir, 'inter-latin-700-normal.woff')),
    readFile(resolve(fontDir, 'inter-latin-800-normal.woff')),
  ]);

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: BG,
          color: FG,
          fontFamily: 'Inter',
          padding: '80px 96px',
          justifyContent: 'space-between',
        },
        children: [
          // Top row: brand mark
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center', gap: 16 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: BRAND_ORANGE,
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 32, fontWeight: 700, letterSpacing: -0.5 },
                    children: 'Parsify.dev',
                  },
                },
              ],
            },
          },
          // Main copy
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: 24 },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 88,
                      fontWeight: 800,
                      letterSpacing: -2,
                      lineHeight: 1.05,
                      color: FG,
                    },
                    children: 'AI & LLM Developer Tools',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 36,
                      fontWeight: 400,
                      color: MUTED,
                      lineHeight: 1.3,
                      maxWidth: 900,
                    },
                    children:
                      'Token counter, cost calculator, schema converter, JSONL viewer, and more — all in your browser.',
                  },
                },
              ],
            },
          },
          // Bottom row: privacy claim
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 24,
                color: BRAND_ORANGE,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              },
              children: ['Privacy-first · Browser-only · BYOK'],
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Inter', data: regular, weight: 400, style: 'normal' },
        { name: 'Inter', data: bold, weight: 700, style: 'normal' },
        { name: 'Inter', data: extraBold, weight: 800, style: 'normal' },
      ],
    }
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
  const out = resolve(process.cwd(), 'public/opengraph-image.png');
  await writeFile(out, png);
  console.log(`Generated ${out} (${WIDTH}×${HEIGHT} PNG, ${png.byteLength} bytes)`);
}

await main();
