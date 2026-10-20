import { lazy, Suspense, useEffect, useState } from "react";
import { useLanguage, LanguageSwitch } from "./i18n";
import { setPageMetadata } from "./seo";
const Admin = lazy(() => import("./Admin"));
const ConsultationChat = lazy(() => import("./ConsultationChat"));
const ArticleFeed = lazy(() => import("./Articles").then(m => ({ default: m.ArticleFeed })));
const BlogPage = lazy(() => import("./Articles").then(m => ({ default: m.BlogPage })));

type IconName =
  | "arrow"
  | "close"
  | "menu"
  | "play"
  | "send"
  | "spark"
  | "user"
  | "plus"
  | "drag";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    play: <path d="m9 7 8 5-8 5V7Z" />,
    send: <><path d="m4 4 17 8-17 8 3-8-3-8Z" /><path d="M7 12h14" /></>,
    spark: <><path d="m12 3 1.2 4.3L17 9l-3.8 1.7L12 15l-1.2-4.3L7 9l3.8-1.7L12 3Z" /><path d="m5 15 .7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15Z" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    drag: <><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="3" /></>,
  };
  return (
    <svg className={name === "arrow" || name === "send" ? "directional-icon" : undefined} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const photos = {
  screens: "https://images.unsplash.com/photo-1784316395212-29225817817f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
  laptop: "https://images.unsplash.com/photo-1752391873033-839ff56ff6c6?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
  code: "https://images.unsplash.com/photo-1753715613373-90b1ea010731?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
  studio: "https://images.unsplash.com/photo-1758874383918-d85ea841b4e3?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
  desk: "https://images.unsplash.com/photo-1643178798819-6ec45bce6d1c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
};

const projects = [
  {
    id: "01",
    title: "NOVA",
    category: "EdTech platform",
    color: "lime",
    image: photos.screens,
    description: "A guided learning ecosystem that turns Python from an intimidating subject into a clear, rewarding daily practice.",
    stat: "Launched October 2026",
  },
  {
    id: "02",
    title: "PAYFLOW",
    category: "Fintech experience",
    color: "coral",
    image: photos.laptop,
    description: "A high-trust payment product designed for small teams who need enterprise-grade control without enterprise complexity.",
    stat: "Design concept",
  },
  {
    id: "03",
    title: "KINETIC",
    category: "AI operations",
    color: "violet",
    image: photos.code,
    description: "An intelligent operations command center that makes complex system health feel immediate, visual, and actionable.",
    stat: "Design concept",
  },
  {
    id: "04",
    title: "STUDIO/24",
    category: "Creative commerce",
    color: "blue",
    image: photos.studio,
    description: "A modular storefront for independent makers, balancing expressive editorial layouts with frictionless shopping.",
    stat: "Design concept",
  },
];

const faqs = [
  ["What kinds of projects does Novextech take on?", "We partner with ambitious startups and established teams on brand systems, websites, digital products, and AI-enabled experiences. The best fit is a meaningful challenge with room to make a measurable difference."],
  ["How long does a typical project take?", "Portfolio websites usually take 1–2 weeks, corporate websites 3–6 weeks, and AI chatbots or agents 2–4 weeks. These are rough estimates; the team confirms the final timeline. Educational platforms need a scope discussion."],
  ["Do you work with in-house design and engineering teams?", "Absolutely. We can lead an entire engagement or embed as a specialist design and front-end team. Our files, systems, and documentation are built for a clean handoff."],
  ["Can you help after launch?", "Yes. We offer monthly evolution partnerships covering experiments, analytics, new pages, product improvements, and technical support."],
];

function Nav() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <nav className="nav-shell">
      <LanguageSwitch />
      <a dir="ltr" className="brand" href="#top" aria-label={t("Novextech home")}>
        <span className="brand-mark" dir="ltr">N</span>
        NOVEXTECH
      </a>
      <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={t("Toggle menu")} aria-expanded={open}><Icon name={open ? "close" : "menu"} /></button>
      <div className={`nav-links ${open ? "is-open" : ""}`}>
        <a href="#work" onClick={() => setOpen(false)}>{t("Work")}</a>
        <a href="#about" onClick={() => setOpen(false)}>{t("Studio")}</a>
        <a href="#insights" onClick={() => setOpen(false)}>{t("Insights")}</a>
        <a className="text-button" href="/admin/login"><Icon name="user" size={16} /> {t("Admin")}</a>
      </div>
      <a className="nav-cta" href="#contact">{t("Start a project")} <Icon name="arrow" /></a>
    </nav>
  );
}

function ProjectFolder({ project, onOpen }: { project: typeof projects[number]; onOpen: () => void }) {
  const { t } = useLanguage();
  return (
    <button className={`folder folder-${project.color}`} onClick={onOpen}>
      <span className="folder-tab">{project.id} {t("/ CASE")}</span>
      <span className="folder-images" aria-hidden="true">
        <img src={project.image} alt="" />
        <img src={project.image} alt="" />
        <img src={project.image} alt="" />
      </span>
      <span className="folder-glass">
        <span className="folder-meta">{t(project.category)}<span>2025</span></span>
        <strong>{project.title}</strong>
        <span className="folder-open">{t("Open case study")} <Icon name="arrow" /></span>
      </span>
    </button>
  );
}

function ProjectModal({ project, onClose }: { project: typeof projects[number]; onClose: () => void }) {
  const { t } = useLanguage();
  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="project-modal">
        <button className="modal-close" onClick={onClose} aria-label={t("Close project")}><Icon name="close" /></button>
        <div className="modal-visual"><img src={project.image} alt={`${project.title} — ${t("Project interface")}`} /><span>{project.id}</span></div>
        <div className="modal-language"><LanguageSwitch /></div>
        <div className="modal-copy">
          <div><p className="eyebrow">{t(project.category)}</p><h2>{project.title}</h2></div>
          <div><p>{t(project.description)}</p><strong>{t(project.stat)}</strong></div>
        </div>
      </article>
    </div>
  );
}

function NovaDemo() {
  const { t } = useLanguage();
  const [lesson, setLesson] = useState("Functions");
  const [chat, setChat] = useState(["Hi Sam — ready to make functions click?", "Try defining greet(name), then return your message."]);
  const lessons = ["Variables", "Functions", "Loops"];
  return (
    <section className="nova-section section-pad" id="about">
      <div className="section-heading">
        <div><p className="eyebrow">{t("Featured product / Nova")}</p><h2>{t("Learning that")}<br /><em>{t("talks back.")}</em></h2></div>
        <p>{t("We built a Python learning environment where thoughtful AI guidance meets playful, focused education.")}</p>
      </div>
      <div className="device-stage">
        <div className="laptop-device">
          <div className="laptop-top">
            <div className="browser-bar" dir="ltr"><i /><i /><i /><span>learnnova.io/classroom</span></div>
            <div className="nova-app">
              <aside><b>NOVA<span>.</span></b><small>{t("FOUNDATIONS")}</small>{lessons.map((item, i) => <button key={item} className={lesson === item ? "active" : ""} onClick={() => setLesson(item)}><span>0{i + 1}</span>{t(item)}</button>)}</aside>
              <main>
                <p>{t("PYTHON / 02")}</p>
                <h3>{t(lesson)} {t("without")}<br />{t("the friction.")}</h3>
                <div className="code-card" dir="ltr" lang="en"><span>def</span> greet(name):<br />&nbsp;&nbsp;return <i>f"Hello, {"{name}"}!"</i></div>
                <div className="progress-row"><span>{t("Lesson progress")}</span><b>68%</b></div>
                <div className="progress"><i /></div>
              </main>
            </div>
          </div>
          <div className="laptop-base" />
        </div>
        <div className="phone-device">
          <div className="phone-notch" />
          <div className="phone-head"><span className="nova-orb"><Icon name="spark" size={15} /></span><div><b>{t("Nova Guide")}</b><small>{t("Online · always curious")}</small></div></div>
          <div className="phone-chat">
            {chat.map((message, index) => <p key={`${message}-${index}`} className={index % 2 ? "ai" : ""}>{t(message)}</p>)}
          </div>
          <button className="quick-reply" onClick={() => setChat([...chat, "Show me an example", "Absolutely. Let's build one together, line by line."])}>{t("Show me an example")} <Icon name="arrow" size={15} /></button>
        </div>
        <div className="floating-code code-a">print("progress")</div>
        <div className="floating-code code-b">+ 240 XP</div>
      </div>
    </section>
  );
}

function FAQ() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(0);
  return (
    <section className="faq section-pad">
      <div><p className="eyebrow">{t("Good questions")}</p><h2>{t("Let’s clear")}<br />{t("things up.")}</h2><p className="faq-intro">{t("Still curious? Our team is one message away.")}</p></div>
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <button key={question} className={open === index ? "active" : ""} onClick={() => setOpen(open === index ? -1 : index)}>
            <span><em>0{index + 1}</em>{t(question)}<i><Icon name={open === index ? "close" : "plus"} /></i></span>
            <p>{t(answer)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<typeof projects[number] | null>(null);
  if (location.pathname.startsWith("/admin")) return <Suspense fallback={<p role="status">Loading…</p>}><Admin /></Suspense>;
  if (location.pathname.startsWith("/blog/")) return <Suspense fallback={<p role="status">Loading…</p>}><BlogPage /></Suspense>;
  if (location.pathname !== "/") return <NotFound />;
  return (
    <div className="site" id="top">
      <Nav />
      <main>
        <section className="hero section-pad">
          <div className="hero-orbit"><span>{t("DESIGN")}</span><i /><span>{t("TECHNOLOGY")}</span><i /><span>{t("GROWTH")}</span></div>
          <p className="hero-label">{t("Web design & AI agency")}</p>
          <h1>{t("Web design")}<br />{t("& AI for")}<br /><em>{t("your business.")}</em></h1>
          <div className="hero-bottom">
            <p>{t("We design and build portfolio, business and learning websites, plus AI assistants that help visitors find what they need.")}</p>
            <a href="#contact">{t("Discuss your project")} <span><Icon name="arrow" /></span></a>
          </div>
          <div className="hero-shape shape-one" /><div className="hero-shape shape-two" /><div className="hero-grid" />
        </section>

        <div className="ticker" dir="ltr"><div>{["AERON", "MONO", "ARCFORM", "STELLAR", "NORTH/CO", "CIRCUIT", "AERON", "MONO", "ARCFORM", "STELLAR"].map((name, index) => <span key={`${name}-${index}`}>{name}<i /></span>)}</div></div>

        <section className="work section-pad" id="work">
          <div className="section-heading work-heading"><div><p className="eyebrow">{t("Projects & design explorations")}</p><h2>{t("Projects worth")}<br /><em>{t("opening.")}</em></h2></div><p>{t("Hover to peek inside. Click any folder to unpack the full story.")}</p></div>
          <div className="folder-grid">{projects.map((project) => <ProjectFolder key={project.id} project={project} onOpen={() => setSelected(project)} />)}</div>
        </section>

        <NovaDemo />

        <section className="resume section-pad">
          <div className="resume-title"><p className="eyebrow">{t("Capabilities / Resume")}</p><h2>{t("Small team.")}<br />{t("Serious range.")}</h2><p>{t("Strategy through ship — one senior team, fewer handoffs, better work.")}</p></div>
          <div className="timeline">
            {[
              ["01", "Discover", "Research, positioning, product strategy", "We find the sharpest version of the problem before drawing the answer."],
              ["02", "Design", "Identity, UX/UI, motion systems", "We build flexible visual languages where every interaction earns its place."],
              ["03", "Develop", "React, creative front-end, AI", "We turn design intent into fast, accessible, resilient digital products."],
              ["04", "Evolve", "Experiments, content, optimization", "We stay close after launch and use real behavior to guide what comes next."],
            ].map(([number, title, tags, copy]) => <article key={number}><span>{number}</span><h3>{t(title)}</h3><small>{t(tags)}</small><p>{t(copy)}</p><Icon name="arrow" /></article>)}
          </div>
        </section>

        <Suspense fallback={<section id="insights" className="insights section-pad" aria-busy="true"><p role="status">{t("Loading stories…")}</p></section>}><ArticleFeed /></Suspense>
        <FAQ />

        <section className="contact section-pad" id="contact">
          <p className="eyebrow">{t("Have a good problem?")}</p><h2>{t("Let’s make")}<br /><em>{t("something matter.")}</em></h2>
          <a dir="ltr" href="mailto:novextech.agency@gmail.com">novextech.agency@gmail.com <Icon name="arrow" /></a>
          <div className="contact-foot"><span>{t("WEB DESIGN · AI SYSTEMS")}</span><span>{t("© 2026 NOVEXTECH STUDIO")}</span><span>{t("TELEGRAM / EMAIL")}</span></div>
        </section>
      </main>
      <Suspense fallback={null}><ConsultationChat /></Suspense>
      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}

    </div>
  );
}

function NotFound() {
  const { language } = useLanguage();
  useEffect(() => setPageMetadata({
    title: language === "fa" ? "صفحه پیدا نشد | نووکس‌تک" : "Page not found | Novextech",
    description: language === "fa" ? "صفحه درخواستی پیدا نشد. به صفحه اصلی نووکس‌تک برگردید." : "The requested page could not be found. Return to the Novextech home page.",
    path: location.pathname,
    noindex: true,
  }), [language]);
  return <main className="reader-page"><div className="reader-heading"><p className="eyebrow">404 · NOVEXTECH</p><h1>{language === "fa" ? "صفحه پیدا نشد" : "Page not found"}</h1><p>{language === "fa" ? "نشانی را بررسی کنید یا به صفحه اصلی برگردید." : "Check the address or return to the home page."}</p><a className="primary-button" href="/">{language === "fa" ? "بازگشت به صفحه اصلی" : "Back to home"}</a></div></main>;
}


