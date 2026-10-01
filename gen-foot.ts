// scripts/gen-foot.ts
const color = '#E8618C'

const shapes = [
  { t: 'ellipse', cx: 262, cy: 285, rx: 105, ry: 95 }, // telapak
  { t: 'ellipse', cx: 252, cy: 390, rx: 62, ry: 62 },  // tumit
  { t: 'circle', cx: 330, cy: 150, r: 38 },            // jari 1..5
  { t: 'circle', cx: 268, cy: 120, r: 26 },
  { t: 'circle', cx: 214, cy: 132, r: 23 },
  { t: 'circle', cx: 172, cy: 165, r: 20 },
  { t: 'circle', cx: 136, cy: 215, r: 17 },
]

const el = ({ t, ...a }: Record<string, any>) =>
  `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="${color}">\n` +
  `  <g transform="translate(23 -11)">\n` +
  shapes.map(s => `    ${el(s)}`).join('\n') +
  `\n  </g>\n</svg>\n`

await Bun.write('public/foot.svg', svg)