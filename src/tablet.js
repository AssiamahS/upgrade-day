// The sales tablet overlay: customer card on the left, conversation + actions on the right.
import { PERSONALITIES, PLANS, TAG_LABEL, NEED_LABEL, BRAND_NAME, money, monthly } from './data.js';

const STAGES = [
  ['greet', 'Greet'], ['discover', 'Discover'], ['recommend', 'Recommend'],
  ['objection', 'Objection'], ['addons', 'Add-ons'], ['close', 'Close'],
];
const STAGE_INDEX = { greet: 0, discover: 1, recommend: 2, pitch: 2, objection: 3, addons: 4, close: 5, checkout: 6, done: 6 };
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export class Tablet {
  constructor(game) {
    this.g = game;
    this.el = document.getElementById('tablet');
    this.sale = null;
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  get isOpen() { return !this.el.classList.contains('hidden'); }

  open(sale) {
    this.sale = sale;
    sale.away = false;
    this.el.classList.remove('hidden');
    this.render();
  }

  hide() { this.el.classList.add('hidden'); }

  onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t || !this.sale) return;
    const s = this.sale;
    const act = t.dataset.act;
    if (act === 'away') { this.g.stepAway(); return; }
    if (act === 'choose') {
      const v = t.dataset.id;
      s.choose(/^\d+$/.test(v) ? Number(v) : v);
    } else if (act === 'device') {
      s.choose(t.dataset.id);
    } else if (act === 'offer') {
      const addons = [...this.el.querySelectorAll('input[name=addon]:checked')].map((i) => i.value);
      const plan = this.el.querySelector('input[name=plan]:checked')?.value || s.p.plan;
      s.choose({ addons, plan });
    } else if (act === 'finish') {
      this.g.endSale(s);
      return;
    }
    this.render();
    if (s.stage === 'checkout') this.runCheckout();
  }

  runCheckout() {
    const s = this.sale;
    const steps = [
      'Verifying ID',
      `Device payment agreement — ${s.device.name}, 36 mo`,
      `Trade-in: ${s.p.oldDevice}`,
      `Activating new device on ${PLANS[s.plan].name}`,
      'Transferring photos, contacts & chats',
      'Printing receipt',
    ];
    const box = this.el.querySelector('.actions');
    box.innerHTML = `<div class="checkout">${steps.map((t, i) => `<div class="step" data-i="${i}"><span class="dot"></span>${esc(t)}</div>`).join('')}<div class="bar"><div></div></div></div>`;
    const bar = box.querySelector('.bar div');
    let i = 0;
    const tick = () => {
      if (this.sale !== s) return;
      const el = box.querySelector(`.step[data-i="${i}"]`);
      if (el) el.classList.add('ok');
      i++;
      bar.style.width = `${(i / steps.length) * 100}%`;
      this.g.sfx('tap');
      if (i < steps.length) setTimeout(tick, 900);
      else setTimeout(() => { s.finish(); this.g.sfx('cash'); this.render(); }, 600);
    };
    setTimeout(tick, 600);
  }

  bar(label, v, color) {
    return `<div class="meter"><div class="mlabel"><span>${label}</span><span>${Math.round(v)}</span></div><div class="mtrack"><div style="width:${v}%;background:${color}"></div></div></div>`;
  }

  card() {
    const s = this.sale, p = s.p, k = s.known;
    const per = PERSONALITIES[p.personality];
    const chips = (arr, map, cls = '') => arr.map((x) => `<span class="chip ${cls}">${esc(map[x] || x)}</span>`).join('');
    let html = `<div class="cname">${esc(p.name)}</div>`;
    html += `<div class="vibe">${k.personality ? esc(per.label) : 'Read them after you say hi'}</div>`;
    html += this.bar('Trust', s.trust, s.trust > 55 ? '#3ecf6e' : s.trust > 30 ? '#f2c14e' : '#ff4d4d');
    html += this.bar('Interest', s.interest, '#4d8dff');
    html += '<div class="sect">Account</div>';
    if (k.account) {
      const eligible = p.balance === 0;
      html += `<div class="acct"><div>${esc(p.phone)}</div><div>${esc(PLANS[p.plan].name)} · ${p.lines} line${p.lines > 1 ? 's' : ''}</div><div>${esc(p.oldDevice)}</div>
        <div class="${eligible ? 'good' : 'bad'}">${eligible ? 'Upgrade eligible' : `Balance ${money(p.balance)}`}</div></div>`;
    } else html += '<div class="muted">Not looked up</div>';
    html += '<div class="sect">Notes</div>';
    const notes = [];
    if (k.priorities.length) notes.push(chips(k.priorities, TAG_LABEL, 'pri'));
    if (k.budget) notes.push(`<span class="chip">Budget: ${p.budget}</span>`);
    if (k.needs.length) notes.push(chips(k.needs, NEED_LABEL, 'need'));
    if (k.noNeeds.length) notes.push(chips(k.noNeeds, NEED_LABEL, 'no'));
    html += notes.length ? `<div class="chips">${notes.join('')}</div>` : '<div class="muted">Ask questions to learn what they need</div>';
    return html;
  }

  catalog(v) {
    const s = this.sale, k = s.known;
    return `<div class="grid">${v.devices.map((d) => {
      const hits = d.tags.filter((t) => k.priorities.includes(t));
      const sw = k.account && s.isSwitch(d);
      return `<button class="dev" data-act="device" data-id="${d.id}">
        <div class="swatch" style="background:${d.color}"></div>
        <div class="dname">${esc(d.name)}</div>
        <div class="dprice">${monthly(d.price)} <span>${money(d.price)}</span></div>
        <div class="tags">${d.tags.map((t) => `<span class="${hits.includes(t) ? 'hit' : ''}">${TAG_LABEL[t]}</span>`).join('')}</div>
        ${sw ? `<div class="warn">Switch from ${BRAND_NAME[s.p.brand]}</div>` : ''}
      </button>`;
    }).join('')}</div>`;
  }

  addons(v) {
    const s = this.sale, k = s.known;
    const rows = v.addons.map((a) => {
      const hint = k.needs.includes(a.need) ? '<em class="good">mentioned</em>' : k.noNeeds.includes(a.need) ? '<em class="bad">said no</em>' : '';
      return `<label class="addon"><input type="checkbox" name="addon" value="${a.id}"><span>${esc(a.name)}</span><b>${esc(a.price)}</b>${hint}</label>`;
    }).join('');
    const plans = Object.entries(v.plans).map(([id, P]) =>
      `<label class="plan"><input type="radio" name="plan" value="${id}" ${id === s.p.plan ? 'checked' : ''}><span>${P.name}</span><b>${money(P.price)}/mo</b>${id === s.p.plan ? '<em>current</em>' : ''}</label>`).join('');
    return `<div class="addons">${rows}</div><div class="sect">Plan</div><div class="plans">${plans}</div>
      <button class="primary wide" data-act="offer">Recommend these</button>`;
  }

  done() {
    const r = this.sale.result;
    const stars = '★'.repeat(r.csat) + '☆'.repeat(5 - r.csat);
    if (r.sold) {
      return `<div class="result good"><div class="big">SOLD</div><div>${esc(r.device.name)}${r.addons.length ? ` + ${r.addons.map((a) => esc(a.name)).join(', ')}` : ''}</div>
        <div class="comm">+${money(r.commission)} commission</div><div class="stars">${stars}</div>
        <button class="primary wide" data-act="finish">Hand them the bag</button></div>`;
    }
    return `<div class="result bad"><div class="big">NO SALE</div><div class="stars">${stars}</div>
      <button class="primary wide" data-act="finish">Okay</button></div>`;
  }

  render() {
    const s = this.sale;
    if (!s) return;
    const v = s.view();
    const idx = STAGE_INDEX[s.stage];
    const pills = STAGES.map(([, label], i) => `<span class="pill ${i < idx ? 'past' : i === idx ? 'now' : ''}">${label}</span>`).join('');
    const log = s.log.slice(-14).map((l) => `<div class="msg ${l.who}">${esc(l.text)}</div>`).join('');
    let actions = '';
    if (v.kind === 'choices') {
      actions = `<div class="prompt">${esc(v.prompt)}</div>` + v.options.map((o) =>
        `<button class="opt ${o.primary ? 'primary' : ''}" data-act="choose" data-id="${esc(o.id)}">${o.tag ? `<span class="otag">${esc(o.tag)}</span>` : ''}${esc(o.text)}</button>`).join('');
    } else if (v.kind === 'catalog') actions = `<div class="prompt">${esc(v.prompt)}</div>${this.catalog(v)}`;
    else if (v.kind === 'addons') actions = `<div class="prompt">${esc(v.prompt)}</div>${this.addons(v)}`;
    else if (v.kind === 'done') actions = this.done();
    else if (v.kind === 'checkout') actions = '<div class="prompt">Processing…</div>';

    this.el.innerHTML = `<div class="bezel"><div class="screen">
      <header><div class="logo">horizon<span>✓</span></div><div class="pills">${pills}</div>
      ${s.stage !== 'done' && s.stage !== 'checkout' ? '<button class="away" data-act="away">Step away (Esc)</button>' : ''}</header>
      <div class="body"><aside>${this.card()}</aside>
      <main><div class="log">${log}</div><div class="actions">${actions}</div></main></div>
    </div></div>`;
    const logEl = this.el.querySelector('.log');
    logEl.scrollTop = logEl.scrollHeight;
  }
}
