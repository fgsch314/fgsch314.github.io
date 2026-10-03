# Contact-form Worker

Receives the form on `/contact/`, checks Cloudflare Turnstile, and emails the message to
`frederic@fredericgschneider.com` (Reply-To = the sender). Free: Workers Free plan +
Email Routing sending to a verified destination address.

**Why a subdomain:** Email Routing takes over the MX records of whatever (sub)domain it is enabled
on. It is enabled on `forms.fredericgschneider.com` only, so the apex MX records keep pointing to
Proton and normal email is untouched.

## One-time setup (after the domain is on Cloudflare DNS)

1. Cloudflare dashboard → domain → **Email → Email Routing** → add subdomain `forms.fredericgschneider.com`
   (Cloudflare adds its MX/SPF records on the subdomain only — check the apex MX still shows Proton).
2. **Destination addresses** → add `frederic@fredericgschneider.com` → click the verification link
   Cloudflare sends to the Proton inbox.
3. **Turnstile** → add widget, hostnames `fredericgschneider.com`, `fgsch314.github.io` (and `localhost`
   for testing) → copy the site key into `data/site.yaml` (`contact_form.turnstile_sitekey`).
4. From this folder: `npx wrangler login`, then `npx wrangler secret put TURNSTILE_SECRET`
   (paste the Turnstile secret key when prompted), then `npx wrangler deploy`.
5. Put the Worker URL in `data/site.yaml` (`contact_form.endpoint`) and push — the form appears.

## Test

`node test/validate.test.mjs` — validation and MIME header-injection checks (no network).
