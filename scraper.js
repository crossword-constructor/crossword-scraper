const cheerio = require('cheerio');
const axios = require('axios');
const mongoose = require('mongoose');
const Clue = require('./Clue');
const Answer = require('./Answer');
const Puzzle = require('./Puzzle');
mongoose.connect('mongodb://localhost/historicalCrossword', (err, res) => {
  if (err){console.log('DB CONNECTION FAILED: '+err)}
  else{console.log('DB CONNECTION SUCCESS')}
  scrape('/PS?date=2/15/1942')
});

function scrape(urlExtension) {
  let newPuzzle = {};
  let puzzleClues = [];
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
      return Promise.all([Clue.findOne({text: currentClue.text}), Answer.findOne({text: currentClue.answer})]);
    }))
    .then(results => {
      let models = results.reduce((acc, result, i) => {
        // if no clue
        let newClue;
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
        }
        if (!clue.answers.includes(answer._id)) {
          clue.answers.push(answer._id)
        }
        answer.puzzles.push(newPuzzle._id)
        clue.puzzles.push(newPuzzle._id)
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
      console.log('all models saved moving to ', nextLink)
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