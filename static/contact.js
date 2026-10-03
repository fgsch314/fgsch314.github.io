// Contact form: POST as JSON to the Cloudflare Worker (worker/contact/), show inline errors.
(function () {
  const form = document.querySelector(".cform");
  if (!form) return;
  const status = form.querySelector(".fstatus");
  const button = form.querySelector('button[type="submit"]');
  const setErr = (errs) => form.querySelectorAll(".ferr").forEach((p) => { p.textContent = (errs && errs[p.dataset.for]) || ""; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setErr(null);
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data["cf-turnstile-response"]) { status.textContent = "Please wait for the spam check to finish, then send again."; return; }
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const r = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const out = await r.json().catch(() => ({}));
      if (r.ok && out.ok) {
        form.reset();
        status.textContent = "Thank you. Your message has been sent, and I will reply by email.";
        form.classList.add("sent");
      } else {
        setErr(out.errors);
        status.textContent = out.error || "Please check the highlighted fields.";
      }
    } catch {
      status.textContent = "The message could not be sent. Please copy the email address below instead.";
    } finally {
      button.disabled = false;
      if (window.turnstile) window.turnstile.reset();
    }
  });
})();
