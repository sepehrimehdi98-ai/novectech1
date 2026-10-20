import { createKavimo } from './kavimo.mjs';
import http from 'node:http';
import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { openStore } from './store.mjs';
import { HttpError, validatePost, validateMessages } from './validation.mjs';
import { answer, FREE_MODEL } from './ai.mjs';
import { approveDocument, deleteDocument, getDocument, listDocuments, reindexApprovedDocuments, saveDocument, unapproveDocument, DEFAULT_EMBEDDING_MODEL } from './rag.mjs';
const scrypt=promisify(scryptCallback);
const digest=s=>createHash('sha256').update(s).digest('hex');
const PUBLIC_POST_CACHE_TTL=30_000;
export async function addAdmin(db,email,password) {
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12) throw new Error('Email and password of at least 12 characters required');
  const salt=randomBytes(16).toString('hex'),hash=(await scrypt(password,salt,64)).toString('hex');
  db.prepare('INSERT INTO admins VALUES (?,?,?)').run(email.toLowerCase(),salt,hash);
}
export function createApplication({dbPath,origins=['http://127.0.0.1:5173','http://localhost:5173'],secure=false,dist=resolve('dist'),aiOptions,kavimoOptions}={}) {
  const db=openStore(dbPath);
  const allowedOrigins=origins.map(value=>new URL(value).origin);
  const kavimo=createKavimo(kavimoOptions);
  const publicPostCache=new Map();
  const cachedPublicPosts=(key,load)=>{
    const now=Date.now(),cached=publicPostCache.get(key);
    if(cached&&cached.expires>now)return cached.value;
    for(const [entry,value] of publicPostCache)if(value.expires<=now)publicPostCache.delete(entry);
    if(publicPostCache.size>=256)publicPostCache.delete(publicPostCache.keys().next().value);
    const value=load();publicPostCache.set(key,{value,expires:now+PUBLIC_POST_CACHE_TTL});return value;
  };
  const invalidatePublicPosts=()=>publicPostCache.clear();
  const publicPostCacheHeaders={'Cache-Control':'public, max-age=0, s-maxage=30, stale-while-revalidate=30'};
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  const siteOrigin=new URL(process.env.APP_ORIGIN||'https://novextech.ir').origin;
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escapeXml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const htmlResponse=async(res,status,file,html,nonce)=>{let content=html??await readFile(file,'utf8');if(nonce)content=content.replace(/<script(?![^>]*\bsrc=)/g,`<script nonce="${nonce}"`);res.writeHead(status,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});res.end(content);};
  const notFound=async(res,nonce)=>htmlResponse(res,404,resolve(dist,'404.html'),undefined,nonce);
  const rate=(key,max,window)=>{
    const now=Date.now();db.prepare('DELETE FROM limits WHERE expires<?').run(now);
    db.prepare('INSERT INTO limits VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+window);
    if(db.prepare('SELECT count FROM limits WHERE key=?').get(key).count>max) throw new HttpError(429,'RATE_LIMITED');
  };
  // Only honor proxy headers when the deployment explicitly declares a trusted
  // reverse proxy. Never trust arbitrary X-Forwarded-For from the public client.
  const clientAddress=req=>{
    if(process.env.TRUST_PROXY==='1'){
      const forwarded=req.headers['x-forwarded-for'];
      if(typeof forwarded==='string'&&forwarded.length<512){
        const address=forwarded.split(',')[0].trim();
        if(address&&!/[\r\n]/.test(address))return address;
      }
    }
    return req.socket.remoteAddress||'unknown';
  };
  const cookie=(value,age)=>`novextech_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure?'; Secure':''}`;
  const readBody=async req=>{if(!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415,'JSON_REQUIRED');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>200000) throw new HttpError(413,'CONTENT_TOO_LARGE');}try{return JSON.parse(text);}catch{throw new HttpError(400,'INVALID_JSON');}};
  const session=req=>{
    const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('novextech_session='))?.slice(18);
    if(!token) return null;
    const row=db.prepare('SELECT * FROM sessions WHERE hash=? AND expires>?').get(digest(token),Date.now());
    return row||null;
  };
  const server=http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy','same-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies','none');
    const nonce=randomBytes(18).toString('base64');
    if(secure){res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');res.setHeader('Content-Security-Policy',`default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; script-src 'self' https://transfer.kavimo.ir 'nonce-${nonce}'; connect-src 'self' https://api.kavimo.ir https://transfer.kavimo.ir; frame-src https://stream.novextech.ir; upgrade-insecure-requests`);}
    const path=new URL(req.url,'http://localhost').pathname;
    try {
      if(req.method==='GET'&&path==='/'&&new URL(req.url,'http://localhost').searchParams.get('lang')==='fa'){
        let html=await readFile(resolve(dist,'index.html'),'utf8');
        const title='نووکس‌تک | طراحی وب و هوش مصنوعی',description='نووکس‌تک وب‌سایت‌های نمونه‌کار، شرکتی و آموزشی و دستیارهای هوش مصنوعی طراحی و پیاده‌سازی می‌کند.',url=siteOrigin+'/?lang=fa';
        html=html.replace(/<html lang="[^"]*" dir="[^"]*">/,'<html lang="fa" dir="rtl">')
          .replace(/<title>[\s\S]*?<\/title>/,'<title>'+escapeHtml(title)+'</title>')
          .replace(/<meta name="description" content="[^"]*"\s*\/>/,'<meta name="description" content="'+escapeHtml(description)+'"/>')
          .replace(/<link rel="canonical" href="[^"]*"\s*\/>/,'<link rel="canonical" href="'+escapeHtml(url)+'"/>')
          .replace(/<meta property="og:title" content="[^"]*"\s*\/>/,'<meta property="og:title" content="'+escapeHtml(title)+'"/>')
          .replace(/<meta property="og:description" content="[^"]*"\s*\/>/,'<meta property="og:description" content="'+escapeHtml(description)+'"/>')
          .replace(/<meta property="og:url" content="[^"]*"\s*\/>/,'<meta property="og:url" content="'+escapeHtml(url)+'"/>')
          .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/,'<meta name="twitter:title" content="'+escapeHtml(title)+'"/>')
          .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/,'<meta name="twitter:description" content="'+escapeHtml(description)+'"/>');
        return htmlResponse(res,200,null,html,nonce);
      }
      if(req.method==='GET'&&path==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'});return res.end(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`);}
      if(req.method==='GET'&&path==='/llms.txt'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'});return res.end(await readFile(resolve(dist,'llms.txt')));}
      if(req.method==='GET'&&path==='/sitemap.xml'){
        const rows=db.prepare("SELECT slug, updated FROM posts WHERE status='published' ORDER BY updated DESC").all();
        const homeDate=new Date().toISOString(),urls=[{en:siteOrigin+'/',fa:siteOrigin+'/?lang=fa',lastmod:homeDate},...rows.map(p=>({en:siteOrigin+'/blog/'+encodeURIComponent(p.slug),fa:siteOrigin+'/blog/'+encodeURIComponent(p.slug)+'?lang=fa',lastmod:p.updated}))];
        const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+urls.flatMap(u=>[{loc:u.en,en:u.en,fa:u.fa,lastmod:u.lastmod},{loc:u.fa,en:u.en,fa:u.fa,lastmod:u.lastmod}]).map(u=>'<url><loc>'+escapeXml(u.loc)+'</loc><xhtml:link rel="alternate" hreflang="en" href="'+escapeXml(u.en)+'"/><xhtml:link rel="alternate" hreflang="fa" href="'+escapeXml(u.fa)+'"/><xhtml:link rel="alternate" hreflang="x-default" href="'+escapeXml(u.en)+'"/><lastmod>'+escapeXml(new Date(u.lastmod).toISOString())+'</lastmod></url>').join('')+'</urlset>';
        res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'});return res.end(xml);
      }
      const articleRoute=path.match(/^\/blog\/([\w-]+)\/?$/);
      if(req.method==='GET'&&articleRoute){
        const row=db.prepare("SELECT document FROM posts WHERE slug=? AND status='published'").get(decodeURIComponent(articleRoute[1]));
        if(!row)return notFound(res,nonce);
        const post=JSON.parse(row.document),requestedLanguage=new URL(req.url,'http://localhost').searchParams.get('lang')==='fa'?'fa':'en',title=post.title[requestedLanguage]+' | Novextech',description=post.excerpt[requestedLanguage].slice(0,300),url=siteOrigin+'/blog/'+encodeURIComponent(post.slug)+(requestedLanguage==='fa'?'?lang=fa':'');
        let html=await readFile(resolve(dist,'index.html'),'utf8');
        html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escapeHtml(title)+'</title>')
          .replace(/<html lang="[^"]*" dir="[^"]*">/,'<html lang="'+requestedLanguage+'" dir="'+(requestedLanguage==='fa'?'rtl':'ltr')+'">')
          .replace(/<meta name="description" content="[^"]*"\s*\/>/,'<meta name="description" content="'+escapeHtml(description)+'"/>')
          .replace(/<link rel="canonical" href="[^"]*"\s*\/>/,'<link rel="canonical" href="'+escapeHtml(url)+'"/>')
          .replace(/<meta property="og:title" content="[^"]*"\s*\/>/,'<meta property="og:title" content="'+escapeHtml(title)+'"/>')
          .replace(/<meta property="og:description" content="[^"]*"\s*\/>/,'<meta property="og:description" content="'+escapeHtml(description)+'"/>')
          .replace(/<meta property="og:url" content="[^"]*"\s*\/>/,'<meta property="og:url" content="'+escapeHtml(url)+'"/>')
          .replace(/<meta property="og:type" content="[^"]*"\s*\/>/,'<meta property="og:type" content="article"/>');
        if(requestedLanguage==='fa')html=html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/,'<meta name="twitter:title" content="'+escapeHtml(title)+'"/>').replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/,'<meta name="twitter:description" content="'+escapeHtml(description)+'"/>');
        const schema={'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:post.title[requestedLanguage],description:post.excerpt[requestedLanguage],inLanguage:requestedLanguage==='fa'?'fa-IR':'en',dateModified:post.updated,mainEntityOfPage:url,author:{'@type':'Organization',name:'Novextech',url:siteOrigin},publisher:{'@type':'Organization',name:'Novextech',url:siteOrigin}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:requestedLanguage==='fa'?'خانه':'Home',item:siteOrigin+'/'},{'@type':'ListItem',position:2,name:requestedLanguage==='fa'?'مجله':'Journal',item:siteOrigin+'/#insights'},{'@type':'ListItem',position:3,name:post.title[requestedLanguage],item:url}]}]};
        html=html.replace('</head>','<script id="novextech-server-jsonld" type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script></head>');
        return htmlResponse(res,200,null,html,nonce);
      }
      if(path.startsWith('/api/')) {
        res.setHeader('Cache-Control','no-store');
        if(!['GET','HEAD'].includes(req.method) && !allowedOrigins.includes(req.headers.origin)) throw new HttpError(403,'INVALID_ORIGIN');
        if(req.method==='GET'&&path==='/api/health') return send(res,200,{ok:true});
        if(req.method==='POST'&&path==='/api/auth/login') {
          rate('login:'+clientAddress(req),10,15*60*1000);
          const body=await readBody(req);if(typeof body.email!=='string'||typeof body.password!=='string'||body.password.length>256) throw new HttpError(400,'INVALID_CREDENTIALS');
          const admin=db.prepare('SELECT * FROM admins WHERE email=?').get(body.email.trim().toLowerCase());
          const actual=await scrypt(body.password,admin?.salt||'dummy-salt-for-missing-account',64);
          if(!admin||!timingSafeEqual(actual,Buffer.from(admin.hash,'hex'))) throw new HttpError(401,'INVALID_CREDENTIALS');
          const old=session(req);if(old) db.prepare('DELETE FROM sessions WHERE hash=?').run(old.hash);
          db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
          const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');
          db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(digest(token),admin.email,csrf,Date.now()+8*3600000);
          res.setHeader('Set-Cookie',cookie(token,8*3600));return send(res,200,{email:admin.email,csrf});
        }
        if(req.method==='GET'&&path==='/api/auth/session') {const current=session(req);if(!current) throw new HttpError(401,'AUTH_REQUIRED');return send(res,200,{email:current.email,csrf:current.csrf});}
        if(req.method==='GET'&&path==='/api/posts') {res.setHeader('Cache-Control',publicPostCacheHeaders['Cache-Control']);return send(res,200,cachedPublicPosts('list',()=>({posts:db.prepare("SELECT document FROM posts WHERE status='published' ORDER BY updated DESC").all().map(r=>JSON.parse(r.document))})));}
        if(req.method==='GET'&&path.startsWith('/api/posts/')) {const slug=decodeURIComponent(path.slice(11)),post=cachedPublicPosts(`post:${slug}`,()=>{const row=db.prepare("SELECT document FROM posts WHERE slug=? AND status='published'").get(slug);return row?JSON.parse(row.document):null;});if(!post)throw new HttpError(404,'NOT_FOUND');res.setHeader('Cache-Control',publicPostCacheHeaders['Cache-Control']);return send(res,200,post);}
        if(req.method==='POST'&&path==='/api/chat') {
          rate('chat:'+clientAddress(req),15,60*1000);
          const body=await readBody(req);const messages=validateMessages(body);
          return send(res,200,await answer(db,messages,body.language,aiOptions));
        }
        if(path.startsWith('/api/admin/')||path==='/api/auth/logout') {
          const current=session(req);if(!current) throw new HttpError(401,'AUTH_REQUIRED');
          if(req.method!=='GET'&&req.headers['x-csrf-token']!==current.csrf) throw new HttpError(403,'CSRF_REQUIRED');
          if(req.method==='POST'&&path==='/api/auth/logout'){db.prepare('DELETE FROM sessions WHERE hash=?').run(current.hash);res.setHeader('Set-Cookie',cookie('',0));return send(res,200,{ok:true});}
          if(req.method==='GET'&&path==='/api/admin/videos/config')return send(res,200,{configured:kavimo.configured,domain:kavimo.domain});
          if(req.method==='GET'&&path==='/api/admin/videos') {
            rate('video-list:'+current.email,30,60000);const query=new URL(req.url,'http://localhost').searchParams;
            const offset=Number(query.get('offset')||0),search=query.get('search')||'';
            if(!Number.isInteger(offset)||offset<0||offset>100000||search.length>200)throw new HttpError(400,'INVALID_CONTENT');
            return send(res,200,await kavimo.list({offset,search}));
          }
          if(req.method==='POST'&&path==='/api/admin/videos/upload-session') {
            rate('video-upload:'+current.email,6,600000);
            return send(res,200,await kavimo.upload(allowedOrigins.map(o=>new URL(o).host)));
          }
          const video=path.match(/^\/api\/admin\/videos\/([a-zA-Z0-9]{12})$/);
          if(req.method==='GET'&&video)return send(res,200,await kavimo.get(video[1]));
          if(req.method==='GET'&&path==='/api/admin/knowledge') return send(res,200,{knowledge:db.prepare('SELECT value FROM settings WHERE key=?').get('knowledge').value,configured:Boolean(aiOptions?.apiKey||process.env.OPENROUTER_API_KEY),model:FREE_MODEL});
          if(req.method==='PUT'&&path==='/api/admin/knowledge'){
            const b=await readBody(req);if(typeof b.knowledge!=='string'||b.knowledge.trim().length<30||b.knowledge.length>20000) throw new HttpError(400,'INVALID_CONTENT');
            db.prepare('UPDATE settings SET value=? WHERE key=?').run(b.knowledge.trim(),'knowledge');
            const current=getDocument(db,'seed-company-knowledge');
            if(current)saveDocument(db,{source_type:'company_fact',knowledge_scope:'company_specific',title:'Approved Novextech company facts',language:'en',topics:['company','services','process','timeline','contact'],body_markdown:b.knowledge,last_verified_at:'',review_due_at:'',references:[]},{id:current.id,adminEmail:current.email});
            return send(res,200,{ok:true,status:'in_review'});
          }
          if(path==='/api/admin/rag/documents'){
            if(req.method==='GET')return send(res,200,{documents:listDocuments(db),embeddingModel:process.env.RAG_EMBEDDING_MODEL||DEFAULT_EMBEDDING_MODEL});
            if(req.method==='POST'){const doc=saveDocument(db,await readBody(req),{adminEmail:current.email});return send(res,201,doc);}
          }
          if(req.method==='POST'&&path==='/api/admin/rag/reindex'){
            rate('rag-reindex:'+current.email,2,60000);try{return send(res,200,await reindexApprovedDocuments(db,{apiKey:aiOptions?.apiKey||process.env.OPENROUTER_API_KEY,fetchImpl:aiOptions?.embeddingFetchImpl||fetch}));}
            catch(error){if(error.message==='AI_NOT_CONFIGURED')throw new HttpError(503,'AI_NOT_CONFIGURED');if(error.message==='EMBEDDING_RATE_LIMITED')throw new HttpError(429,'AI_BUSY');throw new HttpError(503,'RAG_INDEX_FAILED');}
          }
          const ragDoc=path.match(/^\/api\/admin\/rag\/documents\/([\w-]+)$/);
          if(ragDoc){
            const id=ragDoc[1];if(!getDocument(db,id))throw new HttpError(404,'NOT_FOUND');
            if(req.method==='PUT')return send(res,200,saveDocument(db,await readBody(req),{id,adminEmail:current.email}));
            if(req.method==='DELETE'){deleteDocument(db,id);return send(res,200,{ok:true});}
          }
          const ragApproval=path.match(/^\/api\/admin\/rag\/documents\/([\w-]+)\/(approve|unapprove)$/);
          if(ragApproval){
            const [,id,action]=ragApproval;
            if(req.method==='POST'&&action==='approve'){
              rate('rag-approve:'+current.email,20,60000);let result;
              try{const body=await readBody(req);result=await approveDocument(db,id,{adminEmail:current.email,apiKey:aiOptions?.apiKey||process.env.OPENROUTER_API_KEY,fetchImpl:aiOptions?.embeddingFetchImpl||fetch,checklist:body.checklist||{}});}
              catch(error){if(error.message==='RAG_DOCUMENT_NOT_FOUND')throw new HttpError(404,'NOT_FOUND');if(['RAG_APPROVAL_CHECKLIST_REQUIRED','RAG_CASE_STUDY_NOT_CONFIRMED','RAG_TECHNICAL_REVIEW_REQUIRED','RAG_SCOPE_REVIEW_REQUIRED','RAG_DOCUMENT_TOO_LARGE','INVALID_RAG_DOCUMENT'].includes(error.message))throw new HttpError(400,error.message);if(error.message==='AI_NOT_CONFIGURED')throw new HttpError(503,'AI_NOT_CONFIGURED');if(error.message==='EMBEDDING_RATE_LIMITED')throw new HttpError(429,'AI_BUSY');throw new HttpError(503,error.message||'RAG_INDEX_FAILED');}
              return send(res,200,result);
            }
            if(req.method==='POST'&&action==='unapprove'){const body=await readBody(req);try{return send(res,200,unapproveDocument(db,id,{archive:body.archive===true}));}catch(error){if(error.message==='RAG_DOCUMENT_NOT_FOUND')throw new HttpError(404,'NOT_FOUND');throw error;}}
          }
          if(path==='/api/admin/posts') {
            if(req.method==='GET') return send(res,200,{posts:db.prepare('SELECT document FROM posts ORDER BY updated DESC').all().map(r=>JSON.parse(r.document))});
            if(req.method==='POST') {const p=validatePost(await readBody(req));p.revision=1;p.updated=new Date().toISOString();try{db.prepare('INSERT INTO posts VALUES (?,?,?,?,?,?)').run(p.id,p.slug,p.status,p.revision,p.updated,JSON.stringify(p));}catch(e){if(String(e).includes('UNIQUE'))throw new HttpError(409,'SLUG_EXISTS');throw e;}invalidatePublicPosts();return send(res,201,p);}
          }
          const match=path.match(/^\/api\/admin\/posts\/([\w-]+)$/);
          if(match) {
            const row=db.prepare('SELECT * FROM posts WHERE id=?').get(match[1]);if(!row) throw new HttpError(404,'NOT_FOUND');
            if(req.method==='GET') return send(res,200,JSON.parse(row.document));
            if(req.method==='DELETE'){db.prepare('DELETE FROM posts WHERE id=?').run(match[1]);invalidatePublicPosts();return send(res,200,{ok:true});}
            if(req.method==='PUT') {
              const b=await readBody(req);if(b.revision!==row.revision) throw new HttpError(409,'EDIT_CONFLICT');
              const p=validatePost(b,match[1]);p.revision=row.revision+1;p.updated=new Date().toISOString();
              try{const changed=db.prepare('UPDATE posts SET slug=?, status=?, revision=?, updated=?, document=? WHERE id=? AND revision=?').run(p.slug,p.status,p.revision,p.updated,JSON.stringify(p),p.id,b.revision);if(!changed.changes)throw new HttpError(409,'EDIT_CONFLICT');}catch(e){if(String(e).includes('UNIQUE'))throw new HttpError(409,'SLUG_EXISTS');throw e;}invalidatePublicPosts();
              return send(res,200,p);
            }
          }
        }
        throw new HttpError(404,'NOT_FOUND');
      }
      if(req.method!=='GET'&&req.method!=='HEAD') throw new HttpError(405,'METHOD_NOT_ALLOWED');
      const root=resolve(dist);let file=resolve(root,'.'+decodeURIComponent(path));
      if(!file.startsWith(root+sep)&&file!==root)throw new HttpError(404,'NOT_FOUND');
      if(path.includes('/.'))throw new HttpError(404,'NOT_FOUND');
      let exists=false;try{exists=(await stat(file)).isFile();}catch{}
      if(!exists){if(path==='/'||path==='/admin'||path.startsWith('/admin/'))file=resolve(root,'index.html');else return notFound(res,nonce);}
      if(extname(file)==='.html') {
        if(path.startsWith('/admin')) {
          let html=await readFile(file,'utf8');
          html=html.replace(/<meta name="robots" content="[^"]*"\s*\/>/,'<meta name="robots" content="noindex, nofollow"/>');
          return htmlResponse(res,200,null,html,nonce);
        }
        return htmlResponse(res,200,file,undefined,nonce);
      }
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control',path.startsWith('/assets/')?'public, max-age=31536000, immutable':extname(file)==='.html'?'no-cache':'public, max-age=3600');res.end(req.method==='HEAD'?undefined:await readFile(file));
    } catch(e) {const ragBad=['INVALID_RAG_DOCUMENT','RAG_DOCUMENT_NOT_FOUND','RAG_APPROVAL_CHECKLIST_REQUIRED','RAG_CASE_STUDY_NOT_CONFIRMED','RAG_TECHNICAL_REVIEW_REQUIRED','RAG_SCOPE_REVIEW_REQUIRED','RAG_DOCUMENT_TOO_LARGE'].includes(e.message);const status=e.status||(ragBad?400:e.message==='RAG_INDEX_FAILED'?503:500);if(!res.headersSent)send(res,status,{error:e.code||e.message||'SERVER_ERROR'});else res.end();if(!e.status&&!ragBad)console.error('Request failed:',e.message);}
  });
  return {server,db};
}
