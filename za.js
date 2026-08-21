const SHEET_BASE_URL = 'https://docs.google.com/spreadsheets/d/1bvJ63Zb1deDCe_XOZDyX-Xz6OzZi7WDJ9NkWnrQh1Wk/gviz/tq?tqx=out:csv&sheet=';
const SHEETS = [
  { name: 'ミアレ', source: 'miare' },
  { name: '異次元', source: 'isekai' },
  { name: 'メガシンカ', source: 'mega' }
];

const state = { pokemon: [], source: 'all', filter: 'all', query: '' };
const elements = {
  grid: document.querySelector('#pokemonGrid'), empty: document.querySelector('#emptyState'), error: document.querySelector('#errorState'),
  resultCount: document.querySelector('#resultCount'), updatedAt: document.querySelector('#updatedAt'),
  total: document.querySelector('#totalCount'), captured: document.querySelector('#capturedCount'), missing: document.querySelector('#missingCount'),
  rate: document.querySelector('#completionRate'), progressText: document.querySelector('#progressText'), progressBar: document.querySelector('#progressBar')
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
function evolutionBadge(value) {
  const method = String(value || '').trim();
  return method ? `<span class="evolution-badge" title="特殊進化: ${escapeHtml(method)}">${escapeHtml(method)}</span>` : '';
}

function selectedPokemon() {
  return state.source === 'all' ? state.pokemon : state.pokemon.filter(item => item.source === state.source);
}

function updateStats() {
  const selected = selectedPokemon();
  const total = selected.length;
  const captured = selected.filter(item => item.captured).length;
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
  const visible = selectedPokemon().filter(item => {
    const matchesQuery = !query || normalise(item.name).includes(query) || item.number.includes(query);
    const matchesFilter = state.filter === 'all' || (state.filter === 'captured' && item.captured) || (state.filter === 'missing' && !item.captured);
    return matchesQuery && matchesFilter;
  });
  elements.grid.innerHTML = visible.map((item, index) => `
    <article class="pokemon-card${item.captured ? ' captured' : ''}" style="animation-delay:${Math.min(index * 25, 300)}ms">
      <div class="number">NO. ${item.number}</div>
      ${item.infoUrl ? `<a class="pokemon-link" href="${item.infoUrl}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(item.name)}の情報を開く">` : ''}
        <img class="pokemon-image" src="${safeHttpUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
      ${item.infoUrl ? '</a>' : ''}
      <h2 class="pokemon-name">${escapeHtml(item.name)}</h2>
      <span class="status">${item.captured ? '捕獲済み' : '未捕獲'}</span>
      ${evolutionBadge(item.specialEvolution)}
    </article>`).join('');
  elements.resultCount.textContent = `${visible.length} 匹を表示`;
  elements.empty.hidden = visible.length !== 0 || selectedPokemon().length === 0;
}

function parseSheetRows(csv, source) {
  const rows = parseCSV(csv);
  const headers = rows.shift().map(value => value.replace(/^\uFEFF/, '').trim());
  const column = name => headers.findIndex(header => header === name);
  const noIndex = column('No'), nameIndex = column('名前'), imageIndex = column('画像'), checkIndex = column('チェック');
  const infoUrlIndex = headers.findIndex(header => ['情報URL', 'URL', '情報 url'].includes(header));
  const specialEvolutionIndex = column('特殊進化');
  if ([noIndex, nameIndex, imageIndex, checkIndex].some(index => index < 0)) throw new Error(`${source}シートに必要な列がありません`);
  return rows.map(row => ({
    source,
    number: row[noIndex] || '', name: row[nameIndex] || 'Unknown', image: row[imageIndex] || '',
    infoUrl: infoUrlIndex >= 0 ? safeHttpUrl(row[infoUrlIndex]) : '',
    specialEvolution: specialEvolutionIndex >= 0 ? row[specialEvolutionIndex] || '' : '',
    captured: isCaptured(row[checkIndex])
  })).filter(item => item.number && item.name);
}

async function loadData() {
  elements.error.hidden = true;
  elements.grid.innerHTML = '<div class="empty-state"><div>◌</div><span>図鑑データを読み込んでいます...</span></div>';
  try {
    const responses = await Promise.all(SHEETS.map(async sheet => {
      const response = await fetch(`${SHEET_BASE_URL}${encodeURIComponent(sheet.name)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`${sheet.name} HTTP ${response.status}`);
      return parseSheetRows(await response.text(), sheet.source);
    }));
    state.pokemon = responses.flat();
    updateStats(); render();
    elements.updatedAt.textContent = `最終取得 ${new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    console.error(error); elements.grid.innerHTML = ''; elements.error.hidden = false; elements.resultCount.textContent = '読み込みエラー';
  }
}

document.querySelector('#searchInput').addEventListener('input', event => { state.query = event.target.value; render(); });
document.querySelectorAll('.filter:not(.source-filter)').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter:not(.source-filter)').forEach(item => item.classList.remove('active'));
  button.classList.add('active'); state.filter = button.dataset.filter; render();
}));
document.querySelectorAll('.source-filter').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.source-filter').forEach(item => item.classList.remove('active'));
  button.classList.add('active'); state.source = button.dataset.source; updateStats(); render();
}));
document.querySelector('#refreshButton').addEventListener('click', loadData);
document.querySelector('#retryButton').addEventListener('click', loadData);
loadData();
