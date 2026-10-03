// Form validation, kept free of Workers-only imports so it can be tested with plain Node.
import { oneLine } from "./mime.js";

const TOPICS = ["Media request", "Advisory", "Workshops & speaking", "Research collaboration", "Other"];
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function validate(f) {
  const errors = {};
  const name = oneLine(f.name);
  const email = oneLine(f.email);
  const message = String(f.message ?? "").trim();
  if (!name || name.length > 120) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Please enter a valid email address.";
  if (message.length < 10 || message.length > 5000) errors.message = "Please write a message (10–5,000 characters).";
  const topic = TOPICS.includes(f.topic) ? f.topic : "Other";
  const organisation = oneLine(f.organisation).slice(0, 160);
  return { ok: Object.keys(errors).length === 0, errors, data: { name, email, message, topic, organisation } };
}
