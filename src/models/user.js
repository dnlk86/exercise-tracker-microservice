const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: String
}, {collection: "users"});

module.exports = mongoose.model("User", userSchema);