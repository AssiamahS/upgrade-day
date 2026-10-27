// Game content: phones, plans, add-ons, customer generation and every line people say.

export const DEVICES = [
  { id: 'apex17pm', name: 'Apex 17 Pro Max', brand: 'apex', price: 1199, color: '#c9b79c', tags: ['camera', 'battery', 'big', 'premium'], spec: '6.9" display, 48MP triple camera, A19 Pro, 33-hr battery' },
  { id: 'apex17p', name: 'Apex 17 Pro', brand: 'apex', price: 999, color: '#6f7d8c', tags: ['camera', 'premium', 'compact'], spec: '6.3" ProMotion, 48MP telephoto, A19 Pro' },
  { id: 'apex17', name: 'Apex 17', brand: 'apex', price: 799, color: '#7fb3d5', tags: ['camera', 'battery'], spec: '6.3" display, 48MP fusion camera, A19' },
  { id: 'apex16e', name: 'Apex 16e', brand: 'apex', price: 599, color: '#f2f2f2', tags: ['value', 'compact'], spec: '6.1" display, 48MP camera, A18' },
  { id: 'stellar26u', name: 'Stellar S26 Ultra', brand: 'stellar', price: 1299, color: '#2b2b2b', tags: ['camera', 'work', 'big', 'battery', 'premium'], spec: '6.9" QHD+, 200MP, built-in pen, 5000mAh' },
  { id: 'stellar26', name: 'Stellar S26', brand: 'stellar', price: 799, color: '#a7c4a0', tags: ['compact', 'camera'], spec: '6.2" display, 50MP triple camera' },
  { id: 'stellara37', name: 'Stellar A37', brand: 'stellar', price: 399, color: '#3d5a80', tags: ['value', 'battery', 'big'], spec: '6.7" display, 5000mAh, 50MP' },
  { id: 'flipz7', name: 'Stellar Flip Z7', brand: 'stellar', price: 1099, color: '#d8a7c8', tags: ['compact', 'premium'], spec: 'Folds in half, 3.4" cover screen, 50MP' },
  { id: 'pixa10p', name: 'Pixa 10 Pro', brand: 'pixa', price: 999, color: '#e8dcc8', tags: ['camera', 'work', 'premium'], spec: '6.3" LTPO, best-in-class AI camera, 7 yrs updates' },
  { id: 'pixa10a', name: 'Pixa 10a', brand: 'pixa', price: 499, color: '#9ccfd8', tags: ['value', 'camera'], spec: '6.1" display, flagship camera brain for less' },
];

export const TAG_LABEL = {
  camera: 'Camera', battery: 'Battery', big: 'Big screen', compact: 'Compact',
  value: 'Value', work: 'Work', premium: 'Premium',
};

export const PLANS = {
  start: { name: 'Unlimited Start', price: 65, rank: 0, tradeIn: 200 },
  plus: { name: 'Unlimited Plus', price: 80, rank: 1, tradeIn: 400 },
  max: { name: 'Unlimited Max', price: 90, rank: 2, tradeIn: 800 },
};

// need = which hidden customer need makes them say yes
export const ADDONS = [
  { id: 'protect', name: 'Total Protection', price: '$17/mo', need: 'clumsy', commission: 10, yes: "Yeah... honestly I need that. I break everything.", no: "Nah, I'm careful with my phones." },
  { id: 'case', name: 'Case + glass screen protector', price: '$79', need: 'clumsy', commission: 8, yes: 'Definitely, put a case on it.', no: "I'll just grab a case online." },
  { id: 'charger', name: '45W fast charger', price: '$49', need: 'slowCharge', commission: 4, yes: "If it actually charges fast? Yes.", no: "My charger's fine." },
  { id: 'buds', name: 'Wireless earbuds', price: '$179', need: 'music', commission: 12, yes: 'Ooh, for the train? Okay, yeah.', no: "I don't really need earbuds." },
  { id: 'watch', name: 'Smartwatch + line', price: '$399 + $10/mo', need: 'fitness', commission: 20, yes: 'That would be great for my runs, actually.', no: "I don't wear watches." },
  { id: 'line', name: 'New line + phone for family', price: '+$40/mo', need: 'kid', commission: 35, yes: "You know what, she's been begging. Let's do it.", no: "Nobody else needs a phone right now." },
  { id: 'home', name: 'Home Internet', price: '$50/mo', need: 'homeNet', commission: 50, yes: "Cheaper AND faster than what I have? Sign me up.", no: "My internet at home is fine." },
];

export const PERSONALITIES = {
  friendly: { label: 'Friendly, chatty', patience: 1.2, maxQ: 6, spec: 0, pushy: -8 },
  rushed: { label: 'In a hurry', patience: 0.7, maxQ: 2, spec: 0, pushy: -8 },
  skeptical: { label: 'Skeptical of salespeople', patience: 1.0, maxQ: 5, spec: 4, pushy: -18 },
  bargain: { label: 'Deal hunter', patience: 1.0, maxQ: 5, spec: 0, pushy: -3 },
  techie: { label: 'Knows tech', patience: 0.9, maxQ: 4, spec: 15, pushy: -10 },
  senior: { label: 'Takes their time', patience: 1.4, maxQ: 7, spec: -12, pushy: -12 },
};

const NAMES = ['Maria', 'DeShawn', 'Priya', 'Tom', 'Keisha', 'Luis', 'Grace', 'Kwame', 'Emily', 'Jamal', 'Sofia', 'Ahmed', 'Linda', 'Marcus', 'Chen', 'Brianna', 'Frank', 'Ama', 'Tyler', 'Rosa', 'Dorothy', 'Jordan', 'Fatima', 'Kevin', 'Nia', 'Hector', 'Megan', 'Raj', 'Carol', 'Dante'];

export const REASONS = {
  cracked: "My screen's cracked and it's getting worse every day.",
  battery: "My battery is dead by lunch. Every single day.",
  slow: "My phone is so slow. Apps keep crashing on me.",
  eligible: "I got a text saying I'm eligible for an upgrade?",
  lost: "I lost my phone last night. I need something today.",
};

export const PRIORITY_ANS = {
  camera: ["Honestly? Pictures. My kids, my dog, everything.", "The camera is trash. Every photo comes out blurry."],
  battery: ["I'm out all day for work, it has to last.", "I'm always looking for an outlet. It's embarrassing."],
  value: ["Calls, texts, Facebook. Nothing crazy.", "I don't need anything fancy, I just want it to work."],
  big: ["Watching shows on my break. YouTube, Netflix.", "The screen's too small, I'm squinting all the time."],
  compact: ["I just want it to fit in my pocket.", "These new phones are huge. I hate big phones."],
  work: ["Email, spreadsheets — I basically run my business off it.", "It can't keep up with work stuff. Too many apps open and it dies."],
};

export const BUDGET_ANS = {
  tight: "I really can't do more than like twenty bucks a month for the phone.",
  mid: "Somewhere in the middle. I'm not trying to get the most expensive one.",
  open: "If it's worth it, I'll pay for it.",
};

export const NEED_LABEL = {
  clumsy: 'Drops / breaks phones', travel: 'Travels abroad', hotspot: 'Uses hotspot',
  homeNet: 'Bad home internet', fitness: 'Works out / runs', music: 'Listens to music a lot',
  kid: 'Family member wants a phone', slowCharge: 'Charging is slow',
};

export const NEED_YES = {
  clumsy: "Ha — this is my third cracked screen this year.",
  travel: "I go overseas to see family a couple times a year.",
  hotspot: "Yeah, I hotspot my laptop on the road all the time.",
  homeNet: "Ugh. Slow and it costs me like ninety a month.",
  fitness: "I run every morning, yeah.",
  music: "Music all day. I'm on the train an hour each way.",
  kid: "My daughter's been begging me for a phone, actually.",
  slowCharge: "It takes forever. Like three hours.",
};

export const QUESTIONS = [
  { id: 'use', text: 'What do you use your phone for the most?', kind: 'priority', index: 0 },
  { id: 'pain', text: 'What do you love or hate about the phone you have now?', kind: 'priority', index: 1 },
  { id: 'budget', text: 'What are you hoping to spend monthly on the phone?', kind: 'budget' },
  { id: 'account', text: 'Can I grab your number and pull up your account?', kind: 'account' },
  { id: 'lines', text: 'Is there anyone else on the account who might need something?', kind: 'need', needs: ['kid'], no: 'No, just me on here.' },
  { id: 'home', text: "How's your internet at home?", kind: 'need', needs: ['homeNet'], no: "It's fine, no complaints." },
  { id: 'travel', text: 'Do you travel at all, or use your phone as a hotspot?', kind: 'need', needs: ['travel', 'hotspot'], no: 'Not really, I stay local.' },
  { id: 'drop', text: 'Ever cracked a screen or lost a phone before?', kind: 'need', needs: ['clumsy'], no: "Nope, I'm careful." },
  { id: 'active', text: 'Do you work out, or listen to a lot of music?', kind: 'need', needs: ['fitness', 'music'], no: "Not really, no." },
  { id: 'charge', text: "How's charging been — does it take forever?", kind: 'need', needs: ['slowCharge'], no: "Charging's fine." },
];

export const BENEFIT = {
  camera: 'Low-light photos on this are unreal — pictures at night actually look like what you saw.',
  battery: "This goes all day and then some. You won't be hunting for an outlet at 3pm anymore.",
  value: 'It does everything you need for a lot less — about {mo} a month.',
  big: 'The screen is huge and bright — shows, YouTube, all of it looks amazing.',
  compact: 'It fits in any pocket and it is so much easier to use one-handed.',
  work: "It's built for work — split screen, email, docs, it won't choke with ten apps open.",
  premium: "This is top of the line. It's going to feel fast for years, not months.",
};

export const OBJECTIONS = {
  price: {
    say: "That's more than I wanted to spend, honestly.",
    options: [
      { text: "Totally fair. With your trade-in it works out to about {net} a month — let me show you the math.", best: true, trust: 10, interest: 15, reply: 'Oh. Okay, that is less than I thought.' },
      { text: 'We have a cheaper one I can show you if you want to compare.', trust: 6, interest: -5, reply: "Maybe... but I liked this one." },
      { text: "It's worth it, trust me.", trust: -10, interest: -5, reply: '...Sure.' },
      { text: 'Phones are expensive everywhere right now.', trust: -6, interest: -6, reply: "That doesn't really help me." },
    ],
  },
  think: {
    say: 'I think I need to think about it.',
    options: [
      { text: "Of course. Just so I'm helping — is it the price or the phone itself you're unsure about?", best: true, trust: 8, interest: 15, reply: "I guess... the price? But I do like it." },
      { text: 'No pressure. Want me to hold one for you until tonight?', trust: 6, interest: 2, reply: 'Maybe. Thanks.' },
      { text: 'This deal ends today though.', trust: -15, interest: 5, bargainBonus: 12, reply: 'Hm. Every deal "ends today."' },
      { text: "That's fine, the deal will still be here.", trust: 2, interest: -12, reply: "Okay, I'll probably come back." },
    ],
  },
  switch: {
    say: "I've always had a {old}... I'm nervous about switching everything over.",
    options: [
      { text: "We'll move your photos, contacts and chats right here before you leave — and you have 30 days to return it.", best: true, trust: 12, interest: 15, reply: "Oh, you'll do it for me? Okay, that's a relief." },
      { text: "They're all basically the same now honestly.", trust: -4, interest: 0, reply: "I don't know about that." },
      { text: "Your old one is overrated anyway.", trust: -14, interest: -5, reply: 'Wow. Okay.' },
      { text: 'Want to see the {old} version instead?', trust: 4, interest: -8, reply: "Maybe that's safer." },
    ],
  },
  payoff: {
    say: 'Wait — I still owe {bal} on my current phone.',
    options: [
      { text: 'Good news — trading it in on the right plan covers up to {credit}, which wipes that balance out.', best: true, trust: 10, interest: 15, reply: "Seriously? That's way better than I thought." },
      { text: 'You can pay it off today and start fresh.', trust: 2, interest: -8, reply: "I wasn't planning on spending that today." },
      { text: "Don't worry about that.", trust: -12, interest: -4, reply: 'I kind of have to worry about it.' },
      { text: 'Everybody has a balance, it rolls over.', trust: -8, interest: 0, reply: "That doesn't sound right..." },
    ],
  },
  oversold: {
    say: "Last time I came in here I walked out paying for a bunch of stuff I didn't need.",
    options: [
      { text: "Fair. I'll only set you up with what fixes what you told me — nothing extra.", best: true, trust: 18, interest: 8, reply: "Okay. I appreciate that.", promise: true },
      { text: 'I hear that a lot.', trust: -3, interest: 0, reply: "Yeah, I bet you do." },
      { text: "I'm not like other reps.", trust: -6, interest: 0, reply: "That's what the last one said." },
      { text: "Well, the extras are what make it a good deal.", trust: -15, interest: -5, reply: 'And there it is.' },
    ],
  },
  time: {
    say: "How long is this gonna take? I'm on my lunch break.",
    options: [
      { text: "I'll keep it quick — fifteen minutes and you're out the door with everything transferred.", best: true, trust: 12, interest: 10, reply: 'Okay, perfect. Let\'s do it.' },
      { text: 'Should be about an hour with the transfer.', trust: -4, interest: -10, reply: 'An hour?!' },
      { text: "Depends on the system, it's been slow today.", trust: -8, interest: -6, reply: 'Great...' },
      { text: 'Want to come back after work instead?', trust: 4, interest: -15, reply: 'Maybe I will.' },
    ],
  },
};

export const GREETINGS = [
  { text: "Hey, welcome in! I'm {me}. What brings you in today?", trust: 12 },
  { text: 'Thanks for waiting — sorry about that. What can I help you with?', trust: 6, apology: true },
  { text: 'Are you buying something today, or just looking?', trust: -10 },
  { text: 'Yeah?', trust: -15 },
];

export const CLOSES = [
  { text: "Let's get you set up. I'll transfer everything over while we do the paperwork.", mod: 0.12, trust: 0 },
  { text: 'So... do you want it?', mod: -0.06, trust: -2 },
  { text: 'You should grab it before I change my mind on this price.', mod: -0.25, trust: -15 },
];

export const UPGRADES = [
  { id: 'lounge', name: 'Lounge seating', cost: 300, desc: 'Waiting customers lose patience 25% slower.' },
  { id: 'coffee', name: 'Coffee bar', cost: 250, desc: 'Every customer starts with +10 trust.' },
  { id: 'kiosk', name: 'Check-in kiosk', cost: 500, desc: 'New customers are auto-acknowledged when they walk in.' },
  { id: 'training', name: 'Objection training', cost: 400, desc: 'The best objection response is marked on the tablet.' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
export { pick, shuffle };

export function makeProfile(usedNames) {
  const free = NAMES.filter((n) => !usedNames.has(n));
  const name = pick(free.length ? free : NAMES);
  const personality = pick(Object.keys(PERSONALITIES));
  const priorities = shuffle(Object.keys(PRIORITY_ANS)).slice(0, 2);
  const needs = shuffle(Object.keys(NEED_YES)).slice(0, 1 + Math.floor(Math.random() * 3));
  const budget = personality === 'bargain' ? pick(['tight', 'tight', 'mid']) : pick(['tight', 'mid', 'mid', 'open']);
  if (personality === 'senior' && !priorities.includes('value')) priorities[1] = 'value';
  const brand = pick(['apex', 'apex', 'stellar', 'pixa']);
  const balance = Math.random() < 0.25 ? 120 + Math.floor(Math.random() * 27) * 10 : 0;
  return {
    name,
    personality,
    priorities,
    needs,
    budget,
    brand,
    reason: pick(Object.keys(REASONS)),
    plan: pick(['start', 'start', 'plus', 'plus', 'max']),
    lines: 1 + Math.floor(Math.random() * 4),
    balance,
    phone: `(732) 555-${String(1000 + Math.floor(Math.random() * 9000))}`,
    oldDevice: { apex: 'Apex 13', stellar: 'Stellar S21', pixa: 'Pixa 6' }[brand],
  };
}

export const BRAND_NAME = { apex: 'Apex', stellar: 'Stellar', pixa: 'Pixa' };
export const money = (n) => `$${n.toFixed(n % 1 ? 2 : 0)}`;
export const monthly = (price) => `$${(price / 36).toFixed(2)}/mo`;
