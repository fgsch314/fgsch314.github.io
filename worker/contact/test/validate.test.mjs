// Plain-Node checks for validation and header-injection safety: node test/validate.test.mjs
import assert from "node:assert/strict";
import { validate } from "../src/validate.js";
import { buildMessage } from "../src/mime.js";

const good = { name: "Jane Doe", email: "jane@example.org", message: "Interview request for Monday.", topic: "Media request" };
assert.equal(validate(good).ok, true);
assert.equal(validate({ ...good, email: "nope" }).ok, false);
assert.equal(validate({ ...good, message: "hi" }).ok, false);
assert.equal(validate({ ...good, topic: "<script>" }).data.topic, "Other");
assert.equal(validate({ ...good, name: "Eve\r\nBcc: victim@x.com" }).data.name.includes("\n"), false);

const raw = buildMessage({ from: "website@forms.example.com", fromName: "Zoë\r\nBcc: x@y.z via website",
  to: "me@example.com", replyTo: "a@b.c\r\nBcc: x@y.z", subject: "Ümlaut subject", text: "Héllo", domain: "forms.example.com" });
const headers = raw.split("\r\n\r\n")[0].split("\r\n");
assert.ok(!headers.some((h) => /^Bcc:/i.test(h)), "no injected Bcc header");
assert.ok(headers.some((h) => h.startsWith("Subject: =?UTF-8?B?")), "non-ASCII subject encoded");
assert.equal(Buffer.from(raw.split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString(), "Héllo");
console.log("all contact-form tests passed");
