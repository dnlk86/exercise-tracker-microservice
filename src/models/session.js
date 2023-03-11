const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema({
  user_id: String,
  description: String,
  duration: Number,
  date: String
}, {collection: "sessions"})

module.exports = mongoose.model("Session", sessionSchema);