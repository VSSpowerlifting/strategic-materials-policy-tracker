// Progressive enhancement: the full reference and PNG links work without JS.
(() => {
  const cards = [...document.querySelectorAll('.pattern')];
  const search = document.querySelector('#search');
  const family = document.querySelector('#family');
  const tier = document.querySelector('#tier');
  const count = document.querySelector('#result-count');
  const selection = new Set();
  const compare = document.querySelector('#compare');
  const dialog = document.querySelector('#preview-dialog');
  const contents = document.querySelector('#preview-contents');
  const params = new URLSearchParams(location.search);
  for (const input of [search, family, tier]) {
    const value = params.get(input.id);
    if (value) input.value = value;
  }
  function filter() {
    const terms = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const text = card.textContent.toLocaleLowerCase();
      card.hidden = !terms.every((t) => text.includes(t)) || (family.value && card.dataset.family !== family.value) || (tier.value && card.dataset.tier !== tier.value);
      if (!card.hidden) visible++;
    }
    document.querySelectorAll('.family').forEach((section) => {
      section.hidden = ![...section.querySelectorAll('.pattern')].some((card) => !card.hidden);
    });
    count.textContent = visible + ' of ' + cards.length + ' patterns';
    document.querySelector('#empty').hidden = visible !== 0;
    const query = new URLSearchParams();
    for (const input of [search, family, tier]) if (input.value) query.set(input.id, input.value);
    try { history.replaceState(null, '', location.pathname + (query.size ? '?' + query : '') + location.hash); } catch { /* file:// may disallow history updates */ }
  }
  for (const input of [search, family, tier]) input.addEventListener('input', filter);
  document.querySelector('#reset').addEventListener('click', () => { search.value = family.value = tier.value = ''; filter(); search.focus(); });
  document.querySelectorAll('[data-family-link]').forEach((link) => link.addEventListener('click', () => {
    family.value = link.dataset.familyLink; search.value = tier.value = ''; filter();
  }));
  const boxes = [...document.querySelectorAll('[data-compare]')];
  function updateSelection() {
    for (const box of boxes) box.disabled = selection.size === 2 && !box.checked;
    document.querySelector(".compare-bar").classList.toggle("has-selection", selection.size > 0);
    compare.disabled = selection.size !== 2;
    compare.textContent = 'Compare (' + selection.size + '/2)';
    document.querySelector('#selection-status').textContent = [...selection].map((id) => document.getElementById(id).querySelector('h3').textContent).join(' · ');
  }
  for (const box of boxes) box.addEventListener('change', () => { if (box.checked) selection.add(box.dataset.compare); else selection.delete(box.dataset.compare); updateSelection(); });
  document.querySelector('#clear-comparison').addEventListener('click', () => { selection.clear(); boxes.forEach((b) => { b.checked = false; }); updateSelection(); });
  function open(ids) {
    contents.replaceChildren();
    contents.classList.toggle('comparing', ids.length === 2);
    for (const id of ids) {
      const card = document.getElementById(id);
      const section = document.createElement('section');
      const heading = document.createElement('h3'); heading.textContent = card.querySelector('h3').textContent;
      const question = document.createElement('p'); question.textContent = card.querySelector('.question').textContent;
      const img = card.querySelector('img').cloneNode(); img.loading = 'eager';
      const meta = card.querySelector('dl').cloneNode(true);
      const details = card.querySelector('details').cloneNode(true); details.open = true;
      section.append(heading, question, img, meta, details); contents.append(section);
    }
    dialog.showModal();
  }
  document.querySelectorAll('.preview').forEach((link) => link.addEventListener('click', (event) => { event.preventDefault(); open([link.closest('.pattern').id]); }));
  compare.addEventListener('click', () => open([...selection]));
  document.querySelector('#close-preview').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.querySelector('#controls').hidden = false;
  filter(); updateSelection();
})();
