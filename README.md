# Settling Up

A sharecropping simulation for U.S. History (Day 2, "Bottom Rail on Top"). Students play Robert, a free farmer in Mississippi, through five crop years from 1869 to 1873. They see the world in first person: a 3D farm with flat paper-cutout people, mules, and crops standing in it. Then they become auditors and open the planter's books to find out why they ended in debt.

**Supporting question:** Can you be free if you can't leave?

## Playing it

- **Published:** the game runs as a Claude artifact, so students open one link. The teacher board is at the same link: choose "Teacher board" on the first screen.
- **Download and open:** `Settling-Up.html` is a single standalone file. It needs internet for the 3D library and fonts. If 3D can't load, the game falls back to flat screens and is still fully playable.
- About 25 minutes: contract (2), five crop years (about 12), cutscenes (about 4), audit (4). Families of 2 or 3 can share one device.

## How a year works

1. **Plant.** Walk the 15 acres and tap squares to switch them between cotton and corn (5 acres of corn at most).
2. **Store.** Choose Lean, Basic, or Extra furnish. Only credit prices are shown.
3. **Event card.** One per year, with a "Did you know?" note. 1873 is always the Panic.
4. **Harvest.** Walk the rows with the family, then take the wagon to the planter's scale. The 10% short weight is applied silently.
5. **Settling up.** The planter reads one number. Students choose Stay, Leave, Demand the books, or Rent a farm if they qualify.

Three endings: still cropping, renting a farm, or arrested for vagrancy (leaving while in debt). Every family ends at the audit.

## Teacher board

- **Class code:** students type it when they join.
- **Solo or Class mode:** in Class mode, every family waits for you at the start of each year.
- **Open the books:** the audit unlocks for everyone at once.
- **Live board:** each family's balance, a bar chart, and a count of endings.

The live board uses the artifact's shared database. Students report automatically only when they open the link signed in to claude.ai with at least Contributor access. Everyone else can still play the whole game. For those families, type the report line from their final screen into "Add a family by hand."

## Tuning

Every number is in `src/config.js`: prices, markup, short weight, interest, event odds, and the rent threshold. To see how the numbers play out, run `npm run sim`, which plays 20,000 families per play style:

| Play style | Rent a farm | Ends in debt |
| --- | --- | --- |
| Careful (5 corn, lean every year) | about 32% | about 10% |
| Good (5 corn, basic) | 0% | about 84% |
| Thoughtful class, mixed choices | about 3% | about 79% |
| All cotton | 0% | about 95% |

`npm test` checks the spec's worked example (1869, all cotton, basic: +$25.00), the seeded draws, and the election-year rule.

## Choices made beyond the spec

- **First person through Papa's eyes,** with paper cutouts in a 3D world. Lucy narrates the cutscenes, looking back as an adult.
- **A mule raises the share.** An owned mule raises the family's share to two-thirds, following the spec's note on shares for families with stock. Without it, renting was out of reach.
- **Lean basket risk.** In a bad year (drought, flood, mule dies, sickness, night riders, Panic), a Lean basket has a 40% chance of a "thin winter" sickness.
- **Leaving.** Leaving with no debt costs $10 to move ($20 after the night riders card), and savings go with the family.
- **Defaults on the spec's open questions:** Solo mode, start at the contract, and the family surname is chosen by students.

## Files

- `src/`: the game source (config, engine, story, art, 3D world, UI, teacher board)
- `tools/build.mjs`: builds `dist/settling-up.html` (artifact) and `Settling-Up.html` (standalone)
- `tools/simulate.mjs`: tuning simulator and checks
- `tools/playtest.mjs`: plays the whole game in headless Chromium and saves screenshots
