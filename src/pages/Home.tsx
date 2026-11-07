import { useState } from "react";
import { course, sessions, topics, slides, slideSrc, problemSolution as ps, totalSlides, type LessonKey } from "../data/course";
import IsoPath from "../components/IsoPath";
import KnowledgeCake from "../components/KnowledgeCake";
import Rich from "../components/Rich";
import { TopicIcon } from "../components/icons";

export default function Home() {
  const [active, setActive] = useState<LessonKey | null>(null);
  return (
    <main>
      <section className="hero">
        <div className="hero-in">
          <div className="rise">
            <div className="kicker">{course.full}</div>
            <h1>מכלי לשותף:<br /><em>שישה צעדים</em> ביצירה עם AI.</h1>
            <p className="lead">{course.lead}</p>
            <div className="kpis" aria-label="הקורס במספרים">
              <div className="kpi"><b>2</b><span>מפגשים</span></div>
              <div className="kpi"><b>6</b><span>תחנות</span></div>
              <div className="kpi"><b>{totalSlides}</b><span>שקופיות</span></div>
              <div className="kpi"><b>6</b><span>תרגילים</span></div>
            </div>
            <div className="cta-row">
              <a className="press btn btn-main" href="#/intro">להתחיל בהקדמה</a>
              <a className="press btn ghost" href="#/t/a1">ישר לתחנה 1</a>
            </div>
          </div>
          <div className="iso-wrap rise" style={{ animationDelay: ".15s" }}>
            <IsoPath active={active} setActive={setActive} />
            <div className="legend" role="list" aria-label="מקרא התחנות">
              {sessions.map((s) => (
                <div key={s.id} className="legend-col" role="presentation">
                  <div className="legend-title">מפגש {s.letter} · {s.title} ({s.mode})</div>
                  {topics.filter((t) => t.session === s.id).map((t) => (
                    <a key={t.key} role="listitem" href={`#/t/${t.key}`} className={`legend-row ${active === t.key ? "on" : ""}`}
                      onMouseEnter={() => setActive(t.key)} onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(t.key)} onBlur={() => setActive(null)}>
                      <i className="sw" style={{ background: s.color }}>{topics.indexOf(t) + 1}</i>
                      <span><b>{t.title}</b> · {t.subtitle}</span>
                      <bdi className="num">{slides[t.key].length}</bdi>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page">
        <div className="grid-3 narrow" style={{ marginTop: 8 }}>
          <div className="tone tone-problem rise"><span className="label">הבעיה</span><h4>{ps.problem.title}</h4><Rich as="p">{ps.problem.text}</Rich></div>
          <div className="tone tone-solution rise" style={{ animationDelay: ".08s" }}><span className="label">הפתרון</span><h4>{ps.solution.title}</h4><Rich as="p">{ps.solution.text}</Rich></div>
          <div className="tone tone-insight rise" style={{ animationDelay: ".16s" }}><span className="label">התובנה</span><h4>{ps.insight.title}</h4><Rich as="p">{ps.insight.text}</Rich></div>
        </div>

        <section className="section narrow" aria-labelledby="cake-h">
          <div className="section-head"><h2 id="cake-h">הקורס הוא מסע דרך עוגת הידע.</h2><span className="label">הקונספט המאחד</span></div>
          <p className="page-sub">כל תחנה מזיזה אותך פרוסה אחת: מהאדום, מה שאת יודעת, אל הצהוב, מה שעוד לא הכרת.</p>
          <KnowledgeCake />
        </section>

        <section className="section" aria-labelledby="map-h">
          <div className="section-head"><h2 id="map-h">מפת הקורס: הקדמה ושש תחנות.</h2><span className="label">לחצו על כרטיס</span></div>
          <div className="grid-3">
            <a className="press map-card" href="#/intro" style={{ ["--accent" as string]: "var(--wine)" }}>
              <div className="thumb"><img src={slideSrc("intro", 4)} alt="שקף המסע מכלי לשותף" loading="lazy" /></div>
              <div className="body">
                <div className="row1"><span className="topic-ico" style={{ color: "var(--wine)" }}><TopicIcon k="intro" /></span><h3>הקדמה</h3><span className="count"><bdi className="num">{slides.intro.length}</bdi> שקופיות</span></div>
                <span className="sub">עוגת הידע, שלוש רמות הנחיה, ארבע רמות ניסוח</span>
                <Rich as="p">{"==הנדסת פרומפטים היא כלי לחידוד החשיבה.=="}</Rich>
              </div>
            </a>
          </div>
          {sessions.map((s) => (
            <div key={s.id}>
              <div className="session-head">
                <i className="bar" style={{ background: s.color }} />
                <div><h3>מפגש {s.letter}: {s.title} ({s.mode})</h3><p>{s.points.map((p) => p.replace(/\*\*|==/g, "")).slice(0, 2).join(" ")}</p></div>
              </div>
              <div className="grid-3">
                {topics.filter((t) => t.session === s.id).map((t) => (
                  <a key={t.key} className="press map-card" href={`#/t/${t.key}`} style={{ ["--accent" as string]: s.color }}>
                    <div className="thumb"><img src={slideSrc(t.key, t.thumb)} alt={`${t.title}: ${t.subtitle}`} loading="lazy" /></div>
                    <div className="body">
                      <div className="row1">
                        <span className="topic-ico" style={{ color: s.color }}><TopicIcon k={t.key} /></span>
                        <span className="station-tag">תחנה {topics.indexOf(t) + 1}</span><h3>{t.title}</h3><span className="sub">{t.subtitle}</span>
                        <span className="count"><bdi className="num">{slides[t.key].length}</bdi> שקופיות</span>
                      </div>
                      <Rich as="p">{`**${t.insight}**`}</Rich>
                      <p>{t.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
