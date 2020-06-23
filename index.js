// REQUIRE ALL NEEDED PACKAGES
const express = require("express"); // The server
const hbs = require("hbs"); // The templating tool
const mongoose = require("mongoose"); // The database (MongoDB)
const bodyParser = require("body-parser"); // Form input encoder
const session = require("express-session"); // Sessions
const multer = require("multer"); // File uploads
const bcrypt = require("bcrypt"); //Bcrypt hashing
const passport = require("passport"), // Passport
  FacebookStrategy = require("passport-facebook").Strategy, // Passport facebook strategy
  LocalStrategy = require("passport-local").Strategy; // Passport local strategy
const UserModel = require("./models/user"); // Self-made user schema/model
const find = require("array-find"); //array-find for searching the right detailpage'
const flash = require("connect-flash");

// CONFIGURATING ENV FILE TO BLOCK SENSITIVE INFORMATION
require("dotenv").config();

// THE URL TO MY DATABASE
const MONGO_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/test?retryWrites=true&w=majority`;

// USING MULTER TO UPLOADING IMAGES TO PROFILES
const upload = multer({
  dest: "public/uploads/", // The destination folder for uploaded images
  limits: { fileSize: 5000000 }, // Put a limit on the file size
  fileFilter: function fileFilter(req, file, cb) {
    // Creating a functtion to filter out allowed files with a callback
    if (file.mimetype === "image/png") {
      // Mimetypehas to be image/png, image/jpeg (or image/jpg) for the callback to return true
      cb(null, true);
    } else if (file.mimetype === "image/jpeg") {
      cb(null, true);
    } else {
      // If the mimetype is anything else, the callback will return false
      cb(null, false);
    }
  },
});

const app = express();

// CREATING SETUP ROUTES, POSTS AND GET REQUESTS
app
  .set("view engine", "hbs")
  .use(express.static("public"))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(
    session({
      secret: "uir3948uri934i9320oi",
      resave: false,
      saveUninitialized: true,
    })
  )
  .use(passport.initialize())
  .use(passport.session())
  .use(flash())
  .post("/registerform", registerFunction)
  .post("/loginform", loginFunction)
  .post("/booksform", upload.single("profilepicture"), registerBooksFunction)
  .post("/signout", signOutUser)
  .post("/like", liken)
  .post("/", passport.use)
  .post(
    "/edit-profile",
    upload.single("profilepicture"),
    editProfileActionFunction
  )
  .post("/removelike", removeLike)
  .get("/login", getLoginPage)
  .get("/register", getRegisterPage)
  .get("/register/books", getRegisterBooksPage)
  .get("/", getHomePage)
  .get("/discover", getDiscoverPage)
  .get("/edit-profile", editProfilePageFunction)
  .get("/profile/:id", matchDetailPage)
  .get("/matches", renderMatches) //look at this one later

  // Redirect the user to Facebook for authentication.  When complete,
  // Facebook will redirect the user back to the application at
  //     /auth/facebook/callback
  .get("/auth/facebook", passport.authenticate("facebook"))

  // Facebook will redirect the user to this URL after approval.  Finish the
  // authentication process by attempting to obtain an access token.  If
  // access was granted, the user will be logged in.  Otherwise,
  // authentication has failed.
  .get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      successRedirect: "/discover",
      failureRedirect: "/login",
    })
  );

// CREATNG PARTIALS
hbs.registerPartials(__dirname + "/views/partials", (error) => {
  console.error(error);
});

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  UserModel.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  "facebook",
  new FacebookStrategy(
    {
      clientID: `${process.env.FACEBOOK_APP_ID}`,
      clientSecret: `${process.env.FACEBOOK_APP_SECRET}`,
      callbackURL: "http://localhost:8000/auth/facebook/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      const userByFacebookId = await UserModel.findOne({
        facebookId: profile.id,
      }).exec();

      if (userByFacebookId) {
        done(null, userByFacebookId);
        return;
      }

      const user = new UserModel();
      user.facebookId = profile.id;

      await user.save();

      done(null, user);
    }
  )
);

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (username, password, done) {
      UserModel.findOne({ email: username }, function (err, user) {
        if (err) throw err;
        if (!user) {
          return done(null, false, { message: "Unknown Email" });
        }
        bcrypt.compare(password, user.password, function (err, isMatch) {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        });
      });
    }
  )
);

function getHomePage(req, res) {
  res.sendFile(__dirname + "/index.html");
}

//Get the login page
function getLoginPage(req, res) {
  res.render("login", {
    title: "Novel Love — Login",
    message: req.flash("error"),
  });
}

function getRegisterPage(req, res) {
  res.render("register", {
    title: "Novel Love — Register",
  });
}

function getRegisterBooksPage(req, res) {
  if (req.session.user) {
    res.render("books", {
      title: "Novel Love — Register Books",
      newUser: req.session.user,
    });
  } else {
    res.redirect("/register");
  }
}

function liken(req, res) {
  let likedUser = req.body.like;
  UserModel.updateOne(
    { _id: req.user._id },
    { $push: { matches: likedUser } },
    function (error) {
      if (error) {
        console.log(error);
      } else {
        res.redirect("/discover");
      }
    }
  );
}


async function getDiscoverPage(req, res) {
  if (req.user) {
    const userData = function (err, userData) {
      for (let user = 0; user < userData.length; user++) {
        let commonGenres = 0;
        for (let i = 0; i < req.user.favoriteBooks.length; i++) {
          if (req.user.favoriteBooks[i] === userData[user].favoriteBooks[0]) {
            commonGenres += 1;
          }
          if (req.user.favoriteBooks[i] === userData[user].favoriteBooks[1]) {
            commonGenres += 1;
          }
          if (req.user.favoriteBooks[i] === userData[user].favoriteBooks[2]) {
            commonGenres += 1;
          }
        }
        console.log(
          "jij en " +
            userData[user].firstname +
            " hebben " +
            commonGenres +
            " genres gemeen"
        );
        userData[user].commonGenres = commonGenres;
        userData.sort(function (a, b) {
          return b.commonGenres - a.commonGenres;
        });
      }

      res.render("discover", {
        match: userData,
        title: "Novel Love — Discover ",
        user: req.user,
      });
    };
    UserModel.find({ gender: req.user.lookingfor }, userData);
  } else {
    res.redirect("login");
  }
}

function matchDetailPage(req, res, next) {

  const detailPage = function (err, dataProfile) {
    const profile = dataProfile

    if (!profile) {
      next();
      return;
    }else{
      res.render("detail", {
      matchData: profile,
      user: req.user,
      });
    };

    if (req.user) {
      const ID = req.params.id;
      UserModel.findOne({ _id: ID }, detailPage);
    } else {
      res.redirect("login");
    }
}

async function renderMatches(req, res) {
  if(req.user) {
    const match = await UserModel.findOne({ _id: req.user._id})
      .populate("matches") 
      .exec();
    res.render("matches", {
      user: req.user,
      match: match.matches
    });
  } else {
    res.redirect("/login");
  }
}

function removeLike(req, res) {
  let removedUser = req.body.remove;
  UserModel.updateOne(
    { _id: req.user._id },
    { $pull: { matches: removedUser } },
    function (error) {
      if (error) {
        console.log(error);
      } else {
        res.redirect("/matches");
      }
    }
  );
}

// Registration function //
function registerFunction(req, res) {
  req.session.user = {
    email: req.body.email,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    age: req.body.age,
    gender: req.body.gender,
    lookingfor: req.body.lookingfor,
  };

  res.redirect("register/books");
}

function registerBooksFunction(req, res, next) {
  req.session.user.favoriteBooks = req.body.genre;
  req.session.user.currentBook = req.body.currentBook;
  req.session.user.profilepicture = req.file ? req.file.filename : null;

  const newUser = new UserModel(req.session.user);

  newUser.save((err) => {
    if (err) {
      next(err);
    } else {
      res.redirect("/login");
    }
  });
}

// Login Function
function loginFunction(req, res, next) {
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/discover",
    failureFlash: true,
  })(req, res, next);
}

// EDIT PROFILE ROUTE
async function editProfilePageFunction(req, res) {
  if (!req.user) {
    res.redirect("/login");
    return;
  }
  res.render("edit-profile", {
    // Rendering the edit-profile page
    title: "Novel Love — Edit Profile", // Giving the page its own head title
    // Making sure it contains the req.user properties (name, age, etc.) in the input fields
    user: req.user,
  });
}

// POST METHOD ROUTE ON EDIT-PROFILE
async function editProfileActionFunction(req, res) {
  if (!req.user) {
    res.redirect("/login");
    return;
  }

  // MAKING A DELETE ACCOUNT BUTTON AVAILABLE
  if (req.body.deleteAccount === "on") {
    await UserModel.deleteOne({ _id: req.user._id }), req.session.destroy();
    res.redirect("/login");
    return;
  }

  if (req.file) {
    req.user.profilepicture = req.file.filename;
  }
  if (req.body.password) {
    req.user.password = req.body.password;
  }
  req.user.firstname = req.body.firstname;
  req.user.lastname = req.body.lastname;
  req.user.age = req.body.age;
  req.user.email = req.body.email;
  req.user.favoriteBooks = req.body.genre;
  req.user.currentBook = req.body.currentBook;
  await req.user.save();
  res.render("edit-profile", {
    title: "Novel Love — Edit Profile",
    user: req.user,
  });
}


async function signOutUser(req, res) {
  req.session.destroy();
  res.redirect("/login");
}

// RUNNING THE APPLICATION
async function run() {
  // Waiting for Mongoose before actually starting the server.
  await mongoose.connect(MONGO_URL, {
    // Avoiding deprecation warnings
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // The Express server will run on port 8000, or on another port given through the terminal (needed for deployment).
  app.listen(port || 8000, () => {
    // This immediately gives you the URL to click open through the terminal.
    console.log("Your app is now running on http://localhost:8000");
  });
}

// DO NOT FORGET TO RUN THE FUNCTION
// This is needed because mongoose.connect uses await and therefore it can not be at the top-level scope and should be inside an async function.
run();

// SOURCE LIST
// FOR EVERYTHING THAT HAD TO DO WITH MONGOOSE/SCHEMA'S/MODELS ETC. I USED THE OFFICIAL MONGOOSE DOCUMENTATION: https://mongoosejs.com/docs/guide.html
// ABOUT DOTENV FILE SOURCE: https://www.npmjs.com/package/dotenv
// ABOUT SESSIONS SOURCE: https://github.com/expressjs/session
// ABOUT MULTER SOURCE: https://www.npmjs.com/package/multer
// SOURCE: THE MONGODB DOCUMENTATION/GETTING STARTED GUIDE
// SOURCE ABOUT DELETE WITH MONGOOSE: https://mongoosejs.com/docs/models.html#deleting
