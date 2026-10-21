import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('novextech-liara-deploy-20261020-215456/dist');
const target = resolve('dist');
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log('Frontend build copied to repository root ./dist for the Liara Node.js runtime.');
