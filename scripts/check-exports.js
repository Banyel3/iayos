const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'apps', 'frontend_mobile', 'iayos_mobile');

function walk(dir) {
  const results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(file)) {
      results.push(full);
    }
  }
  return results;
}

function readExports(file) {
  const txt = fs.readFileSync(file, 'utf8');
  const exports = {
    default: /export\s+default\s+/m.test(txt),
    named: new Set(),
  };
  // crude scan for named exports: export function|const|let|type|interface|class NAME
  const namedRe = /export\s+(?:function|const|let|type|interface|class)\s+([A-Za-z0-9_]+)/gm;
  let m;
  while ((m = namedRe.exec(txt))) {
    exports.named.add(m[1]);
  }
  // also capture export\s*\{ a, b as c \}
  const listRe = /export\s*\{([^}]+)\}/gm;
  while ((m = listRe.exec(txt))) {
    const items = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim());
    for (const it of items) if (it) exports.named.add(it);
  }
  return exports;
}

function resolveImportSpecifier(fromFile, spec) {
  // handle '@/...' -> root + rest
  if (spec.startsWith('@/')) {
    const rel = spec.replace(/^@\//, '');
    const candidate = path.join(root, rel);
    const exts = ['.tsx', '.ts', '/index.tsx', '/index.ts', '.jsx', '.js'];
    for (const ext of exts) {
      const p = candidate + ext;
      if (fs.existsSync(p)) return p;
    }
    // try as directory with index
    for (const ext of exts) {
      const p = path.join(candidate, ext);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
  return null;
}

const files = walk(root);
const problems = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const importRe = /import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]/gm;
  let m;
  while ((m = importRe.exec(txt))) {
    const imports = m[1].trim();
    const spec = m[2].trim();
    if (!spec.startsWith('@/')) continue;
    const target = resolveImportSpecifier(f, spec);
    if (!target) {
      problems.push({ file: f, spec, type: 'not-found' });
      continue;
    }
    const exports = readExports(target);
    if (imports.startsWith('{')) {
      // named imports
      const names = imports.replace(/^{|}$/g, '').split(',').map(s=>s.trim().split(/\sas\s/)[0].trim());
      for (const name of names) {
        if (!exports.named.has(name)) {
          problems.push({ file: f, spec, target, type: 'missing-named', name });
        }
      }
    } else if (imports.startsWith('* as')) {
      // skip
    } else {
      // default import or namespace
      // treat as default
      if (!exports.default && !exports.named.has(imports)) {
        problems.push({ file: f, spec, target, type: 'missing-default', name: imports });
      }
    }
  }
}

if (problems.length === 0) {
  console.log('No obvious import/export mismatches found for @/ imports.');
  process.exit(0);
}

console.log('Found import/export issues:');
for (const p of problems) {
  if (p.type === 'not-found') {
    console.log(`- ${p.file}: imports from ${p.spec} -> target file not found`);
  } else if (p.type === 'missing-named') {
    console.log(`- ${p.file}: imports named '${p.name}' from ${p.spec} -> ${p.target} does not export it`);
  } else if (p.type === 'missing-default') {
    console.log(`- ${p.file}: imports default '${p.name}' from ${p.spec} -> ${p.target} has no default export`);
  }
}
process.exit(1);
