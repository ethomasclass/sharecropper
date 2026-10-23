// ============================================================================
// STORY — every word students read. Lucy tells it, looking back.
// {F} = the family name students type. {P} = the current planter.
// ============================================================================
const PLANTERS = ["Holliday", "Pruitt", "Dunbar", "Coker", "Askew"];

const FAMILY = [
  { id: "papa", name: "Papa", full: "Robert", role: "Plows and picks" },
  { id: "mama", name: "Mama", full: "Hannah", role: "Keeps count" },
  { id: "lucy", name: "Lucy", full: "Lucy, 10", role: "Tells this story" },
  { id: "sam", name: "Sam", full: "Sam, 6", role: "Carries water" },
  { id: "ruth", name: "Grandma Ruth", full: "Ruth", role: "Minds the garden" },
];

const PROLOGUE = [
  { art: "fieldSun", caption: "Mississippi, 1869. Four years after freedom came.", sub: "My name is Lucy {F}. I was ten years old." },
  { art: "family", caption: "There were five of us.", sub: "Papa, Mama, Grandma Ruth, my little brother Sam, and me." },
  { art: "plow", caption: "Papa wanted one thing: land of our own.", sub: "People had talked about forty acres. It never came." },
  { art: "bigHouse", caption: "Mr. Holliday had land but no one to work it.", sub: "We had our hands, and nothing else." },
  { art: "contractDesk", caption: "So in January, Papa walked up to the big house.", sub: "He went to make his mark on a contract." },
];

// Adapted from the 1882 Grimes contract (SHEG modified version).
const CONTRACT = {
  lines: [
    "For every 30 acres of land rented by sharecroppers, I will provide a mule team, plow, and farming tools. The sharecroppers can have half of the cotton, corn, peas, pumpkins, and potatoes they grow.",
    "Every sharecropper must be responsible for all farming gear placed in his hands, and if not returned must be paid for unless it is worn out by use.",
    "Nothing can be sold from their crops until my rent is all paid, and all amounts they owe me are paid in full.",
    "I am to gin and pack all of the cotton.",
    "The sale of every sharecropper's part of the cotton to be made by me when and where I choose to sell, and after taking all they owe me.",
  ],
  credit: "Adapted. Sharecropping contract, 1882, Grimes Family Papers (#3357), Southern Historical Collection, UNC Chapel Hill. Modified by the Stanford History Education Group.",
  terms: [
    ["Land", "15 acres, a cabin, a mule, tools, and seed"],
    ["Your share", "Half the cotton, after he is paid"],
    ["Food patch", "No more than 5 acres of corn and garden"],
    ["Store", "Supplies on account at the plantation store"],
    ["Interest", "10% on anything carried to next year"],
  ],
  narration: "Papa couldn't read. Mr. Holliday read it out loud, fast, and pushed the pen across the table.",
};

const YEAR_LINES = {
  1869: {
    plant: "Papa walked the fifteen acres with his hat in his hand. \"Cotton pays,\" he said. \"Corn feeds us.\"",
    store: "Mr. Holliday's store was the only store for nine miles. Whatever we took, he wrote in his book.",
    harvest: "We picked from September until frost. Then the wagon went to Mr. Holliday's gin and his scale.",
    settle: "At Christmas, Mr. Holliday called each family up to the porch, one at a time.",
  },
  1870: {
    plant: "Papa said this year we would come out ahead. He said that every spring.",
    store: "Mama asked Mr. Holliday what the flour cost. He said, \"Same as always,\" and wrote it down.",
    harvest: "Sam was big enough to drag a sack this year. He cried when his fingers bled, then kept picking.",
    settle: "Papa wore his good shirt to the porch. Mama walked up with him.",
  },
  1871: {
    plant: "Grandma Ruth said the land didn't care whose name was on it. It just wanted working.",
    store: "Mama kept her own count on a piece of string, one knot for every dollar.",
    harvest: "Mama looked at the loaded wagon, then at the number on the scale. She didn't say anything.",
    settle: "Mr. Holliday didn't look up from his book. He just read the number.",
  },
  1872: {
    plant: "Grandma Ruth's hands hurt too much to pick now. She minded the chickens and sang to them.",
    store: "The store had new shoes in the window. Mama walked past them.",
    harvest: "It was a long picking. We sang to keep our rows even.",
    settle: "Five Christmases on the porch. Papa said he could find it in the dark.",
  },
  1873: {
    plant: "Mama counted every coin twice that spring. We all felt something coming.",
    store: "The prices on the shelf hadn't changed. Mr. Holliday said cotton would come back.",
    harvest: "We picked the best crop we ever grew. Nobody wanted to buy it.",
    settle: "The last settling up I remember clearly. I stood on the step and listened.",
  },
};

const STORE_ITEMS = {
  lean: ["Meal and salt pork", "Molasses", "Seed and plow points"],
  basic: ["Meal and salt pork", "Molasses", "Seed and plow points", "Cloth, 12 yards", "Shoes, 2 pair"],
  extra: ["Meal and salt pork", "Molasses", "Seed and plow points", "Cloth, 12 yards", "Shoes, 2 pair", "Medicine", "Coffee"],
};

// Event cards. `choice` cards show two buttons.
const CARDS = {
  rains: {
    title: "Good rains",
    art: "rain",
    body: "Rain came in spring, then dry weather at picking time. The cotton stood tall.",
    effect: "Yield +20%",
    dyk: "Most farm families had no savings and no insurance. One season's weather could decide whether they ended the year ahead or behind.",
  },
  drought: {
    title: "Drought",
    art: "drought",
    body: "No rain from June to August. The bolls came in small and hard.",
    effect: "Yield −30%",
    dyk: "A sharecropper carried the risk of a bad year. The planter still collected his half of whatever grew, and the store bill stayed the same.",
  },
  flood: {
    title: "Flood on the bottomland",
    art: "flood",
    body: "The river came up over the low fields. It took the corn patch and some of the cotton.",
    effect: "Yield −20%. The corn patch is lost, so the store bill goes back up.",
    dyk: "Bottomland near rivers had the richest soil, and it was the first to flood. Croppers rarely got the high ground.",
  },
  muledies: {
    title: "The mule dies",
    art: "mule",
    body: "Old Jack lay down in his stall and didn't get up. Mr. {P} said the mule was in Papa's hands.",
    effect: "The planter charges $60 to your account.",
    effectOwn: "Your own mule dies. You lose the bigger share until you buy another.",
    dyk: "The 1882 contract says every sharecropper is \"responsible for all farming gear placed in his hands.\" Families paid for the planter's tools and stock.",
    credit: "Grimes Family Papers, 1882, adapted by SHEG",
  },
  sickness: {
    title: "Sickness in the family",
    art: "sick",
    body: "Sam took a fever in July. Mama sat up with him for nine nights, and we were one pair of hands short.",
    effect: "Yield −15%. Doctor: $10 on account.",
    effectExtra: "You bought medicine this spring. Yield −10%, and no doctor's bill.",
    dyk: "With no savings, every crisis went on account at the store. Historian Jim Downs found that the Freedmen's Bureau never had enough doctors or money to fight the epidemics of these years.",
    credit: "Jim Downs, Sick from Freedom (2012)",
  },
  school: {
    title: "A school opens nearby",
    art: "school",
    body: "The church started a school for children. It meant one less picker in the field.",
    question: "Send Lucy to school?",
    yes: "Send Lucy",
    no: "Keep her in the field",
    effectYes: "Yield −10%. Lucy learns to read.",
    effectNo: "Lucy stays in the field.",
    dyk: "The Freedmen's Bureau and Black churches opened schools across the South. Families paid for them with tuition, with labor, and with lost hands in the field.",
    credit: "Records of the Freedmen's Bureau, National Archives",
  },
  election: {
    title: "Election Day, {Y}",
    art: "ballot",
    body: "Papa could vote now. Mr. {P} said a man who votes against him can find another place to live.",
    question: "Does Papa go to vote?",
    yes: "Go and vote",
    no: "Stay home",
    effectYes: "Papa votes. Mr. {P} may put you off the place (1 in 4).",
    effectNo: "Papa stays home.",
    dyk: "The 15th Amendment (1870) said no state could deny the vote because of race. Planters used the lease as a weapon against Black voters.",
    credit: "U.S. Constitution, 15th Amendment",
  },
  mulebuy: {
    title: "A chance to buy a mule",
    art: "mulebuy",
    body: "A neighbor moving west to Texas offered his mule for $60, cash money.",
    question: "Buy the mule?",
    yes: "Buy it for $60",
    no: "Not this year",
    effectYes: "You own a mule. From now on you keep two-thirds of the crop, not half.",
    effectNo: "You let the mule go.",
    cantAfford: "You need $60 in savings. You don't have it.",
    dyk: "Families who owned a mule could bargain for a bigger share of the crop. Owning stock was the first rung on the ladder toward renting land.",
    credit: "Ransom and Sutch, One Kind of Freedom (1977)",
  },
  eggs: {
    title: "Eggs and greens in town",
    art: "eggs",
    body: "Grandma Ruth's garden came in thick. Mama walked to town on Saturday with a basket.",
    effect: "+$15 cash, if you planted 3 or more acres of corn and garden.",
    effectNone: "The garden was too small to spare anything for town.",
    dyk: "Every egg or ear of corn a family raised was one less thing bought on credit at the planter's store.",
  },
  riders: {
    title: "Headline: night riders in the county",
    art: "headline",
    headline: "NIGHT RIDERS IN THE COUNTY",
    body: "The newspaper said men in masks rode at night two farms over. Papa barred the door and said nothing.",
    effect: "No money lost. Leaving this year costs double.",
    dyk: "The Ku Klux Klan and other groups attacked Black voters, teachers, and families who tried to get ahead. Congress passed the Enforcement Acts in 1870 and 1871 to stop them.",
    credit: "Enforcement Acts of 1870–1871",
  },
  panic: {
    title: "The Panic of 1873",
    art: "panic",
    headline: "PANIC IN NEW YORK",
    body: "A big bank in New York failed in September, and many more followed. Nobody wanted to buy cotton.",
    effect: "Cotton drops to $60 a bale.",
    dyk: "The Panic of 1873 began when Jay Cooke & Company failed. Cotton prices fell, and the Freedman's Savings Bank collapsed the next year, taking many Black families' savings with it.",
    credit: "Federal Reserve History, \"The Panic of 1873\"",
  },
  none: { title: "A quiet year", art: "fieldSun", body: "Nothing much happened.", effect: "", dyk: "" },
};

const INTERLUDES = {
  1870: [
    { art: "newspaper15", caption: "In 1870, the 15th Amendment said Papa could vote.", sub: "Mama read the newspaper to Grandma Ruth twice." },
    { art: "tracker", caption: "On our tracker, we crossed one word off.", sub: "The other word stayed." },
    { art: "senate", caption: "That winter, Hiram Revels of Mississippi took a seat in the U.S. Senate.", sub: "He was the first Black senator. Papa said, \"Now watch.\"" },
  ],
  1873: [
    { art: "newspaperPanic", caption: "In the fall of 1873, banks failed far away in New York.", sub: "We had never seen New York. It found us anyway." },
    { art: "priceChart", caption: "Cotton fell to $60 a bale.", sub: "We had grown it all year at the old price." },
  ],
};

const SETTLE_TEXT = {
  owe: "\"You owe me ${N}. We'll carry it to next year, at ten percent.\"",
  ahead: "\"Your share comes to ${N}, clear.\"",
  even: "\"You come out even. Nothing owed.\"",
  evictedVote: "\"I heard you went to town on Election Day. I'll keep your share for the trouble. Find yourselves another place.\"",
  evictedDemand: "\"You calling me a liar? Get off my porch. Your share stays with me. Be gone by New Year's.\"",
  demandIntro: "Papa took a breath and asked to see the books.",
  leaveOwing: "If we leave owing him, the law can come after Papa. Mama said it quietly.",
  rentReady: "Papa had saved enough, and the mule was ours. A man two miles off had land to rent.",
};

const REVEALS = {
  markup: {
    title: "One line from his book",
    text: "The store charges a \"time price\" for goods on account: 40% more than the cash price.",
    detail: (y) => `This year: ${fmt(y.ledger.store + y.ledger.doctor)} on account. Cash price: ${fmt(y.honest.store + y.honest.doctor)}.`,
  },
  weight: {
    title: "One line from his book",
    text: "Papa asked about the weight. Mr. {P} turned the book around for a second. The gin weight was less than what went in the wagon.",
    detail: (y) => `Your wagon: ${y.trueLbs.toLocaleString()} lb. His scale: ${y.scaleLbs.toLocaleString()} lb.`,
  },
  interest: {
    title: "One line from his book",
    text: "The interest on the carried debt isn't ten percent. It's twenty-five.",
    detail: (y) => y.startBalance < 0
      ? `This year: ${fmt(y.ledger.interest)} in interest. At 10% it would be ${fmt(-y.startBalance * CONFIG.interestTold)}.`
      : "You weren't carrying debt this year, but it will apply the next time you are.",
  },
};

const ENDINGS = {
  cropping: {
    title: "Still cropping",
    panels: [
      { art: "porchLantern", caption: "\"Next year,\" Mr. {P} said. \"Cotton will come back.\"", sub: "Papa said, \"Yes, sir.\" We planted again in the spring." },
      { art: "longRows", caption: "We planted again the year after that, and the year after that.", sub: "The rows were the same. Only the number in the book got bigger." },
    ],
  },
  rent: {
    title: "Renting a farm",
    panels: [
      { art: "muleRoad", caption: "We loaded the wagon in January and drove our own mule down the road.", sub: "The land still wasn't ours. But the crop was ours to sell." },
      { art: "ownField", caption: "Papa sold our cotton himself that fall.", sub: "He read the price off the board in town and counted the money twice." },
    ],
  },
  left: {
    title: "Lost to the lien",
    panels: [
      { art: "emptyRoad", caption: "We leave at night, owing.", sub: "We make it as far as the county line." },
      { art: "emptyDoor", caption: "His lien takes the crop, the mule, even Hannah's stove.", sub: "The justice of the peace sides with him." },
      { art: "longRows", caption: "No planter in the county will sign a man who walked off owing.", sub: "I hire out by the day, to whoever will have me." },
      { art: "emptyRoad", caption: "After 1876, Mississippi's new laws made it easy to arrest a Black man for almost nothing and hire him out to work off the fine.", sub: "For a family that left owing, the risk only grew." },
    ],
  },
};

const EPILOGUE = {
  school: { art: "schoolLetters", caption: "I learned to read at the church school.", sub: "Years later I taught there. I wrote this down so you would know." },
  noschool: { art: "grandmother", caption: "I never went to school.", sub: "I told this story to my granddaughter, and she wrote it down for me." },
};

const AUDIT_INTRO = "Now you are the auditors. Here is Mr. Holliday's book next to what your family really bought, at cash prices, with honest weights.";

const EXIT_TICKET = {
  question: "Can you be free if you can't leave?",
  prompt: "Answer in one TEA paragraph. Use one number from your own audit as evidence.",
  tracker: "LANDLESS stays on the tracker. Write the one mechanism from the sim that kept it there.",
};
