const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Clue = new mongoose.Schema({
  text: {type: String},
  answers: [{answer: {type: ObjectId, ref: 'Answer'}, count: {type: Number}}],
  puzzles: [{type: ObjectId, ref: 'Puzzle'}],
})

Clue.index({text: 'text'})
module.exports = mongoose.model('Clue', Clue);