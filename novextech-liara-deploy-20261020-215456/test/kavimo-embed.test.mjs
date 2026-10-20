import test from 'node:test';
import assert from 'node:assert/strict';
import {extractKavimoMediaId,kavimoIframeUrl} from '../shared/kavimo-embed.mjs';

test('accepts a media ID or extracts the ID from the approved iframe snippet',()=>{
  const id='immcuy8dntih';
  const snippet=`<div><iframe src="https://stream.novextech.ir/${id}/iframe"></iframe><script src="https://stream.novextech.ir/Vis3/fs.js"></script></div>`;
  assert.equal(extractKavimoMediaId(id),id);
  assert.equal(extractKavimoMediaId(snippet),id);
  assert.equal(extractKavimoMediaId(`[https://stream.novextech.ir/${id}/iframe](https://stream.novextech.ir/${id}/iframe)`),id);
  assert.equal(kavimoIframeUrl(id),`https://stream.novextech.ir/${id}/iframe`);
});

test('rejects untrusted hosts, non-iframe URLs, and arbitrary pasted scripts',()=>{
  assert.equal(extractKavimoMediaId('https://evil.example/immcuy8dntih/iframe'),null);
  assert.equal(extractKavimoMediaId('https://stream.novextech.ir/immcuy8dntih/embed'),null);
  assert.equal(extractKavimoMediaId('<script>alert(1)</script>'),null);
  assert.equal(kavimoIframeUrl('bad-id'),null);
});
