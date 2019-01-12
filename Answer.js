const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Answer = new mongoose.Schema({
  text: {type: String, required: true},
  clues: [{type: ObjectId, red: 'Clue'}],
  puzzles: [{type: ObjectId, ref: 'Puzzle'},]
})

module.exports = mongoose.model('Answer', Answer);