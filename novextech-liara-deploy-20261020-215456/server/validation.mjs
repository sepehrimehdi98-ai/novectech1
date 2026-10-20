import { randomUUID } from 'node:crypto';
export class HttpError extends Error { constructor(status, code) { super(code); this.status=status; this.code=code; } }
const fail = () => { throw new HttpError(400,'INVALID_CONTENT'); };
function str(value,max=10000) { if(typeof value!=='string'||value.length>max) fail();return value.trim(); }
function localized(value,max) { if(!value || typeof value!=='object') fail();return {en:str(value.en,max),fa:str(value.fa,max)}; }
export function safeUrl(value,{image=false,video=false}={}) {
  const text=str(value??'',2000); if(!text) return '';
  let u;try {u=new URL(text);} catch {fail();}
  if(u.protocol!=='https:' || u.username || u.password) fail();
  if(video && !(u.hostname==='kavimo.com'||u.hostname.endsWith('.kavimo.com')||u.hostname==='kavimo.ir'||u.hostname.endsWith('.kavimo.ir'))) fail();
  return u.href;
}
export function validatePost(body,id=randomUUID()) {
  if(!body||typeof body!=='object') fail();
  const slug=str(body.slug,100);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!['draft','published'].includes(body.status)) fail();
  const title=localized(body.title,200),excerpt=localized(body.excerpt,1000),tag=localized(body.tag,80);
  if(!Array.isArray(body.blocks)||body.blocks.length>80) fail();
  const ids=new Set();
  const blocks=body.blocks.map(b=>{
    if(!b||!['heading','paragraph','image','video','quote','cta'].includes(b.type)) fail();
    if(typeof b.id!=='string'||!/^[\w-]{1,64}$/.test(b.id)||ids.has(b.id)) fail();ids.add(b.id);
    if(!['start','center','end'].includes(b.align)||!['reading','wide'].includes(b.width)||!['none','lime','violet','coral'].includes(b.accent)) fail();
    const block={id:b.id,type:b.type,text:localized(b.text,10000),align:b.align,width:b.width,accent:b.accent};
    if(b.type==='video'){if(typeof b.mediaId!=='string'||(b.mediaId!==''&&!/^[a-zA-Z0-9]{12}$/.test(b.mediaId)))fail();block.mediaId=b.mediaId;}
    if(['image','cta'].includes(b.type)) block.url=safeUrl(b.url,{video:b.type==='video',image:b.type==='image'});
    if(body.status==='published' && (!block.text.en||!block.text.fa||(['image','cta'].includes(b.type)&&!block.url)||(b.type==='video'&&!block.mediaId))) throw new HttpError(400,'TRANSLATIONS_REQUIRED');
    return block;
  });
  if(body.status==='published'&&(!title.en||!title.fa||!excerpt.en||!excerpt.fa||!blocks.length)) throw new HttpError(400,'TRANSLATIONS_REQUIRED');
  return {id,slug,status:body.status,title,excerpt,tag,cover:safeUrl(body.cover,{image:true}),blocks};
}
export function validateMessages(body) {
  if(!body||!['en','fa'].includes(body.language)||!Array.isArray(body.messages)||body.messages.length<1||body.messages.length>16) fail();
  let size=0;
  const messages=body.messages.map(m=>{if(!m||!['user','assistant'].includes(m.role)) fail();const content=str(m.content,3000);if(!content) fail();size+=content.length;return {role:m.role,content};});
  if(size>18000||messages.at(-1).role!=='user') fail();
  return messages;
}
