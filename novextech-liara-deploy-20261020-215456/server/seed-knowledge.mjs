// Starter knowledge grounded in the Novextech facts the owner supplied and
// public primary references for general web guidance. Keep company and general
// advice in separate scopes; all seeded content is visible/editable in admin.
const googleSeo={url:'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',title:'Google SEO Starter Guide',publisher:'Google Search Central'};
const googleLinks={url:'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',title:'SEO Link Best Practices',publisher:'Google Search Central'};
const webVitals={url:'https://web.dev/articles/vitals',title:'Web Vitals',publisher:'web.dev'};
const wcag={url:'https://www.w3.org/WAI/WCAG22/Understanding/',title:'Understanding WCAG 2.2',publisher:'W3C WAI'};
const owaspRest={url:'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',title:'REST Security Cheat Sheet',publisher:'OWASP'};
const owaspSecrets={url:'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',title:'Secrets Management Cheat Sheet',publisher:'OWASP'};

export const SEED_KNOWLEDGE=[
  {
    id:'seed-company-services-fa',source_type:'faq',knowledge_scope:'company_specific',title:'خدمات نووکس‌تک',language:'fa',topics:['company','services','ai-assistants','web-design','ecommerce','hosting','maintenance'],
    body:`نووکس‌تک یک شرکت طراحی وب و هوش مصنوعی است. خدمات آن شامل طراحی وب‌سایت نمونه‌کار و شرکتی، پلتفرم آموزشی، بازطراحی وب‌سایت، صفحه فرود، فروشگاه اینترنتی، چت‌بات و عامل هوش مصنوعی، میزبانی و نگهداری مداوم است. انتخاب راهکار مناسب به هدف کسب‌وکار، کاربران و امکانات موردنیاز بستگی دارد.

پروژه نُوا یک پلتفرم آموزشی زنده است که برای مدرسه‌ها، معلم‌های مستقل، آموزشگاه‌ها و شرکت‌های آموزش کارکنان ساخته شده است. نُوا کلاس آنلاین، بخش مرور درس، دستیار هوش مصنوعی برای پرسش‌های دانش‌آموزان و تحلیل پیشرفت و مشارکت را ارائه می‌دهد. امکان ساخت پلتفرمی مشابه با نیازهای هر مشتری وجود دارد. فقط وقتی گفتگو درباره آموزش، کلاس یا دوره است، نُوا را مثال بزن.` ,
    references:[],
  },
  {
    id:'seed-company-process-fa',source_type:'faq',knowledge_scope:'company_specific',title:'مراحل همکاری و زمان تقریبی پروژه در نووکس‌تک',language:'fa',topics:['company','process','timeline','pricing-process','contact'],
    body:`همکاری با یک گفتگو در چت سایت، تلگرام یا ایمیل آغاز می‌شود. سپس یک مشاوره کوتاه و جلسه کشف نیاز برگزار می‌شود تا هدف‌ها و محدوده روشن شوند. تیم پیشنهاد مکتوب شامل محدوده، قیمت، زمان‌بندی و برنامه پرداخت را می‌فرستد. پس از تأیید و پرداخت پیش‌پرداخت، مشتری لوگو، متن‌ها، تصاویر و اطلاعات کسب‌وکار را ارائه می‌کند. نووکس‌تک طرح صفحه را برای بازخورد می‌فرستد، سپس توسعه و آزمایش روی دستگاه‌های مختلف انجام می‌شود. بعد از تأیید و تسویه نهایی، سایت راه‌اندازی و دسترسی‌ها و راهنمای کوتاه تحویل داده می‌شوند. پشتیبانی و نگهداری بیشتر قابل ارائه است.

برآوردهای تقریبی و غیرقطعی: وب‌سایت نمونه‌کار حدود یک تا دو هفته، وب‌سایت شرکتی حدود سه تا شش هفته، و چت‌بات یا عامل هوش مصنوعی حدود دو تا چهار هفته. پلتفرم آموزشی به امکانات و اندازه پروژه بستگی دارد. تیم پس از بررسی محدوده، زمان نهایی را تأیید می‌کند. قیمت ثابت یا بازه قیمتی از پیش اعلام نشده است و به امکانات و محدوده بستگی دارد؛ برای قیمت دقیق باید با تیم صحبت کرد.

تلگرام: @Novextech. ایمیل: novextech.agency@gmail.com.`,references:[],
  },
  {
    id:'seed-general-discovery-en',source_type:'faq',knowledge_scope:'general_industry',title:'Starting a website project: goals and requirements',language:'en',topics:['web-design','ux','process'],
    body:`Start by defining the outcome, not the visual style. Write down what the organization does, who the main visitors are, what problem the site should solve, and the one action a visitor should take next. Collect examples of sites you like and explain what you like about them. List must-have features separately from ideas that can wait. Gather existing brand assets, copy, images, legal details, and domain or hosting access. If this is a redesign, identify what currently works and what is causing trouble. A useful first brief can be one page; detailed technical choices can follow after the goals are clear.`,references:[],
  },
  {
    id:'seed-general-discovery-fa',source_type:'faq',knowledge_scope:'general_industry',title:'شروع پروژه وب‌سایت: هدف و نیازها',language:'fa',topics:['web-design','ux','process'],
    body:`برای شروع، اول نتیجه مورد انتظار را مشخص کنید، نه رنگ و ظاهر سایت را. بنویسید کسب‌وکار چه کاری انجام می‌دهد، کاربران اصلی چه کسانی هستند، سایت قرار است چه مشکلی را حل کند و بازدیدکننده بعد از دیدن آن چه اقدام مهمی انجام دهد. چند نمونه سایت موردعلاقه را همراه با توضیح دلیل انتخابشان جمع کنید. امکانات ضروری را از ایده‌هایی که می‌توانند بعداً اضافه شوند جدا کنید. لوگو و فایل‌های هویت بصری، متن‌ها، تصاویر، اطلاعات حقوقی و دسترسی دامنه یا میزبانی را آماده کنید. اگر سایت فعلی را بازطراحی می‌کنید، مشخص کنید چه چیزهایی خوب کار می‌کنند و کجا مشکل دارید. یک شرح نیاز یک‌صفحه‌ای برای شروع کافی است؛ انتخاب فناوری می‌تواند بعد از روشن‌شدن هدف‌ها انجام شود.`,references:[],
  },
  {
    id:'seed-general-structure-en',source_type:'faq',knowledge_scope:'general_industry',title:'Choosing pages, content, and navigation',language:'en',topics:['web-design','ux','seo'],
    body:`There is no mandatory page list for every website. Choose pages from visitor needs and the services or information the organization actually has. A small service business may need a home page, service pages, an about page, contact details, and useful articles; an online store needs product discovery and checkout; a course platform needs course, lesson, and learner flows. Sketch a simple page map before designing. Use short, familiar navigation labels, keep important actions easy to find, and link related pages with descriptive text. Write real page copy before polishing the visual design; avoid placeholder claims, invented testimonials, and empty sections.`,references:[googleLinks],
  },
  {
    id:'seed-general-structure-fa',source_type:'faq',knowledge_scope:'general_industry',title:'انتخاب صفحه‌ها، محتوا و مسیرهای سایت',language:'fa',topics:['web-design','ux','seo'],
    body:`برای همه وب‌سایت‌ها فهرست اجباری و یکسانی از صفحه‌ها وجود ندارد. صفحه‌ها را با توجه به نیاز بازدیدکننده و خدمات یا اطلاعات واقعی کسب‌وکار انتخاب کنید. یک کسب‌وکار خدماتی کوچک ممکن است به صفحه اصلی، صفحه خدمات، درباره ما، اطلاعات تماس و مقاله‌های مفید نیاز داشته باشد؛ فروشگاه به مسیر پیدا کردن محصول و پرداخت نیاز دارد؛ پلتفرم آموزشی هم صفحه دوره، درس و مسیر یادگیری می‌خواهد. پیش از طراحی، نقشه ساده صفحه‌ها را بکشید. نام‌های کوتاه و آشنا برای منو انتخاب کنید، اقدام‌های اصلی را پیدا کردنشان آسان کنید و صفحه‌های مرتبط را با متن پیوند روشن به هم وصل کنید. متن واقعی را پیش از پرداخت نهایی به ظاهر آماده کنید و از ادعاهای ساختگی، نظر مشتری جعلی و بخش‌های خالی دوری کنید.`,references:[googleLinks],
  },
  {
    id:'seed-general-accessibility-en',source_type:'faq',knowledge_scope:'general_industry',title:'Responsive design and accessibility basics',language:'en',topics:['web-design','ux','accessibility','rtl-persian'],
    body:`Plan the experience for narrow mobile screens as well as desktop. Check that content reflows without horizontal scrolling, text remains readable when enlarged, and buttons and forms work with a keyboard. Do not use color alone to communicate status; provide clear labels, visible focus, useful error messages, and meaningful alternative text for informative images. Decorative images can use empty alt text. Check color contrast and test the main task with a real phone and keyboard. These are practical starting points, not a claim of complete accessibility conformance; formal conformance requires testing against the applicable WCAG success criteria.`,references:[wcag],
  },
  {
    id:'seed-general-accessibility-fa',source_type:'faq',knowledge_scope:'general_industry',title:'مبانی طراحی واکنش‌گرا و دسترس‌پذیری',language:'fa',topics:['web-design','ux','accessibility','rtl-persian'],
    body:`تجربه سایت را برای نمایشگر کوچک موبایل و رایانه طراحی و آزمایش کنید. بررسی کنید محتوا بدون اسکرول افقی در عرض کم جا شود، متن با بزرگ‌نمایی همچنان خوانا باشد و دکمه‌ها و فرم‌ها با صفحه‌کلید کار کنند. وضعیت را فقط با رنگ نشان ندهید؛ برچسب روشن، نشانگر فوکوس، پیام خطای مفید و متن جایگزین معنادار برای تصویرهای اطلاع‌رسان فراهم کنید. برای تصویر تزئینی می‌توان متن جایگزین خالی گذاشت. کنتراست رنگ را بررسی کنید و کار اصلی سایت را با گوشی واقعی و صفحه‌کلید بیازمایید. این‌ها نقطه شروع عملی هستند و به‌تنهایی ادعای انطباق کامل با دسترس‌پذیری نیستند؛ انطباق رسمی نیازمند آزمون معیارهای مربوط WCAG است.`,references:[wcag],
  },
  {
    id:'seed-general-seo-en',source_type:'faq',knowledge_scope:'general_industry',title:'Practical SEO and website performance checks',language:'en',topics:['seo','performance','core-web-vitals','ai-search'],
    body:`Make every important page useful, reachable through ordinary links, and clear about its subject. Give each page an accurate, distinct title and concise description; use descriptive link text and image alt text that reflects the image's purpose. Keep a sitemap current and avoid indexing private or duplicate pages. SEO does not guarantee rankings. Measure loading and interaction on real devices rather than guessing: Core Web Vitals include Largest Contentful Paint, Interaction to Next Paint, and Cumulative Layout Shift. Compress and size images, limit unnecessary JavaScript, and retest after changes. Prioritize the actual bottleneck shown by measurement.`,references:[googleSeo,googleLinks,webVitals],
  },
  {
    id:'seed-general-seo-fa',source_type:'faq',knowledge_scope:'general_industry',title:'بررسی‌های کاربردی سئو و سرعت وب‌سایت',language:'fa',topics:['seo','performance','core-web-vitals','ai-search'],
    body:`هر صفحه مهم باید محتوای مفید داشته باشد، از راه پیوندهای معمول قابل دسترسی باشد و موضوعش روشن باشد. برای هر صفحه عنوان دقیق و منحصربه‌فرد و توضیح کوتاه بنویسید؛ متن پیوندها و متن جایگزین تصویر باید هدف را توضیح دهند. نقشه سایت را به‌روز نگه دارید و صفحه‌های خصوصی یا تکراری را برای نمایه‌سازی عمومی باز نگذارید. سئو رتبه را تضمین نمی‌کند. سرعت بارگذاری و تعامل را روی دستگاه واقعی اندازه بگیرید؛ معیارهای اصلی Core Web Vitals شامل LCP، INP و CLS هستند. اندازه تصویرها را متناسب و فشرده کنید، جاوااسکریپت غیرضروری را کم کنید و پس از تغییر دوباره بسنجید. اول گلوگاهی را برطرف کنید که اندازه‌گیری نشان می‌دهد.`,references:[googleSeo,googleLinks,webVitals],
  },
  {
    id:'seed-general-technical-en',source_type:'faq',knowledge_scope:'general_industry',title:'Choosing a website platform and planning safeguards',language:'en',topics:['stack-frameworks','cms','security','hosting'],
    body:`Choose the simplest platform that meets the real requirements. A mostly informational site may work well with a content-managed site; custom workflows, accounts, or integrations can justify a custom application. Decide who will edit content, who will own the domain and hosting, what must keep working during a network interruption, and how backups will be restored. For any site, use HTTPS, keep software updated, limit administrator access, validate form input on the server, protect credentials in server-side secrets, and keep encrypted backups. These are baseline practices, not a security audit. For payments, sensitive personal data, or regulated work, get a qualified security review.`,references:[owaspRest,owaspSecrets],
  },
  {
    id:'seed-general-technical-fa',source_type:'faq',knowledge_scope:'general_industry',title:'انتخاب بستر سایت و برنامه‌ریزی محافظت‌ها',language:'fa',topics:['stack-frameworks','cms','security','hosting'],
    body:`ساده‌ترین بستری را انتخاب کنید که نیاز واقعی را برآورده کند. سایت اطلاع‌رسانی ممکن است با سامانه مدیریت محتوا مناسب باشد؛ فرایندهای اختصاصی، حساب کاربری یا یکپارچه‌سازی‌ها گاهی ساخت برنامه سفارشی را توجیه می‌کنند. مشخص کنید چه کسی محتوا را ویرایش می‌کند، مالک دامنه و میزبانی چه کسی است، هنگام قطعی اینترنت چه قابلیت‌هایی باید کار کنند و نسخه پشتیبان چگونه بازیابی می‌شود. برای هر سایت از HTTPS استفاده کنید، نرم‌افزار را به‌روز نگه دارید، دسترسی مدیران را محدود کنید، ورودی فرم را در سرور اعتبارسنجی کنید، کلیدها را فقط در تنظیمات امن سرور نگه دارید و نسخه پشتیبان رمزگذاری‌شده داشته باشید. این‌ها اقدامات پایه هستند، نه ممیزی امنیتی. برای پرداخت، اطلاعات شخصی حساس یا کارهای قانون‌مند، بررسی متخصص امنیت بگیرید.`,references:[owaspRest,owaspSecrets],
  },
];
