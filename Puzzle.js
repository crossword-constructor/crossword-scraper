const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Puzzle = new mongoose.Schema({
  editor: {type: String},
  title: {type: String},
  author: {type: String},
  publisher: {type: String},
  clues: [{
    position: {type: String},
    answer: {type: ObjectId, ref: 'Answer'},
    clue: {type: ObjectId, ref: 'Clue'}
  }],
  date: {type: String},
  dimensions: {
    rows: {type: Number},
    columns: {type: Number}
  },
  board: {type: Object}
})

module.exports = mongoose.model('Puzzle', Puzzle);