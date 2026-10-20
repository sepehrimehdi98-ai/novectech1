import { HttpError } from './validation.mjs';
export function mediaId(value){if(typeof value!=='string'||!/^[a-zA-Z0-9]{12}$/.test(value))throw new HttpError(400,'INVALID_MEDIA_ID');return value;}
export function encodeForm(params){const out=new URLSearchParams();const append=(key,value)=>{if(value===undefined||value===null)return;if(Array.isArray(value))value.forEach((v,i)=>append(`${key}[${i}]`,v));else if(typeof value==='object')Object.entries(value).forEach(([k,v])=>append(`${key}[${k}]`,v));else out.append(key,String(value));};Object.entries(params).forEach(([k,v])=>append(k,v));return out;}
export function createKavimo({token=process.env.KAVIMO_TOKEN,domain=process.env.KAVIMO_STREAM_DOMAIN,lineId=process.env.KAVIMO_LINE_ID,fetchImpl=fetch,wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 const configured=Boolean(token&&domain);
 let host='';if(domain){try{const u=new URL('https://'+domain);if(u.hostname!==domain||u.port||u.username||u.pathname!=='/'||!domain.includes('.'))throw Error();host=u.hostname;}catch{throw new Error('KAVIMO_STREAM_DOMAIN must be a hostname without protocol, path or port');}}
 const call=async(method,path,params={},emptyAllowed=false)=>{
  if(!token)throw new HttpError(503,'VIDEO_NOT_CONFIGURED');
  const form=encodeForm(params),url='https://api.kavimo.ir/v2'+path+(method==='GET'?'?'+form:'');
  let response,data;
  for(let attempt=0;attempt<2;attempt++){
   try{response=await fetchImpl(url,{method,headers:{Authorization:`Bearer ${token}`,...(method==='GET'?{}:{'Content-Type':'application/x-www-form-urlencoded'})},body:method==='GET'?undefined:form.toString(),signal:AbortSignal.timeout(20000)});data=await response.json();}catch{throw new HttpError(502,'VIDEO_PROVIDER_UNAVAILABLE');}
   const errors=JSON.stringify(data.errors??[]);
   if(response.status===429||/Ratelimit/i.test(errors)){if(method==='GET'&&attempt===0){await wait(10000);continue;}throw new HttpError(429,'VIDEO_RATE_LIMITED');}
   if(response.status===401||response.status===403||/Unauthorized|Account policy/i.test(errors))throw new HttpError(503,'VIDEO_CREDENTIALS');
   if(!response.ok)throw new HttpError(502,'VIDEO_PROVIDER_UNAVAILABLE');
   if(data.success!==true){if(emptyAllowed&&Array.isArray(data.result)&&data.result.length===0&&(!data.errors||data.errors.length===0))return {...data,result:[]};throw new HttpError(502,'VIDEO_PROVIDER_REJECTED');}
   return data;
  }
 };
 const normalize=m=>({id:mediaId(m.id),title:typeof m.title==='string'?m.title:'',type:Number(m.type),status:Number(m.status),duration:Number(m.duration)||0,ready:m.assets?.status?.ready===true,mode:Number(m.assets?.status?.mode??0),progress:Math.min(100,Math.max(0,Number(m.assets?.status?.progress)||0))});
 return {configured,domain:host,
  async list({offset=0,search=''}={}){const d=await call('GET','/medias',{with:'assets',type:1,limit:25,offset,search,line_id:lineId,orderby:'created_at',orderby_type:'DESC'},true);return {videos:(Array.isArray(d.result)?d.result:[]).map(normalize),total:Number(d.messages?._meta?.total)||0,offset};},
  async upload(domains){if(!configured)throw new HttpError(503,'VIDEO_NOT_CONFIGURED');const d=await call('POST','/transfers/file/create',{expire:600,domain_policy:domains,line_id:lineId});const result=d.result;let u;try{u=new URL(result.url);}catch{throw new HttpError(502,'VIDEO_PROVIDER_REJECTED');}if(u.protocol!=='https:'||u.hostname!=='transfer.kavimo.ir'||u.username||u.password)throw new HttpError(502,'VIDEO_UPLOAD_HOST');return {url:u.href,expiresIn:600};}
 };
}
