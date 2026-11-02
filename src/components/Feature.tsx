// שכבת ידע מוזיאלית: כתבה עם תמונה, אות פתיחה, ציטוט עם מקור, תובנה, הייקו, דוגמה עירונית, חיבורים ופוסט.
import type { Knowledge, LessonKey } from "../data/course";
import { slideSrc, lessonTitle } from "../data/course";
import { toast } from "../lib/toast";
import Rich, { Lines } from "./Rich";
import { Copy } from "./icons";

export default function Feature({ k, item }: { k: LessonKey; item: Knowledge }) {
  const copyPost = async () => {
    try { await navigator.clipboard.writeText(item.post); toast("הפוסט הועתק"); } catch { toast("ההעתקה נחסמה. סמנו והעתיקו ידנית."); }
  };
  return (
    <article className="ft">
      <figure className="ft-fig">
        <img src={slideSrc(k, item.heroSlide)} alt={item.heroCaption} loading="lazy" />
        <figcaption>{item.heroCaption}</figcaption>
        <aside className="ft-haiku" aria-label="הייקו">
          {item.haiku.map((l, i) => <span key={i}>{l}</span>)}
          <small>{item.haikuNote}</small>
        </aside>
      </figure>
      <div>
        <div className="ft-kicker">{item.kicker}</div>
        <h3 className="ft-title">{item.title}</h3>
        <Rich as="p" className="ft-deck">{item.deck}</Rich>
        {item.body.map((p, i) => <Rich key={i} as="p" className={i === 0 ? "ft-p ft-drop" : "ft-p"}>{p}</Rich>)}

        <blockquote className="ft-quote">
          <p className="tr">"{item.quote.tr}"<span className="tag">תרגום</span></p>
          {item.quote.orig && <p className="orig">"{item.quote.orig}"</p>}
          <cite><b>{item.quote.by}</b> <span className="latin">{item.quote.byLatin}</span>, {item.quote.work}, {item.quote.year}</cite>
        </blockquote>

        <aside className="ft-insight"><span className="label">תובנה</span><Rich as="p">{`==${item.insight}==`}</Rich></aside>

        <div className="city">
          <i className="bar" />
          <div><span className="label">דוגמה מהעיר</span><h4>{item.city.title}</h4><Lines text={item.city.text} className="p" /></div>
        </div>

        <section className="links" aria-label="חיבורים">
          <span className="label">חיבורים לתחנות אחרות · הכלל, התובנה, מה עושים</span>
          {item.links.map((l, i) => (
            <a key={i} className="press link-card" href={l.to === "intro" ? "#/intro" : `#/t/${l.to}`}>
              <span className="to">אל {lessonTitle(l.to)}</span>
              <span><b>הכלל:</b> {l.rule}</span>
              <Rich className="ins">{`==${l.insight}==`}</Rich>
              <span><b>מה עושים:</b> {l.action}</span>
            </a>
          ))}
        </section>

        <section className="post" aria-label="פוסט">
          <div className="post-tools"><span className="label">פוסט מוכן לשיתוף</span><button className="icon-btn" onClick={copyPost} aria-label="העתקת הפוסט" title="העתקת הפוסט"><Copy /></button></div>
          <p>{item.post.split("\n").map((l, i) => <Rich key={i} as="span">{l}</Rich>)}</p>
        </section>

        <footer className="sources">
          <span className="label">מקורות</span>
          <ol>{item.sources.map((s, i) => <li key={i}><a href={s.href} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ol>
        </footer>
      </div>
    </article>
  );
}
