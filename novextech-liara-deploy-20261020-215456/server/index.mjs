import { createApplication, addAdmin } from './app.mjs';
import { resolve } from 'node:path';
import { writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if(existsSync('.env.local'))process.loadEnvFile('.env.local');
const production=process.env.NODE_ENV==='production';
if(production&&!process.env.APP_ORIGIN)throw new Error('APP_ORIGIN is required in production');
const origins=process.env.APP_ORIGIN?[process.env.APP_ORIGIN]:undefined;
const {server,db}=createApplication({dbPath:resolve(process.env.DATABASE_PATH||'data/novextech.sqlite'),origins,secure:production});
if(!db.prepare('SELECT email FROM admins LIMIT 1').get()) {
  if(production&&(!process.env.INITIAL_ADMIN_EMAIL||!process.env.INITIAL_ADMIN_PASSWORD||process.env.INITIAL_ADMIN_PASSWORD.length<16))throw new Error('Set INITIAL_ADMIN_EMAIL and a 16+ character INITIAL_ADMIN_PASSWORD for the first production start.');
  const email=production?process.env.INITIAL_ADMIN_EMAIL:'admin@novextech.local';
  const password=production?process.env.INITIAL_ADMIN_PASSWORD:randomBytes(18).toString('base64url');
  await addAdmin(db,email,password);
  if(!production){writeFileSync('.local-admin.txt',`Local Novextech admin\nURL: http://127.0.0.1:5173/admin/login\nEmail: ${email}\nPassword: ${password}\nKeep this file private. It is excluded from shared archives.\n`,{mode:0o600});console.log('Local admin created. Credentials are in .local-admin.txt');}
  else console.log('Initial production admin created. Remove INITIAL_ADMIN_PASSWORD from app settings after this start.');
}
const port=Number(process.env.PORT||8787),host=process.env.HOST||(production?'0.0.0.0':'127.0.0.1');
server.listen(port,host,()=>console.log(`Novextech API listening on ${host}:${port}`));
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0)}));
