export const KAVIMO_STREAM_HOST='stream.novextech.ir';

export function extractKavimoMediaId(input) {
  const value=String(input??'').trim();
  if(/^[a-zA-Z0-9]{12}$/.test(value))return value;
  const candidates=value.match(/https:\/\/[^\s"'<>]+/g)||[];
  for(const candidate of candidates){
    const clean=candidate.split(/[)\]]/)[0].replace(/[.,]+$/g,'');
    try{
      const url=new URL(clean);
      const match=url.hostname===KAVIMO_STREAM_HOST&&url.protocol==='https:'&&url.port===''&&url.username===''&&url.password===''?url.pathname.match(/^\/([a-zA-Z0-9]{12})\/iframe\/?$/):null;
      if(match)return match[1];
    }catch{}
  }
  return null;
}

export function kavimoIframeUrl(id) {
  if(typeof id!=='string'||!/^[a-zA-Z0-9]{12}$/.test(id))return null;
  return `https://${KAVIMO_STREAM_HOST}/${id}/iframe`;
}
