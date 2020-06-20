const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// declares schema
const Schema = mongoose.Schema;

// creates new schema for user
const UserSchema = new Schema({
  email: String,
  password: String,
  facebookId: String,
  firstname: String,
  lastname: String,
  gender: String,
  lookingfor: String,
  profilepicture: String,
  name: String,
  age: Number,
  favoriteBooks: [String],
  currentBook: String,
  matches: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

//Making sure the password gets hashed
UserSchema.pre("save", function (next) {
  let user = this;
  if (user.password) {
    bcrypt.hash(user.password, 10, function (err, hash) {
      if (err) {
        return next(err);
      } else {
        user.password = hash;
        next();
      }
    });
  } else {
    next();
  }
});

// the above should be ignored if logging in with facebook

// registers UserSchema with mongoose
const UserModel = mongoose.model("User", UserSchema);

module.exports.comparePassword = function (candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
    if (err) throw err;
    callback(null, isMatch);
  });
};
// makes UserModel available to be required in my index.js
module.exports = UserModel;

// LEARN MORE:
// mongoose schema: https://mongoosejs.com/docs/guide.html
// mongoose model: https://mongoosejs.com/docs/models.html
// about the type: Schema.Types.ObjectId, ref: "User" (basically populate): https://mongoosejs.com/docs/populate.html
