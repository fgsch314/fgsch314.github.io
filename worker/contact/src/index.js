// Contact-form endpoint: validates the form, checks Cloudflare Turnstile, and emails the
// message to the site owner's verified address via Email Routing (send_email binding).
// Email Routing runs on a subdomain only (FROM_ADDRESS), so the apex MX stays with Proton (D-005).
import { EmailMessage } from "cloudflare:email";
import { buildMessage } from "./mime.js";
import { validate } from "./validate.js";

async function turnstileOk(token, secret, ip) {
  if (!token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  return (await r.json()).success === true;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGINS.split(",").map((s) => s.trim());
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
    if (!allowed.includes(origin)) return json({ ok: false, error: "Origin not allowed" }, 403);

    let f;
    try { f = await request.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }
    if (f.website) return json({ ok: true }); // honeypot filled → silently drop

    const { ok, errors, data } = validate(f);
    if (!ok) return json({ ok: false, errors }, 422);
    if (!(await turnstileOk(f["cf-turnstile-response"], env.TURNSTILE_SECRET, request.headers.get("CF-Connecting-IP")))) {
      return json({ ok: false, error: "Spam check failed. Please reload the page and try again." }, 403);
    }

    const text = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      data.organisation ? `Organisation: ${data.organisation}` : null,
      `Topic: ${data.topic}`,
      "",
      data.message,
      "",
      "—",
      `Sent from the contact form on ${origin}. Reply to this email to answer ${data.name} directly.`,
    ].filter((l) => l !== null).join("\n");

    const raw = buildMessage({
      from: env.FROM_ADDRESS,
      fromName: `${data.name} via website`,
      to: env.TO_ADDRESS,
      replyTo: data.email,
      subject: `[Website] ${data.topic}: ${data.name}`,
      text,
      domain: env.FROM_ADDRESS.split("@")[1],
    });
    try {
      await env.MAILER.send(new EmailMessage(env.FROM_ADDRESS, env.TO_ADDRESS, raw));
    } catch (e) {
      console.error("send failed", e && e.message);
      return json({ ok: false, error: "Sorry, the message could not be sent. Please try again later." }, 502);
    }
    return json({ ok: true });
  },
};
