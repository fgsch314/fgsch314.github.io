# Contact-form Worker

Receives the form on `/contact/`, checks Cloudflare Turnstile (+ a honeypot field), validates the
input, and emails the message to `frederic@fredericgschneider.com` through the Resend API, with
Reply-To set to the visitor so a reply from Proton goes straight back to them.

**Why Resend, on a subdomain:** the apex `fredericgschneider.com` receives mail at Proton. Cloudflare
Email Routing can only be onboarded for a whole zone (it would replace the apex MX records), so it
is not used. Resend is verified on `forms.fredericgschneider.com`; its DNS records live under that
subdomain only, and the apex MX/SPF/DKIM/DMARC records are untouched.

## One-time setup

1. Resend → Domains → add `forms.fredericgschneider.com` (region: EU) → add the DNS records it
   lists in Cloudflare DNS, all **DNS only** → Verify.
2. Resend → API keys → create a key with **Sending access** for that domain only.
3. Cloudflare → Turnstile → add widget for `fredericgschneider.com`, `fgsch314.github.io`, `localhost`;
   put the **site key** in `../../data/site.yaml` (`contact_form.turnstile_sitekey`).
4. From this folder, type the two secrets when prompted (never paste them into a file or chat):
   `npx wrangler secret put TURNSTILE_SECRET` and `npx wrangler secret put RESEND_API_KEY`.
5. `npx wrangler deploy`; put the printed workers.dev URL in `contact_form.endpoint`; push the site.

## Test

`node test/validate.test.mjs` — validation and header-injection checks (no network).
