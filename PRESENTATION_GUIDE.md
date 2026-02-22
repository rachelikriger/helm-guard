# מדריך הכנה להרצאה – Helm Guard

מדריך למידה מובנה לכל נדבכי הפרויקט, כדי שתוכלי להעביר הרצאה בביטחון מלא ולענות על שאלות.

---

## 1. התמונה הגדולה (5 דקות)

### מה הבעיה שהכלי פותר?
- **Drift** – הפער בין מה ש-Helm רוצה ל deploy לבין מה שבאמת רץ ב-OpenShift
- **Pre-deployment validation** – לוודא לפני `helm upgrade` שאין הפתעות
- **CI gate** – לחסום deployment כשיש הבדלים קריטיים

### איך זה עובד (בקצרה)?
1. **CLI** מריץ `helm template` → מקבל YAML "רצוי"
2. **CLI** מריץ `oc get` → מקבל YAML "חי" מהקלстר
3. **CLI** משווה (עם נורמליזציה) → מייצר דוח JSON
4. **UI** מציגה את הדוח (העלאה מקומית או URL מ-CI)

### Exit codes (חשוב לדעת!)
| Exit | משמעות |
|------|--------|
| 0 | הכל תואם |
| 1 | רק WARN – כדאי לבדוק |
| 2 | FAIL – חסימת deployment |
| 3 | שגיאת runtime/שימוש |

---

## 2. SHARED – חוזה הדוח (התחל כאן!)

**למה להתחיל כאן?** כי זה ה-**contract** בין CLI ל-UI. כל מה שמוגדר כאן חייב להיות מובן.

### קבצים:
- `shared/src/reportContract.ts` – טיפוסי TypeScript
- `shared/src/reportSchema.ts` – ולידציה עם Zod
- `shared/src/index.ts` – re-exports

### מושגים מרכזיים:

| מושג | משמעות |
|------|--------|
| **ResourceStatus** | MATCH, DRIFT, MISSING_LIVE, MISSING_HELM |
| **DiffAction** | WARN, FAIL (הבדל "רך" vs "קשה") |
| **resourceKey** | `Kind/namespace/name` – מפתח יחיד לריסורס |
| **DiffItem** | path + helmValue + liveValue + action |

### החלטות עיצוב:
- **Zod** – ולידציה של JSON נכנס (UI, proxy) – אם הדוח לא תואם schema, נזרק שגיאה ברורה
- **schemaVersion: 1** – מאפשר שינויי schema בעתיד בלי לשבור תאימות
- **shared** נבנה ראשון – CLI ו-UI תלויים בו (`prebuild` ב-package.json)

### שאלות צפויות:
- **"למה Zod ולא TypeScript בלבד?"** – כי JSON מבחוץ (קובץ, URL) לא מגיע עם טיפוסים. Zod בודק בזמן ריצה.
- **"מה קורה אם schema ישן?"** – כרגע אין versioning, אבל המבנה מאפשר להוסיף `schemaVersion: 2` בעתיד.

---

## 3. CLI – מנוע הוולידציה

### 3.1 נקודת הכניסה – `cli/src/index.ts`

**Flow:**
1. `commander` מפרסר ארגומנטים
2. `validateInputs` + `validateHelmRenderOptions` – ולידציה
3. `runBootstrapComparison` או `runHelmManagedComparison` (האחרון עדיין לא מיושם)
4. אם `--output` – `buildReport` + כתיבה ל-JSON
5. `printReport` – הדפסה לקונסול + exit code

### 3.2 Boundaries (גבולות חיצוניים)

| קובץ | תפקיד |
|------|-------|
| **helm.ts** | `helm template` – הרנדור של ה-chart |
| **openshift.ts** | `oc get <kinds>` – שליפת ריסורסים חיים |
| **io.ts** | `spawn` ל-helm/oc, `parseYamlDocuments` (ספריית yaml) |
| **reporter.ts** | הדפסה לקונסול עם chalk (צבעים) |

**החלטות:**
- **spawn** ולא `exec` – כדי להימנע מ-ENOBUFS כשהפלט גדול
- **oc** ולא `kubectl` – מותאם OpenShift
- **whitelist kinds** – רק kinds ש-Helm מייצר נשלפים מ-live (חוסך זמן ורעש)

### 3.3 Domain – הליבה

| קובץ | תפקיד |
|------|-------|
| **comparisonStrategies.ts** | `runBootstrapComparison`: render → whitelist → fetch live → compare |
| **kindWhitelist.ts** | `deriveKindWhitelist` – אוסף את כל ה-kinds מה-Helm output |
| **comparator.ts** | `compareResources` – deep-diff + נורמליזציה + סינון |
| **buildReport.ts** | בונה את מבנה הדוח (summary + results) |

### 3.4 Normalization – הלב של ההשוואה

**למה נורמליזציה?** OpenShift מוסיף שדות אוטומטיים (uid, resourceVersion, annotations וכו'). בלי נורמליזציה – כל ריסורס ייראה כ-drift.

**resourceNormalizer.ts:**
- מוחק `status`
- מוחק `uid`, `resourceVersion`, `generation`, `managedFields`
- מוחק annotations כמו `deployment.kubernetes.io/revision`, `meta.helm.sh/*`, `openshift.io/*`
- ממיין מערכים לפי `name` (כדי שה-diff יהיה עקבי)

**shouldIncludeDiff.ts:**
- שער יחיד להחלטה: "האם להציג את ההבדל?"
- 1) path תקין 2) semantic equality 3) platform default suppression
- **Platform default rules** – OpenShift מגדיר ערכי ברירת מחדל (למשל `clusterIP`, `sessionAffinity: None`). אם ה-live value הוא ברירת מחדל וה-Helm לא ציין – לא מדווחים.

**rules/** – רשימת כללים:
- `coreRules` – Deployment, Service, StatefulSet, Route
- `metadataRules`, `podTemplateRules`, `cronJobRules`, `buildConfigRules`
- כל rule: path (עם wildcard `*` לאינדקסים) + `matches` function

**החלטות:**
- `imagePullPolicy: Always` – מדווח רק כש-tag הוא `latest` או ריק (כי אז זה באמת default)
- `targetPort` ב-Service – אם שווה ל-`port`, לא מדווחים (default של OpenShift)

### 3.5 ספריות CLI

| ספרייה | שימוש |
|--------|-------|
| **commander** | CLI parsing |
| **chalk** | צבעים בקונסול |
| **deep-diff** | השוואת אובייקטים עמוקה |
| **yaml** | פענוח YAML |
| **fast-deep-equal** | שוויון סמנטי (בנורמליזציה) |

---

## 4. UI – צופה הדוחות

### 4.1 ארכיטקטורה

- **Vite + React** – build מהיר, SPA
- **React Router** – דף ראשי + NotFound
- **Tailwind + shadcn/ui** – עיצוב
- **lucide-react** – אייקונים

### 4.2 דרכי טעינת דוח

1. **העלאת קובץ** – `FileUploader` → `FileReader` → `safeParseReport` → `onReportLoaded`
2. **URL** – `?reportUrl=...` → `fetchReportFromUrl` → proxy → `safeParseReport`

### 4.3 reportApi.ts

- `fetchReportFromUrl` – שולח ל-`/proxy?url=...`
- השרת (Node) עושה fetch ל-URL עם `GITLAB_PROXY_TOKEN` (לפרויקטים פרטיים)
- `safeParseReport` – ולידציה עם Zod לפני הצגה
- טיפול בשגיאות: 401, 502, JSON לא תקין

### 4.4 Server – `ui/server/index.mjs`

- **Static files** – מגיש מ-`dist/`
- **`/proxy`** – proxy ל-GitLab artifacts (עם token)
- **SPA fallback** – כל path שלא קובץ → `index.html`
- **MIME types** – html, js, css, json, ico, png, svg, woff2

**למה proxy?** – CORS. הדפדפן לא יכול לעשות fetch ישיר ל-GitLab. השרת רץ באותו origin, אז הוא עושה את ה-fetch.

### 4.5 קומפוננטות מרכזיות

| קומפוננטה | תפקיד |
|-----------|-------|
| **Index** | דף ראשי – בודק `reportUrl`, טוען דוח, מציג `FileUploader` או `ReportViewer` |
| **FileUploader** | drag-and-drop / click, קורא JSON, קורא ל-`safeParseReport` |
| **ReportViewer** | Header, סיכום, פילטרים, רשימת ריסורסים |
| **ReportSummary** | כרטיסי סיכום (matched, drifted, missing...) |
| **Filters** | סינון לפי status ו-action |
| **ResourceList** | רשימת ResourceCard |
| **ResourceCard** | כרטיס מתקפל עם StatusBadge + DiffTable |
| **DiffTable** | טבלת הבדלים (path, helm, live, action) |
| **StatusBadge** | badge צבעוני לפי status |
| **ActionBadge** | WARN/FAIL |

### 4.6 Flow של state ב-ReportViewer

- `nameFilter` – חיפוש לפי שם
- `selectedStatuses` – MATCH, DRIFT, וכו'
- `selectedActions` – WARN, FAIL
- `filterResults` – מסנן את `report.results` לפי כל אלה
- `filteredSummary` – מחושב מ-`filteredResults` (סיכום מעודכן לפי הפילטרים)

### 4.7 types/report.ts

- re-export מ-`@helm-guard/shared` – UI משתמש באותם טיפוסים

---

## 5. CI – guard-template.yml

- **stage: validate**
- image: helm-guard-cli
- משתנים: `HELM_CHART_PATH`, `HELM_NAMESPACE`, `HELM_RELEASE_NAME`, `HELM_VALUES_FILES`, `HELM_SET_VALUES`
- `helm-guard` רץ עם אותם פרמטרים שישמשו ל-`helm upgrade`
- **artifacts**: `report.json` (when: always, expire_in: 7 days)
- **after_script**: בונה קישור ל-UI עם `reportUrl` – `HELM_GUARD_UI_URL/?reportUrl=...`

---

## 6. שאלות צפויות והתשובות

### "למה bootstrap ו-helm-managed?"
- **bootstrap** – השוואה "פשוטה": Helm output vs live. מתאים ל-bootstrap או כשהכל managed ידנית.
- **helm-managed** – מתוכנן לעתיד: להתמקד רק בריסורסים ש-Helm מנהל (לפי labels). **עדיין לא מיושם.**

### "למה strict mode?"
- **לא strict**: הבדלים מסווגים כ-WARN (exit 1)
- **strict**: כל הבדל = FAIL (exit 2). מתאים ל-"steady state" – אפס סובלנות.

### "מה קורה עם ריסורסים ש-Helm לא מייצר?"
- `MISSING_HELM` – קיימים ב-live אבל לא ב-Helm. ייתכן שנוצרו ידנית או ע"י operator.

### "למה proxy ולא fetch ישיר?"
- GitLab artifacts דורשים authentication. הדפדפן לא יכול לשלוח `PRIVATE-TOKEN`. השרת יכול.

### "מה עם self-signed cert ב-GitLab?"
- `NODE_TLS_REJECT_UNAUTHORIZED=0` – רק dev/test. לא production.

### "למה shared כ-package נפרד?"
- חוזה משותף. שינוי ב-schema – משפיע על CLI ו-UI. build order: shared → cli, ui.

---

## 7. סדר למידה מומלץ (להרצאה)

1. **README** – התמונה הגדולה
2. **shared** – reportContract + reportSchema
3. **CLI index** – flow מלא
4. **comparisonStrategies** – render → fetch → compare
5. **helm.ts + openshift.ts** – איך מתקשרים עם העולם החיצון
6. **comparator** – איך עושים diff
7. **shouldIncludeDiff + rules** – למה לא כל הבדל מדווח
8. **buildReport** – מבנה הדוח
9. **UI Index + reportApi** – איך טוענים דוח
10. **ReportViewer + ResourceCard + DiffTable** – איך מציגים
11. **server/index.mjs** – proxy + static
12. **guard-template** – אינטגרציה ב-CI

---

## 8. טיפים להרצאה

- **הדגמה חיה**: הרצי `helm-guard` על chart אמיתי, שמרי report.json, טעני ב-UI
- **הראי diff אמיתי**: ריסורס עם DRIFT – פתחי ResourceCard והראי את DiffTable
- **הסבירי את ה-exit codes** – זה מה ש-CI משתמש בו
- **הזכירי את ה-normalization** – זו הנקודה שמייחדת את הכלי (לא סתם diff)
- **אם שואלים על helm-managed** – "מתוכנן, כרגע רק bootstrap"

בהצלחה בהרצאה! 🚀
