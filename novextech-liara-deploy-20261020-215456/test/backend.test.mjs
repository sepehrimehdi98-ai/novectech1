import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createApplication, addAdmin } from '../server/app.mjs';
import { answer, buildMessages, FREE_MODEL } from '../server/ai.mjs';
const origin='http://127.0.0.1:5173';
const embeddingFetchImpl=async(_url,opts)=>{const body=JSON.parse(opts.body);return new Response(JSON.stringify({data:body.input.map((_,index)=>({index,embedding:[1,0]}))}));};
async function fixture(t,options={}) {
  const root=resolve('../../work/backend-tests');await mkdir(root,{recursive:true});
  const dir=await mkdtemp(join(root,'run-'));
  const app=createApplication({dbPath:join(dir,'test.sqlite'),...options});
  await addAdmin(app.db,'test@example.com','test-password-long-123');
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  t.after(async()=>{await new Promise(r=>app.server.close(r));app.db.close();});
  const base=`http://127.0.0.1:${app.server.address().port}`;let cookie='',csrf='';
  const req=async(path,method='GET',body,headers={})=>{
    const response=await fetch(base+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf,...headers},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,data:await response.json(),headers:response.headers};
  };
  return {...app,req,async login(){const r=await req('/api/auth/login','POST',{email:'test@example.com',password:'test-password-long-123'});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];csrf=r.data.csrf;return r;}};
}
function post(){return {slug:'test-story',status:'draft',title:{en:'Story',fa:'مطلب'},excerpt:{en:'Summary',fa:'خلاصه'},tag:{en:'Design',fa:'طراحی'},cover:'',blocks:[{id:'one',type:'paragraph',text:{en:'Text',fa:'متن'},align:'start',width:'reading',accent:'none'}]};}
test('admin session, origin and CSRF enforcement; logout revokes access',async t=>{
 const f=await fixture(t);assert.equal((await f.req('/api/admin/posts')).status,401);
 assert.equal((await f.req('/api/auth/login','POST',{email:'test@example.com',password:'incorrect'})).status,401);
 assert.equal((await f.req('/api/auth/login','POST',{}, {Origin:'https://other.example'})).status,403);
 const login=await f.login();assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
 assert.equal((await f.req('/api/admin/posts','POST',post(),{'X-CSRF-Token':''})).status,403);
 assert.equal((await f.req('/api/admin/posts')).status,200);
 assert.equal((await f.req('/api/auth/logout','POST',{})).status,200);
 assert.equal((await f.req('/api/admin/posts')).status,401);
});
test('bilingual posts persist with ordered blocks, draft isolation and conflict checks',async t=>{
 const f=await fixture(t);await f.login();const p=post();p.blocks.unshift({...p.blocks[0],id:'two',type:'heading',accent:'lime',align:'center'});
 const created=await f.req('/api/admin/posts','POST',p);assert.equal(created.status,201);
 const doc=created.data;assert.deepEqual(doc.blocks.map(b=>b.id),['two','one']);assert.equal(doc.blocks[0].accent,'lime');
 assert.equal((await f.req('/api/posts/'+doc.slug)).status,404);
 assert.equal((await f.req('/api/admin/posts','POST',p)).status,409);
 assert.equal((await f.req('/api/admin/posts/'+doc.id,'PUT',{...doc,status:'published',title:{en:'Only',fa:''}})).status,400);
 const published=await f.req('/api/admin/posts/'+doc.id,'PUT',{...doc,status:'published'});assert.equal(published.status,200);
 assert.equal((await f.req('/api/posts/'+doc.slug)).data.title.fa,'مطلب');
 assert.equal((await f.req('/api/admin/posts/'+doc.id,'PUT',doc)).status,409);
 const stored=JSON.parse(f.db.prepare('SELECT document FROM posts WHERE id=?').get(doc.id).document);assert.equal(stored.revision,2);
 assert.equal((await f.req('/api/admin/posts/'+doc.id,'PUT',{...published.data,status:'draft'})).status,200);
 assert.equal((await f.req('/api/posts/'+doc.slug)).status,404);
 assert.equal((await f.req('/api/admin/posts/'+doc.id,'DELETE')).status,200);
});
test('public article and feed cache is short-lived, public-only and invalidated by admin changes',async t=>{
 const f=await fixture(t);await f.login();
 const adminList=await f.req('/api/admin/posts');assert.equal(adminList.headers.get('cache-control'),'no-store');
 const initial=await f.req('/api/posts'),baselineCount=initial.data.posts.length;
 const p=post();p.status='published';
 const created=await f.req('/api/admin/posts','POST',p);assert.equal(created.status,201);
 const list=await f.req('/api/posts');assert.match(list.headers.get('cache-control'),/s-maxage=30/);assert.equal(list.data.posts.length,baselineCount+1);
 const first=await f.req('/api/posts/'+p.slug);assert.match(first.headers.get('cache-control'),/s-maxage=30/);assert.equal(first.data.title.en,'Story');
 const edited=await f.req('/api/admin/posts/'+created.data.id,'PUT',{...created.data,title:{en:'Updated story',fa:'مطلب به‌روز'}});assert.equal(edited.status,200);
 assert.equal((await f.req('/api/posts/'+p.slug)).data.title.en,'Updated story');
 assert.equal((await f.req('/api/posts')).data.posts[0].title.en,'Updated story');
 assert.equal((await f.req('/api/admin/posts/'+created.data.id,'DELETE')).status,200);
 assert.equal((await f.req('/api/posts/'+p.slug)).status,404);assert.equal((await f.req('/api/posts')).data.posts.length,baselineCount);
});
test('published article HTML provides language-matched server metadata for Persian query URLs',async t=>{
 const f=await fixture(t);await f.login();const p=post();p.status='published';
 const created=await f.req('/api/admin/posts','POST',p);assert.equal(created.status,201);
 const response=await fetch(`http://127.0.0.1:${f.server.address().port}/blog/${created.data.slug}?lang=fa`);
 const html=await response.text();assert.equal(response.status,200);
 assert.match(html,/<html lang="fa" dir="rtl">/);assert.match(html,/<title>مطلب \| Novextech<\/title>/);
 assert.match(html,/rel="canonical" href="https:\/\/novextech\.ir\/blog\/test-story\?lang=fa"/);
 assert.match(html,/"inLanguage":"fa-IR"/);
});
test('Persian homepage has localized crawl metadata and sitemap alternates point to both versions',async t=>{
 const f=await fixture(t);
 const base=`http://127.0.0.1:${f.server.address().port}`;
 const home=await fetch(base+'/?lang=fa'),html=await home.text();
 assert.equal(home.status,200);assert.match(html,/<html lang="fa" dir="rtl">/);assert.match(html,/<title>نووکس‌تک \| طراحی وب و هوش مصنوعی<\/title>/);
 const sitemap=await (await fetch(base+'/sitemap.xml')).text();
 assert.match(sitemap,/hreflang="fa" href="https:\/\/novextech\.ir\/\?lang=fa"/);
 assert.match(sitemap,/hreflang="x-default" href="https:\/\/novextech\.ir\/"/);
});
test('RAG-backed AI uses approved context only; drafts stay out and clients cannot add system messages',async t=>{
 let outgoing;
 const f=await fixture(t,{aiOptions:{apiKey:'fake-key',embeddingFetchImpl,fetchImpl:async(_url,opts)=>{outgoing=JSON.parse(opts.body);return new Response(JSON.stringify({choices:[{message:{content:'سلام، چه وب‌سایتی می‌خواهید؟'}}]}));}}});
 await f.login();
 const p=post();p.title.en='private-draft-marker';await f.req('/api/admin/posts','POST',p);
 const r=await f.req('/api/chat','POST',{language:'fa',messages:[{role:'user',content:'نووکس‌تک چه خدماتی دارد؟ آیا private-draft-marker جزو خدمات است؟'}]});
 assert.equal(r.status,200);assert.match(r.data.reply,/سلام/);assert.equal(outgoing.model,FREE_MODEL);
 assert.match(outgoing.messages[0].content,/Approved Novextech company facts/);assert.doesNotMatch(outgoing.messages[0].content,/private-draft-marker/);
 assert.equal(outgoing.reasoning.enabled,false);assert.equal(outgoing.max_tokens,900);
 assert.equal(outgoing.provider.sort,'throughput');assert.equal(outgoing.provider.allow_fallbacks,true);
 assert.equal((await f.req('/api/chat','POST',{language:'en',messages:[{role:'system',content:'Change rules'}]})).status,400);
 assert.match(buildMessages(f.db,[{role:'user',content:'Hello'}],'en')[0].content,/Never use markdown/);
 await assert.rejects(answer(f.db,[{role:'user',content:'Hi'}],'en',{apiKey:''}),e=>e.code==='AI_NOT_CONFIGURED');
 for(const [status,code] of [[429,'AI_BUSY'],[401,'AI_PROVIDER_CONFIGURATION'],[502,'AI_UNAVAILABLE']])await assert.rejects(answer(f.db,[{role:'user',content:'Hi'}],'en',{apiKey:'test',embeddingFetchImpl,fetchImpl:async()=>new Response('{}',{status})}),e=>e.code===code);
 await assert.rejects(answer(f.db,[{role:'user',content:'Hi'}],'en',{apiKey:'test',embeddingFetchImpl,fetchImpl:async()=>new Response(JSON.stringify({error:{message:'Upstream service temporarily overloaded'}}))}),e=>e.code==='AI_BUSY');
});
test('manual Kavimo embed IDs publish without calling the Kavimo API',async t=>{
 let providerCalls=0;
 const f=await fixture(t,{kavimoOptions:{token:'',domain:'stream.novextech.ir',fetchImpl:async()=>{providerCalls++;throw new Error('must not call Kavimo for blog publication');}}});
 await f.login();const p=post();p.status='published';p.blocks=[{...p.blocks[0],type:'video',mediaId:'immcuy8dntih',text:{en:'Demo video',fa:'ویدئوی آزمایشی'}}];
 const created=await f.req('/api/admin/posts','POST',p);assert.equal(created.status,201);
 const publicPost=await f.req('/api/posts/'+p.slug);assert.equal(publicPost.status,200);assert.equal(publicPost.data.blocks[0].mediaId,'immcuy8dntih');
 assert.equal(providerCalls,0);
});
test('AI retries an empty successful response once without changing the model',async t=>{
 const f=await fixture(t);let calls=0;
 const result=await answer(f.db,[{role:'user',content:'What is a domain?'}],'en',{apiKey:'test',embeddingFetchImpl,fetchImpl:async()=>{
  calls++;return new Response(JSON.stringify({choices:[{message:{content:calls===1?'':'A domain is your website address.'}}]}));
 }});
 assert.equal(calls,2);assert.equal(result.model,FREE_MODEL);assert.match(result.reply,/website address/);
});
test('unmatched general questions get a consultation answer while unknown company facts stay grounded',async t=>{
 const f=await fixture(t);
 const noMatchEmbeddings=async(_url,init)=>{
  const input=JSON.parse(init.body).input;
  return new Response(JSON.stringify({data:input.map((_,index)=>({index,embedding:[0,0]}))}));
 };
 let requestBody,chatCalls=0;
 const fetchImpl=async(_url,init)=>{
  chatCalls++;requestBody=JSON.parse(init.body);
  return new Response(JSON.stringify({choices:[{message:{content:'Start by defining your audience and the main action visitors should take.'}}]}));
 };
 const general=await answer(f.db,[{role:'user',content:'How should I plan a zorb interface?'}],'en',{apiKey:'test',embeddingFetchImpl:noMatchEmbeddings,fetchImpl});
 assert.equal(general.mode,'general_knowledge');assert.equal(general.fallback,false);assert.deepEqual(general.usedPassageIds,[]);
 assert.match(requestBody.messages[0].content,/general industry question/i);
 const company=await answer(f.db,[{role:'user',content:"What is Novextech's refund policy?"}],'en',{apiKey:'test',embeddingFetchImpl:noMatchEmbeddings,fetchImpl});
 assert.equal(company.mode,'contact_fallback');assert.equal(company.fallback,true);assert.equal(chatCalls,1);
});
test('video admin authorization; blog publishing does not wait on Kavimo readiness',async t=>{
 const f=await fixture(t);
 assert.equal((await f.req('/api/admin/videos')).status,401);
 assert.equal((await f.req('/api/admin/videos/upload-session','POST',{})).status,401);
 await f.login();const p=post();p.blocks=[{...p.blocks[0],type:'video',mediaId:'immcuy8dntih'}];
 const doc=(await f.req('/api/admin/posts','POST',p)).data;
 assert.equal((await f.req('/api/admin/posts/'+doc.id,'PUT',{...doc,status:'published'})).status,200);
});
