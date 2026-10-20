import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { openStore } from '../server/store.mjs';
import { approveDocument, chunkDocument, normalizeText, retrieve, saveDocument, unapproveDocument } from '../server/rag.mjs';

async function database(t){const root=resolve('../../work/rag-tests');await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,'run-'));const db=openStore(join(dir,'rag.sqlite'));t.after(()=>db.close());return db;}
const checks={facts_verified:true,original_wording:true,no_unsupported_claims:true,scope_checked:true,language_topics_checked:true};
const doc=(overrides={})=>({source_type:'technical_explainer',knowledge_scope:'general_industry',title:'Core Web Vitals explained',language:'en',topics:['core-web-vitals','performance'],body_markdown:'## What they measure\nCore Web Vitals are a set of user experience metrics for loading, responsiveness, and visual stability. They help teams find common performance issues.',references:[{title:'Web Vitals',url:'https://web.dev/articles/vitals'}],last_verified_at:'2026-10-18',review_due_at:'2027-04-18',...overrides});
const embeddingFetchImpl=async(_url,opts)=>{const body=JSON.parse(opts.body);return new Response(JSON.stringify({data:body.input.map((text,index)=>({index,embedding:/orchid|quasar|ارکید|کوآزار/i.test(text)?[0,1]:/core web vitals/i.test(text)?[1,0]:[0,0]}))}));};

test('Persian normalization canonicalizes Arabic letters and digits, and chunks preserve sections',()=>{
 assert.equal(normalizeText('ي ك ۱۲۳'),normalizeText('ی ک 123'));
 const chunks=chunkDocument('## First section\nA useful sentence. Another useful sentence.\n## Second section\nA final passage.','technical_explainer');
 assert.equal(chunks.length,2);assert.match(chunks[0],/First section/);assert.match(chunks[1],/Second section/);
});

test('starter library supports general bilingual consultation without company-only filtering',async t=>{
 const db=await database(t),seedIds=db.prepare("SELECT id FROM rag_documents WHERE id LIKE 'seed-%' AND status='approved'").all().map(r=>r.id);
 assert.ok(seedIds.includes('seed-general-discovery-fa'));assert.ok(seedIds.includes('seed-general-seo-en'));
 const allMatch=async(_url,opts)=>{const body=JSON.parse(opts.body);return new Response(JSON.stringify({data:body.input.map((_,index)=>({index,embedding:[1,0]}))}));};
 for(const [query,language] of [['What pages do you recommend for my website?','en'],['برای طراحی سایت از کجا شروع کنم؟','fa']]){
   const result=await retrieve(db,query,{language,apiKey:'test-key',fetchImpl:allMatch});
   assert.equal(result.fallback,false);assert.ok(result.passages.some(p=>p.scope==='general_industry'));
 }
 const company=await retrieve(db,'What services does Novextech offer?',{language:'en',apiKey:'test-key',fetchImpl:allMatch});
 assert.equal(company.fallback,false);assert.ok(company.passages.every(p=>p.scope==='company_specific'));
});

test('drafts are not indexed, approval creates embeddings, and unapproval removes them immediately',async t=>{
 const db=await database(t),draft=saveDocument(db,doc({title:'Orchid quasar technical explainer',body_markdown:'## Orchid quasar\nOrchid quasar describes a sample technical concept used only to verify document retrieval behavior.'}));
 assert.equal(draft.status,'draft');assert.equal(db.prepare('SELECT count(*) n FROM rag_chunks WHERE document_id=?').get(draft.id).n,0);
 const before=await retrieve(db,'What is orchid quasar?',{language:'en',apiKey:'test-key',fetchImpl:embeddingFetchImpl});assert.equal(before.fallback,true);
 const approved=await approveDocument(db,draft.id,{adminEmail:'reviewer@example.com',apiKey:'test-key',fetchImpl:embeddingFetchImpl,checklist:checks});
 assert.equal(approved.status,'approved');assert.equal(approved.approved_by,'reviewer@example.com');assert.deepEqual(approved.approval_checklist,checks);
 const result=await retrieve(db,'ارکید کوآزار چیست؟',{language:'fa',apiKey:'test-key',fetchImpl:embeddingFetchImpl});assert.equal(result.fallback,false);assert.equal(result.passages[0].title,'Orchid quasar technical explainer');assert.equal(result.passages[0].language,'en');
 unapproveDocument(db,draft.id);assert.equal(db.prepare('SELECT count(*) n FROM rag_chunks WHERE document_id=? AND is_active=1').get(draft.id).n,0);
 const after=await retrieve(db,'What is orchid quasar?',{language:'en',apiKey:'test-key',fetchImpl:embeddingFetchImpl});assert.equal(after.fallback,true);
});

test('approval requires the checklist and client confirmation for case studies',async t=>{
 const db=await database(t),technical=saveDocument(db,doc());
 await assert.rejects(approveDocument(db,technical.id,{apiKey:'test-key',fetchImpl:embeddingFetchImpl,checklist:{}}),/RAG_APPROVAL_CHECKLIST_REQUIRED/);
 const study=saveDocument(db,doc({source_type:'case_study',knowledge_scope:'company_specific',client_confirmed:false,title:'Client project',last_verified_at:'',review_due_at:'',references:[]}));
 await assert.rejects(approveDocument(db,study.id,{apiKey:'test-key',fetchImpl:embeddingFetchImpl,checklist:checks}),/RAG_CASE_STUDY_NOT_CONFIRMED/);
});

test('stale approved technical passages are excluded from retrieval',async t=>{
 const db=await database(t),stale=saveDocument(db,doc({title:'Orchid quasar technical explainer',body_markdown:'## Orchid quasar\nOrchid quasar describes a sample technical concept used only to verify document retrieval behavior.',review_due_at:'2020-01-01'}));
 await approveDocument(db,stale.id,{apiKey:'test-key',fetchImpl:embeddingFetchImpl,checklist:checks});
 const result=await retrieve(db,'What is orchid quasar?',{language:'en',apiKey:'test-key',fetchImpl:embeddingFetchImpl});assert.equal(result.fallback,true);
});
