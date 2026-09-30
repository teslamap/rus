# Language Arcade — Georgian to Russian / English

## Files
- `index.html`: opening language selector.
- `russian.html`: Russian arcade and study center.
- `english.html`: English vocabulary quiz and matching.
- `css/styles.css`: shared visual styles.
- `js/`: authentication, app logic and Supabase configuration.
- `supabase/schema.sql`: database table and Row Level Security setup.

## Run
Open `index.html`, preferably through a local static server.

## Supabase setup
Set the project URL and public anon/publishable key in `js/config.js`. Run `supabase/schema.sql` in the Supabase SQL editor. Configure Site URL and redirect URLs under Supabase Auth. Never put a service-role key in frontend code. Test sign-up, email confirmation, login, password reset and account isolation before publishing.

## GitHub Pages
Create a repository, upload all files preserving folders, then choose Settings → Pages → Deploy from branch → `main` → `/ (root)`. Add the Pages URL to Supabase Auth settings.

English includes a starter pack of common words and phrases; it is not represented as a professionally validated dictionary. Russian page retains the existing larger Russian arcade. The visible interface has no dark-mode toggle or language-package upload control.
