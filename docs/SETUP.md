# הגדרה חד־פעמית: השרת והמפתח

בערך 10 דקות, פעם אחת. שום דבר מכאן לא מדביקים בצ'אט.

## 1. חשבון Cloudflare (חינם)
1. נרשמים ב-https://dash.cloudflare.com/sign-up
2. בתפריט נכנסים ל-**Workers & Pages**. בפעם הראשונה הוא מבקש לבחור שם לכתובת. כל שם קצר מתאים.

## 2. אישור העלאה ל-GitHub
כדי שהשרת יעלה לבד בכל עדכון:
1. ב-Cloudflare: למעלה בצד, האייקון של המשתמש ← **My Profile** ← **API Tokens** ← **Create Token**.
2. ליד **Edit Cloudflare Workers** לוחצים **Use template**, אחר כך **Continue to summary**, ואז **Create Token**. מעתיקים את מה שמופיע.
3. ב-GitHub, בפרויקט talkback: **Settings** ← **Secrets and variables** ← **Actions** ← **New repository secret**:
   - שם: `CLOUDFLARE_API_TOKEN`, ובתוכן: מה שהעתקת.
4. עוד אחד, באותו מקום:
   - שם: `CLOUDFLARE_ACCOUNT_ID`, ובתוכן: ה-Account ID. מוצאים אותו ב-Cloudflare בעמוד **Workers & Pages**, בצד ימין.

## 3. האתר ב-GitHub
ב-GitHub, בפרויקט: **Settings** ← **Pages** ← תחת **Source** בוחרים **GitHub Actions**.

## 4. המפתח של Gemini (אחרי שהשרת עלה)
1. ב-Cloudflare: **Workers & Pages** ← **talkback-api** ← **Settings** ← **Variables and Secrets** ← **Add**.
2. **Type**: `Secret`. **Variable name**: `GEMINI_API_KEY`. **Value**: מדביקים את המפתח מ-AI Studio.
3. **Deploy** (או **Save**).

מעכשיו המפתח שמור רק שם. אף אחד לא יכול לראות אותו, גם לא מי שבונה את האפליקציה.

## 5. בדיקה
באפליקציה: **פרופיל** ← גלגל השיניים ← **בדיקה שהכול עובד**. כל השורות צריכות להיות סגולות עם ✓.

## 6. מנוע הדמות (Modal, חינם)
פעם אחת, כדי שהדמות שלך תיווצר בתוך האפליקציה ותהיה דומה לך.
1. נרשמים ב-https://modal.com עם חשבון הגוגל (Sign up). לא צריך להוסיף אמצעי תשלום. יש 30 דולר חינם בכל חודש.
2. ב-Modal: **Settings** ← **API Tokens** ← **New Token**. מופיעים שני ערכים: אחד מתחיל ב-`ak-` והשני ב-`as-`.
3. ב-GitHub, באותו מקום כמו קודם (**Settings** ← **Secrets and variables** ← **Actions** ← **New repository secret**):
   - שם: `MODAL_TOKEN_ID`, ובתוכן: הערך שמתחיל ב-`ak-`.
   - שם: `MODAL_TOKEN_SECRET`, ובתוכן: הערך שמתחיל ב-`as-`.

את כל השאר עושים בשבילך: המנוע עולה ומתחבר לשרת לבד.
