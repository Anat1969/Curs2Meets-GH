# מכלי לשותף · קורס AI ויצירה

**[curs2meets-gh.vercel.app](https://curs2meets-gh.vercel.app)**

המיזוג האחרון, בלי Vercel: [raw.githack.com/Anat1969/Curs2Meets-GH/main/app/index.html](https://raw.githack.com/Anat1969/Curs2Meets-GH/main/app/index.html)

קורס מתקדם בשני מפגשים: שישה צעדים ביצירה עם בינה מלאכותית, מ-AI ככלי ל-AI כשותף.
בכל תחנה: שקופיות, תרגיל עם יומן, מעבדת פרומפט שמדרגת את הניסוח, שכבת ידע וגלריית הכיתה.

## הרצה
```
npm install
npm run dev
```

## בדיקה
```
npm run build && node tests/e2e.cjs
```

## מבנה
- `src/data/course.ts`: מקור הנתונים היחיד.
- `src/data/slides.json`, `public/slides/`: 112 השקופיות.
- `src/lib/grade.ts`: מנוע ההערכה של מעבדת הפרומפט.
- `supabase/schema.sql`: טבלאות הגלריה וההרשאות.
- הנחיות העבודה: `CLAUDE.md`, ומעליהן https://github.com/Anat1969/Claude-GH.
