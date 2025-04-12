const mongoose = require('mongoose');

const boardSchema = mongoose.Schema({
  name: { type: String, required: true },
  threads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }],
});
const Board = mongoose.model('Board', boardSchema);


const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replycount: { type: Number, default: 0 },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }],
});
const Thread = mongoose.model('Thread', threadSchema);


const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
});
const Reply = mongoose.model('Reply', replySchema);
  
module.exports = {
  Board,
  Thread,
  Reply,
};