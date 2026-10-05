// Builds the whole site into ONE self-contained HTML file (JS, CSS, fonts and
// favicon inlined) that opens with a double-click: no server, no internet.
// Browsers refuse to load module scripts over file://, so a normal `dist/`
// can't be opened directly; this inlines everything instead.
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'vite'

const OUT = 'dist-offline'
const TARGET = 'docs/AI-Quest-60-offline.html'

await build({
  configFile: 'vite.config.ts',
  logLevel: 'warn',
  build: {
    outDir: OUT,
    emptyOutDir: true,
    assetsInlineLimit: () => true, // fonts become data: URIs inside the CSS
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { codeSplitting: false } },
  },
})

let html = readFileSync(join(OUT, 'index.html'), 'utf8')
const read = (p) => readFileSync(join(OUT, p.replace(/^\.\//, '')), 'utf8')

html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  // a literal "</script" inside the bundle would end the inline tag early
  const js = read(src).replace(/<\/script/gi, '<\\/script')
  return `<script type="module">${js}</script>`
})
html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => `<style>${read(href)}</style>`)
html = html.replace(
  /<link rel="icon" type="image\/svg\+xml" href="\.\/favicon\.svg" \/>/,
  `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${readFileSync('public/favicon.svg').toString('base64')}" />`,
)

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('offline build still references external assets')
writeFileSync(TARGET, html)
rmSync(OUT, { recursive: true, force: true })
console.log(`✓ ${TARGET} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`)
