const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://bhautik:12345@bhautik.jwdpxcv.mongodb.net/Sherians"
);

const UserModel = new mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  age: Number,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", UserModel);
