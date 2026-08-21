const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bvJ63Zb1deDCe_XOZDyX-Xz6OzZi7WDJ9NkWnrQh1Wk/gviz/tq?tqx=out:csv&sheet=FRLG';

const state = { pokemon: [], filter: 'all', query: '', panelScale: 1 };
const elements = {
  grid: document.querySelector('#pokemonGrid'), empty: document.querySelector('#emptyState'), error: document.querySelector('#errorState'),
  resultCount: document.querySelector('#resultCount'), updatedAt: document.querySelector('#updatedAt'),
  total: document.querySelector('#totalCount'), captured: document.querySelector('#capturedCount'), missing: document.querySelector('#missingCount'), backToTop: document.querySelector('#backToTop'),
  rate: document.querySelector('#completionRate'), progressText: document.querySelector('#progressText'), progressBar: document.querySelector('#progressBar'), panelSizeControl: document.querySelector('#panelSizeControl'), panelSizeToggle: document.querySelector('#panelSizeToggle'), panelSizeOptions: document.querySelector('#panelSizeOptions')
};

function parseCSV(csv) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index], next = csv[index + 1];
    if (character === '"' && quoted && next === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field); if (row.some(value => value.trim())) rows.push(row); row = []; field = '';
    } else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function normalise(value) { return String(value || '').trim().toLowerCase(); }
function isCaptured(value) { return ['true', '1', 'yes', 'はい', '捕獲済み'].includes(normalise(value)); }
function cleanUrl(value) { return String(value || '').replace(/[\r\n]/g, '').trim(); }
function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}
function safeHttpUrl(value) {
  const url = cleanUrl(value);
  return /^https?:\/\//i.test(url) ? escapeHtml(url) : '';
}
function specialEvolutionClass(value) {
  const evolution = normalise(value);
  if (evolution.includes('ほのお')) return ' special-fire';
  if (evolution.includes('みず')) return ' special-water';
  if (evolution.includes('こおり')) return ' special-ice';
  if (evolution.includes('めざめいし')) return ' special-dawn';
  if (evolution.includes('たいよう')) return ' special-sun';
  if (evolution.includes('ひかり')) return ' special-light';
  if (evolution.includes('かみなり')) return ' special-thunder';
  if (evolution.includes('リーフ')) return ' special-leaf';
  if (evolution.includes('やみ')) return ' special-dark';
  if (evolution.includes('なつき')) return ' special-affection';
  if (evolution.includes('つき')) return ' special-moon';
  if (evolution.includes('通信交換')) return ' special-trade';
  return '';
}

function specialInfoBadge(value, specialEvolution) {
  const info = String(value || '').trim();
  if (!info) return '';
  const normalisedInfo = normalise(info);
  const infoClass = normalisedInfo === '対象外' ? `${specialEvolutionClass(specialEvolution)} special-out` : normalisedInfo.includes('fr') ? ' version-fr' : normalisedInfo.includes('lg') ? ' version-lg' : '';
  return `<span class="version-badge${infoClass}" title="特殊情報: ${escapeHtml(info)}">${escapeHtml(info)}</span>`;
}

function evolutionBadge(value) {
  const method = String(value || '').trim();
  return method ? `<span class="evolution-badge${specialEvolutionClass(method)}" title="特殊進化: ${escapeHtml(method)}">${escapeHtml(method)}</span>` : '';
}

function updateStats() {
  const total = state.pokemon.length;
  const captured = state.pokemon.filter(item => item.captured).length;
  const missing = total - captured;
  const rate = total ? Math.round(captured / total * 100) : 0;
  elements.total.textContent = total;
  elements.captured.textContent = captured;
  elements.missing.textContent = missing;
  elements.rate.textContent = `${rate}%`;
  elements.progressText.textContent = `${captured} / ${total}`;
  elements.progressBar.style.width = `${rate}%`;
}

function render() {
  const query = normalise(state.query);
  const visible = state.pokemon.filter(item => {
    const matchesQuery = !query || normalise(item.name).includes(query) || item.number.includes(query);
    const matchesFilter = state.filter === 'all' || (state.filter === 'captured' && item.captured) || (state.filter === 'missing' && !item.captured);
    return matchesQuery && matchesFilter;
  });
  elements.grid.innerHTML = visible.map((item, index) => `
    <article class="pokemon-card${item.captured ? ' captured' : ''}" style="animation-delay:${Math.min(index * 25, 300)}ms">
      ${specialInfoBadge(item.specialInfo, item.specialEvolution)}
      <div class="number">NO. ${item.number}</div>
      ${item.infoUrl ? `<a class="pokemon-link" href="${item.infoUrl}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.name)}の情報を開く">` : ''}
        <img class="pokemon-image" src="${safeHttpUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
      ${item.infoUrl ? '</a>' : ''}
      <h2 class="pokemon-name">${escapeHtml(item.name)}</h2>
      <span class="status">${item.captured ? '捕獲済み' : '未捕獲'}</span>
      ${evolutionBadge(item.specialEvolution)}
    </article>`).join('');
  elements.resultCount.textContent = `${visible.length} 匹を表示`;
  elements.empty.hidden = visible.length !== 0 || state.pokemon.length === 0;
  const columns = elements.grid.children.length ? [...elements.grid.children].filter(item => item.offsetTop === elements.grid.children[0].offsetTop).length : 0;
  elements.grid.classList.toggle('six-column-groups', columns === 6);
  document.body.classList.toggle('six-column-layout', columns === 6);
  if (columns !== 6) state.panelScale = 1;
  elements.grid.style.setProperty('--panel-scale', state.panelScale);
  elements.panelSizeControl.hidden = columns !== 6;
  if (columns !== 6) {
    elements.panelSizeOptions.hidden = true;
    elements.panelSizeToggle.setAttribute('aria-expanded', 'false');
  }
}

async function loadData() {
  elements.error.hidden = true;
  elements.grid.innerHTML = '<div class="empty-state"><div>◌</div><span>図鑑データを読み込んでいます...</span></div>';
  try {
    const response = await fetch(SHEET_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = parseCSV(await response.text());
    const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').trim());
    const column = name => headers.findIndex(header => header === name);
    const noIndex = column('No'), nameIndex = column('名前'), imageIndex = column('画像'), checkIndex = column('チェック');
    const infoUrlIndex = headers.findIndex(header => ['情報URL', 'URL', '情報 url'].includes(header));
    const specialInfoIndex = column('特殊情報');
    const specialEvolutionIndex = column('特殊進化');
    if ([noIndex, nameIndex, imageIndex, checkIndex].some(index => index < 0)) throw new Error('必要な列がありません');
    state.pokemon = rows.map(row => ({
      number: row[noIndex] || '', name: row[nameIndex] || 'Unknown', image: row[imageIndex] || '',
      infoUrl: infoUrlIndex >= 0 ? safeHttpUrl(row[infoUrlIndex]) : '',
      specialInfo: specialInfoIndex >= 0 ? row[specialInfoIndex] || '' : '',
      specialEvolution: specialEvolutionIndex >= 0 ? row[specialEvolutionIndex] || '' : '',
      captured: isCaptured(row[checkIndex])
    })).filter(item => item.number && item.name);
    updateStats(); render();
    elements.updatedAt.textContent = `最終取得 ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    console.error(error); elements.grid.innerHTML = ''; elements.error.hidden = false; elements.resultCount.textContent = '読み込みエラー';
  }
}

document.querySelector('#searchInput').addEventListener('input', event => { state.query = event.target.value; render(); });
document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active'); state.filter = button.dataset.filter; render();
}));
document.querySelector('#refreshButton').addEventListener('click', loadData);
document.querySelector('#retryButton').addEventListener('click', loadData);
elements.panelSizeToggle.addEventListener('click', () => {
  const isOpen = elements.panelSizeToggle.getAttribute('aria-expanded') === 'true';
  elements.panelSizeToggle.setAttribute('aria-expanded', String(!isOpen));
  elements.panelSizeOptions.hidden = isOpen;
});
elements.panelSizeOptions.querySelectorAll('[data-panel-scale]').forEach(button => button.addEventListener('click', () => {
  state.panelScale = Number(button.dataset.panelScale);
  elements.grid.style.setProperty('--panel-scale', state.panelScale);
  elements.panelSizeOptions.hidden = true;
  elements.panelSizeToggle.setAttribute('aria-expanded', 'false');
}));
function updateBackToTop() {
  const isScrolled = window.scrollY > 0;
  elements.backToTop.hidden = !isScrolled;
  document.body.classList.toggle('page-scrolled', isScrolled);
}
window.addEventListener('scroll', updateBackToTop, { passive: true });
elements.backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('resize', render);
updateBackToTop();
loadData();
