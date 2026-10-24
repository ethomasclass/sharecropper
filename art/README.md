# Adding your own art

**Making the whole set with an AI agent?** Give it [`FLOW_BRIEF.md`](FLOW_BRIEF.md): the style, the characters, and a prompt and filename for all 93 images.

Every person, animal, crop, and prop in the 3D farm is a flat 2D cutout standing in the world. Every cutscene panel and event card is a flat picture. You can replace any of them with your own art, including images you make with an AI image generator. Any slot you leave empty keeps the drawn version, so you can swap art in one piece at a time.

## How it works

1. Save your image into the right folder, named exactly after its slot (for example `art/sprites/mama.png`).
2. Rebuild the game with `npm run build`, or ask Claude to rebuild it.
3. The build packs your art into `Settling-Up.html`, so the game stays one file that works offline. For GitHub Pages, it writes the prepared art to `assets/art/` and `index.html` loads it from there, so the page stays small. Commit `assets/` along with `index.html`.

The build does the fiddly parts for you:

- **Trims empty margins,** so a character's feet sit on the ground.
- **Adds the cream paper edge** that makes cutouts look cut from paper. To skip it, name the file `mama.noedge.png`.
- **Resizes and compresses** each image: cutouts to 1024 px tall at most, panels to 1600 px wide at most.
- **Warns you** about a misnamed file or a cutout with no transparent background.

PNG, WebP, and JPG all work. **Cutouts need a transparent background.** Without one they stand in the world as rectangles. If your generator can't make transparent images, run them through a background remover first.

## Making cutouts that fit

- **Full body, head to feet,** with nothing cropped off at the bottom.
- **Facing the viewer,** straight on or slightly turned. Cutouts turn to face Papa as he walks, the way paper standees would.
- **Even, flat light.** No cast shadow and no ground or floor; the game adds a soft shadow.
- **At least 1024 px tall.** Bigger is fine.
- **One subject per image.** No text, labels, or borders.

The size in the world is set by the slot, not the image. A tall image of Sam still stands 1.12 m tall.

## Keeping a consistent look

Use the same style words in every prompt so the pieces belong together. A starting point:

> flat gouache paper-cut illustration, simple bold shapes, limited palette of ochre, indigo blue, brick red, cream, and deep brown, subtle paper texture, plain transparent background, full body, facing forward

Describe the qualities you want rather than naming a living artist.

**Period details (rural Mississippi, around 1870):**

- **Men:** work shirts, suspenders, wool or cotton trousers, straw or felt hats, heavy shoes.
- **Women:** long calico or homespun dresses, aprons, head wraps.
- **Children:** often barefoot in warm months.
- **Mr. Holliday:** dressed better than the family: a vest and a good hat.

## Depicting the family with dignity

This game asks students to care about a Black family living through a hard system. How the family looks matters as much as what the game says.

- **Show individuals.** Specific faces, ages, and personalities: a proud father, a sharp-eyed mother, a curious girl, a lively boy, a grandmother who has seen everything.
- **Reject stereotypes.** AI image generators can reproduce racist caricature: exaggerated features, minstrel imagery, ragged "plantation" clichés. Reject any image that leans that way, even slightly, and regenerate.
- **Choose dignified work poses.** For the field slots, show a person standing or walking with a hoe, basket, or sack. Avoid stooped or suffering poses used for effect.
- **Get a second opinion.** Have a colleague look at the full set before students see it.

## Slots

### People and animals (`art/sprites/`)

| File name | What it is | Height in the world |
| --- | --- | --- |
| `mama` | Hannah, Papa's wife, standing | 1.66 m |
| `lucy` | Lucy, age 10, the narrator, standing | 1.36 m |
| `sam` | Sam, age 6, standing | 1.12 m |
| `ruth` | Grandma Ruth, standing, maybe with a cane or basket | 1.56 m |
| `holliday` | Mr. Holliday, the planter, standing on his porch | 1.9 m |
| `mamaWork` | Mama in the field, with a hoe or basket | 1.5 m |
| `lucyWork` | Lucy in the field, carrying seed or a water bucket | 1.24 m |
| `samWork` | Sam in the field, carrying a small sack | 1.02 m |
| `mule` | The mule, side view | 1.6 m |

### Crops and landscape (`art/sprites/`)

| File name | What it is | Height in the world |
| --- | --- | --- |
| `cottonSprout` | A young cotton seedling | 0.5 m |
| `cottonGrow` | A green cotton plant in summer | 1.0 m |
| `cottonRipe` | A cotton plant with open white bolls | 1.05 m |
| `cottonPicked` | A cotton plant after harvest, bare and brown | 1.0 m |
| `cornSprout` | Young corn | 0.95 m |
| `cornGrow` | Tall green corn | 2.1 m |
| `cornRipe` | Corn with ears, drying | 2.1 m |
| `cornPicked` | A corn stalk after harvest | 2.0 m |
| `tree1` | A round leafy tree, such as an oak | 6–8 m (scaled per tree) |
| `tree2` | A tall pointed tree, such as a pine | 6–8 m (scaled per tree) |
| `flag` | The marker that shows where to go next | 2.6 m |

### Optional props (`art/props/`)

These only appear if you add them. Each has a set place in the world.

| File name | Where it stands | Height |
| --- | --- | --- |
| `chickens` | Beside the cabin | 0.55 m |
| `dog` | In the cabin yard | 0.65 m |
| `washtub` | Beside the cabin | 0.9 m |
| `woodpile` | Behind the cabin | 1.1 m |
| `rocker` | On the cabin porch | 1.1 m |
| `well` | Behind the cabin | 1.8 m |
| `bench` | Outside the store | 0.9 m |
| `clerk` | The store clerk, at the store door | 1.75 m |
| `neighbors` | A neighboring family, out past the field | 1.65 m |
| `fieldhand` | A neighbor in the distance, by the woods | 1.65 m |
| `church` | A church in the distance, flat like stage scenery | 7 m |
| `oak` | A large shade tree behind the cabin | 9 m |
| `fence` | Replaces the drawn rail fence behind the field, section by section | 1.25 m |
| `clothesline` | In the cabin yard, facing where Papa starts each spring | 1.9 m |
| `baskets` | At the edge of the field, at harvest only | 1.0 m |
| `bales` | Beside the store and gin | 1.4 m |
| `crates` | Outside the store, by the bench | 1.3 m |
| `ledgerTable` | On the big house porch, beside Mr. Holliday | 1.0 m |
| `lantern` | On the ledger table, at settling time only | 0.42 m |
| `rainBarrel` | At the back corner of the cabin | 1.2 m |
| `plow` | At the west edge of the field | 1.1 m |
| `outhouse` | Behind the cabin | 2.4 m |

### Building fronts (`art/facades/`)

Each building is a 3D box and roof wearing three paintings: its front and both sides. The build trims the magenta, so the bottom of each painting is its ground line.

`cabinFront`, `cabinSide`, `storeFront`, `storeSide`, `bigHouseFront`, `bigHouseSide`, `schoolFront`, `schoolSide`

**How the paintings fit together.** [`facades.json`](facades.json) records, for each painting, where its wall corners are, where the wall meets the ground (base), the top of the wall (eave), and the top of the roof (ridge), as fractions of the picture. The game uses them to:

- **Land each painted wall exactly on the 3D wall,** so the front and sides meet at the corners and the eaves line up all the way around. The building's depth and wall height come from the paintings' own shapes, so nothing is stretched.
- **Copy the front's roof.** The 3D roof takes the front painting's ridge height, pitch, and eave overhang (`eaves`). On the cabin and school, whose sides are the long eave walls, the sides are cut off at the eave and the 3D roof carries the front's roof over them. On the store and big house, whose sides are gable ends, the painted gable is kept and re-pitched to meet the 3D ridge.
- **Carry chimneys up.** A chimney on a cut side (`chimney`) becomes a 3D stack above the roof, wearing the painting's own stonework.
- **Split joined buildings.** `sections` tells the game when one front shows two buildings joined, like the store's gable-fronted commissary beside its tin-roofed gin barn. Each part gets its own 3D roof.
- **Match the plain walls.** `planks` names a patch of plain painted wall; the 3D back wall and gable ends wear it, so they match the paintings.
- **Cut openings.** `holes` makes dark painted openings see-through, like the big house's open side porch.
- **Place the store sign** on the painting's blank sign board (`sign`).

Roofs, porches, and chimneys painted past the wall stand out past the corners, like the wings of a stage flat. With a front painting in place, the drawn door, windows, porch, and columns are hidden.

**When you replace a building painting,** run `python3 tools/facade_check.py`. It draws the calibration lines over each painting in `dist/facade-check/`. Move any line that's off by editing `facades.json`, then rebuild.

### Ground and wall textures (`art/textures/`, square, seamless)

| File name | Where it goes | One tile covers |
| --- | --- | --- |
| `grass` | The ground | 6 m |
| `hill` | The hill under the big house | 6 m |
| `soil` | The field plots (corn plots are tinted lighter) | one plot, 3.7 m |
| `road` | The roads | 3 m |
| `roofShingle` | The cabin roof; tinted brick red for the big house and school | 2 m |
| `roofTin` | The store roof | 2.5 m |
| `wallPlanks` | The cabin walls | 2.5 m |
| `wallClapboard` | The store, big house, and school walls | 2.5 m |

The seasons tint a painted ground lightly, and dusk darkens it.

### Sky and horizon (`art/backdrops/`, 16:9, seamless left and right)

| File name | What it does |
| --- | --- |
| `skyDay` | Wraps the world as the daytime sky, warmed for summer, fall, and drought |
| `skyDusk` | The sky at settling time, Christmas evening |
| `hillsFar` | Replaces the drawn far hills |
| `treeLine` | Replaces the drawn near hills |

The fog fades into the bottom color of the sky painting, so distant things melt into it.

### Cutscene panels (`art/scenes/`, 16:9, at least 1600 × 900)

| File name | Panel |
| --- | --- |
| `fieldSun` | Mississippi, 1869: a field under a big sun |
| `family` | The five of them in front of the cabin |
| `plow` | Papa behind a mule and plow |
| `bigHouse` | The big house on the hill, the cabin below |
| `contractDesk` | The contract on the table, a pen, an X |
| `senate` | Hiram Revels and the U.S. Capitol |
| `porchLantern` | Night on the planter's porch, a lantern, the ledger |
| `longRows` | The family working long rows to the horizon |
| `muleRoad` | The family leaving with their own mule and wagon (renting ending) |
| `ownField` | Papa on rented land with his own crop (renting ending) |
| `emptyRoad` | An empty road at night (vagrancy ending, never showing an arrest) |
| `emptyDoor` | An empty cabin doorway (vagrancy ending) |
| `schoolLetters` | Lucy at a chalkboard (epilogue, if she went to school) |
| `grandmother` | An old woman telling a story to a child (epilogue) |
| `newspaper15`, `newspaperPanic`, `tracker`, `priceChart` | These panels carry words and numbers. AI images garble text, so keep the drawn versions. |

### Event cards (`art/cards/`, 16:10)

`rain`, `drought`, `flood`, `mule`, `sick`, `school`, `ballot`, `mulebuy`, `eggs`, `headline`, `panic`

The `headline` and `panic` cards are newspapers, so keep the drawn versions for those too.
