const mongoose = require("mongoose");

// declares schema
const Schema = mongoose.Schema;

// creates new schema for user
const UserSchema = new Schema({
  profilepicture: String,
  name: String,
  age: Number,
  favoriteBooks: [String],
  currentBook: String,
  matches: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

// registers UserSchema with mongoose
const UserModel = mongoose.model("User", UserSchema);

// makes UserModel available to be required in my index.js
module.exports = UserModel;

// LEARN MORE:
// mongoose schema: https://mongoosejs.com/docs/guide.html
// mongoose model: https://mongoosejs.com/docs/models.html
// about the type: Schema.Types.ObjectId, ref: "User" (basically populate): https://mongoosejs.com/docs/populate.html
