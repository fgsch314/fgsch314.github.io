// Plain-Node checks for form validation: node test/validate.test.mjs
import assert from "node:assert/strict";
import { validate } from "../src/validate.js";

const good = { name: "Jane Doe", email: "jane@example.org", message: "Interview request for Monday.", topic: "Media request" };
assert.equal(validate(good).ok, true);
assert.equal(validate({ ...good, email: "nope" }).ok, false);
assert.equal(validate({ ...good, email: "a@b.c\r\nBcc: x@y.z" }).ok, false, "header injection in email rejected");
assert.equal(validate({ ...good, message: "hi" }).ok, false);
assert.equal(validate({ ...good, topic: "<script>" }).data.topic, "Other");
assert.equal(validate({ ...good, name: "Eve\r\nBcc: victim@x.com" }).data.name.includes("\n"), false);
assert.equal(validate({ ...good, name: "Zoë Ünal" }).data.name, "Zoë Ünal");
console.log("all contact-form tests passed");
