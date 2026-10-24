// ============================================================================
// SCRIPT LINES — the single source for the script, the voiceover sheet, and
// (next) the game's text. Only two voices speak:
//   PAPA      Robert's inner voice (thought), his narration in cutscenes
//             (narration), and the few words he says out loud (aloud).
//   HOLLIDAY  the planter, out loud.
// Everyone else is heard through Papa, or appears as a silent speech bubble
// in the world (voice: null).
//
// Rules for voiced lines (they are recorded once and can't change per game):
//   - No family surname (students choose it) and no amounts that change per
//     game. Fixed game values (sixty dollars, ten percent, five acres) are OK,
//     but re-record them if config.js changes.
//   - Papa says "Mr. Holliday" only in 1869, before the family could move.
//   - Only Mr. Holliday is voiced. If the family moves, the new planter's
//     lines show as text, and Papa's thoughts stay voiced.
//   - Standard spelling. The voice comes from word choice, not dialect.
// ============================================================================

const P = (id, delivery, text, o = {}) => ({ id, voice: "papa", delivery, text, ...o });
const H = (id, text, o = {}) => ({ id, voice: "holliday", delivery: "aloud", text, ...o });
const B = (id, who, text, o = {}) => ({ id, voice: null, delivery: "bubble", who, text, ...o });
const TXT = (id, text, o = {}) => ({ id, voice: null, delivery: "card", text, ...o });

// Delivery tags for ElevenLabs v4. Thoughts are close and quiet. A line with
// a `vo` field uses that instead: the same words with emotion tags inside.
export const TAGS = { thought: "[quietly]", narration: "[thoughtful]", aloud: "" };

// ElevenLabs voice IDs.
export const VOICES = { papa: "kzZ2bw7ItjSNWP4M85Xl", holliday: "N3qnQs6q5bYnw2n8I73X" };

export const ARC = [
  { year: "Prologue", title: "Four Years Free", beat: "Papa has freedom, a family, and two hands. He has no land, no money, and no letters. He walks up the hill to sign." },
  { year: 1869, title: "The Mark", beat: "Hope. He makes his X on a contract he can't read and starts his first crop as a free man. Hannah starts a knotted string to keep her own count. In December he votes for the first time, and a week later he settles up." },
  { year: 1870, title: "Written Down", beat: "Pride, then the first doubt. The 15th Amendment and Hiram Revels make Papa feel the country turning. Cotton falls. He remembers his father, sold away before he could vote. Lucy asks to go to school." },
  { year: 1871, title: "The String", beat: "Knowing. News of Meridian. Lucy learns her letters. At the scale Hannah whispers that the wagon felt heavier. That night her string and his book don't match, and there is nothing Papa can safely say. This is the turn of the story." },
  { year: 1872, title: "Holding On", beat: "Endurance. Grant runs again. Papa's mother can't walk to the field. Hannah says they could leave; Papa knows the lien would take everything. Lucy reads him the store sign. 'I'd hate to lose you,' Mr. Holliday says, and means it." },
  { year: 1873, title: "The Panic", beat: "The test. Fever in the river towns, then the Panic in September. The best crop they ever grew sells for almost nothing. At the last settling up, Papa chooses: stay, leave, or, rarely, rent land of his own." },
  { year: "Ending", title: "Next Year", beat: "Papa's last words depend on the choice. A silent card tells what became of Lucy, the girl who learned to read." },
];

export const SCENES = [
  // ---------------------------------------------------------------- prologue
  { id: "PRO", title: "Prologue", when: "Cutscene, before play", lines: [
    P("PRO-01", "narration", "Mississippi. January, eighteen sixty-nine. Four years since freedom came down the road.", { art: "fieldSun" }),
    P("PRO-02", "narration", "Five of us in a one-room cabin. Hannah. Our girl Lucy, ten. Our boy Sam, six. And my mother, Ruth.", { art: "family" }),
    P("PRO-03", "narration", "In sixty-five, folks said the bottom rail was on top. I'll believe it when I'm holding a deed.", { art: "plow" }),
    P("PRO-04", "narration", "Mr. Holliday has land and nobody to work it. I have two hands, a family, and nothing else.", { art: "bigHouse" }),
    P("PRO-05", "narration", "So this morning I walk up to the big house to make my mark.", { art: "contractDesk" }),
  ] },

  // ---------------------------------------------------------------- contract
  { id: "CON", title: "The contract", when: "January 1869: the walk up the hill, then the contract page", lines: [
    B("CON-B1", "Hannah", "Make him read you every word, Robert.", { when: "At the cabin, as the walk begins" }),
    P("CON-01", "thought", "Hannah says make him read every word. I can't read a one of them. He knows that.", { when: "Walking up the hill" }),
    H("CON-02", "Sit down, Robert. I'll read it, you listen. Saves us both some time.", { when: "Contract page opens" }),
    H("CON-03", "For every thirty acres, I'll provide a mule team, plow, and farming tools. You can have half of the cotton and corn you grow.", { when: "Reading the contract", note: "Adapted from the 1882 Grimes contract (SHEG). Brisk and flat, a man who has read this many times." }),
    H("CON-04", "Nothing can be sold from your crop until my rent is all paid, and all amounts you owe me are paid in full.", { when: "Reading the contract" }),
    H("CON-05", "The sale of your part of the cotton to be made by me, when and where I choose to sell, and after taking all you owe me.", { when: "Reading the contract" }),
    H("CON-06", "Fifteen acres. Five in corn, no more. Your account's at my commissary. Ten percent on anything you carry over. Make your mark right there.", { when: "After the clauses" }),
    P("CON-07", "thought", "He read it fast, like a grocery list. I caught 'half.' I caught 'all you owe me.'", { when: "Before the mark" }),
    P("CON-08", "aloud", "Yes, sir.", { when: "As the student makes the mark", tag: "[respectfully]" }),
    P("CON-09", "thought", "My mark. An X. Lucy is going to learn to write our name.", { when: "After the mark" }),
  ] },

  // -------------------------------------------------------------------- 1869
  { id: "Y1869", year: 1869, title: "1869: The Mark", when: "Spring to Christmas, 1869", lines: [
    P("Y1869-01", "thought", "Spring comes early. First stop, the commissary. Seed, and meat, meal, and molasses on account.", { when: "Walk to the store" }),
    B("Y1869-B1", "Hannah", "Every time he writes in that book, I tie a knot in this string.", { when: "Walk to the store" }),
    P("Y1869-02", "thought", "Only store for nine miles. Whatever we take, he writes down. Hannah ties a knot.", { when: "Store page" }),
    P("Y1869-03", "thought", "Fifteen acres. More than I ever worked for myself. Not one of them mine.", { when: "Walk to the field" }),
    P("Y1869-04", "thought", "Cotton pays at settling time. Corn feeds us all year. Hannah wants corn. Mr. Holliday wants cotton.", { when: "Planning the field" }),
    B("Y1869-B2", "Mother Ruth", "Plant corn close to the house, son. Hungry is worse than broke.", { when: "Planning the field" }),
    P("Y1869-05", "thought", "Walk the rows. Hannah and the children come behind me with the seed.", { when: "Planting" }),
    B("Y1869-B3", "Sam", "Papa! I can carry the whole sack!", { when: "Planting" }),
    P("Y1869-06", "thought", "Field's in. Now it's up to the rain, the Lord, and the price.", { when: "Planting done" }),
    P("Y1869-07", "thought", "By June we chop cotton. By the Fourth of July it's laid by. Home for supper.", { when: "Walk home to the cabin" }),
    P("Y1869-08", "thought", "September. The bolls are open. Picking time runs till frost.", { when: "Walk to the field in the fall" }),
    P("Y1869-09", "thought", "Every row we walk is money. Whose money, we'll find out at Christmas.", { when: "Harvest" }),
    B("Y1869-B4", "Lucy", "Papa, can I count the bales when we're done?", { when: "Harvest" }),
    P("Y1869-10", "thought", "The bales are tied and loaded. His gin. His scale. His book.", { when: "Walk to the wagon" }),
    P("Y1869-11", "thought", "His man reads the needle and writes it down. I watch the needle. I can read a needle.", { when: "At the scale" }),
    P("Y1869-12", "thought", "First of December, I voted. First time in my life. A week later, I walk up the hill to settle.", { when: "Walk to the big house", note: "Mississippi ratified its new constitution November 30 to December 1, 1869." }),
    H("Y1869-13", "Come on up, Robert. I've got your number right here.", { when: "Arriving at the porch" }),
    P("Y1869-14", "thought", "Our first year free and settled. Whatever that number is, it's ours to carry.", { when: "Leaving the porch" }),
  ] },

  // -------------------------------------------------------------------- 1870
  { id: "I1870", title: "Interlude: 1870", when: "Cutscene, before spring 1870", lines: [
    P("I1870-01", "narration", "February, eighteen seventy. The Fifteenth Amendment. I already voted once. Now the Constitution says no state can take it from me because of my color.", { art: "newspaper15" }),
    P("I1870-02", "narration", "Voteless. That word gets crossed out. Landless. That one stays.", { art: "tracker" }),
    P("I1870-03", "narration", "Same month, a Black man from Mississippi, Hiram Revels, takes a seat in the United States Senate. Now watch, I tell Hannah. Now watch.", { art: "senate" }),
  ] },
  { id: "Y1870", year: 1870, title: "1870: Written Down", when: "Spring to Christmas, 1870", lines: [
    P("Y1870-01", "thought", "New year, same road. I tell Hannah this is the year we come out ahead. I say that every spring.", { when: "Walk to the store" }),
    P("Y1870-02", "thought", "Hannah asks what the flour costs. The clerk says, 'Same as always,' and writes it down.", { when: "Store page" }),
    P("Y1870-03", "thought", "Lucy walks beside me. She says the church is starting a school. She wants to go.", { when: "Walk to the field" }),
    B("Y1870-B1", "Lucy", "Papa, could I go? Even just in winter?", { when: "Walk to the field" }),
    P("Y1870-04", "thought", "Cotton was down last fall. Corn doesn't care about New York.", { when: "Planning the field" }),
    P("Y1870-05", "thought", "Sam drags his own sack this year. Taller every spring.", { when: "Planting" }),
    B("Y1870-B2", "Sam", "I'm big enough now, Papa.", { when: "Planting" }),
    P("Y1870-06", "thought", "Mother told me tonight my father would have walked ten miles to vote. They sold him to Alabama when I was six.", { when: "Walk home to the cabin", note: "Review flag: Papa's memory of his father being sold. Brief and offstage, per the house rule." }),
    P("Y1870-07", "thought", "Picking time. Sam fills his first whole sack. He's prouder of it than anything.", { when: "Walk to the field in the fall" }),
    P("Y1870-08", "thought", "Hannah sings in the next row. Sam sings louder, and wrong. Lucy laughs.", { when: "Harvest" }),
    P("Y1870-09", "thought", "Loaded. I count the bales twice. I want to know the number before he tells me.", { when: "Walk to the wagon" }),
    P("Y1870-10", "thought", "The needle stops. I hold that number in my head all the way up the hill.", { when: "At the scale" }),
    P("Y1870-11", "thought", "I put on my good shirt. Hannah walks up with me.", { when: "Walk to the big house" }),
    H("Y1870-12", "Evening, Robert. Cotton's down this year. Nothing I can do about New York.", { when: "Arriving at the porch" }),
    P("Y1870-13", "thought", "Walking home, I don't say much. I never do after settling.", { when: "Leaving the porch" }),
  ] },

  // -------------------------------------------------------------------- 1871
  { id: "Y1871", year: 1871, title: "1871: The String", when: "Spring to Christmas, 1871 (the turn of the story)", lines: [
    P("Y1871-01", "thought", "Word came from Meridian. A fire, a trial, then shooting in the courthouse. Our people, mostly.", { when: "Walk to the store", note: "Meridian, March 4 to 6, 1871." }),
    P("Y1871-02", "thought", "Hannah keeps her own count now. One knot for every dollar he writes.", { when: "Store page" }),
    P("Y1871-03", "thought", "Mother says the land doesn't care whose name is on it. It just wants working.", { when: "Walk to the field" }),
    P("Y1871-04", "thought", "Every acre of corn is a little less owed. Every acre of cotton is a little more hope.", { when: "Planning the field" }),
    P("Y1871-05", "thought", "The preacher's wife is teaching Lucy her letters on Sundays. She writes them in the dirt between rows.", { when: "Planting" }),
    B("Y1871-B1", "Lucy", "That's an R, Papa. R for Robert.", { when: "Planting" }),
    P("Y1871-06", "thought", "Laid by. Evenings on the porch, I count on my fingers. Hannah counts on her string.", { when: "Walk home to the cabin" }),
    P("Y1871-07", "thought", "Hannah watches the wagon fill. She doesn't say anything. She's counting.", { when: "Walk to the field in the fall" }),
    P("Y1871-08", "thought", "I know what a wagon of cotton weighs. My back knows.", { when: "Harvest" }),
    P("Y1871-09", "thought", "Hannah walks beside the wagon this year. She wants to see the needle too.", { when: "Walk to the wagon" }),
    B("Y1871-B2", "Hannah", "That wagon felt heavier than that.", { when: "At the scale" }),
    P("Y1871-10", "thought", "Hannah leans close and whispers it. She's right. And there's not a thing I can say.", { when: "At the scale" }),
    P("Y1871-11", "thought", "Up the hill. He won't look up from his book. He never does.", { when: "Walk to the big house" }),
    H("Y1871-12", "Robert. Let's see where you stand.", { when: "Arriving at the porch" }),
    P("Y1871-13", "thought", "Hannah unties her string on the table tonight. We count the knots together. His book has more.", { when: "Leaving the porch" }),
  ] },

  // -------------------------------------------------------------------- 1872
  { id: "Y1872", year: 1872, title: "1872: Holding On", when: "Spring to Christmas, 1872", lines: [
    P("Y1872-01", "thought", "Election year. Grant is running again. Men argue about it on every porch.", { when: "Walk to the store" }),
    P("Y1872-02", "thought", "New shoes in the commissary window. Hannah walks right past them.", { when: "Store page" }),
    P("Y1872-03", "thought", "Mother can't walk out to the field this year. Her knees won't carry her.", { when: "Walk to the field" }),
    B("Y1872-B1", "Mother Ruth", "Go on. I'll mind the chickens and pray for rain.", { when: "Walk to the field" }),
    P("Y1872-04", "thought", "Hannah says plant more corn. Owe less. Eat. She's not wrong. She's never wrong.", { when: "Planning the field" }),
    P("Y1872-05", "thought", "Sam asks if his grandmother is coming out today. Not today, son.", { when: "Planting" }),
    B("Y1872-B2", "Sam", "Is Grandma coming out today?", { when: "Planting" }),
    P("Y1872-06", "thought", "Lucy read me the sign on the store today. Every letter. My daughter reads.", { when: "Walk home to the cabin" }),
    P("Y1872-07", "thought", "Long picking this year. We sing to keep the rows even.", { when: "Walk to the field in the fall" }),
    P("Y1872-08", "thought", "Hannah says we could leave. Leave owing, and he takes the mule, the crop, the stove. Then where?", { when: "Harvest" }),
    P("Y1872-09", "thought", "Same wagon. Same road. Same scale.", { when: "Walk to the wagon" }),
    P("Y1872-10", "thought", "Four years of that needle. It never once comes out on my side.", { when: "At the scale" }),
    P("Y1872-11", "thought", "Four Christmases on that porch. I could find it in the dark.", { when: "Walk to the big house" }),
    H("Y1872-12", "Another year, Robert. You're a good worker. I'd hate to lose you.", { when: "Arriving at the porch" }),
    P("Y1872-13", "thought", "'I'd hate to lose you.' He means it. That's the worst part.", { when: "Leaving the porch" }),
  ] },

  // -------------------------------------------------------------------- 1873
  { id: "Y1873", year: 1873, title: "1873: The Panic", when: "Spring to Christmas, 1873", lines: [
    P("Y1873-01", "thought", "Hannah counts every coin twice this spring. Something's coming. We can all feel it.", { when: "Walk to the store" }),
    P("Y1873-02", "thought", "The prices on the shelf haven't changed. They never do.", { when: "Store page" }),
    P("Y1873-03", "thought", "One more good year. That's all we need. I've said that before.", { when: "Walk to the field" }),
    P("Y1873-04", "thought", "Corn or cotton. Five years of the same question, and I still don't know the right answer.", { when: "Planning the field" }),
    P("Y1873-05", "thought", "Lucy asks, when we have our own land, can she name the mule?", { when: "Planting" }),
    B("Y1873-B1", "Lucy", "When we have our own land, can I name the mule?", { when: "Planting" }),
    P("Y1873-06", "thought", "Hard rain this summer, and fever down in Grenada and Vicksburg. We keep the children close.", { when: "Walk home to the cabin (no event card this summer)", note: "Yellow fever reached Grenada and frightened Vicksburg in 1873." }),
    P("Y1873-07", "thought", "Best crop we ever grew.", { when: "Arriving at the field in the fall, just before the Panic cutscene" }),
    P("Y1873-08", "thought", "Best crop we ever grew, and nobody wants to buy it.", { when: "Harvest" }),
    P("Y1873-09", "thought", "I lead the wagon slow. No hurry to hear it.", { when: "Walk to the wagon" }),
    P("Y1873-10", "thought", "The needle stops. It doesn't matter now. The price was decided in New York.", { when: "At the scale" }),
    P("Y1873-11", "thought", "Lucy follows me up the hill this time and stands on the step to listen.", { when: "Walk to the big house" }),
    H("Y1873-12", "Sit down, Robert. Bad year for everybody. Even me.", { when: "Arriving at the porch" }),
  ] },
  { id: "I1873", title: "Interlude: the Panic", when: "Cutscene in the fall of 1873, before the harvest (moved from spring: the Panic began September 18)", lines: [
    P("I1873-01", "narration", "September, eighteen seventy-three. A bank in New York fails, and then the whole country seems to.", { art: "newspaperPanic" }),
    P("I1873-02", "narration", "Cotton falls to sixty dollars a bale. We grew it all year at the old price.", { art: "priceChart" }),
  ] },

  // ------------------------------------------------- lines used every year
  { id: "STORE", title: "At the store (every year)", when: "After the student picks a basket", lines: [
    P("STORE-LEAN", "thought", "No shoes this year. We'll make do. We always make do."),
    P("STORE-BASIC", "thought", "That should see us through, if nothing goes wrong."),
    P("STORE-EXTRA", "thought", "Medicine on the shelf. Hannah will sleep better. So will I."),
  ] },
  { id: "FIELD", title: "In the field (every year)", lines: [
    P("FIELD-LIMIT", "thought", "Five acres of corn. That's all the contract allows. He wants cotton.", { when: "Trying to plant a sixth acre of corn" }),
    P("FIELD-SOWN", "thought", "That's enough. The family will finish the rest.", { when: "Planting done early" }),
    P("FIELD-PICKED", "thought", "Hannah and the children will bring in the rest.", { when: "Harvest done early" }),
  ] },
  { id: "SETTLE", title: "Settling up (every year)", when: "On the porch", lines: [
    H("SET-AHEAD", "Well. Your share comes out ahead this year. Don't spend it all in one place.", { when: "Balance above zero" }),
    H("SET-EVEN", "Comes out even. Nothing owed, nothing coming.", { when: "Balance zero" }),
    H("SET-OWE", "You come up short. I'll carry it over to next year. Ten percent, same as always.", { when: "In debt for the first time" }),
    H("SET-OWE-AGAIN", "Short again, Robert. I'll carry it. I always do.", { when: "In debt again" }),
    H("SET-EVICT-VOTE", "I hear you went to town on Election Day. I'll keep your share for the trouble. Be gone by New Year's.", { when: "Voted, and the 1-in-4 eviction comes up" }),
    P("SET-REACT-AHEAD", "thought", "Ahead. Say it again. Ahead. Hannah squeezes my hand all the way down the hill."),
    P("SET-REACT-EVEN", "thought", "Even. A whole year of work, and we're right where we started."),
    P("SET-REACT-SHORT", "thought", "Short. Hannah's string says we're closer than that. I keep my mouth shut.", { when: "Owe less than fifty dollars" }),
    P("SET-REACT-DEEP", "thought", "Every year we work harder, and every year we owe more.", { when: "Owe fifty dollars or more" }),
    P("SET-REACT-EVICT", "thought", "Put off the place. We load the wagon. We've moved before. We'll move again."),
    P("SET-YES", "aloud", "Yes, sir.", { tag: "[respectfully]", when: "Choosing to stay" }),
  ] },
  { id: "BOOKS", title: "Demanding the books", when: "Optional, once per settling up", lines: [
    P("BOOKS-01", "thought", "A man asking to see the books. On this porch. Hannah is holding her breath.", { when: "Before the choice" }),
    P("BOOKS-02", "aloud", "Sir... I'd like to see the books.", { tag: "[carefully]" }),
    H("BOOKS-EVICT", "You'd call me a liar on my own porch? Your share stays with me. Be gone by New Year's.", { when: "The 1-in-3 eviction" }),
    H("BOOKS-MARKUP", "That's the time price. Goods on credit cost more than cash. Always have. It's in the contract.", { when: "First reveal" }),
    P("BOOKS-MARKUP-T", "thought", "Forty cents on every dollar, just for waiting till Christmas."),
    H("BOOKS-WEIGHT", "The scale is the scale, Robert. You want to weigh your own cotton, buy your own gin.", { when: "Second reveal" }),
    P("BOOKS-WEIGHT-T", "thought", "So the wagon did weigh more. Hannah was right."),
    H("BOOKS-INTEREST", "Ten, twenty-five... interest is interest. You want land of your own someday or not?", { when: "Third reveal" }),
    P("BOOKS-INTEREST-T", "thought", "Twenty-five percent. He said ten. He said it to my face."),
  ] },
  { id: "LEAVE", title: "Leaving, renting", when: "Settling-up choices", lines: [
    P("LEAVE-OWING", "thought", "If we leave owing, his lien takes the crop, the mule, everything we can't carry. No planter in the county will sign me.", { when: "Choosing to leave while in debt" }),
    H("LEAVE-FREE", "Suit yourself. Plenty of men want this place.", { when: "Leaving with no debt" }),
    P("LEAVE-NOWHERE", "thought", "Leave for where? Every planter in this county keeps the same kind of book, and weighs on the same kind of scale.", { when: "Choosing to leave with no debt" }),
    H("RENT-01", "Renting. Well. You've got the mule and the money. I won't stand in your way.", { when: "Choosing to rent" }),
  ] },

  // ------------------------------------------------------------ event cards
  { id: "CARD", title: "Event cards", when: "Summer, at the cabin. Papa voices the card; the effect and the Did You Know note stay on screen as text.", lines: [
    P("CARD-RAINS", "thought", "Rain at planting, and dry at picking. The cotton stands tall. A good year, if the price holds."),
    P("CARD-DROUGHT", "thought", "No rain from June to August. The bolls come in small and hard. I can hear them rattle."),
    P("CARD-FLOOD", "thought", "The river comes up over the low fields. It takes the corn patch and some of the cotton."),
    P("CARD-MULEDIES", "thought", "Old Jack lies down in his stall and doesn't get up. The mule was in my hands, so the cost goes in his book."),
    P("CARD-MULEDIES-OWN", "thought", "Our own mule, lying in the stall. Sixty dollars of savings. Back to half shares."),
    P("CARD-SICK", "thought", "Sam takes the chills and fever in July. Hannah sits up with him nine nights. We're a pair of hands short."),
    P("CARD-SICK-EXTRA", "thought", "Sam takes the chills and fever. We have medicine on the shelf this time. Thank God for that."),
    P("CARD-SCHOOL-1869", "thought", "The church is starting a school for children. Lucy wants to go. That's one less pair of hands in the field.", { when: "1869" }),
    P("CARD-SCHOOL", "thought", "The new public school opens, free. But it runs in the same months as chopping and picking.", { when: "1870 and later", note: "Mississippi's school law of July 1870 made public schools free; terms were about four months." }),
    P("CARD-SCHOOL-YES", "thought", "Lucy goes to school. The rows are a little longer without her. I don't mind the walk."),
    P("CARD-SCHOOL-NO", "thought", "Lucy stays in the field. She keeps asking. I keep saying next year."),
    P("CARD-ELECTION", "thought", "Election Day. I can vote, and he knows it. He says a man who votes against him can find another place to live.", { when: "1871 or 1872 only" }),
    P("CARD-ELECTION-YES", "thought", "I walk to town and vote. Nobody says a word to me on the road home. Nobody needs to."),
    P("CARD-ELECTION-NO", "thought", "I stay home. I don't say a word all day. Neither does Hannah."),
    P("CARD-MULEBUY", "thought", "A neighbor moving west to Texas will sell his mule for sixty dollars, cash money."),
    P("CARD-MULEBUY-YES", "thought", "I count out sixty dollars. The mule is ours. Two-thirds of the crop from now on."),
    P("CARD-MULEBUY-NO", "thought", "I watch the mule go down the road. Maybe next year."),
    P("CARD-MULEBUY-CANT", "thought", "Sixty dollars cash. We don't have it. Not close."),
    P("CARD-EGGS", "thought", "Mother's garden comes in thick. Hannah walks to town on Saturday with eggs and greens."),
    P("CARD-EGGS-YES", "thought", "She comes home with fifteen dollars in her apron. Cash. Ours.", { when: "Three or more acres of corn" }),
    P("CARD-EGGS-NONE", "thought", "The garden's too small this year to spare anything for town."),
    P("CARD-RIDERS", "thought", "Word of masked men riding at night, two farms over. I bar the door and sit up with the lamp out."),
    P("CARD-PANIC", "thought", "Nobody in town will name a price. The buyers say wait. The planter says sell.", { when: "1873, after the Panic cutscene" }),
  ] },

  // ---------------------------------------------------------------- endings
  { id: "END", title: "Endings", when: "Cutscene after the last settling up", lines: [
    P("END-STAY-01", "narration", "'Next year,' he says. 'Cotton will come back.' 'Yes, sir,' I say.", { art: "porchLantern", when: "Still cropping" }),
    P("END-STAY-02", "narration", "We plant again the next spring, and the spring after that. The rows stay the same. Only the number in his book gets bigger.", { art: "longRows", when: "Still cropping" }),
    P("END-RENT-01", "narration", "January. We load the wagon and drive our own mule down the road. The land still isn't ours. But the crop will be.", { art: "muleRoad", when: "Renting a farm" }),
    P("END-RENT-02", "narration", "That fall I sell our cotton myself. I read the price off the board in town, and I count the money twice.", { art: "ownField", when: "Renting a farm" }),
    P("END-LEFT-01", "narration", "We leave at night, owing. We make it as far as the county line.", { art: "emptyRoad", when: "Left owing" }),
    P("END-LEFT-02", "narration", "His lien takes the crop, the mule, even Hannah's stove. The justice of the peace sides with him.", { art: "emptyDoor", when: "Left owing" }),
    P("END-LEFT-03", "narration", "No planter in the county will sign a man who walked off owing. I hire out by the day, to whoever will have me.", { art: "longRows", when: "Left owing" }),
    TXT("END-LEFT-CARD", "After 1876, Mississippi's new laws made it easy to arrest a Black man for almost nothing and hire him out to work off the fine. For a family that left owing, the risk only grew.", { when: "Left owing, silent card", note: "The 1876 'pig law' and convict leasing." }),
    TXT("END-LUCY-SCHOOL", "Lucy learned to read at the church school. Later she taught there. She wrote this story down.", { when: "If Lucy went to school, silent card" }),
    TXT("END-LUCY-NOSCHOOL", "Lucy never had much schooling. She told this story to her granddaughter, who wrote it down.", { when: "If Lucy never went to school, silent card" }),
  ] },

  // ------------------------------------------------------------------- audit
  { id: "AUD", title: "The audit", when: "After the ending", lines: [
    P("AUD-01", "thought", "Hannah's string was right. Now see for yourself.", { when: "Audit page opens" }),
    TXT("AUD-QUOTE", "\"A man that didn't know how to count would always lose. He might lose anyhow. They didn't give no itemized statement. No, you just had to take their word.\" Henry Blake, interviewed for the Federal Writers' Project, Arkansas, 1930s.", { when: "On the audit page, silent", note: "Primary source quoted as recorded. Project Gutenberg, WPA Slave Narratives, Arkansas, Part 1." }),
  ] },

  // ---------------------------------------------------------- tapping people
  { id: "TALK", title: "Tapping people in the world", when: "Silent bubbles, except Mr. Holliday", lines: [
    B("TALK-HANNAH", "Hannah", "Go on, Robert. The rows won't plant themselves."),
    B("TALK-LUCY", "Lucy", "I'll carry the water bucket, Papa."),
    B("TALK-SAM", "Sam", "Can I ride the mule? Just to the fence?"),
    B("TALK-RUTH", "Mother Ruth", "I was born on this place. Never thought I'd see it from this side."),
    H("TALK-HOLLIDAY", "Get on back to work, Robert. We'll settle up at Christmas."),
  ] },
];

// The Did You Know notes, rewritten where the fact-check found problems.
// These stay on screen as text; they are not voiced.
export const DYK = {
  sickness: { text: "Malaria, called \"chills and fever,\" was common along Mississippi's rivers, and yellow fever reached Grenada and Vicksburg in 1873. With no savings, every doctor's bill went on account at the store.", credit: "Mississippi Encyclopedia; Vicksburg Post" },
  school: { text: "Mississippi's school law of 1870 made public schools free for Black and white children. Terms were short, about four months, the schools were almost always separate, and Black schools got less money. Churches and missionary groups ran schools too.", credit: "Mississippi History Now; SPLC timeline of Mississippi education" },
  election: { text: "Black men in Mississippi first voted in 1867, under the Reconstruction Acts. The 15th Amendment (1870) made the right permanent, but planters used the lease as a weapon, and in 1871 Klan violence kept many from the polls.", credit: "Mississippi History Now, \"First Black Legislators\"" },
  riders: { text: "In March 1871, after a fire in Meridian, a courtroom shooting set off killings of as many as thirty Black people. Congress passed the Enforcement Acts in 1870 and 1871 to fight the Klan.", credit: "U.S. Senate, \"The Enforcement Acts\"" },
  panic: { text: "The Panic of 1873 began on September 18, when Jay Cooke & Company failed. Cotton prices fell, and in 1874 the Freedman's Savings Bank closed, owing 61,000 depositors nearly $3 million.", credit: "Federal Reserve History; Britannica" },
};
