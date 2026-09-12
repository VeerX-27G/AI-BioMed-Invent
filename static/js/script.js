// ---------------------------------------------------------------
// Live data, pulled from the Flask API (/api/eod), which runs
// fetch_all_eod_data() from data.py against Marketstack.
// ---------------------------------------------------------------
let allData = [];

async function loadData(){
  try {
    const res = await fetch('/api/eod');
    if (!res.ok)
      throw new Error(`API error: ${res.status}`);
    allData = await res.json();
  } catch (err) {
    console.error('Failed to load EOD data:', err);
    document.getElementById('live-price').textContent = 'N/A';
    return;
  }
  render(365);
}

// ---------------------------------------------------------------
// Chart rendering
// ---------------------------------------------------------------
const svg = document.getElementById('chart-svg');
const pathEl = document.getElementById('chart-path');
const fillEl = document.getElementById('chart-fill');
const gridEl = document.getElementById('grid-lines');
const yLabels = document.getElementById('y-labels');
const tooltip = document.getElementById('tooltip');
const crosshair = document.getElementById('crosshair-x');
const liveDot = document.getElementById('live-dot-circle');

const PAD = { top: 20, bottom: 20, left: 0, right: 0 };
const W = 1000, H = 320;

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' });
}
function fmtMoney(v){ return '$' + v.toFixed(3); }
function fmtVol(v){ return v.toLocaleString('en-CA'); }

let currentSlice = [];

function render(rangeDays){
  const slice = allData.slice(-rangeDays);
  currentSlice = slice;

  const closes = slice.map(d => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = (max - min) || 1;

  const xStep = (W - PAD.left - PAD.right) / (slice.length - 1);
  const yScale = v => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom);

  let linePath = '';
  slice.forEach((d, i) => {
    const x = PAD.left + i * xStep;
    const y = yScale(d.close);
    linePath += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2) + ' ';
  });

  const lastX = PAD.left + (slice.length - 1) * xStep;
  const lastY = yScale(slice[slice.length - 1].close);
  const fillPath = linePath + `L${lastX.toFixed(2)},${H - PAD.bottom} L${PAD.left},${H - PAD.bottom} Z`;

  pathEl.setAttribute('d', linePath.trim());
  fillEl.setAttribute('d', fillPath);

  // Animate the complete path.  A fixed dash length can leave a visible
  // gap when the data makes the SVG path longer than that length.
  const pathLength = pathEl.getTotalLength();
  pathEl.style.animation = 'none';
  pathEl.style.transition = 'none';
  pathEl.style.strokeDasharray = pathLength;
  pathEl.style.strokeDashoffset = pathLength;
  pathEl.getBoundingClientRect();
  requestAnimationFrame(() => {
    pathEl.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.4, 0, .2, 1)';
    pathEl.style.strokeDashoffset = '0';
  });

  liveDot.setAttribute('cx', lastX.toFixed(2));
  liveDot.setAttribute('cy', lastY.toFixed(2));

  // grid + y labels (4 horizontal lines)
  gridEl.innerHTML = '';
  const steps = 4;
  const labels = [];
  for (let s = 0; s <= steps; s++){
    const v = min + (span * s / steps);
    const y = yScale(v);
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', 0); line.setAttribute('x2', W);
    line.setAttribute('y1', y.toFixed(2)); line.setAttribute('y2', y.toFixed(2));
    line.setAttribute('stroke', 'var(--grid)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '2,4');
    gridEl.appendChild(line);
    labels.push(v);
  }
  yLabels.innerHTML = labels.reverse().map(v => `<span>${fmtMoney(v)}</span>`).join('');

  updateHeaderStats(slice);
}

function updateHeaderStats(slice){
  const last = slice[slice.length - 1];
  const prev = slice[slice.length - 2] || last;
  const change = last.close - prev.close;
  const pct = (change / prev.close) * 100;
  const up = change >= 0;

  document.getElementById('live-price').textContent = fmtMoney(last.close);
  document.getElementById('live-price').style.color = up ? 'var(--phosphor)' : 'var(--down)';

  const changeEl = document.getElementById('live-change');
  changeEl.textContent = `${up ? '▲' : '▼'} ${Math.abs(change).toFixed(3)} (${Math.abs(pct).toFixed(2)}%)`;
  changeEl.style.color = up ? 'var(--phosphor)' : 'var(--down)';

  document.getElementById('stat-open').textContent = fmtMoney(last.open);
  document.getElementById('stat-volume').textContent = fmtVol(last.volume);

  const yearCloses = allData.map(d => d.close);
  const lo = Math.min(...yearCloses), hi = Math.max(...yearCloses);
  document.getElementById('stat-range').textContent = `${fmtMoney(lo)} – ${fmtMoney(hi)}`;
  document.getElementById('stat-count').textContent = allData.length;

  renderTable();
}

function renderTable(){
  const rows = allData.slice(-15).reverse();
  const tbody = document.getElementById('session-table');
  tbody.innerHTML = rows.map(d => `
    <tr class="border-b" style="border-color:var(--border)">
      <td class="py-2 px-3.5">${fmtDate(d.date)}</td>
      <td class="text-right py-2 px-3.5 font-mono">${d.open.toFixed(3)}</td>
      <td class="text-right py-2 px-3.5 font-mono">${d.high.toFixed(3)}</td>
      <td class="text-right py-2 px-3.5 font-mono">${d.low.toFixed(3)}</td>
      <td class="text-right py-2 px-3.5 font-mono" style="color:var(--phosphor)">${d.close.toFixed(3)}</td>
      <td class="text-right py-2 px-3.5 font-mono">${fmtVol(d.volume)}</td>
    </tr>
  `).join('');
}

// Range toggle buttons
document.getElementById('range-controls').addEventListener('click', (e) => {
  const btn = e.target.closest('.range-btn');
  if (!btn) return;
  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.remove('active');
    b.style.color = 'var(--text-muted)';
  });
  btn.classList.add('active');
  btn.style.color = '';
  render(parseInt(btn.dataset.range, 10));
});

// Hover crosshair + tooltip
svg.addEventListener('mousemove', (e) => {
  const rect = svg.getBoundingClientRect();
  const relX = ((e.clientX - rect.left) / rect.width) * W;
  const xStep = W / (currentSlice.length - 1);
  const idx = Math.max(0, Math.min(currentSlice.length - 1, Math.round(relX / xStep)));
  const point = currentSlice[idx];
  if (!point) return;

  const x = idx * xStep;
  crosshair.setAttribute('x1', x); crosshair.setAttribute('x2', x);
  crosshair.setAttribute('visibility', 'visible');

  tooltip.classList.remove('hidden');
  tooltip.style.left = Math.min(rect.width - 130, Math.max(0, (x / W) * rect.width + 8)) + 'px';
  tooltip.style.top = '8px';
  tooltip.innerHTML = `${fmtDate(point.date)}<br><span style="color:var(--phosphor)">${fmtMoney(point.close)}</span>`;
});
svg.addEventListener('mouseleave', () => {
  crosshair.setAttribute('visibility', 'hidden');
  tooltip.classList.add('hidden');
});

loadData();
