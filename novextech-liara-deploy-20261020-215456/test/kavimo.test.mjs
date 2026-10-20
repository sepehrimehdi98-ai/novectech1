import test from 'node:test';
import assert from 'node:assert/strict';
import { createKavimo, encodeForm } from '../server/kavimo.mjs';

const response = data => new Response(JSON.stringify(data), {status:200});
test('nested form encoding preserves domain policies and false booleans',()=>{
  const form=encodeForm({domain_policy:['localhost:5173','novextech.ir'],options:{player_options:{autoplay:false}}});
  assert.equal(form.get('domain_policy[0]'),'localhost:5173');
  assert.equal(form.get('domain_policy[1]'),'novextech.ir');
  assert.equal(form.get('options[player_options][autoplay]'),'false');
});
test('upload token is scoped and master token is never returned to browser',async()=>{
  let outgoing;
  const client=createKavimo({token:'test-secret',domain:'stream.example.com',fetchImpl:async(url,options)=>{
    outgoing={url,options};return response({success:true,result:{url:'https://transfer.kavimo.ir/upload/test-upload-token',token:'test-upload-token'}});
  }});
  const link=await client.upload(['localhost:5173']);
  assert.equal(outgoing.url,'https://api.kavimo.ir/v2/transfers/file/create');
  assert.equal(outgoing.options.headers.Authorization,'Bearer test-secret');
  const form=new URLSearchParams(outgoing.options.body);
  assert.equal(form.get('expire'),'600');
  assert.equal(form.get('domain_policy[0]'),'localhost:5173');
  assert.deepEqual(Object.keys(link),['url','expiresIn']);
  assert.ok(!JSON.stringify(link).includes('test-secret'));
});
test('provider failures are distinguished from an empty library',async()=>{
  const empty=createKavimo({token:'test-secret',fetchImpl:async()=>response({success:false,result:[],errors:[]})});
  assert.deepEqual((await empty.list()).videos,[]);
  const invalid=createKavimo({token:'test-secret',fetchImpl:async()=>response({success:false,result:[],errors:['Unauthorized']})});
  await assert.rejects(invalid.list(),e=>e.code==='VIDEO_CREDENTIALS');
  const missing=createKavimo({token:''});
  await assert.rejects(missing.list(),e=>e.code==='VIDEO_NOT_CONFIGURED');
});
test('rate limited reads retry once after 10 seconds; writes never retry',async()=>{
  let calls=0,waited=0;
  const client=createKavimo({token:'test-secret',domain:'stream.example.com',wait:async ms=>{waited+=ms;},fetchImpl:async()=>{
    calls++;return calls===1?response({success:false,errors:['Ratelimit']}):response({success:true,result:[]});
  }});
  await client.list();assert.equal(calls,2);assert.equal(waited,10000);
  calls=0;await assert.rejects(client.upload(['localhost']),e=>e.code==='VIDEO_RATE_LIMITED');assert.equal(calls,1);
});
