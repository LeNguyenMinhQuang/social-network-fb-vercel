const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  photoUrl: {
    type: String,
    default: "",
  },
  friend: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model("users", UserSchema);
