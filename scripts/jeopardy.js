const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
const BASE_API_URL = "https://jservice.io/api/";
// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // ask for the max number of categories so we can pick random
  // added the offset to ensure total random
  let offset = Math.floor(Math.random() * 200) * 100;
  let response = await axios.get(
    `${BASE_API_URL}categories?count=100&offset=${offset}`
  );
  let catIds = response.data.map((cat) => cat.id);
  return _.sampleSize(catIds, NUM_CATEGORIES); //lodash to get 5 random elements
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  let response = await axios.get(`${BASE_API_URL}category?id=${catId}`);
  let cat = response.data;
  let allClues = cat.clues;
  let randomClues = _.sampleSize(allClues, NUM_CATEGORIES); //lodash to get 5 random elements
  let clues = randomClues.map((clue) => ({
    question: clue.question,
    answer: clue.answer,
    showing: null,
  }));

  return { title: cat.title, clues };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_CLUES_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
  $("#jeopardy").append($("<thead>"));
  $("#jeopardy").append($("<tbody>"));

  // add category header row
  let $tr = $("<tr>");
  for (let catIndex = 0; catIndex < NUM_CATEGORIES; catIndex++) {
    $tr.append($("<th>").text(categories[catIndex].title));
  }
  $("#jeopardy thead").append($tr);

  // add rows with clues for each category
  for (let clueIndex = 0; clueIndex < NUM_CLUES_PER_CAT; clueIndex++) {
    let $tr = $("<tr>");
    for (let catIndex = 0; catIndex < NUM_CATEGORIES; catIndex++) {
      $tr.append(
        $("<td>")
          .attr("id", `${catIndex}-${clueIndex}`)
          .text("?")
          .addClass("hover initial")
      );
    }
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let cellId = evt.target.id;
  let [catId, clueId] = cellId.split("-");
  let clue = categories[catId].clues[clueId];
  let display;

  if (!clue.showing) {
    $(`#${cellId}`).removeClass("initial");
    $(`#${cellId}`).addClass("clue");
    display = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    $(`#${cellId}`).removeClass("clue");
    $(`#${cellId}`).removeClass("hover");
    $(`#${cellId}`).addClass("answer");
    display = clue.answer;
    clue.showing = "answer";
  } else {
    // showing the answer already
    return;
  }

  // Update text of cell
  $(`#${cellId}`).text(display);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  $("button").text("Loading...");
  $("#jeopardy").empty();
  $(".loader").removeClass("hidden");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $(".loader").addClass("hidden");
  $("button").text("Restart");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();

  let catIds = await getCategoryIds();

  categories = [];

  for (let catId of catIds) {
    categories.push(await getCategory(catId));
  }

  fillTable();

  hideLoadingView();
}

/** On click of start / restart button, set up game. */

$("button").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(document).ready(function () {
  $("#jeopardy").on("click", "td", handleClick);
});
