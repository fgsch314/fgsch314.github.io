// Minimal RFC 5322 builder for a plain-text UTF-8 message (no dependencies).

// Strip CR/LF so visitor input can never inject extra headers.
export const oneLine = (s) => String(s ?? "").replace(/[\r\n]+/g, " ").trim();

const b64 = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};

// RFC 2047 encoded-word for non-ASCII header text.
const encodeHeader = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);

export function buildMessage({ from, fromName, to, replyTo, subject, text, domain }) {
  const id = `<${crypto.randomUUID()}@${domain}>`;
  const body = b64(text).replace(/.{1,76}/g, "$&\r\n");
  return [
    `From: ${encodeHeader(oneLine(fromName))} <${from}>`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${oneLine(replyTo)}>` : null,
    `Subject: ${encodeHeader(oneLine(subject))}`,
    `Message-ID: ${id}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].filter((l) => l !== null).join("\r\n");
}
