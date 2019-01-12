const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;
const Clue = new mongoose.Schema({
  text: {type: String, required: true},
  answer: {type: String, required: true},
  puzzle: {type: ObjectId},
})

module.exports = mongoose.model('Clue', Clue);