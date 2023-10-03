const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  userId: {
    type: String,
  },
  like: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  photoUrl: {
    type: String,
    default: "",
  },
  text: {
    type: String,
  },
  comments: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model("posts", PostSchema);
