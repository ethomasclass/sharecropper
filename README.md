# Settling Up

A single-player sharecropping game for U.S. History (Day 2, "Bottom Rail on Top"). Students are Robert, a free farmer in Mississippi, and they walk him through five crop years from 1869 to 1873 in first person. The farm is a 3D world with flat 2D paper-cutout people, animals, and crops standing in it. At the end, students audit the planter's books to find out why the family ended in debt.

**Supporting question:** Can you be free if you can't leave?

## Playing it

Open `Settling-Up.html` in Chrome. That one file is the whole game: the 3D library, fonts, and art are packed inside. It needs no internet, no account, and no install, so you can put it on Google Drive or a USB stick and students can double-click it. Progress saves on the device it's played on.

If a computer can't run 3D, the game switches to flat screens and still plays all the way through.

**Which file to open.** From a folder, a USB stick, or Google Drive, open `Settling-Up.html`: everything is inside it. `index.html` is for GitHub Pages; opened straight from a folder, the browser won't let it load its painted art into 3D, so it falls back to the simple drawn art and says so. If the graphics card ever drops the 3D view, the game says so and saves progress; reloading picks up where you left off.

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
5. **Settling up.** He walks up to the big house. The planter's book adds itself up line by line: what the crop brought, every charge, and a bar that shows the shortfall as a length. Beside it sits **Hannah's tally**, the family's own count (store charges, the cotton's true weight on Hannah's knotted string, and the 10% interest he promised); the gap between the two is what the system took that year. Students choose to stay, demand the books, or rent a farm if they qualify. Demanding the books writes the hidden truth into the book in red.

**The almanac** opens at the field's edge each spring, before the cotton-or-corn choice (and from the top bar any time). It charts cotton's price per bale, from real New York prices for 1866–1868 (Historical Statistics of the United States, series E 104) through each year the family has settled, and what one acre of cotton earned the family against what one acre of corn saved. It never shows a year that hasn't happened.

**In plain words.** The voiced story stays as it is, but every key moment also has a blue "In plain words" box: one or two plain sentences on what just happened and what it means for the family's money (the contract, the store, planting, each event card, the harvest, the scale, the almanac, and each settling up, where it spells out the year's arithmetic). Key words (lien, furnish, credit, share, settling up, carried debt, interest, ginning) can be tapped for a definition, and the Journal lists them all under "Words to know." After the first settling up, one check-your-understanding question asks what has to happen before the family sees any money; it explains the answer and never blocks play.

**Hannah's tally** stays in the top bar all year, so students watch the family's account build: last year's debt, the store, the doctor, the cotton coming in.

**Leaving.** The button to leave the planter's place is always offered, and never works: in debt, Papa knows the planter's lien holds him; even, he knows every planter in the county keeps the same book. Students can try the door and find it shut.

**Handling the field work.** Walking is the only thing students do in the field. There's no tapping, picking, or scoring, and once Papa has walked most of the rows, the family finishes the rest. The decisions sit where the lesson is: the split between cotton and corn, the store, and the porch.

**Endings.** Still cropping, or renting a farm. A family put off the place (for voting, or for demanding the books) moves to another planter, its debt following it. Every family ends at the audit.

**Sound.** The voice of Papa and Mr. Holliday, and outdoor sound under it (a spring day, a fall field, a winter dusk, rain) that fades with the season and turns down when someone speaks. The top bar has a switch for each.

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

The voice and sound are made with ElevenLabs and saved in `audio/`, so the game never calls it: `node tools/voice.mjs --all` records any missing lines from `story/vo.mjs`, and `node tools/ambience.mjs` makes any missing outdoor loops and levels them (it needs ffmpeg). Both read your key from `ELEVENLABS_API_KEY`; never commit it.

## Tuning

Every number is in `src/config.js`. Results from `npm run sim`:

| Play style | Rent a farm | Ends in debt | Ahead every year |
| --- | --- | --- | --- |
| Lean basket every year, 5 corn | under 1% | about 93% | about 7% |
| Lean and basic in turn, 5 corn | about 2% | about 89% | about 11% |
| Basic every year, 5 corn | about 2% | about 93% | about 7% |
| All cotton, basic | 0% | about 98% | about 2% |
| Thoughtful, mixed choices | under 1% | about 98% | about 2% |

Renting takes $80 saved and a mule of your own. With honest books (no markup, no short weight, the promised interest), about 55 to 90% of families would have had enough to rent: the audit's point.

## Choices made beyond the spec

- **Single player, self-contained.** No class codes, teacher board, or shared database.
- **First person through Papa's eyes,** with paper cutouts in a 3D world. Lucy narrates the cutscenes, looking back as an adult.
- **A mule raises the share.** An owned mule raises the family's share to two-thirds, following the spec's note on shares. Without it, renting was out of reach.
- **Lean baskets wear the family down.** Each lean year adds a year of wear (a basic year mends half, an extra year all of it), and wear cuts the crop: 14% after one lean year, 24% after two, 32% after three. Lean years bring sickness more often too (Mother Ruth takes to her bed, with a doctor's bill). Papa says so at harvest, and the harvest note counts the bales lost.
- **Prices follow the 1871 collapse.** 1871 is $70 a bale and 1872 $80, nearer the real fall in New York prices.
- **Leaving is refused.** The button is offered and never works, so the five years always play out.
- **The cart.** At harvest the wagon waits at the field's far end; Papa hitches Old Jack and walks beside him down the cart road to the scale, at a mule's pace.

## Files

- `src/`: the game (config, engine, story, 2D art, 3D world, game flow, page shell)
- `art/`: your own art, plus the guide for making it
- `tools/`: build, art preparation, tuning simulator, playtest
