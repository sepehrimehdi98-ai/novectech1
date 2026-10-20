import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SEED_KNOWLEDGE } from './seed-knowledge.mjs';
export function openStore(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS admins (email TEXT PRIMARY KEY, salt TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, email TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, updated TEXT NOT NULL, document TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS rag_documents (
      id TEXT PRIMARY KEY, source_type TEXT NOT NULL, knowledge_scope TEXT NOT NULL,
      title TEXT NOT NULL, language TEXT NOT NULL, topics TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', client_confirmed INTEGER NOT NULL DEFAULT 0,
      body TEXT NOT NULL, references_json TEXT NOT NULL DEFAULT '[]',
      approved_by TEXT, approved_at TEXT, approval_checklist TEXT NOT NULL DEFAULT '{}', last_verified_at TEXT, review_due_at TEXT,
      version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL, knowledge_scope TEXT NOT NULL, language TEXT NOT NULL,
      topics TEXT NOT NULL, chunk_index INTEGER NOT NULL, content TEXT NOT NULL,
      content_norm TEXT NOT NULL, embedding TEXT, embedding_model TEXT, is_active INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS rag_chunks_active ON rag_chunks(is_active, language, knowledge_scope, source_type);`);
  try { db.exec("ALTER TABLE rag_documents ADD COLUMN approval_checklist TEXT NOT NULL DEFAULT '{}'"); } catch {}
  db.exec('PRAGMA foreign_keys=ON;');
  if (!db.prepare('SELECT key FROM settings WHERE key=?').get('knowledge')) {
    db.prepare('INSERT INTO settings VALUES (?,?)').run('knowledge', readFileSync(new URL('./knowledge.txt', import.meta.url), 'utf8'));
  }
  if (!db.prepare("SELECT id FROM rag_documents WHERE id='seed-company-knowledge'").get()) {
    const now=new Date().toISOString();
    const body=readFileSync(new URL('./knowledge.txt', import.meta.url), 'utf8').trim();
    db.prepare(`INSERT INTO rag_documents
      (id,source_type,knowledge_scope,title,language,topics,status,body,approved_by,approved_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run('seed-company-knowledge','company_fact','company_specific','Approved Novextech company facts','en',JSON.stringify(['company','services','process','timeline','contact']),'approved',body,'system-seed',now,now);
  }
  if(!db.prepare('SELECT key FROM settings WHERE key=?').get('rag_seed_library_v1')){
    const today=new Date(),verified=today.toISOString().slice(0,10),review=new Date(today.getTime()+365*86400000).toISOString().slice(0,10);
    const seedInsert=db.prepare(`INSERT OR IGNORE INTO rag_documents
      (id,source_type,knowledge_scope,title,language,topics,status,client_confirmed,body,references_json,approved_by,approved_at,approval_checklist,last_verified_at,review_due_at,version,updated_at)
      VALUES (?,?,?,?,?,?, 'approved',0,?,?, 'owner-seeded',?, ?,?,?,1,?)`);
    const checklist=JSON.stringify({facts_verified:true,original_wording:true,no_unsupported_claims:true,scope_checked:true,language_topics_checked:true});
    for(const doc of SEED_KNOWLEDGE){
      const approvedAt=today.toISOString();
      seedInsert.run(doc.id,doc.source_type,doc.knowledge_scope,doc.title,doc.language,JSON.stringify(doc.topics),doc.body,JSON.stringify(doc.references),approvedAt,checklist,verified,review,approvedAt);
    }
    db.prepare('INSERT INTO settings VALUES (?,?)').run('rag_seed_library_v1','1');
  }
  if (!db.prepare('SELECT key FROM settings WHERE key=?').get('seeded')) {
    const entries = [
      ['why-good-websites-feel-inevitable','Why good websites feel inevitable','چرا وب‌سایت‌های خوب طبیعی به نظر می‌رسند؟','Design','طراحی','A clear purpose, useful content and simple navigation make a website easier to use. Start with the needs of your visitors, then design each page around the action that matters.','هدف روشن، محتوای کاربردی و مسیر ساده، استفاده از وب‌سایت را آسان می‌کند. از نیاز بازدیدکننده شروع کنید و هر صفحه را حول اقدام اصلی طراحی کنید.'],
      ['designing-ai-for-people','Designing AI without losing the human','طراحی هوش مصنوعی با حفظ نگاه انسانی','AI','هوش مصنوعی','A useful AI assistant should explain what it can do, ask relevant questions and be honest about uncertainty. Human support should always remain easy to reach.','دستیار هوشمند کاربردی باید توانایی‌هایش را روشن توضیح دهد، پرسش‌های مرتبط بپرسد و درباره ندانسته‌هایش صادق باشد. دسترسی به پشتیبانی انسانی باید آسان بماند.'],
      ['motion-as-a-product-language','Motion as a product language','حرکت به‌عنوان زبان محصول','Development','توسعه','Use motion to explain changes and guide attention. Respect reduced-motion preferences, keep interactions fast and make essential information available without animation.','از حرکت برای توضیح تغییرها و هدایت توجه استفاده کنید. به تنظیم کاهش حرکت احترام بگذارید، تعامل‌ها را سریع نگه دارید و اطلاعات ضروری را بدون انیمیشن نیز نمایش دهید.']
    ];
    for (const [slug,en,fa,tagEn,tagFa,textEn,textFa] of entries) {
      const doc={id:randomUUID(),slug,status:'published',revision:1,updated:new Date().toISOString(),title:{en,fa},excerpt:{en:textEn,fa:textFa},tag:{en:tagEn,fa:tagFa},cover:'',blocks:[{id:randomUUID(),type:'paragraph',text:{en:textEn,fa:textFa},align:'start',width:'reading',accent:'none'}]};
      db.prepare('INSERT INTO posts VALUES (?,?,?,?,?,?)').run(doc.id,slug,doc.status,1,doc.updated,JSON.stringify(doc));
    }
    db.prepare('INSERT INTO settings VALUES (?,?)').run('seeded','1');
  }
  return db;
}

