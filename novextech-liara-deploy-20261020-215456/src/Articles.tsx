import { KavimoPlayer } from './Videos';
import { useEffect, useState } from 'react';
import { useLanguage, LanguageSwitch } from './i18n';
import { api, errorText, type Post } from './content';
import { setPageMetadata } from './seo';
export function ArticleBody({post,language}:{post:Post;language:'en'|'fa'}) {
 return <div className="article-body" dir={language==='fa'?'rtl':'ltr'} lang={language}>{post.blocks.map(b=><section key={b.id} className={`content-block block-${b.type} width-${b.width} accent-${b.accent}`} style={{textAlign:b.align}}>
  {b.type==='heading'?<h2>{b.text[language]}</h2>:b.type==='paragraph'?<p>{b.text[language]}</p>:b.type==='quote'?<blockquote>{b.text[language]}</blockquote>:b.type==='image'?<figure>{b.url&&<img loading="lazy" src={b.url} alt={b.text[language]}/>}<figcaption>{b.text[language]}</figcaption></figure>:b.type==='video'?<figure><KavimoPlayer id={b.mediaId||''} title={b.text[language]}/><figcaption>{b.text[language]}</figcaption></figure>:<a className="primary-button" href={b.url||undefined} target="_blank" rel="noopener noreferrer">{b.text[language]} ↗</a>}
 </section>)}</div>;
}
export function ArticleFeed(){
 const {language}=useLanguage();const [posts,setPosts]=useState<Post[]>([]);const [error,setError]=useState<unknown>();const [loading,setLoading]=useState(true);
 const load=()=>{setLoading(true);setError(undefined);api<{posts:Post[]}>('/api/posts').then(d=>setPosts(d.posts)).catch(setError).finally(()=>setLoading(false));};
 useEffect(load,[]);
 return <section className="insights section-pad" id="insights"><div className="section-heading"><div><p className="eyebrow">{language==='fa'?'مجله نووکس‌تک':'NOVEXTECH JOURNAL'}</p><h2>{language==='fa'?'ایده‌ها و تجربه‌ها':'Ideas & insights'}</h2></div><p>{language==='fa'?'درباره طراحی وب، فناوری و ساختن تجربه‌های بهتر.':'Thoughts on design, technology and building better experiences.'}</p></div>
 {loading&&<p role="status">{language==='fa'?'در حال دریافت مطالب…':'Loading stories…'}</p>}{error!=null&&<div role="alert">{errorText(error,language)} <button onClick={load}>{language==='fa'?'تلاش دوباره':'Retry'}</button></div>}
 {!loading&&!error&&!posts.length&&<p>{language==='fa'?'به‌زودی مطالب تازه منتشر می‌شود.':'New stories are coming soon.'}</p>}
 <div className="journal-grid">{posts.map(p=><a className="journal-card" href={`/blog/${p.slug}`} key={p.id}>{p.cover?<img src={p.cover} alt={p.title[language]} loading="lazy"/>:<div className="journal-placeholder" aria-hidden="true">N<span>↗</span></div>}<small>{p.tag[language]}</small><h3>{p.title[language]}</h3><p>{p.excerpt[language]}</p><span>{language==='fa'?'مطالعه مطلب ←':'Read story →'}</span></a>)}</div></section>;
}
export function BlogPage(){
 const {language}=useLanguage();const [post,setPost]=useState<Post>();const [error,setError]=useState<unknown>();
 useEffect(()=>{api<Post>('/api/posts/'+encodeURIComponent(decodeURIComponent(location.pathname.slice(6)))).then(setPost).catch(setError);},[]);
 useEffect(()=>{if(post){const title=post.title[language],description=post.excerpt[language],localized=language==='fa',url=`https://novextech.ir/blog/${post.slug}${localized?'?lang=fa':''}`;setPageMetadata({title:`${title} | Novextech`,description,path:`/blog/${post.slug}${localized?'?lang=fa':''}`,type:'article',structuredData:{'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:title,description,inLanguage:localized?'fa-IR':'en',dateModified:post.updated,mainEntityOfPage:url,author:{'@type':'Organization',name:'Novextech',url:'https://novextech.ir'},publisher:{'@type':'Organization',name:'Novextech',url:'https://novextech.ir'}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:language==='fa'?'خانه':'Home',item:localized?'https://novextech.ir/?lang=fa':'https://novextech.ir/'},{'@type':'ListItem',position:2,name:language==='fa'?'مجله':'Journal',item:localized?'https://novextech.ir/?lang=fa#insights':'https://novextech.ir/#insights'},{'@type':'ListItem',position:3,name:title,item:url}]}]}});}},[post,language]);
 return <div className="reader-page"><header className="studio-header"><a className="brand" href="/" dir="ltr">NOVEXTECH</a><nav aria-label={language==='fa'?'مسیر صفحه':'Breadcrumb'} className="breadcrumbs"><a href="/">{language==='fa'?'خانه':'Home'}</a><span aria-hidden="true"> / </span><a href="/#insights">{language==='fa'?'مجله':'Journal'}</a><span aria-hidden="true"> / </span><span aria-current="page">{post?.title[language]||''}</span></nav><LanguageSwitch/></header>{error!=null?<p role="alert">{errorText(error,language)}</p>:!post?<p role="status">{language==='fa'?'در حال دریافت…':'Loading…'}</p>:<article><div className="reader-heading"><p className="eyebrow">{post.tag[language]}</p><h1>{post.title[language]}</h1><p>{post.excerpt[language]}</p>{post.cover&&<img src={post.cover} alt={post.title[language]}/>}</div><ArticleBody post={post} language={language}/></article>}</div>;
}
