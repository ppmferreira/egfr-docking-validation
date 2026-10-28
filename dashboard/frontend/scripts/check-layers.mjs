// Enforces the dependency rule: each layer may only import from the layers listed here.
//   domain          -> domain
//   application     -> domain, application, react
//   infrastructure  -> domain, infrastructure, 3dmol
//   presentation    -> domain, application, presentation, react, radix-ui, lucide-react, recharts, motion, clsx, tailwind-merge
// src/main.tsx is the composition root and may import anything.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

const SRC = resolve('src')
const ALLOWED = {
  domain: { layers: ['domain'], packages: [] },
  application: { layers: ['domain', 'application'], packages: ['react'] },
  infrastructure: { layers: ['domain', 'infrastructure'], packages: ['3dmol'] },
  presentation: { layers: ['domain', 'application', 'presentation'], packages: ['react', 'radix-ui', 'lucide-react', 'recharts', 'motion', 'clsx', 'tailwind-merge'] },
}

const files = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? files(p) : [p]
})
const layerOf = (p) => relative(SRC, p).split(sep)[0]

const problems = []
for (const file of files(SRC).filter((f) => /\.(ts|tsx)$/.test(f))) {
  const layer = layerOf(file)
  const rule = ALLOWED[layer]
  if (!rule) continue
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/^\s*(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm)) {
    const spec = m[1] ?? m[2]
    if (spec.endsWith('.css')) continue
    if (spec.startsWith('.')) {
      const target = layerOf(resolve(dirname(file), spec))
      if (!rule.layers.includes(target)) problems.push(`${relative(SRC, file)}: ${layer} must not import ${target} (${spec})`)
    } else if (!rule.packages.some((p) => spec === p || spec.startsWith(`${p}/`))) {
      problems.push(`${relative(SRC, file)}: ${layer} must not import package "${spec}"`)
    }
  }
}

if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
console.log('layers ok')
