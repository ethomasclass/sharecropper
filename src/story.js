// ============================================================================
// STORY — the on-screen text that isn't a spoken line. Every line Papa or
// Mr. Holliday says, and every family speech bubble, lives in
// story/lines.mjs (SCENES), so the script, the voices, and the game agree.
// {P} = the current planter. {Y} = the current year.
// ============================================================================
const PLANTERS = ["Holliday", "Pruitt", "Dunbar", "Coker", "Askew"];

// Adapted from the 1882 Grimes contract (SHEG modified version).
const CONTRACT = {
  lines: [
    "For every 30 acres of land rented by sharecroppers, I will provide a mule team, plow, and farming tools. The sharecroppers can have half of the cotton, corn, peas, pumpkins, and potatoes they grow.",
    "Every sharecropper must be responsible for all farming gear placed in his hands, and if not returned must be paid for unless it is worn out by use.",
    "Nothing can be sold from their crops until my rent is all paid, and all amounts they owe me are paid in full.",
    "I am to gin and pack all of the cotton.",
    "The sale of every sharecropper's part of the cotton to be made by me when and where I choose to sell, and after taking all they owe me.",
  ],
  // which clause Mr. Holliday is reading aloud in each voiced line
  reading: { "CON-03": 0, "CON-04": 2, "CON-05": 4 },
  credit: "Adapted. Sharecropping contract, 1882, Grimes Family Papers (#3357), Southern Historical Collection, UNC Chapel Hill. Modified by the Stanford History Education Group.",
  terms: [
    ["Land", "15 acres, a cabin, a mule, tools, and seed"],
    ["Your share", "Half the cotton, after he is paid"],
    ["Food patch", "No more than 5 acres of corn and garden"],
    ["Store", "Supplies on account at the plantation store"],
    ["Interest", "10% on anything carried to next year"],
  ],
};

const STORE_ITEMS = {
  lean: ["Meal and salt pork", "Molasses", "Seed and plow points"],
  basic: ["Meal and salt pork", "Molasses", "Seed and plow points", "Cloth, 12 yards", "Shoes, 2 pair"],
  extra: ["Meal and salt pork", "Molasses", "Seed and plow points", "Cloth, 12 yards", "Shoes, 2 pair", "Medicine", "Coffee"],
};

// Event cards. `line` is Papa's voiced line for the card; variants pick
// another line in a special case. The effect and Did You Know stay as text.
const CARDS = {
  rains: { title: "Good rains", art: "rain", line: "CARD-RAINS", effect: "Yield +20%",
    dyk: "Most farm families had no savings and no insurance. One season's weather could decide whether they ended the year ahead or behind." },
  drought: { title: "Drought", art: "drought", line: "CARD-DROUGHT", effect: "Yield −30%",
    dyk: "A sharecropper carried the risk of a bad year. The planter still collected his half of whatever grew, and the store bill stayed the same." },
  flood: { title: "Flood on the bottomland", art: "flood", line: "CARD-FLOOD", effect: "Yield −20%. The corn patch is lost, so the store bill goes back up.",
    dyk: "Bottomland near rivers had the richest soil, and it was the first to flood. Croppers rarely got the high ground." },
  muledies: { title: "The mule dies", art: "mule", line: "CARD-MULEDIES", lineOwn: "CARD-MULEDIES-OWN",
    effect: "The planter charges $60 to your account.", effectOwn: "Your own mule dies. You lose the bigger share until you buy another.",
    dyk: "The 1882 contract says every sharecropper is \"responsible for all farming gear placed in his hands.\" Families paid for the planter's tools and stock.",
    credit: "Grimes Family Papers, 1882, adapted by SHEG" },
  sickness: { title: "Chills and fever", art: "sick", line: "CARD-SICK", lineExtra: "CARD-SICK-EXTRA",
    effect: "Yield −15%. Doctor: $10 on account.", effectExtra: "You bought medicine this spring. Yield −10%, and no doctor's bill." },
  school: { title: "A school opens", art: "school", line: "CARD-SCHOOL", line1869: "CARD-SCHOOL-1869",
    question: "Send Lucy to school?", yes: "Send Lucy", no: "Keep her in the field", lineYes: "CARD-SCHOOL-YES", lineNo: "CARD-SCHOOL-NO",
    effectYes: "Yield −10%. Lucy learns to read.", effectNo: "Lucy stays in the field." },
  election: { title: "Election Day, {Y}", art: "ballot", line: "CARD-ELECTION",
    question: "Go to town and vote?", yes: "Go and vote", no: "Stay home", lineYes: "CARD-ELECTION-YES", lineNo: "CARD-ELECTION-NO",
    effectYes: "You vote. The planter may put you off the place (1 in 4).", effectNo: "You stay home." },
  mulebuy: { title: "A chance to buy a mule", art: "mulebuy", line: "CARD-MULEBUY",
    question: "Buy the mule?", yes: "Buy it for $60", no: "Not this year", lineYes: "CARD-MULEBUY-YES", lineNo: "CARD-MULEBUY-NO", lineCant: "CARD-MULEBUY-CANT",
    effectYes: "You own a mule. From now on you keep two-thirds of the crop, not half.", effectNo: "You let the mule go.",
    cantAfford: "You need $60 in savings. You don't have it.",
    dyk: "Families who owned a mule could bargain for a bigger share of the crop. Owning stock was the first rung on the ladder toward renting land.",
    credit: "Ransom and Sutch, One Kind of Freedom (1977)" },
  eggs: { title: "Eggs and greens in town", art: "eggs", line: "CARD-EGGS", lineYes: "CARD-EGGS-YES", lineNone: "CARD-EGGS-NONE",
    effect: "+$15 cash.", effectNone: "The garden was too small to spare anything for town.",
    dyk: "Every egg or ear of corn a family raised was one less thing bought on credit at the planter's store." },
  riders: { title: "Night riders in the county", art: "headline", line: "CARD-RIDERS", effect: "No money lost. Leaving this year costs double." },
  panic: { title: "The Panic of 1873", art: "panic", line: "CARD-PANIC", effect: "Cotton drops to $60 a bale." },
  none: { title: "A quiet year", art: "fieldSun", effect: "", dyk: "" },
};
// Corrected notes from the fact-check (story/lines.mjs) replace the old ones.
Object.entries(DYK).forEach(([k, v]) => { if (CARDS[k]) { CARDS[k].dyk = v.text; CARDS[k].credit = v.credit; } });

const ENDINGS = {
  cropping: { title: "Still cropping", lines: ["END-STAY-01", "END-STAY-02"] },
  rent: { title: "Renting a farm", lines: ["END-RENT-01", "END-RENT-02"] },
  left: { title: "Lost to the lien", lines: ["END-LEFT-01", "END-LEFT-02", "END-LEFT-03", "END-LEFT-CARD"] },
};
const EPILOGUE = { school: { id: "END-LUCY-SCHOOL", art: "schoolLetters" }, noschool: { id: "END-LUCY-NOSCHOOL", art: "grandmother" } };

const EXIT_TICKET = {
  question: "Can you be free if you can't leave?",
  prompt: "Answer in one TEA paragraph. Use one number from your own audit as evidence.",
  tracker: "LANDLESS stays on the tracker. Write the one mechanism from the sim that kept it there.",
};

const ALMANAC = {
  source: "1866–1868: New York price of middling upland cotton, per 400-pound bale. Historical Statistics of the United States, Colonial Times to 1957, series E 104 (from Watkins, Production and Price of Cotton for One Hundred Years, 1895). Your years: the price Mr. {P} says he got, a game value.",
  note: "An acre of cotton here is your share of one acre's crop at that year's price, less ginning. An acre of corn is what it takes off the store bill.",
};

// ---- In plain words --------------------------------------------------------------
// One or two short sentences at each moment saying what just happened and
// what it means for the family's money. [[term]] marks a word students can tap.
const PLAIN = {
  contract: "You just agreed to farm Mr. {P}'s land for a year. He supplies the land, a cabin, a mule, and seed; your family does all the work. At the end of the year you get a [[share]] of the cotton, but only after he takes back everything he lent you. Until then he holds a [[lien]] on your crop.",
  store: "This is the [[furnish]]: food and supplies for the year, bought on [[credit]]. You pay nothing today. Mr. {P} writes it in his book and takes it out of your cotton at [[settling up]]. Credit prices are higher than cash prices, and you aren't told by how much.",
  plan: "Cotton is the crop that can pay your debt, and it's what the planter wants. Corn feeds your family, so you buy less food at the store, but it earns no cash. The contract allows only 5 acres of corn.",
  harvest: "The cotton you bring in is all you have to pay with. Your family keeps a [[share]]; the rest goes to Mr. {P} for the land.",
  scale: "Your cotton is weighed on Mr. {P}'s scale, read by his man, and you can't check it. Every pound the scale doesn't count comes out of your share.",
  almanac: "Cotton's price kept falling. When it falls, the same year of work earns less, but the store bill doesn't shrink.",
  owe: "Your share of the cotton came to {in}, but Mr. {P} charged {out}. That leaves {short} unpaid. It becomes [[carried debt]], it grows with [[interest]], and under the [[lien]] you can't leave until it's paid. So next year starts in the hole, and the family has to sign again.",
  ahead: "Your share of the cotton covered everything this year, with {left} over. But it sits in Mr. {P}'s book, not your pocket, and one bad year can wipe it out.",
  even: "Your share of the cotton paid for exactly what you bought. Nothing left over, and you start next year with nothing saved.",
  evicted: "Mr. {P} has put your family off the land. You lose this year's share, and your debt follows you to the next planter's book.",
};
const PLAIN_CARDS = {
  rains: "More rain means more cotton to pay your debt. The store bill stays the same.",
  drought: "Less cotton this year, but the store bill and your debt don't shrink. The family carries the loss, not the planter.",
  flood: "Less cotton, and the corn is gone, so the family has to buy more food on [[credit]].",
  muledies: "The contract makes the family pay for the planter's animals and tools. The mule goes on your account.",
  sickness: "A sick child can't work, so less cotton comes in, and the doctor goes on your account.",
  school: "A child in school can't work in the field, so there's less cotton. But a child who can read can check the planter's book.",
  election: "Black men in Mississippi could vote in 1871 and 1872. A planter could punish a family for it by putting them off the land.",
  mulebuy: "A family with its own mule keeps more of the crop: two-thirds instead of half. It costs savings the family rarely has.",
  eggs: "Eggs and greens sold in town bring in a little cash the planter doesn't control.",
  riders: "Night riders, like the Klan, threatened Black families who tried to leave or vote. Fear kept families in place.",
  panic: "A money crisis in 1873 crashed cotton prices. The same work and the same debt, but far less money for the crop.",
  none: "Nothing unusual this year. Only the crop and the bill count.",
};
const GLOSSARY = {
  "sharecropper": "A farmer who works someone else's land and is paid with a share of the crop, not wages.",
  "planter": "The man who owns the land and the store: here, Mr. {P}.",
  "share": "Your part of the crop: half of the cotton (two-thirds if you own a mule). The planter takes the rest.",
  "lien": "A legal claim on your crop. Until your debt is paid, the crop is the planter's first, and you can't sell it or leave.",
  "furnish": "Food, cloth, and supplies the planter's store hands out for the year, on credit.",
  "credit": "Taking things now and paying later. The store writes it in the book, at higher prices than cash.",
  "settling up": "The yearly reckoning at Christmas. The planter sets your share of the crop against everything you owe.",
  "carried debt": "Money still owed after settling up. It moves onto next year's account.",
  "interest": "Extra money charged for carrying debt to next year. Mr. {P} says 10%.",
  "ginning": "Cleaning the seeds out of picked cotton at the gin. The planter charges for it.",
};
