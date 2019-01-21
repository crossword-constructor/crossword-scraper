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
mongoose.connect('mongodb://localhost/historicalCrossword', (err, res) => {
  if (err){console.log('DB CONNECTION FAILED: '+err)}
  else{console.log('DB CONNECTION SUCCESS')}
  scrape(`/PS?date=2/15/1942`)
});

function scrape(urlExtension) {
  let newPuzzle = {};
  let puzzleClues = [];
  let board = {};
  let models = [];
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
      let models = [];
      if (results.length > 0) {
        results.forEach((result, index) => {
          let clue = result[0]
          let answer = result[1]
          console.log('clue: ', clue)
          console.log('answer: ', answer)
          if (clue && answer) {
            // Check if the clue has THIS answer
            let answerFound = clue.answers.some((ans, i, arr) => {
              if (ans.answer === answer._id) {
                arr[i].count++;
                return true;
              } return false;
            })
            if (!answerFound) {
              clue.answers.push({answer: answer._id, count: 1})
            }
            // Check if the answer
            let clueFound = answer.clues.some((cl, i, arr) => {
              if (cl.clue === clue._id) {
                arr[i].count++;
                return true;
              } return false;
            })
            if (!clueFound) {
              anser.clues.push({clue: clue._id, count: 1})
            }
            console.log('clue should have answer with count 2')
            console.log(clue)
          } else if (clue) { // THis is a new answer for an existing clue
            answer = new Answer({
              text: clues[index].answer,
              clues: [{clue: clue._id, count: 1}]
            })
            clue.answers.push({answer: answer._id, count: 1})
          } else if (answer){ // This is a new clue for an existing answer
            clue = new Clue({
              text: clues[index].clue,
              answers: [{answer: answer._id, count: 1}]
            })
            answer.clues.push({clue: clue._id, count: 1})
          } else { // Both the clue and the answer are new
            answer = new Answer({
              text: clues[index].answer,
            })
            clue = new Clue({
              text: clues[index].clue,
            })
            answer.clues = [{clue: clue._id, count: 1}]
            clue.answers = [{answer: answer._id, count: 1}]
          }
          models.push(clue)
          models.push(answer)
        })
      }
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
      scrape(nextLink)
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