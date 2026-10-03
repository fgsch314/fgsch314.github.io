// Work page filters: type, topic, free-text search. State lives in the URL (?type=&topic=&q=)
// so old WordPress pages can redirect to a filtered view (D-003).
(function () {
  const params = new URLSearchParams(location.search);
  const state = { type: params.get("type") || "", topic: params.get("topic") || "", q: params.get("q") || "" };
  const rows = [...document.querySelectorAll(".row")];
  const blocks = [...document.querySelectorAll(".year-block")];
  const search = document.querySelector(".search");
  const count = document.querySelector(".count");
  search.value = state.q;

  function apply() {
    const q = state.q.trim().toLowerCase();
    let n = 0;
    rows.forEach((r) => {
      const ok = (!state.type || r.dataset.type === state.type) &&
        (!state.topic || r.dataset.topics.split(" ").includes(state.topic)) &&
        (!q || r.textContent.toLowerCase().includes(q));
      r.hidden = !ok;
      if (ok) n++;
    });
    blocks.forEach((b) => { b.hidden = !b.querySelector(".row:not([hidden])"); });
    document.querySelectorAll(".fchip[data-type]").forEach((c) =>
      c.setAttribute("aria-pressed", String(c.dataset.type === state.type)));
    document.querySelectorAll(".fchip[data-topic]").forEach((c) =>
      c.setAttribute("aria-pressed", String(c.dataset.topic === state.topic)));
    count.textContent = `${n} item${n === 1 ? "" : "s"}`;
    const p = new URLSearchParams();
    for (const k of ["type", "topic", "q"]) if (state[k]) p.set(k, state[k]);
    history.replaceState(null, "", p.toString() ? `?${p}` : location.pathname);
  }

  document.querySelectorAll(".fchip[data-type]").forEach((c) =>
    c.addEventListener("click", () => { state.type = c.dataset.type; apply(); }));
  document.querySelectorAll(".fchip[data-topic]").forEach((c) =>
    c.addEventListener("click", () => { state.topic = state.topic === c.dataset.topic ? "" : c.dataset.topic; apply(); }));
  search.addEventListener("input", () => { state.q = search.value; apply(); });
  apply();
})();
