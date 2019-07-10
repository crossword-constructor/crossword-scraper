const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const Answer = new mongoose.Schema({
  text: { type: String, required: true, index: true },
  clues: [
    {
      clue: { type: ObjectId, red: "Clue" },
      count: { type: Number },
      _id: false
    }
  ],
  puzzles: [{ type: ObjectId, ref: "Puzzle" }]
});

module.exports = mongoose.model("Answer", Answer);
