# Settling Up: Art Production Brief for a Google Flow Agent

You are producing every 2D image for **Settling Up**, a first-person educational game for high school U.S. History. Players walk a 3D farm in Mississippi, 1869–1873, as Robert ("Papa"), a free Black farmer working on shares for a white planter, Mr. Holliday. The world is a simple 3D stage dressed with flat painted cutouts, like a paper theater or a pop-up storybook. Your images are those cutouts, the painted walls of the buildings, the ground, the sky, and the story panels.

Work through this brief in order. Generate images only (not video), at the highest quality the tool offers. Deliver every file with the exact name and folder given here.

---

## 1. Why this matters

The game asks students to care about a Black family caught in a system built to keep them in debt. How the family looks carries as much meaning as the words. Every person you paint is a specific human being with dignity, intelligence, and an inner life. Image generators can reproduce racist caricature, so **reject any image that exaggerates features, leans toward minstrel or "plantation" clichés, or shows suffering for effect, and generate it again.** When in doubt, regenerate.

---

## 2. The style: painted paper cutout

Every image is a **hand-painted gouache illustration that looks cut from heavy paper**.

**The STYLE BLOCK.** Paste this text into every prompt:

> STYLE: Hand-painted gouache illustration in the look of a painted paper cutout for a storybook theater. Matte, opaque paint with visible brushstrokes and a subtle cold-press paper grain. Realistic proportions and anatomy, with simplified but specific, individual faces: calm, dignified, intelligent expressions. Flat, soft, even daylight from the upper left, gentle painted shading, no harsh shadows, no gloss, no photographic detail, no 3D render look. Limited palette: ochre #C08A3E, light ochre #D9AE62, indigo blue #2E3B56, brick red #A3271F, cream #F6EFDF, deep brown #4F2F1D, warm brown #7A4A2E, olive green #5E6A3A, sage #7E8B4E. Historically accurate rural Mississippi, 1869–1873. No text, letters, numbers, signatures, watermarks, or borders unless asked.

**Period details:**

- **Men:** cotton or linen work shirts, suspenders, wool or cotton trousers, straw or felt hats, heavy work shoes (brogans).
- **Women:** long calico or homespun dresses, aprons, head wraps.
- **Children:** often barefoot in warm months.
- **Buildings:** rough-sawn boards, split rails, fieldstone chimneys, and the planter's whitewashed columned house.

**Avoid:**

- anime or cartoon styling, big eyes, chibi proportions
- caricature of any kind
- glossy digital painting, neon, or gradients outside the palette
- modern objects or clothing
- text in any image
- any violence shown on screen

---

## 3. Formats

Set the aspect ratio in the tool for each image. Name each file exactly as listed and save it as PNG.

| Kind | Folder | Aspect ratio | Background and framing |
| --- | --- | --- | --- |
| Character reference sheets | `art/reference/` | 9:16 | Solid flat magenta #FF00FF. One full-body figure, facing forward. |
| People, animals, crops, trees (cutouts) | `art/sprites/` | 9:16 (crops and trees 3:4 is fine) | **Solid flat magenta #FF00FF everywhere outside the subject.** Full figure head to feet, with the feet touching the bottom edge and nothing cropped. Facing forward. No ground, no cast shadow, no other objects. |
| Props and set dressing (cutouts) | `art/props/` | 1:1 or 3:4 | Solid flat magenta #FF00FF. The whole object, standing upright, viewed straight on from eye level. |
| Building facades | `art/facades/` | As listed | **Straight-on flat elevation, no perspective,** like an architect's drawing painted in gouache. The full wall including the roofline silhouette. Solid flat magenta #FF00FF above and around the building. The bottom edge is where the wall meets the ground. |
| Ground and wall textures | `art/textures/` | 1:1 | **Seamless and tileable** on all four edges. Viewed from straight above (ground) or straight on (walls and roofs). Even light, no objects, no shadows that break the tile. |
| Sky and horizon backdrops | `art/backdrops/` | 16:9 | **Seamless left and right edges** so the strip can wrap around the world. Hill and tree strips have solid magenta #FF00FF above their silhouette. |
| Story panels | `art/scenes/` | 16:9 | A full painted composition, like a storybook spread. |
| Event cards | `art/cards/` | 16:9 | A full painted composition, simpler than a story panel, with one clear subject. |

The game's build trims the magenta away and adds a cream paper edge to every cutout automatically. Don't paint a border yourself.

---

## 4. Workflow

**Phase 1: lock the style (3 images).** Generate `art/reference/styleTest.png`: Hannah standing (use her character description below) beside the cabin front, as a 16:9 composition. Regenerate until the style matches Section 2 exactly. Every later image must look like it belongs next to this one. Attach it as a style reference to every later prompt if the tool allows reference images.

**Phase 2: character reference sheets (7 images).** Generate one canonical full-body figure for each character below, saved in `art/reference/`. These define what each person looks like for the rest of the job. **Attach the matching reference image to every later prompt that includes that person,** so faces, clothing, and colors stay identical everywhere.

**Phase 3: everything else,** in the order of Section 6.

**Phase 4: check every image** against the checklist in Section 7. Regenerate anything that fails.

---

## 5. The characters

Use these exact descriptions every time a character appears.

- **papa (Robert, 32).** A Black man, tall and lean, with strong shoulders, short cropped hair, a short beard, weathered work-worn hands, and a steady, thoughtful face. Faded indigo-blue work shirt with sleeves rolled, brown suspenders, patched brown wool trousers, worn brown brogans, and a straw hat with a frayed brim. *He is never seen in the 3D world, because players see through his eyes. He appears only in story panels.*
- **mama (Hannah, 30).** A Black woman of medium height, strong and quick, with alert, intelligent eyes and a hint of dry humor. Brick-red calico dress with a small cream print, sleeves rolled to the elbow, a cream apron, and a cream head wrap. A length of knotted string hangs from her apron pocket; it is her own count of the debt.
- **lucy (10).** A slim Black girl with a bright, curious face, and hair in neat plaits tied with cream cloth. Cream muslin dress with a brick-red sash, barefoot.
- **sam (6).** A small Black boy with a round, eager face and a quick grin. Ochre cotton shirt, short indigo trousers held up by one suspender, barefoot.
- **ruth (Mother Ruth, about 65).** A small Black woman, slightly stooped but dignified, with gray hair under a faded olive-green head wrap, a deeply lined face, and calm, knowing eyes. Faded olive-green dress, a brown shawl, and a plain wooden walking stick.
- **holliday (Mr. Holliday, 55).** A heavy-set white man with a gray mustache and a comfortable, confident bearing. Cream linen shirt, dark brown vest with a gold watch chain, dark trousers, and a wide-brimmed black hat. He carries a leather-bound ledger book. He looks pleasant and in charge, never a sneering villain.
- **mule (Old Jack).** A brown work mule, side view, with long ears, a gentle tired eye, and worn leather harness.

---

## 6. Every image

Each prompt below is the SUBJECT. **Final prompt = SUBJECT + the STYLE BLOCK + the format line for its kind (Section 3).** For any character, also attach that character's reference sheet.

### 6.1 Reference sheets (`art/reference/`, 9:16)

| File | Subject |
| --- | --- |
| `styleTest.png` (16:9) | Hannah standing beside the front of a small board-and-batten sharecropper's cabin in early spring, full figure, facing forward. |
| `papa.png` | Robert, full body, standing, facing forward, hat on, hands relaxed at his sides. |
| `mama.png` | Hannah, full body, standing, facing forward, one hand at the knotted string in her apron pocket. |
| `lucy.png` | Lucy, full body, standing, facing forward, holding a small slate at her side. |
| `sam.png` | Sam, full body, standing, facing forward, grinning, hands behind his back. |
| `ruth.png` | Mother Ruth, full body, standing, facing forward, both hands on her walking stick. |
| `holliday.png` | Mr. Holliday, full body, standing, facing forward, ledger tucked under one arm, thumb in his vest pocket. |
| `mule.png` | Old Jack the mule, full side view, standing, head slightly lowered. |

### 6.2 People and animals in the world (`art/sprites/`, 9:16, magenta background)

| File | Subject |
| --- | --- |
| `mama.png` | Hannah standing at ease, facing forward, hands folded over her apron. |
| `lucy.png` | Lucy standing, facing forward, hands clasped, looking up with curiosity. |
| `sam.png` | Sam standing, facing forward, mid-grin, one hand raised in a small wave. |
| `ruth.png` | Mother Ruth standing, facing forward, leaning on her walking stick. |
| `holliday.png` | Mr. Holliday standing, facing forward, holding his open ledger in one hand, the other hand in his vest pocket. |
| `mamaWork.png` | Hannah standing in a field pose, facing forward, carrying a split-oak basket on her hip, sleeves rolled, upright and strong. |
| `lucyWork.png` | Lucy standing, facing forward, carrying a tin water bucket with a dipper. |
| `samWork.png` | Sam standing, facing forward, a small cloth seed sack over his shoulder. |
| `mule.png` | Old Jack the mule, full side view, standing calmly in harness. |

### 6.3 Crops and trees (`art/sprites/`, 3:4, magenta background)

| File | Subject |
| --- | --- |
| `cottonSprout.png` | A single young cotton seedling, two to four broad leaves, small and fresh green. |
| `cottonGrow.png` | A single knee-high summer cotton plant, full and leafy, deep green, a few cream flowers. |
| `cottonRipe.png` | A single autumn cotton plant on dry brown stems, leaves turning olive and brown, covered with open white cotton bolls. |
| `cottonPicked.png` | A single cotton plant after harvest: bare brown stems, a few dry leaves, empty open husks. |
| `cornSprout.png` | A single young corn plant, a few long narrow leaves, light green. |
| `cornGrow.png` | A single tall green corn stalk in summer with long arching leaves and a tassel. |
| `cornRipe.png` | A single tall corn stalk drying to tan in fall, one husked ear hanging, the tassel brown. |
| `cornPicked.png` | A single dry tan corn stalk after harvest, ears taken, leaves ragged. |
| `tree1.png` | A single broad, rounded Southern oak tree with a thick trunk and full olive-green canopy. |
| `tree2.png` | A single tall loblolly pine, straight trunk, layered dark green boughs. |
| `flag.png` | A thin wooden stake with a small brick-red cloth pennant tied near the top, standing upright. |

### 6.4 Props and set dressing (`art/props/`, magenta background)

| File | Ratio | Subject |
| --- | --- | --- |
| `chickens.png` | 1:1 | Three brown and speckled hens standing together, pecking. |
| `dog.png` | 1:1 | A lean, friendly brown hound dog, sitting, side view. |
| `washtub.png` | 1:1 | A round galvanized washtub on a low wooden bench, a washboard leaning in it. |
| `woodpile.png` | 1:1 | A neat stack of split firewood with an axe resting against it. |
| `rocker.png` | 3:4 | A worn wooden rocking chair with a woven cane seat. |
| `well.png` | 3:4 | A simple wooden well with a windlass, rope, and wooden bucket. |
| `bench.png` | 1:1 | A long weathered wooden bench. |
| `clerk.png` | 9:16 | A young white store clerk in shirtsleeves, sleeve garters, and a long canvas apron, holding a pencil and a small account book, full body, facing forward. |
| `neighbors.png` | 9:16 | A Black farming family of three standing together, a father, mother, and young son, plainly dressed in work clothes, full bodies, facing forward. |
| `fieldhand.png` | 9:16 | A Black man in a work shirt and straw hat standing with a hoe over his shoulder, full body, facing forward. |
| `church.png` | 1:1 | A small white clapboard country church with a modest bell steeple, straight-on front view. |
| `oak.png` | 3:4 | A huge old live oak with a wide spreading canopy and hanging Spanish moss. |
| `fence.png` | 16:9 | A straight section of weathered split-rail fence, three rails, straight-on side view. |
| `clothesline.png` | 16:9 | A clothesline strung between two wooden posts with plain shirts, a dress, and a quilt hanging on it. |
| `baskets.png` | 1:1 | Three tall split-oak cotton baskets piled with picked white cotton. |
| `bales.png` | 1:1 | Two burlap-wrapped cotton bales bound with iron ties, standing on end. |
| `crates.png` | 1:1 | A stack of wooden crates and barrels marked only by shape (flour barrel, molasses keg), no lettering. |
| `lantern.png` | 3:4 | A tin kerosene lantern glowing warm. |
| `ledgerTable.png` | 1:1 | A small wooden porch table with a large open leather ledger book, an inkwell, and a pen. The pages show only abstract scribble lines, no readable text. |
| `rainBarrel.png` | 3:4 | A wooden rain barrel with iron hoops. |
| `plow.png` | 16:9 | A single-handled wooden walking plow with an iron blade, side view. |
| `outhouse.png` | 3:4 | A small weathered board outhouse with a crescent moon cut in the door. |

### 6.5 Building facades (`art/facades/`, straight-on elevation, magenta around the building)

These wrap the game's 3D buildings like painted stage flats. Paint each wall square to the viewer, filling the frame edge to edge horizontally, with no perspective.

| File | Ratio | Subject |
| --- | --- | --- |
| `cabinFront.png` | 1:1 | The front of a one-room board-and-batten sharecropper's cabin: a plank door in the center, one small shuttered window, a low plank porch along the front, a fieldstone chimney rising at one side, and a pitched roof of weathered wood shingles. |
| `cabinSide.png` | 4:3 | The side wall of the same cabin: weathered vertical boards, the gable end of the shingle roof, the stone chimney climbing the wall. |
| `storeFront.png` | 4:3 | The front of a plantation commissary and gin house: a wide plank storefront with a door, a window showing shelves of goods (bolts of cloth, jars, sacks), a hitching rail, and a tin-roofed porch. The sign board above the door is blank cream; leave it empty. |
| `storeSide.png` | 4:3 | The side wall of the commissary: unpainted clapboard, a high loading door, the tin roof's gable. |
| `bigHouseFront.png` | 16:9 | The front of a two-story whitewashed planter's house with six tall square columns, a deep shaded porch across the full front, tall shuttered windows, a center door, a wide front step, and a brick-red roof. Stately, quiet, and imposing. |
| `bigHouseSide.png` | 4:3 | The side wall of the same house: whitewashed clapboard, two tall shuttered windows per floor, the porch roof's end, the brick-red roof gable. |
| `schoolFront.png` | 1:1 | The front of a small whitewashed church that doubles as a school: a plain double door, two windows, a small bell tower, a brick-red roof. |
| `schoolSide.png` | 4:3 | The side wall of the same church school: whitewashed boards and three tall plain windows. |

### 6.6 Ground and wall textures (`art/textures/`, 1:1, seamless)

| File | Subject |
| --- | --- |
| `grass.png` | Seen from straight above: short, uneven Southern pasture grass, olive and sage with patches of ochre, a few clover leaves. Seamless tile. |
| `soil.png` | Seen from straight above: freshly plowed red-brown Mississippi soil in straight parallel furrows running left to right. Seamless tile. |
| `road.png` | Seen from straight above: a packed ochre dirt road with faint wagon ruts and small pebbles. Seamless tile. |
| `hill.png` | Seen from straight above: dry, longer grass going ochre, mixed with sage. Seamless tile. |
| `roofShingle.png` | Seen straight on: rows of weathered gray-brown wooden roof shingles. Seamless tile. |
| `roofTin.png` | Seen straight on: corrugated tin roofing with soft rust streaks. Seamless tile. |
| `wallPlanks.png` | Seen straight on: weathered vertical board-and-batten planks, gray-brown. Seamless tile. |
| `wallClapboard.png` | Seen straight on: whitewashed horizontal clapboard, slightly worn. Seamless tile. |

### 6.7 Sky and horizon (`art/backdrops/`, 16:9, seamless left and right)

| File | Subject |
| --- | --- |
| `skyDay.png` | A warm, hazy Mississippi sky, pale cream near the horizon rising to soft light ochre, with a few broad painted clouds. No ground. |
| `skyDusk.png` | A December dusk sky: deep indigo above, fading to a thin band of dusty rose and ochre near the horizon, a few early stars. No ground. |
| `hillsFar.png` | A long, low line of distant blue-indigo rolling hills along the bottom third, solid magenta #FF00FF above the hill silhouette. |
| `treeLine.png` | A long band of dark olive tree tops (oaks, pines, and a few cypress) along the bottom third, solid magenta #FF00FF above the silhouette. |

### 6.8 Story panels (`art/scenes/`, 16:9)

Papa narrates these. They are the emotional heart of the game. Compose each like a page in a fine storybook. Keep faces dignified and expressive, and keep all violence and arrests offstage.

| File | Subject |
| --- | --- |
| `fieldSun.png` | Mississippi, January 1869: a wide, empty cotton field of last year's dry stalks under a huge low winter sun, a lone figure (Robert) at the field's edge looking out. |
| `family.png` | The whole family standing together in front of their cabin: Robert, Hannah, Lucy, Sam, and Mother Ruth. Proud, close, a little guarded. |
| `plow.png` | Robert guiding a walking plow behind Old Jack the mule across a field in early spring, the furrow stretching ahead of him. |
| `bigHouse.png` | The planter's white columned house on a rise, seen from the road below, the family's small cabin in the foreground at the bottom of the hill. |
| `contractDesk.png` | Close view of a polished table in the big house: a long handwritten contract (abstract script lines, nothing readable), an inkwell and pen, and Robert's large work-worn hand making an X at the bottom. |
| `senate.png` | 1870: a dignified Black man in a dark frock coat seen from behind, at a distance, walking up the steps toward the U.S. Capitol dome. (He represents Senator Hiram Revels; do not attempt a portrait likeness.) |
| `porchLantern.png` | Christmas evening at settling time: Robert at the foot of the big house steps, hat held at his chest, Hannah beside him; above them Mr. Holliday seated at a small table under a lantern with his open ledger. Deep indigo dusk, warm lantern light, quiet tension. |
| `longRows.png` | The family working long rows of autumn cotton that run to the horizon, seen from behind and above, small figures in a vast field. |
| `muleRoad.png` | The family leaving with their own mule and a loaded wagon down a sunlit country road in January, hopeful, the old plantation behind them. |
| `ownField.png` | Robert standing at the edge of a rented field of open cotton, holding a small cloth purse of coins, a modest cabin behind him. Quiet pride. |
| `emptyRoad.png` | An empty country road at night under a pale moon, a dropped bundle in the dust. No people. |
| `emptyDoor.png` | The open doorway of an empty cabin, inside dark, a single overturned chair, morning light on the floorboards. No people. |
| `schoolLetters.png` | Lucy at a small church school, writing on a slate with great concentration, a few other children on benches behind her. The slate's marks are abstract, not readable letters. |
| `grandmother.png` | An old woman (grown-up Lucy, many years later) telling a story to her granddaughter by lamplight, both faces warm. |

**Keep the drawn versions of these panels;** don't generate them: `newspaper15`, `newspaperPanic`, `tracker`, `priceChart`. They carry words and numbers that image generators garble.

### 6.9 Event cards (`art/cards/`, 16:9)

| File | Subject |
| --- | --- |
| `rain.png` | Soft rain falling over green rows of young cotton, the sky silver-gray. |
| `drought.png` | A cracked dry field under a hard white summer sky, cotton plants small and wilted. |
| `flood.png` | Brown river water spread over low fields, the tops of corn stalks and cotton just showing. |
| `mule.png` | An empty stall in a plank barn, a worn harness hanging on a peg, straw on the floor. No animal shown. |
| `sick.png` | Hannah sitting up at night beside a small bed by candlelight, a cool cloth in her hand, a sleeping child's shape under a quilt. Tender, not grim. |
| `school.png` | A small whitewashed church school on a spring morning, children walking up to the door. |
| `ballot.png` | A Black man's hand placing a folded paper ballot into a wooden ballot box, a crowd of men's coats out of focus behind. |
| `mulebuy.png` | A sturdy mule standing by a fence on a country road, a paper tag tied to its halter (blank, no writing). |
| `eggs.png` | A split-oak basket of brown eggs and fresh collard greens on a cabin step. |

**Keep the drawn versions of these cards:** `headline`, `panic` (newspapers).

---

## 7. Checklist for every image

Regenerate the image if any answer is no.

1. **Style.** Does it look like it belongs beside `styleTest.png`: matte gouache, paper grain, the palette, soft even light?
2. **Faces and dignity.** Is every Black character a specific, dignified individual? Are there no exaggerated features, no caricature, no stereotype, and no suffering shown for effect?
3. **Consistency.** Does every character match their reference sheet: face, build, clothing, colors?
4. **History.** Is everything right for rural Mississippi, 1869–1873, with nothing modern?
5. **Text.** Is there no readable text, lettering, numbers, logo, or signature anywhere?
6. **Format.** Is the aspect ratio correct and the filename exact?
   - **Cutouts:** the whole subject is visible, feet on the bottom edge, solid magenta everywhere else.
   - **Facades:** straight on, with no perspective.
   - **Textures:** they tile seamlessly.
   - **Backdrops:** the left and right edges match.
7. **Violence.** Is all violence and every arrest offstage?

---

## 8. Delivery

- Save each approved image as PNG with its exact filename, in its folder under `art/`.
- Keep the reference sheets in `art/reference/`. The game doesn't use them, but future art will.
- Write `art/DELIVERY.md` listing every file you delivered. Note any image you couldn't get right, and why.
- Don't deliver rejected attempts.
