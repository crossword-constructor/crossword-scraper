const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Clue = new mongoose.Schema({
  text: {type: String},
  answers: [{answer: {type: ObjectId, ref: 'Answer'}, count: {type: Number}}],
  puzzles: [{type: ObjectId, ref: 'Puzzle'}],
})

module.exports = mongoose.model('Clue', Clue);