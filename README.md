# Settling Up

A single-player sharecropping game for U.S. History (Day 2, "Bottom Rail on Top"). Students are Robert, a free farmer in Mississippi, and they walk him through five crop years from 1869 to 1873 in first person. The farm is a 3D world with flat 2D paper-cutout people, animals, and crops standing in it. At the end, students audit the planter's books to find out why the family ended in debt.

**Supporting question:** Can you be free if you can't leave?

## Playing it

Open `Settling-Up.html` in Chrome. That one file is the whole game: the 3D library, fonts, and art are packed inside. It needs no internet, no account, and no install, so you can put it on Google Drive or a USB stick and students can double-click it. Progress saves on the device it's played on.

If a computer can't run 3D, the game switches to flat screens and still plays all the way through.

**Controls:**

- **Walk:** W A S D or the arrow keys. Hold Shift to hurry.
- **Look:** drag on the screen.
- **Talk:** tap a person.
- **Touchscreens:** on-screen arrow buttons.

A red flag and a direction arrow at the top of the screen show where to go next. The game never moves Papa for the student.

It takes about 25 minutes.

## How a year works

Papa walks everywhere himself:

1. **The store.** He walks to the planter's store for seed and supplies and picks a Lean, Basic, or Extra furnish basket. Only credit prices are shown.
2. **The field.** At the field's edge he decides which acres go to cotton and which to corn (5 acres of corn at most), then walks the rows to plant. Mama and the children follow with the seed.
3. **Home.** He walks back to the cabin, where the year's event card happens. 1873 is always the Panic.
4. **The harvest.** In the fall he walks the rows with the family, then leads the loaded wagon to the planter's scale. The 10% short weight is applied silently.
5. **Settling up.** He walks up to the big house. The planter reads one number, and students choose to stay, leave, demand the books, or rent a farm if they qualify.

**Handling the field work.** Walking is the only thing students do in the field. There's no tapping, picking, or scoring, and once Papa has walked most of the rows, the family finishes the rest. The decisions sit where the lesson is: the split between cotton and corn, the store, and the porch.

**Endings.** Three endings: still cropping, renting a farm, or lost to the lien (leaving while in debt: the planter's claim takes the crop and goods, and no other planter will sign Papa). Every family ends at the audit.

## Adding your own art

Every cutout, cutscene panel, and event card can be replaced with your own images, including AI-generated ones. Drop a file into `art/`, named after its slot, and rebuild. The build trims each image, gives it a paper edge, resizes it, and packs it into the game. See [`art/README.md`](art/README.md) for the slot list, sizes, prompt tips, and guidance on depicting the family with dignity.

## Building

```
npm install
npm run build     # makes Settling-Up.html (adding your art needs Python 3 with Pillow)
npm test          # checks the spec's worked example and the event rules
npm run sim       # plays 20,000 families per play style to show the tuning
```

`node tools/playtest.mjs` plays the whole game in headless Chromium and saves screenshots (it needs Playwright).

## Tuning

Every number is in `src/config.js`. Results from `npm run sim`:

| Play style | Rent a farm | Ends in debt |
| --- | --- | --- |
| Careful (5 corn, lean every year) | about 32% | about 10% |
| Good (5 corn, basic) | 0% | about 84% |
| Thoughtful, mixed choices | about 3% | about 79% |
| All cotton | 0% | about 95% |

## Choices made beyond the spec

- **Single player, self-contained.** No class codes, teacher board, or shared database.
- **First person through Papa's eyes,** with paper cutouts in a 3D world. Lucy narrates the cutscenes, looking back as an adult.
- **A mule raises the share.** An owned mule raises the family's share to two-thirds, following the spec's note on shares. Without it, renting was out of reach.
- **Lean basket risk.** In a bad year, a Lean basket has a 40% chance of a "thin winter" sickness.
- **Leaving.** Leaving with no debt costs $10 to move ($20 after the night riders card), and savings go with the family.

## Files

- `src/`: the game (config, engine, story, 2D art, 3D world, game flow, page shell)
- `art/`: your own art, plus the guide for making it
- `tools/`: build, art preparation, tuning simulator, playtest
