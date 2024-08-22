const express = require("express");
const UserModel = require("./Model/User");
const PostModel = require("./Model/Post");
const app = express();
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/register', async (req, res) => {
  let { email, password, name, username, age } = req.body;

  let user = await UserModel.findOne({ email });

  if (user) return res.redirect("/error_page");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await UserModel.create({
        email,
        name,
        username,
        age,
        password: hash
      })

      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.send("Regestered");
    })
  })
})

app.post('/login', async (req, res) => {
  let { email, password } = req.body;

  let user = await UserModel.findOne({ email });

  if (!user) return res.status(404).send("Something Went Wrong !!!!!");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
      res.cookie("token", token);
      res.redirect('profile')
    }
    else {
      res.redirect("login");
    }
  })
})

app.get('/profile', isLoggedIn, async (req, res) => {
  let user = await UserModel.findOne({ email: req.user.email }).populate("posts");
  res.render('profile', { user });
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
  let post = await PostModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  }
  else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }

  await post.save();
  res.redirect('/profile');
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
  let post = await PostModel.findOne({ _id: req.params.id }).populate("user");

  res.render('edit',{post});
});

app.get('/delete/:id', isLoggedIn, async (req, res) => {
  let post = await PostModel.findOneAndDelete({ _id: req.params.id });

  res.redirect('/profile');
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
  let post = await PostModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content});

  res.redirect('/profile');
});

app.post('/post', isLoggedIn, async (req, res) => {
  let user = await UserModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await PostModel.create({
    user: user._id,
    content
  });

  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.get('/logout', (req, res) => {
  res.cookie("token", "")
  res.redirect('/login');
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect('login');
    alert("You must be logged in please !!!")
  }
  else {
    let data = jwt.verify(req.cookies.token, "shhhh");
    req.user = data;
    // console.log(data);
    next();
  }
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
