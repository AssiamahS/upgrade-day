# Upgrade Day

A first-person wireless store sales simulator. You work the floor of a phone store: people walk in, browse the
display tables, and wait for help. Greet them, ask the right discovery questions, recommend a phone that fits,
handle the objection, offer only the add-ons they actually need, and close — all on the store tablet.

Ignore someone too long and they walk out. Push stuff they don't need and your rating tanks.

**Play:** https://assiamahs.github.io/upgrade-day/

## Controls
| Desktop | Touch |
|---|---|
| WASD + mouse, Shift to hustle | left-side joystick, drag to look |
| **E** help a customer / go back to them | **E** button |
| **F** "I'll be right with you" (refills patience once) | **F** button |
| **Esc** step away from the tablet | "Step away" on the tablet |

## How a sale scores
- **Trust** — greeting, apologising for the wait, not being pushy, keeping promises.
- **Interest** — pitching benefits that match what they told you, the right phone for their budget.
- **Close chance** = trust + interest + phone fit. CSAT drops when they leave with extras they didn't need.

Commission builds a bank you spend on store upgrades between shifts (lounge seating, coffee bar, check-in kiosk,
objection training). Progress saves in the browser.

## Build
No bundler. Three.js loads from jsDelivr via an import map. GitHub Actions runs the sale simulation tests
(`npm test`) and deploys to GitHub Pages on every push to `main`.
