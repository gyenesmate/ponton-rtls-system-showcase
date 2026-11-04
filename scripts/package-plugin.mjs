import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const wpDist = resolve(root, 'wordpress', 'dist');

if (!existsSync(resolve(dist, 'rtls-showcase.js'))) {
  console.error('Missing dist/rtls-showcase.js — run npm run build first');
  process.exit(1);
}

rmSync(wpDist, { recursive: true, force: true });
mkdirSync(wpDist, { recursive: true });
cpSync(dist, wpDist, { recursive: true });
console.log('Copied dist/ → wordpress/dist/');
