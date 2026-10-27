// Plays thousands of simulated sales: a rep who listens should out-close a rep who doesn't.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sale } from '../src/sale.js';
import { makeProfile, DEVICES, OBJECTIONS, GREETINGS, CLOSES } from '../src/data.js';

const game = () => ({ save: { upgrades: {} }, playerName: 'Sly', stats: { offered: 0 }, sfx() {} });
const customer = () => ({ profile: makeProfile(new Set()), waitRatio: () => 0.2 });

function play(good) {
  const s = new Sale(customer(), game());
  const step = () => s.view();
  s.choose(s.greetOpts.findIndex((g) => g.text === (good ? GREETINGS[0].text : 'Yeah?')));
  if (good) for (const q of ['use', 'pain', 'budget', 'account']) if (s.stage === 'discover') s.choose(q);
  if (s.stage === 'discover') s.choose('__next');
  if (s.stage === 'recommend') {
    const d = good ? [...DEVICES].sort((a, b) => s.deviceFit(b) - s.deviceFit(a))[0] : DEVICES[4];
    s.choose(d.id);
  }
  if (s.stage === 'pitch') {
    const opt = good ? step().options.find((o) => o.id.startsWith('b:') && s.p.priorities.includes(o.id.slice(2))) || step().options[0] : step().options.find((o) => o.id === 'pushy');
    s.choose(opt.id);
  }
  if (s.stage === 'pitch') s.choose(step().options.find((o) => o.id === 'move').id);
  if (s.stage === 'objection') {
    const opts = OBJECTIONS[s.objType].options;
    s.choose(good ? opts.findIndex((o) => o.best) : opts.findIndex((o) => o.trust === Math.min(...opts.map((x) => x.trust))));
  }
  if (s.stage === 'addons') s.choose({ addons: good ? s.p.needs.slice(0, 0) : ['protect', 'buds', 'watch', 'home'], plan: s.p.plan });
  if (s.stage === 'close') s.choose(good ? 0 : CLOSES.length - 1);
  if (s.stage === 'checkout') s.finish();
  assert.equal(s.stage, 'done');
  return s.result;
}

test('every sale reaches a result', () => {
  for (let i = 0; i < 500; i++) { play(true); play(false); }
});

test('listening beats pushing', () => {
  const rate = (good) => { let n = 0; for (let i = 0; i < 2000; i++) if (play(good).sold) n++; return n / 2000; };
  const good = rate(true), bad = rate(false);
  console.log({ good, bad });
  assert.ok(good > 0.55, `good rep closes ${good}`);
  assert.ok(bad < 0.2, `pushy rep closes ${bad}`);
});

test('commission and csat stay in range', () => {
  for (let i = 0; i < 500; i++) {
    const r = play(true);
    assert.ok(r.csat >= 1 && r.csat <= 5);
    if (r.sold) assert.ok(r.commission >= 30);
  }
});
