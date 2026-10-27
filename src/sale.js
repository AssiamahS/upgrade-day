// The conversation engine behind the tablet: greet → discover → recommend → pitch → objection → add-ons → close.
import {
  DEVICES, PLANS, ADDONS, PERSONALITIES, REASONS, PRIORITY_ANS, BUDGET_ANS, NEED_YES, QUESTIONS,
  BENEFIT, OBJECTIONS, GREETINGS, CLOSES, BRAND_NAME, TAG_LABEL, pick, shuffle, money, monthly,
} from './data.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

export class Sale {
  constructor(customer, game) {
    this.c = customer;
    this.p = customer.profile;
    this.g = game;
    this.per = PERSONALITIES[this.p.personality];
    this.stage = 'greet';
    this.trust = 45 + (game.save.upgrades.coffee ? 10 : 0);
    this.interest = 20;
    this.fit = 0;
    this.log = [];
    this.asked = new Set();
    this.known = { priorities: [], needs: [], budget: false, account: false, personality: false, noNeeds: [] };
    this.device = null;
    this.plan = this.p.plan;
    this.pitches = 0;
    this.swaps = 0;
    this.promise = false;
    this.accepted = [];
    this.pushedExtras = 0;
    this.result = null;
    this.greetOpts = shuffle(GREETINGS);
    this.say('them', this.c.waitRatio() > 0.6 ? '(Arms crossed. Checking the time.)' : '(Looks up from the display.)');
  }

  say(who, text) { this.log.push({ who, text }); }
  me(text) { this.say('me', fill(text, { me: this.g.playerName })); }

  adjust(trust = 0, interest = 0) {
    this.trust = clamp(this.trust + trust, 0, 100);
    this.interest = clamp(this.interest + interest, 0, 100);
    if (this.trust <= 0 && !this.result) this.walk("I'm good. I'll go somewhere else.");
  }

  walk(line) {
    this.say('them', line);
    this.result = { sold: false, commission: 0, csat: 1, line };
    this.stage = 'done';
  }

  // What the tablet should render right now.
  view() {
    switch (this.stage) {
      case 'greet':
        return { kind: 'choices', prompt: 'Greet the customer', options: this.greetOpts.map((g, i) => ({ id: i, text: fill(g.text, { me: this.g.playerName }) })) };
      case 'discover': {
        const qs = QUESTIONS.filter((q) => !this.asked.has(q.id)).map((q) => ({ id: q.id, text: q.text, tag: q.kind === 'account' ? 'Lookup' : null }));
        qs.push({ id: '__next', text: "Alright — let me show you a few phones that fit.", tag: 'Next step', primary: true });
        return { kind: 'choices', prompt: `Discovery — ask good questions (${this.asked.size} asked)`, options: qs };
      }
      case 'recommend':
        return { kind: 'catalog', prompt: 'Pick a phone to recommend', devices: DEVICES };
      case 'pitch':
        return { kind: 'choices', prompt: `Pitch the ${this.device.name}`, options: this.pitchOpts };
      case 'objection':
        return { kind: 'choices', prompt: 'Handle the objection', options: this.objOpts };
      case 'addons':
        return { kind: 'addons', prompt: "Build the bundle — only what they'll actually use", addons: ADDONS, plans: PLANS };
      case 'close':
        return { kind: 'choices', prompt: 'Close the sale', options: this.closeOpts };
      case 'checkout':
        return { kind: 'checkout', prompt: 'Processing' };
      default:
        return { kind: 'done', prompt: this.result?.sold ? 'Sale complete' : 'Customer left' };
    }
  }

  choose(id) {
    if (this.stage === 'done') return;
    this.g.sfx('tap');
    const fn = this[`on_${this.stage}`];
    if (fn) fn.call(this, id);
  }

  on_greet(i) {
    const g = this.greetOpts[i];
    this.me(g.text);
    const waited = this.c.waitRatio();
    let t = g.trust;
    if (g.apology) t += waited > 0.4 ? 14 : 0;
    else if (waited > 0.5) { t -= 10; this.say('them', 'Took you long enough.'); }
    this.adjust(t, 0);
    if (this.stage === 'done') return;
    this.say('them', REASONS[this.p.reason]);
    this.known.personality = true;
    this.stage = 'discover';
  }

  on_discover(id) {
    if (id === '__next') {
      this.me("Alright — based on what you told me, let me show you a couple phones.");
      this.stage = 'recommend';
      return;
    }
    const q = QUESTIONS.find((x) => x.id === id);
    this.asked.add(id);
    this.me(q.text);
    if (this.asked.size > this.per.maxQ) {
      this.adjust(-8, 0);
      if (this.stage === 'done') return;
      this.say('them', '(sighs) Can we speed this up a little?');
    }
    if (q.kind === 'priority') {
      const pr = this.p.priorities[q.index];
      this.say('them', PRIORITY_ANS[pr][q.index]);
      if (!this.known.priorities.includes(pr)) this.known.priorities.push(pr);
      this.adjust(4, 4);
    } else if (q.kind === 'budget') {
      this.say('them', BUDGET_ANS[this.p.budget]);
      this.known.budget = true;
      this.adjust(this.p.personality === 'skeptical' ? -2 : 2, 0);
    } else if (q.kind === 'account') {
      this.say('them', `Sure, it's ${this.p.phone}.`);
      this.known.account = true;
      this.adjust(3, 0);
    } else {
      const hit = q.needs.find((n) => this.p.needs.includes(n));
      if (hit) {
        this.say('them', NEED_YES[hit]);
        q.needs.filter((n) => this.p.needs.includes(n)).forEach((n) => this.known.needs.push(n));
        this.adjust(4, 2);
      } else {
        this.say('them', q.no);
        this.known.noNeeds.push(...q.needs);
        this.adjust(1, 0);
      }
    }
  }

  deviceFit(d) {
    let fit = 0;
    for (const pr of this.p.priorities) if (d.tags.includes(pr)) fit += 28;
    const b = this.p.budget;
    if (b === 'tight') fit += d.price <= 600 ? 20 : d.price > 900 ? -35 : -10;
    if (b === 'mid') fit += d.price <= 900 ? 10 : d.price > 1100 ? -20 : 0;
    if (b === 'open' && d.tags.includes('premium')) fit += 12;
    if (this.isSwitch(d)) fit -= 12;
    return fit;
  }

  isSwitch(d) { return (d.brand === 'apex') !== (this.p.brand === 'apex'); }

  on_recommend(deviceId) {
    const d = DEVICES.find((x) => x.id === deviceId);
    if (this.device) { this.swaps++; this.adjust(-3, 0); }
    if (this.stage === 'done') return;
    this.device = d;
    this.fit = this.deviceFit(d);
    this.me(`I think the ${d.name} would be great for you. It's ${money(d.price)}, or ${monthly(d.price)} over 36 months.`);
    if (this.p.budget === 'tight' && d.price > 900) this.say('them', "Whoa. That's way more than I wanted to spend.");
    else if (this.fit >= 40) this.say('them', "Ooh, okay. I like that.");
    else if (this.fit >= 15) this.say('them', 'Hm. Maybe.');
    else this.say('them', "I don't know... that's not really what I'm looking for.");
    this.adjust(0, this.fit / 2);
    this.buildPitch();
    this.stage = 'pitch';
  }

  buildPitch() {
    const d = this.device;
    const tags = shuffle(d.tags).slice(0, 2);
    const mo = monthly(d.price);
    const opts = tags.map((t) => ({ id: `b:${t}`, text: fill(BENEFIT[t], { mo }), tag: TAG_LABEL[t] }));
    opts.push({ id: 'spec', text: `It's got a ${d.spec}. Benchmarks are crazy.`, tag: 'Specs' });
    opts.push({ id: 'pushy', text: 'Honestly, everybody is buying this one right now.', tag: 'Hype' });
    opts.push({ id: 'back', text: 'Actually — let me show you something else.', tag: 'Swap phone' });
    if (this.pitches > 0) opts.push({ id: 'move', text: "I really think this is the one for you.", tag: 'Next step', primary: true });
    this.pitchOpts = opts;
  }

  on_pitch(id) {
    const opt = this.pitchOpts.find((o) => o.id === id);
    if (id === 'back') { this.me(opt.text); this.stage = 'recommend'; return; }
    if (id === 'move') { this.me(opt.text); this.startObjection(); return; }
    this.me(opt.text);
    this.pitches++;
    if (id.startsWith('b:')) {
      const tag = id.slice(2);
      if (this.p.priorities.includes(tag)) { this.adjust(5, 20); this.say('them', pick(["That's exactly what I need.", 'Okay, now you are speaking my language.', 'See, that matters to me.'])); }
      else { this.adjust(0, 3); this.say('them', pick(['Okay.', "Cool, I guess.", "That's nice."])); }
    } else if (id === 'spec') {
      this.adjust(this.per.spec < 0 ? this.per.spec : 0, Math.max(0, this.per.spec));
      this.say('them', this.per.spec > 0 ? 'Oh nice, that chip is fast.' : this.per.spec < 0 ? "I have no idea what any of that means." : 'Uh huh.');
    } else if (id === 'pushy') {
      this.adjust(this.per.pushy, 0);
      if (this.stage === 'done') return;
      this.say('them', "I don't care what everybody else is buying.");
    }
    if (this.stage === 'done') return;
    if (this.pitches >= 3) this.startObjection();
    else this.buildPitch();
  }

  startObjection() {
    const d = this.device;
    const credit = PLANS.max.tradeIn;
    const net = Math.max(0, d.price - Math.min(credit, d.price * 0.6)) / 36;
    let type;
    if (this.p.balance > 0 && !this.known.account) type = 'payoff';
    else if (this.p.balance > 0 && Math.random() < 0.5) type = 'payoff';
    else if (this.isSwitch(d)) type = 'switch';
    else if (this.p.budget === 'tight' && d.price > 600) type = 'price';
    else if (this.p.personality === 'skeptical') type = 'oversold';
    else if (this.p.personality === 'rushed') type = 'time';
    else type = pick(['think', 'price']);
    if (type === 'payoff' && !this.known.account) {
      this.say('them', "You didn't even check my account?");
      this.known.account = true;
      this.adjust(-6, 0);
      if (this.stage === 'done') return;
    }
    const o = OBJECTIONS[type];
    const vars = { old: BRAND_NAME[this.p.brand], bal: money(this.p.balance), credit: money(credit), net: `$${net.toFixed(2)}` };
    this.say('them', fill(o.say, vars));
    this.objType = type;
    const training = this.g.save.upgrades.training;
    this.objOpts = shuffle(o.options.map((op, i) => ({ id: i, text: fill(op.text, vars), tag: training && op.best ? 'Best practice' : null })));
    this.objVars = vars;
    this.stage = 'objection';
  }

  on_objection(i) {
    const op = OBJECTIONS[this.objType].options[i];
    this.me(fill(op.text, this.objVars));
    let ti = op.interest;
    if (op.bargainBonus && this.p.personality === 'bargain') ti += op.bargainBonus;
    if (op.promise) this.promise = true;
    this.adjust(op.trust, ti);
    if (this.stage === 'done') return;
    this.say('them', op.reply);
    this.stage = 'addons';
  }

  on_addons({ addons, plan }) {
    const offered = ADDONS.filter((a) => addons.includes(a.id));
    this.g.stats.offered += offered.length;
    if (!offered.length && plan === this.p.plan) {
      this.me("I'm not going to load you up with extras — just the phone.");
      this.say('them', 'Perfect.');
      this.adjust(4, 0);
    }
    for (const a of offered) {
      this.me(`I'd also recommend the ${a.name} (${a.price}).`);
      if (this.p.needs.includes(a.need)) {
        this.say('them', a.yes);
        this.accepted.push(a);
        this.adjust(3, 4);
      } else {
        const impulse = this.p.budget === 'open' ? 0.35 : this.p.budget === 'mid' ? 0.15 : 0;
        if (Math.random() < impulse) { this.say('them', 'Eh... sure, why not.'); this.accepted.push(a); this.pushedExtras++; }
        else { this.say('them', a.no); this.adjust(this.promise ? -14 : this.p.budget === 'tight' ? -8 : -5, 0); }
      }
      if (this.stage === 'done') return;
    }
    if (plan !== this.p.plan) {
      const P = PLANS[plan];
      this.me(`And I'd move you to ${P.name} — that's ${money(P.price)} a month per line and it unlocks ${money(P.tradeIn)} in trade-in credit.`);
      const needsUp = (this.p.needs.includes('travel') && plan === 'max') || (this.p.needs.includes('hotspot') && P.rank >= 1);
      if (needsUp) { this.say('them', "Wait, that covers that? Then yes."); this.planChange = true; this.adjust(4, 8); }
      else if (P.rank < PLANS[this.p.plan].rank) { this.say('them', 'Lower bill? Love that.'); this.planChange = true; this.adjust(10, 0); }
      else if (this.p.budget === 'open' && Math.random() < 0.4) { this.say('them', 'Sure, if it gets me the bigger trade-in.'); this.planChange = true; this.pushedExtras++; }
      else { this.say('them', "I'm good on my plan, thanks."); this.adjust(this.p.budget === 'tight' ? -8 : -4, 0); }
      if (this.planChange) this.plan = plan;
    }
    if (this.stage === 'done') return;
    this.closeOpts = shuffle(CLOSES.map((c, i) => ({ id: i, text: c.text })));
    this.stage = 'close';
  }

  closeChance(mod = 0) {
    return clamp((this.trust * 0.55 + this.interest * 0.6 + this.fit * 0.35) / 100 - 0.12 + mod, 0.04, 0.97);
  }

  on_close(i) {
    const c = CLOSES[i];
    this.me(c.text);
    this.adjust(c.trust, 0);
    if (this.stage === 'done') return;
    const chance = this.closeChance(c.mod);
    if (Math.random() < chance) {
      this.say('them', pick(["Yeah. Let's do it.", "Okay — you sold me.", 'Alright, set it up.']));
      this.stage = 'checkout';
    } else {
      this.walk(pick(["I think I'm going to hold off for now.", "I'll think about it. Thanks though.", "Let me talk to my husband first.", "I'm going to look around a bit more."]));
      this.result.csat = clamp(Math.round(1 + this.trust / 30), 1, 4);
    }
  }

  // Called by the tablet when the checkout animation finishes.
  finish() {
    let commission = 30;
    for (const a of this.accepted) commission += a.commission;
    if (this.planChange && PLANS[this.plan].rank > PLANS[this.p.plan].rank) commission += 15 * (PLANS[this.plan].rank - PLANS[this.p.plan].rank);
    let csat = 1 + Math.round(this.trust / 25);
    if (this.fit >= 40) csat += 1;
    csat -= this.pushedExtras;
    this.result = { sold: true, commission, csat: clamp(csat, 1, 5), device: this.device, addons: this.accepted };
    this.say('them', csat >= 4 ? 'Thank you so much, you were great!' : 'Thanks.');
    this.stage = 'done';
  }
}
