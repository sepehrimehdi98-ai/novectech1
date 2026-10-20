import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import fa from "./fa.json";
import { setPageMetadata } from "./seo";

type Language = "en" | "fa";
const dictionary: Record<string, string> = fa;
const LanguageContext = createContext({ language: "en" as Language, setLanguage: (_: Language) => {}, t: (text: string) => text });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    if (requested === "fa" || requested === "en") return requested;
    try { return localStorage.getItem("novextech-language") === "fa" ? "fa" : "en"; } catch { return "en"; }
  });
  const changeLanguage = (next: Language) => {
    const url = new URL(window.location.href);
    if (next === "fa") url.searchParams.set("lang", "fa");
    else url.searchParams.delete("lang");
    window.history.replaceState({}, "", url);
    setLanguage(next);
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    const path = window.location.pathname;
    try { localStorage.setItem("novextech-language", language); } catch { /* Storage may be unavailable in private browsers. */ }
    if (path.startsWith("/blog/")) return;
    if (path.startsWith("/admin")) {
      const section = path.split("/").filter(Boolean).at(-1) || "login";
      const titles: Record<string, string> = { login: "Admin sign in", blogs: "Manage articles", new: "New article", videos: "Video library", knowledge: "Consultation knowledge" };
      const label = /^[a-f\d-]{20,}$/i.test(section) ? "Edit article" : titles[section] || "Content studio";
      setPageMetadata({ title: `${label} | Novextech`, description: "Private Novextech content studio.", path, noindex: true });
    } else if (path === "/") {
      setPageMetadata({
        title: language === "fa" ? "نووکس‌تک | طراحی وب و هوش مصنوعی" : "Novextech | Web Design & AI",
        description: language === "fa"
          ? "نووکس‌تک وب‌سایت‌های نمونه‌کار، شرکتی و آموزشی و دستیارهای هوش مصنوعی طراحی و پیاده‌سازی می‌کند."
          : "Novextech designs portfolio, business and learning websites, plus AI assistants for businesses.",
        path: language === "fa" ? "/?lang=fa" : "/",
      });
    }
  }, [language]);
  const t = (text: string) => language === "fa" ? dictionary[text] ?? text : text;
  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return <div className="language-switch" role="group" aria-label={language === "fa" ? "زبان سایت" : "Site language"} dir="ltr">
    <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
    <button type="button" lang="fa" aria-pressed={language === "fa"} onClick={() => setLanguage("fa")}>فارسی</button>
  </div>;
}
