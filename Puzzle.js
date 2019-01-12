const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Puzzle = new mongoose.Schema({
  editors: [{type: String, required: true}],
  authors: [{type: String, required: true}],
  clues: [{type: ObjectId}],
  date: {type: String},
  dimensions: {
    rows: {type: Number},
    columns: {type: Number}
  }
})

module.exports = mongoose.model('Puzzle', Puzzle);