import { useEffect } from "react";
import { topics, sessions, slides, type LessonKey } from "../data/course";
import SlideViewer from "../components/SlideViewer";
import ExercisePanel from "../components/ExercisePanel";
import PromptLab from "../components/PromptLab";
import Feature from "../components/Feature";
import TopicGallery from "../components/Gallery";
import Rich from "../components/Rich";
import { TopicIcon } from "../components/icons";
import NotFound from "./NotFound";

const SECTIONS = [["slides", "השקופיות"], ["exercise", "התרגיל"], ["lab", "מעבדת פרומפט"], ["knowledge", "ידע והשראה"], ["gallery", "גלריה"]] as const;

export default function TopicPage({ k }: { k: string }) {
  const i = topics.findIndex((t) => t.key === k);
  const t = topics[i];
  useEffect(() => { if (t) document.title = `${t.title}: ${t.subtitle} · מכלי לשותף`; }, [t]);
  if (!t) return <NotFound />;
  const s = sessions.find((x) => x.id === t.session)!;
  const prev = topics[i - 1], next = topics[i + 1];
  const siblings = topics.filter((x) => x.session === t.session);

  return (
    <main className="page" style={{ ["--accent" as string]: s.color, ["--accent-wash" as string]: s.wash }}>
      <div className="topic-head">
        <div>
          <div className="crumbs"><a href="#/">מכלי לשותף</a> / <a href={`#/t/${siblings[0].key}`}>מפגש {s.letter}: {s.title}</a> / תחנה {i + 1}</div>
          <div className="who">
            <span className="topic-ico" style={{ color: s.color, width: 44, height: 44 }}><TopicIcon k={t.key as LessonKey} /></span>
            <h1 className="page-title">{t.title}: {t.subtitle}</h1>
          </div>
          <Rich as="p" className="page-sub">{`==${t.insight}== ${t.description}`}</Rich>
        </div>
        <nav className="chips" aria-label={`תחנות מפגש ${s.letter}`}>
          {siblings.map((x) => (
            <a key={x.key} className="chip" href={`#/t/${x.key}`} aria-pressed={x.key === t.key}>{x.n}. {x.title}<bdi className="num">{slides[x.key].length}</bdi></a>
          ))}
        </nav>
      </div>

      <nav className="subnav tabs" aria-label="חלקי התחנה">
        {SECTIONS.map(([id, label], n) => (
          <button key={id} className="tab" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>
            <span className="section-no">{n + 1}</span> {label}
          </button>
        ))}
      </nav>

      <SlideViewer k={t.key} />

      <section className="section" id="exercise">
        <div className="section-head"><span className="section-no">2</span><h2>תרגיל {t.exercise.number}: {t.exercise.name}</h2><span className="label">בצעו, סמנו, רשמו</span></div>
        <ExercisePanel k={t.key} ex={t.exercise} />
      </section>

      <section className="section" id="lab">
        <div className="section-head"><span className="section-no">3</span><h2>מעבדת פרומפט: מרמה 1 לרמה 4.</h2><span className="label">כלי · הערכה שמסבירה את עצמה</span></div>
        <p className="page-sub">התחילו מהפתיחה של התרגיל, השלימו, וראו איך הרמה עולה. כשמגיעים לרמה <bdi className="num">4</bdi>, מעתיקים לשיחה חדשה.</p>
        <PromptLab id={t.key} starter={t.exercise.starter} />
      </section>

      <section className="section" id="knowledge">
        <div className="section-head"><span className="section-no">4</span><h2>ידע והשראה</h2><span className="label">ציטוט · תובנה · הייקו · עיר · פוסט</span></div>
        <Feature k={t.key} item={t.knowledge} />
      </section>

      <section className="section" id="gallery">
        <div className="section-head"><span className="section-no">5</span><h2>גלריית התחנה</h2><span className="label">עבודות הכיתה</span></div>
        <TopicGallery session={t.session} topic={String(t.n)} />
      </section>

      <nav className="section pager" aria-label="התחנה הקודמת והבאה" style={{ justifyContent: "space-between" }}>
        {prev ? <a className="press" href={`#/t/${prev.key}`}><small>התחנה הקודמת</small>{prev.title}: {prev.subtitle}</a> : <a className="press" href="#/intro"><small>חזרה</small>הקדמה</a>}
        {next ? <a className="press" href={`#/t/${next.key}`} style={{ textAlign: "left" }}><small>התחנה הבאה</small>{next.title}: {next.subtitle}</a> : <a className="press" href="#/gallery" style={{ textAlign: "left" }}><small>סוף המסע</small>גלריית הכיתה</a>}
      </nav>
    </main>
  );
}
