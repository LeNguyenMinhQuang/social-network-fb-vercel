const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatboxSchema = new Schema({
  members: {
    type: Array,
  },
  messages: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("chatboxes", ChatboxSchema);
