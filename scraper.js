const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const Clue = require('./Clue');
const Answer = require('./Answer');
const Puzzle = require('./Puzzle');
let prevDate;
let avg = 0;
let total = 0;
let counter = 0;
mongoose.connect('mongodb://localhost/historicalCrossword3', (err, res) => {
  if (err){console.log('DB CONNECTION FAILED: '+err)}
  else{console.log('DB CONNECTION SUCCESS')}
  scrape(`/PS?date=12/1/2011`)
});

function scrape(urlExtension) {
  let newPuzzle = {};
  let puzzleClues = [];
  let board = {};
  let nextLink;
  axios.get(`https://www.xwordinfo.com/${urlExtension}`)
  .then(res => {
    let $ = cheerio.load(res.data)
    let found = false;
    $('.dtlink').each(function(index){
      // console.log($(this).attr('rel
      if ($(this).attr('rel') === 'next' && !found){
        nextLink = $(this).attr('href');
        found = true;
      }
    });
    // console.log("nextLink: ", nextLink)
    let clues = []
    newPuzzle = new Puzzle({
      title: $('#PuzTitle').html(),
      date: urlExtension.slice(urlExtension.indexOf('=') + 1),
      publisher: 'New York Times',
      editor: $('.aegrid').children().last().text(),
      author: $('.aegrid :nth-child(2)').text(),
      dimensions: {
        rows: $('#PuzTable').children().children().length,
        columns: $('#PuzTable').children().children().first().children().length
      }
    })
    let puzzle = $("#PuzTable").children().first();
    puzzle.children().each(function(index, el){
      let newRow = [];
      $(this).children().each(function(subIndex, subEl) {
        if ($(this).hasClass('black')) {
          newRow.push('#BlackSquare#')
        } else {
          newRow.push($(this).children().last().text())
        }
      })
      board[`row${index + 1}`] = newRow;
    })
    console.log(board)
    newPuzzle.board = board;
    // console.log("rows: ", rows, " columns: ", columns)
    let acrossClues = $('.aclues').children().last().children()
    acrossClues.each(function(index, el){
      let clue = parseClue($(this), "A")
      // console.log(clue)
      clues.push(clue)
    })
    let downClues = $('.dclues').children().last().children()
    downClues.each(function(index, el){
      let clue = parseClue($(this), "D")
      clues.push(clue)
      // console.log(clue)
    })
    // console.log(clues)

    Promise.all(clues.map(currentClue => {
      // CHeck if this clue or answer is unique
      return Promise.all([Clue.findOne({$text: {$search: currentClue.text}}), Answer.findOne({$text: {$search: currentClue.answer}})]);
    }))
    .then(results => {
      let models = results.reduce((acc, result, i) => {
        // if no clue
        let clue;
        let answer;
        if (!result[0]) {
          clue = new Clue({
            text: clues[i].text,
            puzzles: [],
            answers: [],
          })
        } else {
          clue = result[0]
        }


        // if no answer
        if (!result[1]) {
          answer = new Answer ({
            text: clues[i].answer,
            puzzles: [],
            clues: [],
          })
        } else { answer = result[1] }

        // Save ids to each other if unique
        if (!answer.clues.includes(clue._id)) {
          answer.clues.push(clue._id);
        } else {
          console.log("answer ", anwer._id, " has repeat clue: ", clue._id, ' and ', answer.clues)
        }
        if (!clue.answers.includes(answer._id)) {
          clue.answers.push(answer._id);
        }
        if (!answer.puzzles.includes(newPuzzle._id)) {
          answer.puzzles.push(newPuzzle._id);
        }
        if (!clue.puzzles.includes(newPuzzle._id)) {
          clue.puzzles.push(newPuzzle._id);
        }
        newPuzzle.clues.push({clue: clue._id, answer: answer._id, position: clues[i].position})
        // return {answer, clue}
        acc.push(answer)
        acc.push(clue)
        return acc;
      }, [])
      models.push(newPuzzle)
      return Promise.all(models.map(model => model.save()))
    })
    .then(() => {
      let difference = Date.now() - prevDate;
      difference = difference / 1000;
      if (counter !== 0) {
        total += difference;
        avg = total / counter
      }
      console.log('all models saved moving to ', nextLink, " ", difference, " avg: ", avg)
      prevDate = Date.now()
      counter++;
      // scrape(nextLink)
      // } catch (err) { console.log(err)}
    })
    .catch(err => console.log(err))
  })
  .catch(err => {
    console.log("request err: ", err)
  })
}

function parseClue(element, direction) {
  let clueString = element.text()
  let position = `${clueString.slice(0, clueString.indexOf('.'))}${direction}`
  let word = element.children().first().html()
  clueString = clueString.slice(clueString.indexOf('.') + 1, clueString.indexOf(word) - 2).trim();
  return {text: clueString, answer: word, position: position}
}

//@TODO GRAB RELATED ENTRIES