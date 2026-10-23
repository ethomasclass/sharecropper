# Settling Up: Script

Two voices only. **Papa** (Robert) is heard as his own thoughts, as the narrator of the cutscenes, and in the few words he says out loud. **Mr. Holliday** speaks out loud. Everyone else reaches the student through Papa, or as a silent speech bubble in the world.

This file is generated from `story/lines.mjs` by `node tools/script.mjs`. Edit the lines there, then regenerate, and this script, the voiceover sheet (`story/vo-lines.csv`), and the timing below stay in step.

## The arc

The supporting question is the spine: *Can you be free if you can't leave?* Each year turns Papa a step further from hope toward knowing, and the gap between what he thinks and what he can say on the porch gets wider.

| Year | Title | What happens to Papa |
| --- | --- | --- |
| Prologue | Four Years Free | Papa has freedom, a family, and two hands. He has no land, no money, and no letters. He walks up the hill to sign. |
| 1869 | The Mark | Hope. He makes his X on a contract he can't read and starts his first crop as a free man. Hannah starts a knotted string to keep her own count. In December he votes for the first time, and a week later he settles up. |
| 1870 | Written Down | Pride, then the first doubt. The 15th Amendment and Hiram Revels make Papa feel the country turning. Cotton falls. He remembers his father, sold away before he could vote. Lucy asks to go to school. |
| 1871 | The String | Knowing. News of Meridian. Lucy learns her letters. At the scale Hannah whispers that the wagon felt heavier. That night her string and his book don't match, and there is nothing Papa can safely say. This is the turn of the story. |
| 1872 | Holding On | Endurance. Grant runs again. Papa's mother can't walk to the field. Hannah says they could leave; Papa knows the lien would take everything. Lucy reads him the store sign. 'I'd hate to lose you,' Mr. Holliday says, and means it. |
| 1873 | The Panic | The test. Fever in the river towns, then the Panic in September. The best crop they ever grew sells for almost nothing. At the last settling up, Papa chooses: stay, leave, or, rarely, rent land of his own. |
| Ending | Next Year | Papa's last words depend on the choice. A silent card tells what became of Lucy, the girl who learned to read. |

**The turn is 1871.** Until then, Papa hopes the numbers are honest. At the scale, Hannah whispers that the wagon felt heavier, and that night her knotted string and the planter's book don't match. From then on Papa knows, and the student knows he knows, every time he says "Yes, sir."

**Threads that run all five years:**

- **Hannah's string:** a knot for every dollar charged. It starts in 1869, doesn't match in 1871, and pays off in the audit ("Hannah's string was right").
- **Lucy's letters:** she asks for school (1870), learns letters on Sundays (1871), reads the store sign (1872), and dreams of naming a mule on their own land (1873). Papa signed with an X. His daughter learns to write their name.
- **The vote:** first vote in December 1869, the 15th Amendment in 1870, his father sold away before he could vote, and the Election Day card in 1871 or 1872.
- **"Next year":** Papa says it every spring. Mr. Holliday says it in the end.

## How the lines work

| Kind | What the student hears or sees | Recording |
| --- | --- | --- |
| PAPA (thinking) | His inner voice, while walking or at a moment in the world. Italic subtitles. | `[quietly]`, close and quiet |
| PAPA (narrating) | Cutscene panels | `[thoughtful]`, unhurried |
| PAPA (aloud) | The few things he says to Mr. Holliday | Each line has its own tag, such as `[respectfully]` |
| MR. HOLLIDAY | Out loud, on the porch and at the contract | No tag; his calm does the work |
| Silent bubble | Family members' words, as paper speech bubbles in the world | Not recorded |
| Silent card | History notes and Lucy's ending | Not recorded |

**Recording rules:**

- Voiced lines never use the family surname or an amount that changes from game to game; numbers appear on the ledger page.
- Fixed game values (sixty dollars, ten percent, five acres) are spoken. Re-record them if `src/config.js` changes.
- Papa says "Mr. Holliday" by name only in the prologue and 1869, before the family could have moved to another planter.
- Every word uses standard spelling. The voice comes from word choice and rhythm, never from dialect spelling.

## Size and timing

| | Papa | Mr. Holliday | Total |
| --- | --- | --- | --- |
| Lines | 123 | 22 | 145 |
| Characters (credits for one take) | 10,584 | 1,874 | 12,458 |
| Audio if every line is recorded | 12:44 | 2:21 | 15:05 |

- **One playthrough hears about 11:01 of voice.** Most of it plays while Papa walks, so it adds little to play time.
- **Three takes of every line** come to about 37,374 credits.
- **Play time stays inside 30 minutes** with the cuts in `node tools/timing.mjs --proposed`: about 29 minutes as modeled, before the voice that plays during walking.
- **Spoken lines are short.** Lines heard while walking stay between 3 and 8 seconds. Longer moments sit in cutscenes and pages the student moves through.

## Changes this script makes to the game

These come from the history fact-check. Each needs a small code change when the script is wired in.

| Change | Why | Source |
| --- | --- | --- |
| Election Day card in **1871 or 1872** (was 1870 or 1872) | Mississippi held no general election in 1870. It voted in November 1871 (legislature) and November 1872 (president). | Mississippi History Now; 1870–71 U.S. House elections |
| Papa **votes in December 1869**, a week before the first settling up | Mississippi ratified its new constitution November 30 to December 1, 1869. Black men there first voted in 1867. | Mississippi History Now, "The Constitution of 1868" |
| 15th Amendment line: the Constitution now protects a vote **he already had** | The amendment made the right permanent and federal. It didn't create it in Mississippi. | Mississippi History Now, "First Black Legislators" |
| **Panic moves to the fall of 1873** (cutscene before the harvest); no card that summer | Jay Cooke & Co. failed September 18, 1873. | Federal Reserve History |
| **"Left owing" ending replaces the vagrancy arrest** | The 1865 Black Codes were void by 1866–67 and repealed in 1870. In 1869–73 a family that left owing lost the crop and goods to the lien and couldn't get another contract. Arrest-and-hire-out became the real risk after 1876, which a silent card says. | Mississippi Encyclopedia, "Black Codes," "Crop Liens," "Convict Leasing" |
| Sickness card: **chills and fever (malaria)**; drop the Jim Downs citation | Downs covers 1862–1870, mostly smallpox before 1869. | Mississippi Encyclopedia; Vicksburg Post on 1873 yellow fever |
| School card: the **free public school of 1870**, whose cost is lost labor, not tuition | Mississippi's school law of July 1870 made schools free, with short terms. | SPLC timeline; Mississippi History Now |
| No Freedmen's Bureau at the contract signing | The Bureau stopped supervising contracts January 1, 1869. | Smithsonian NMAAHC, Bureau records finding aid |
| Interest wording: "historians estimate **25 to 60 percent or more**" | The "about 60 percent" figure couldn't be confirmed. | Mississippi Encyclopedia, "Crop Liens" |

**Cotton prices.** The real New York prices for the 1869–73 crops ran about $106, $75, $90, $80, and $75 a bale. The game's $110, $95, $85, $85, $60 keep the downward trend and are labeled as game values. Matching them exactly would make 1870 much harsher; that's a tuning choice for later.

## Decisions made

1. **The ending when a family leaves owing is "Lost to the lien."** The planter's claim takes the crop and goods, and no planter in the county will sign Papa. It replaces the spec's vagrancy arrest, which fits 1865–67 and after 1876 but not 1869–73. A final silent card says that after 1876 arrest-and-hire-out became the real risk, so the debrief question "Why didn't you just leave?" still lands.
2. **Papa's father stays** (`Y1870-06`). It is brief and offstage, and it is the one line that makes the vote personal. Flag it for the reviewer.
3. **There is no second planter voice.** If the family moves, the new planter's words appear as text only, and Papa's thoughts stay voiced. Only Mr. Holliday is ever heard, so one voice never plays two men.


## Prologue

*Cutscene, before play*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `PRO-01` | PAPA (narrating) | "Mississippi. January, eighteen sixty-nine. Four years since freedom came down the road." | art: fieldSun |
| `PRO-02` | PAPA (narrating) | "Five of us in a one-room cabin. Hannah. Our girl Lucy, ten. Our boy Sam, six. And my mother, Ruth." | art: family |
| `PRO-03` | PAPA (narrating) | "In sixty-five, folks said the bottom rail was on top. I'll believe it when I'm holding a deed." | art: plow |
| `PRO-04` | PAPA (narrating) | "Mr. Holliday has land and nobody to work it. I have two hands, a family, and nothing else." | art: bigHouse |
| `PRO-05` | PAPA (narrating) | "So this morning I walk up to the big house to make my mark." | art: contractDesk |

## The contract

*January 1869: the walk up the hill, then the contract page*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `CON-B1` | Hannah (silent bubble) | Make him read you every word, Robert. | At the cabin, as the walk begins |
| `CON-01` | PAPA (thinking) | *Hannah says make him read every word. I can't read a one of them. He knows that.* | Walking up the hill |
| `CON-02` | MR. HOLLIDAY | "Sit down, Robert. I'll read it, you listen. Saves us both some time." | Contract page opens |
| `CON-03` | MR. HOLLIDAY | "For every thirty acres, I'll provide a mule team, plow, and farming tools. You can have half of the cotton and corn you grow." | Reading the contract · Adapted from the 1882 Grimes contract (SHEG). Brisk and flat, a man who has read this many times. |
| `CON-04` | MR. HOLLIDAY | "Nothing can be sold from your crop until my rent is all paid, and all amounts you owe me are paid in full." | Reading the contract |
| `CON-05` | MR. HOLLIDAY | "The sale of your part of the cotton to be made by me, when and where I choose to sell, and after taking all you owe me." | Reading the contract |
| `CON-06` | MR. HOLLIDAY | "Fifteen acres. Five in corn, no more. Your account's at my commissary. Ten percent on anything you carry over. Make your mark right there." | After the clauses |
| `CON-07` | PAPA (thinking) | *He read it fast, like a grocery list. I caught 'half.' I caught 'all you owe me.'* | Before the mark |
| `CON-08` | PAPA (aloud) | "Yes, sir." | As the student makes the mark |
| `CON-09` | PAPA (thinking) | *My mark. An X. Lucy is going to learn to write our name.* | After the mark |

## 1869: The Mark

*Spring to Christmas, 1869*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `Y1869-01` | PAPA (thinking) | *Spring comes early. First stop, the commissary. Seed, and meat, meal, and molasses on account.* | Walk to the store |
| `Y1869-B1` | Hannah (silent bubble) | Every time he writes in that book, I tie a knot in this string. | Walk to the store |
| `Y1869-02` | PAPA (thinking) | *Only store for nine miles. Whatever we take, he writes down. Hannah ties a knot.* | Store page |
| `Y1869-03` | PAPA (thinking) | *Fifteen acres. More than I ever worked for myself. Not one of them mine.* | Walk to the field |
| `Y1869-04` | PAPA (thinking) | *Cotton pays at settling time. Corn feeds us all year. Hannah wants corn. Mr. Holliday wants cotton.* | Planning the field |
| `Y1869-B2` | Mother Ruth (silent bubble) | Plant corn close to the house, son. Hungry is worse than broke. | Planning the field |
| `Y1869-05` | PAPA (thinking) | *Walk the rows. Hannah and the children come behind me with the seed.* | Planting |
| `Y1869-B3` | Sam (silent bubble) | Papa! I can carry the whole sack! | Planting |
| `Y1869-06` | PAPA (thinking) | *Field's in. Now it's up to the rain, the Lord, and the price.* | Planting done |
| `Y1869-07` | PAPA (thinking) | *By June we chop cotton. By the Fourth of July it's laid by. Home for supper.* | Walk home to the cabin |
| `Y1869-08` | PAPA (thinking) | *September. The bolls are open. Picking time runs till frost.* | Walk to the field in the fall |
| `Y1869-09` | PAPA (thinking) | *Every row we walk is money. Whose money, we'll find out at Christmas.* | Harvest |
| `Y1869-B4` | Lucy (silent bubble) | Papa, can I count the bales when we're done? | Harvest |
| `Y1869-10` | PAPA (thinking) | *The bales are tied and loaded. His gin. His scale. His book.* | Walk to the wagon |
| `Y1869-11` | PAPA (thinking) | *His man reads the needle and writes it down. I watch the needle. I can read a needle.* | At the scale |
| `Y1869-12` | PAPA (thinking) | *First of December, I voted. First time in my life. A week later, I walk up the hill to settle.* | Walk to the big house · Mississippi ratified its new constitution November 30 to December 1, 1869. |
| `Y1869-13` | MR. HOLLIDAY | "Come on up, Robert. I've got your number right here." | Arriving at the porch |
| `Y1869-14` | PAPA (thinking) | *Our first year free and settled. Whatever that number is, it's ours to carry.* | Leaving the porch |

## Interlude: 1870

*Cutscene, before spring 1870*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `I1870-01` | PAPA (narrating) | "February, eighteen seventy. The Fifteenth Amendment. I already voted once. Now the Constitution says no state can take it from me because of my color." | art: newspaper15 |
| `I1870-02` | PAPA (narrating) | "Voteless. That word gets crossed out. Landless. That one stays." | art: tracker |
| `I1870-03` | PAPA (narrating) | "Same month, a Black man from Mississippi, Hiram Revels, takes a seat in the United States Senate. Now watch, I tell Hannah. Now watch." | art: senate |

## 1870: Written Down

*Spring to Christmas, 1870*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `Y1870-01` | PAPA (thinking) | *New year, same road. I tell Hannah this is the year we come out ahead. I say that every spring.* | Walk to the store |
| `Y1870-02` | PAPA (thinking) | *Hannah asks what the flour costs. The clerk says, 'Same as always,' and writes it down.* | Store page |
| `Y1870-03` | PAPA (thinking) | *Lucy walks beside me. She says the church is starting a school. She wants to go.* | Walk to the field |
| `Y1870-B1` | Lucy (silent bubble) | Papa, could I go? Even just in winter? | Walk to the field |
| `Y1870-04` | PAPA (thinking) | *Cotton was down last fall. Corn doesn't care about New York.* | Planning the field |
| `Y1870-05` | PAPA (thinking) | *Sam drags his own sack this year. Taller every spring.* | Planting |
| `Y1870-B2` | Sam (silent bubble) | I'm big enough now, Papa. | Planting |
| `Y1870-06` | PAPA (thinking) | *Mother told me tonight my father would have walked ten miles to vote. They sold him to Alabama when I was six.* | Walk home to the cabin · Review flag: Papa's memory of his father being sold. Brief and offstage, per the house rule. |
| `Y1870-07` | PAPA (thinking) | *Picking time. Sam fills his first whole sack. He's prouder of it than anything.* | Walk to the field in the fall |
| `Y1870-08` | PAPA (thinking) | *Hannah sings in the next row. Sam sings louder, and wrong. Lucy laughs.* | Harvest |
| `Y1870-09` | PAPA (thinking) | *Loaded. I count the bales twice. I want to know the number before he tells me.* | Walk to the wagon |
| `Y1870-10` | PAPA (thinking) | *The needle stops. I hold that number in my head all the way up the hill.* | At the scale |
| `Y1870-11` | PAPA (thinking) | *I put on my good shirt. Hannah walks up with me.* | Walk to the big house |
| `Y1870-12` | MR. HOLLIDAY | "Evening, Robert. Cotton's down this year. Nothing I can do about New York." | Arriving at the porch |
| `Y1870-13` | PAPA (thinking) | *Walking home, I don't say much. I never do after settling.* | Leaving the porch |

## 1871: The String

*Spring to Christmas, 1871 (the turn of the story)*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `Y1871-01` | PAPA (thinking) | *Word came from Meridian. A fire, a trial, then shooting in the courthouse. Our people, mostly.* | Walk to the store · Meridian, March 4 to 6, 1871. |
| `Y1871-02` | PAPA (thinking) | *Hannah keeps her own count now. One knot for every dollar he writes.* | Store page |
| `Y1871-03` | PAPA (thinking) | *Mother says the land doesn't care whose name is on it. It just wants working.* | Walk to the field |
| `Y1871-04` | PAPA (thinking) | *Every acre of corn is a little less owed. Every acre of cotton is a little more hope.* | Planning the field |
| `Y1871-05` | PAPA (thinking) | *The preacher's wife is teaching Lucy her letters on Sundays. She writes them in the dirt between rows.* | Planting |
| `Y1871-B1` | Lucy (silent bubble) | That's an R, Papa. R for Robert. | Planting |
| `Y1871-06` | PAPA (thinking) | *Laid by. Evenings on the porch, I count on my fingers. Hannah counts on her string.* | Walk home to the cabin |
| `Y1871-07` | PAPA (thinking) | *Hannah watches the wagon fill. She doesn't say anything. She's counting.* | Walk to the field in the fall |
| `Y1871-08` | PAPA (thinking) | *I know what a wagon of cotton weighs. My back knows.* | Harvest |
| `Y1871-09` | PAPA (thinking) | *Hannah walks beside the wagon this year. She wants to see the needle too.* | Walk to the wagon |
| `Y1871-B2` | Hannah (silent bubble) | That wagon felt heavier than that. | At the scale |
| `Y1871-10` | PAPA (thinking) | *Hannah leans close and whispers it. She's right. And there's not a thing I can say.* | At the scale |
| `Y1871-11` | PAPA (thinking) | *Up the hill. He won't look up from his book. He never does.* | Walk to the big house |
| `Y1871-12` | MR. HOLLIDAY | "Robert. Let's see where you stand." | Arriving at the porch |
| `Y1871-13` | PAPA (thinking) | *Hannah unties her string on the table tonight. We count the knots together. His book has more.* | Leaving the porch |

## 1872: Holding On

*Spring to Christmas, 1872*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `Y1872-01` | PAPA (thinking) | *Election year. Grant is running again. Men argue about it on every porch.* | Walk to the store |
| `Y1872-02` | PAPA (thinking) | *New shoes in the commissary window. Hannah walks right past them.* | Store page |
| `Y1872-03` | PAPA (thinking) | *Mother can't walk out to the field this year. Her knees won't carry her.* | Walk to the field |
| `Y1872-B1` | Mother Ruth (silent bubble) | Go on. I'll mind the chickens and pray for rain. | Walk to the field |
| `Y1872-04` | PAPA (thinking) | *Hannah says plant more corn. Owe less. Eat. She's not wrong. She's never wrong.* | Planning the field |
| `Y1872-05` | PAPA (thinking) | *Sam asks if his grandmother is coming out today. Not today, son.* | Planting |
| `Y1872-B2` | Sam (silent bubble) | Is Grandma coming out today? | Planting |
| `Y1872-06` | PAPA (thinking) | *Lucy read me the sign on the store today. Every letter. My daughter reads.* | Walk home to the cabin |
| `Y1872-07` | PAPA (thinking) | *Long picking this year. We sing to keep the rows even.* | Walk to the field in the fall |
| `Y1872-08` | PAPA (thinking) | *Hannah says we could leave. Leave owing, and he takes the mule, the crop, the stove. Then where?* | Harvest |
| `Y1872-09` | PAPA (thinking) | *Same wagon. Same road. Same scale.* | Walk to the wagon |
| `Y1872-10` | PAPA (thinking) | *Four years of that needle. It never once comes out on my side.* | At the scale |
| `Y1872-11` | PAPA (thinking) | *Four Christmases on that porch. I could find it in the dark.* | Walk to the big house |
| `Y1872-12` | MR. HOLLIDAY | "Another year, Robert. You're a good worker. I'd hate to lose you." | Arriving at the porch |
| `Y1872-13` | PAPA (thinking) | *'I'd hate to lose you.' He means it. That's the worst part.* | Leaving the porch |

## 1873: The Panic

*Spring to Christmas, 1873*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `Y1873-01` | PAPA (thinking) | *Hannah counts every coin twice this spring. Something's coming. We can all feel it.* | Walk to the store |
| `Y1873-02` | PAPA (thinking) | *The prices on the shelf haven't changed. They never do.* | Store page |
| `Y1873-03` | PAPA (thinking) | *One more good year. That's all we need. I've said that before.* | Walk to the field |
| `Y1873-04` | PAPA (thinking) | *Corn or cotton. Five years of the same question, and I still don't know the right answer.* | Planning the field |
| `Y1873-05` | PAPA (thinking) | *Lucy asks, when we have our own land, can she name the mule?* | Planting |
| `Y1873-B1` | Lucy (silent bubble) | When we have our own land, can I name the mule? | Planting |
| `Y1873-06` | PAPA (thinking) | *Hard rain this summer, and fever down in Grenada and Vicksburg. We keep the children close.* | Walk home to the cabin (no event card this summer) · Yellow fever reached Grenada and frightened Vicksburg in 1873. |
| `Y1873-07` | PAPA (thinking) | *Best crop we ever grew.* | Arriving at the field in the fall, just before the Panic cutscene |
| `Y1873-08` | PAPA (thinking) | *Best crop we ever grew, and nobody wants to buy it.* | Harvest |
| `Y1873-09` | PAPA (thinking) | *I lead the wagon slow. No hurry to hear it.* | Walk to the wagon |
| `Y1873-10` | PAPA (thinking) | *The needle stops. It doesn't matter now. The price was decided in New York.* | At the scale |
| `Y1873-11` | PAPA (thinking) | *Lucy follows me up the hill this time and stands on the step to listen.* | Walk to the big house |
| `Y1873-12` | MR. HOLLIDAY | "Sit down, Robert. Bad year for everybody. Even me." | Arriving at the porch |

## Interlude: the Panic

*Cutscene in the fall of 1873, before the harvest (moved from spring: the Panic began September 18)*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `I1873-01` | PAPA (narrating) | "September, eighteen seventy-three. A bank in New York fails, and then the whole country seems to." | art: newspaperPanic |
| `I1873-02` | PAPA (narrating) | "Cotton falls to sixty dollars a bale. We grew it all year at the old price." | art: priceChart |

## At the store (every year)

*After the student picks a basket*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `STORE-LEAN` | PAPA (thinking) | *No shoes this year. We'll make do. We always make do.* |  |
| `STORE-BASIC` | PAPA (thinking) | *That should see us through, if nothing goes wrong.* |  |
| `STORE-EXTRA` | PAPA (thinking) | *Medicine on the shelf. Hannah will sleep better. So will I.* |  |

## In the field (every year)

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `FIELD-LIMIT` | PAPA (thinking) | *Five acres of corn. That's all the contract allows. He wants cotton.* | Trying to plant a sixth acre of corn |
| `FIELD-SOWN` | PAPA (thinking) | *That's enough. The family will finish the rest.* | Planting done early |
| `FIELD-PICKED` | PAPA (thinking) | *Hannah and the children will bring in the rest.* | Harvest done early |

## Settling up (every year)

*On the porch*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `SET-AHEAD` | MR. HOLLIDAY | "Well. Your share comes out ahead this year. Don't spend it all in one place." | Balance above zero |
| `SET-EVEN` | MR. HOLLIDAY | "Comes out even. Nothing owed, nothing coming." | Balance zero |
| `SET-OWE` | MR. HOLLIDAY | "You come up short. I'll carry it over to next year. Ten percent, same as always." | In debt for the first time |
| `SET-OWE-AGAIN` | MR. HOLLIDAY | "Short again, Robert. I'll carry it. I always do." | In debt again |
| `SET-EVICT-VOTE` | MR. HOLLIDAY | "I hear you went to town on Election Day. I'll keep your share for the trouble. Be gone by New Year's." | Voted, and the 1-in-4 eviction comes up |
| `SET-REACT-AHEAD` | PAPA (thinking) | *Ahead. Say it again. Ahead. Hannah squeezes my hand all the way down the hill.* |  |
| `SET-REACT-EVEN` | PAPA (thinking) | *Even. A whole year of work, and we're right where we started.* |  |
| `SET-REACT-SHORT` | PAPA (thinking) | *Short. Hannah's string says we're closer than that. I keep my mouth shut.* | Owe less than fifty dollars |
| `SET-REACT-DEEP` | PAPA (thinking) | *Every year we work harder, and every year we owe more.* | Owe fifty dollars or more |
| `SET-REACT-EVICT` | PAPA (thinking) | *Put off the place. We load the wagon. We've moved before. We'll move again.* |  |
| `SET-YES` | PAPA (aloud) | "Yes, sir." | Choosing to stay |

## Demanding the books

*Optional, once per settling up*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `BOOKS-01` | PAPA (thinking) | *A man asking to see the books. On this porch. Hannah is holding her breath.* | Before the choice |
| `BOOKS-02` | PAPA (aloud) | "Sir... I'd like to see the books." |  |
| `BOOKS-EVICT` | MR. HOLLIDAY | "You'd call me a liar on my own porch? Your share stays with me. Be gone by New Year's." | The 1-in-3 eviction |
| `BOOKS-MARKUP` | MR. HOLLIDAY | "That's the time price. Goods on credit cost more than cash. Always have. It's in the contract." | First reveal |
| `BOOKS-MARKUP-T` | PAPA (thinking) | *Forty cents on every dollar, just for waiting till Christmas.* |  |
| `BOOKS-WEIGHT` | MR. HOLLIDAY | "The scale is the scale, Robert. You want to weigh your own cotton, buy your own gin." | Second reveal |
| `BOOKS-WEIGHT-T` | PAPA (thinking) | *So the wagon did weigh more. Hannah was right.* |  |
| `BOOKS-INTEREST` | MR. HOLLIDAY | "Ten, twenty-five... interest is interest. You want land of your own someday or not?" | Third reveal |
| `BOOKS-INTEREST-T` | PAPA (thinking) | *Twenty-five percent. He said ten. He said it to my face.* |  |

## Leaving, renting

*Settling-up choices*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `LEAVE-OWING` | PAPA (thinking) | *If we leave owing, his lien takes the crop, the mule, everything we can't carry. No planter in the county will sign me.* | Choosing to leave while in debt |
| `LEAVE-FREE` | MR. HOLLIDAY | "Suit yourself. Plenty of men want this place." | Leaving with no debt |
| `RENT-01` | MR. HOLLIDAY | "Renting. Well. You've got the mule and the money. I won't stand in your way." | Choosing to rent |

## Event cards

*Summer, at the cabin. Papa voices the card; the effect and the Did You Know note stay on screen as text.*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `CARD-RAINS` | PAPA (thinking) | *Rain at planting, and dry at picking. The cotton stands tall. A good year, if the price holds.* |  |
| `CARD-DROUGHT` | PAPA (thinking) | *No rain from June to August. The bolls come in small and hard. I can hear them rattle.* |  |
| `CARD-FLOOD` | PAPA (thinking) | *The river comes up over the low fields. It takes the corn patch and some of the cotton.* |  |
| `CARD-MULEDIES` | PAPA (thinking) | *Old Jack lies down in his stall and doesn't get up. The mule was in my hands, so the cost goes in his book.* |  |
| `CARD-MULEDIES-OWN` | PAPA (thinking) | *Our own mule, lying in the stall. Sixty dollars of savings. Back to half shares.* |  |
| `CARD-SICK` | PAPA (thinking) | *Sam takes the chills and fever in July. Hannah sits up with him nine nights. We're a pair of hands short.* |  |
| `CARD-SICK-EXTRA` | PAPA (thinking) | *Sam takes the chills and fever. We have medicine on the shelf this time. Thank God for that.* |  |
| `CARD-SCHOOL-1869` | PAPA (thinking) | *The church is starting a school for children. Lucy wants to go. That's one less pair of hands in the field.* | 1869 |
| `CARD-SCHOOL` | PAPA (thinking) | *The new public school opens, free. But it runs in the same months as chopping and picking.* | 1870 and later · Mississippi's school law of July 1870 made public schools free; terms were about four months. |
| `CARD-SCHOOL-YES` | PAPA (thinking) | *Lucy goes to school. The rows are a little longer without her. I don't mind the walk.* |  |
| `CARD-SCHOOL-NO` | PAPA (thinking) | *Lucy stays in the field. She keeps asking. I keep saying next year.* |  |
| `CARD-ELECTION` | PAPA (thinking) | *Election Day. I can vote, and he knows it. He says a man who votes against him can find another place to live.* | 1871 or 1872 only |
| `CARD-ELECTION-YES` | PAPA (thinking) | *I walk to town and vote. Nobody says a word to me on the road home. Nobody needs to.* |  |
| `CARD-ELECTION-NO` | PAPA (thinking) | *I stay home. I don't say a word all day. Neither does Hannah.* |  |
| `CARD-MULEBUY` | PAPA (thinking) | *A neighbor moving west to Texas will sell his mule for sixty dollars, cash money.* |  |
| `CARD-MULEBUY-YES` | PAPA (thinking) | *I count out sixty dollars. The mule is ours. Two-thirds of the crop from now on.* |  |
| `CARD-MULEBUY-NO` | PAPA (thinking) | *I watch the mule go down the road. Maybe next year.* |  |
| `CARD-MULEBUY-CANT` | PAPA (thinking) | *Sixty dollars cash. We don't have it. Not close.* |  |
| `CARD-EGGS` | PAPA (thinking) | *Mother's garden comes in thick. Hannah walks to town on Saturday with eggs and greens.* |  |
| `CARD-EGGS-YES` | PAPA (thinking) | *She comes home with fifteen dollars in her apron. Cash. Ours.* | Three or more acres of corn |
| `CARD-EGGS-NONE` | PAPA (thinking) | *The garden's too small this year to spare anything for town.* |  |
| `CARD-RIDERS` | PAPA (thinking) | *Word of masked men riding at night, two farms over. I bar the door and sit up with the lamp out.* |  |
| `CARD-PANIC` | PAPA (thinking) | *Nobody in town will name a price. The buyers say wait. The planter says sell.* | 1873, after the Panic cutscene |

## Endings

*Cutscene after the last settling up*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `END-STAY-01` | PAPA (narrating) | "'Next year,' he says. 'Cotton will come back.' 'Yes, sir,' I say." | Still cropping · art: porchLantern |
| `END-STAY-02` | PAPA (narrating) | "We plant again the next spring, and the spring after that. The rows stay the same. Only the number in his book gets bigger." | Still cropping · art: longRows |
| `END-RENT-01` | PAPA (narrating) | "January. We load the wagon and drive our own mule down the road. The land still isn't ours. But the crop will be." | Renting a farm · art: muleRoad |
| `END-RENT-02` | PAPA (narrating) | "That fall I sell our cotton myself. I read the price off the board in town, and I count the money twice." | Renting a farm · art: ownField |
| `END-LEFT-01` | PAPA (narrating) | "We leave at night, owing. We make it as far as the county line." | Left owing · art: emptyRoad |
| `END-LEFT-02` | PAPA (narrating) | "His lien takes the crop, the mule, even Hannah's stove. The justice of the peace sides with him." | Left owing · art: emptyDoor |
| `END-LEFT-03` | PAPA (narrating) | "No planter in the county will sign a man who walked off owing. I hire out by the day, to whoever will have me." | Left owing · art: longRows |
| `END-LEFT-CARD` | Silent card | After 1876, Mississippi's new laws made it easy to arrest a Black man for almost nothing and hire him out to work off the fine. For a family that left owing, the risk only grew. | Left owing, silent card · The 1876 'pig law' and convict leasing. |
| `END-LUCY-SCHOOL` | Silent card | Lucy learned to read at the church school. Later she taught there. She wrote this story down. | If Lucy went to school, silent card |
| `END-LUCY-NOSCHOOL` | Silent card | Lucy never had much schooling. She told this story to her granddaughter, who wrote it down. | If Lucy never went to school, silent card |

## The audit

*After the ending*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `AUD-01` | PAPA (thinking) | *Hannah's string was right. Now see for yourself.* | Audit page opens |
| `AUD-QUOTE` | Silent card | "A man that didn't know how to count would always lose. He might lose anyhow. They didn't give no itemized statement. No, you just had to take their word." Henry Blake, interviewed for the Federal Writers' Project, Arkansas, 1930s. | On the audit page, silent · Primary source quoted as recorded. Project Gutenberg, WPA Slave Narratives, Arkansas, Part 1. |

## Tapping people in the world

*Silent bubbles, except Mr. Holliday*

| ID | Who | Line | When and notes |
| --- | --- | --- | --- |
| `TALK-HANNAH` | Hannah (silent bubble) | Go on, Robert. The rows won't plant themselves. |  |
| `TALK-LUCY` | Lucy (silent bubble) | I'll carry the water bucket, Papa. |  |
| `TALK-SAM` | Sam (silent bubble) | Can I ride the mule? Just to the fence? |  |
| `TALK-RUTH` | Mother Ruth (silent bubble) | I was born on this place. Never thought I'd see it from this side. |  |
| `TALK-HOLLIDAY` | MR. HOLLIDAY | "Get on back to work, Robert. We'll settle up at Christmas." |  |

## Did You Know notes (on screen, not voiced)

Rewritten where the fact-check found problems. The other cards keep their current notes.

| Card | Note | Credit |
| --- | --- | --- |
| sickness | Malaria, called "chills and fever," was common along Mississippi's rivers, and yellow fever reached Grenada and Vicksburg in 1873. With no savings, every doctor's bill went on account at the store. | Mississippi Encyclopedia; Vicksburg Post |
| school | Mississippi's school law of 1870 made public schools free for Black and white children. Terms were short, about four months, the schools were almost always separate, and Black schools got less money. Churches and missionary groups ran schools too. | Mississippi History Now; SPLC timeline of Mississippi education |
| election | Black men in Mississippi first voted in 1867, under the Reconstruction Acts. The 15th Amendment (1870) made the right permanent, but planters used the lease as a weapon, and in 1871 Klan violence kept many from the polls. | Mississippi History Now, "First Black Legislators" |
| riders | In March 1871, after a fire in Meridian, a courtroom shooting set off killings of as many as thirty Black people. Congress passed the Enforcement Acts in 1870 and 1871 to fight the Klan. | U.S. Senate, "The Enforcement Acts" |
| panic | The Panic of 1873 began on September 18, when Jay Cooke & Company failed. Cotton prices fell, and in 1874 the Freedman's Savings Bank closed, owing 61,000 depositors nearly $3 million. | Federal Reserve History; Britannica |

## Recording notes

- **Model:** Eleven v4 (or v3). Neither supports `<break>` tags, so pauses are written into the text with ellipses and short sentences.
- **Papa** is one voice recorded two ways: thoughts `[quietly]`, close and private; spoken lines careful and respectful. Generate a thought and a spoken line first, and confirm the voice can do both before recording the rest.
- **Mr. Holliday** never raises his voice. If a take sounds like a sneering villain, regenerate it. His menace is his politeness.
- **Files** are named `<id>_<voice>.mp3` (for example `y1871-10_papa.mp3`). The `file` column in `vo-lines.csv` has each name. Keep the best take and drop it in `audio/vo/`.
- **Format:** `mp3_44100_64` or `mp3_24000_48`. Speech sounds fine at 48 kbps.
- **Review:** before students hear it, have a Black colleague or community member listen to Papa's lines. Tell students the voices are AI-generated.
