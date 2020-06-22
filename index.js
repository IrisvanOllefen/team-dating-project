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
  }
});


const app = express();

// CREATING SETUP ROUTES, POSTS AND GET REQUESTS
app
  .set("view engine", "hbs") // The view engine is hbs (handlebars for express), this gives a res.render to render a file and send it to the browser.
  .use(express.static("public")) // Serving static files in the public map (things like images, the stylesheet, etc.)
  .use(bodyParser.urlencoded({ extended: false })) // bodyParser IS USED FO PARSE FORM DATA
  .use(
    // This middleware function makes it possible to save data (session data like a userId) inbetween requests.
    session({
      secret: "uir3948uri934i9320oi",
      resave: false,
      saveUninitialized: true
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
  //.post("/likes", likeUser)

  .get("/login", getLoginPage)
  .get("/register", getRegisterPage)
  .get("/register/books", getRegisterBooksPage)
  .get("/", homePageFunction)
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
      successRedirect: "/",
      failureRedirect: "/login"
    })
  );

// CREATNG PARTIALS
hbs.registerPartials(__dirname + "/views/partials", error => {
  // USING _dirname TO CREATE ABSOLUTE PATHS
  console.error(error);
});

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  UserModel.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(
  "facebook",
  new FacebookStrategy(
    {
      clientID: `${process.env.FACEBOOK_APP_ID}`,
      clientSecret: `${process.env.FACEBOOK_APP_SECRET}`,
      callbackURL: "http://localhost:8000/auth/facebook/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      const userByFacebookId = await UserModel.findOne({
        facebookId: profile.id
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
      passwordField: "password"
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

//Get the login page
function getLoginPage(req, res) {
  res.render("login", {
    title: "Novel Love — Login",
    message: req.flash("error") 
  });
}

function getRegisterPage(req, res) {
  res.render("register", {
    title: "Novel Love — Register"
  });
}

function getRegisterBooksPage(req, res) {
  if (req.session.user) {
    res.render("books", {
      title: "Novel Love — Register Books",
      newUser: req.session.user
    });
  } else {
    res.redirect("/register");
  }
}

function liken(req) {
  let likedUser = req.body.like;
  UserModel.updateOne(
    { _id: req.user._id },
    { $push: { matches: likedUser } },
    function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log(req.user.matches);
      }
    }
  );
}

let dataProfiles;
async function homePageFunction(req, res) {
  const users = await UserModel.find({}).exec(); // Looking for all users in UserModel to make them available in a drop down in the header to switch users/accounts

  if (req.user) {
    const userData = function (err, userData) {
      dataProfiles = userData;
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
        dataProfiles[user].commonGenres = commonGenres;
        dataProfiles.sort(function (a, b) {
          return b.commonGenres - a.commonGenres;
        });
        console.log(dataProfiles);
      }
      res.render("index", {
        match: dataProfiles,
        title: "Novel Love — Discover ", // Giving it a specific title for inside the head (used template for this in .hbs file)
        users, // These are the users that are available in the drop down menu
        user: req.user
      });
    };
    UserModel.find({ gender: req.user.lookingfor }, userData);
  } else {
    res.redirect("login");
  }
}

function matchDetailPage(req, res, next) {
  if (req.user) {
    let ID = req.params.id;
    let profile = find(dataProfiles, function (value) {
      return value.id === ID;
    });

    if (!profile) {
      next();
      return;
    }

    res.render("detail", {
      matchData: profile,
      user: req.user
    });
  } else {
    res.redirect("login");
  }
}

function renderMatches(req, res) {
  res.render("matches");
  //  UserModel.find({ likes: req.user.lookingfor }, userData);
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
    lookingfor: req.body.lookingfor
  };

  res.redirect("register/books");
}

function registerBooksFunction(req, res, next) {
  req.session.user.favoriteBooks = req.body.genre;
  req.session.user.currentBook = req.body.currentBook;
  req.session.user.profilepicture = req.file ? req.file.filename : null;

  const newUser = new UserModel(req.session.user);

  newUser.save(err => {
    if (err) {
      next(err);
    } else {
      res.redirect("/");
    }
  });
}

// Login Function
function loginFunction(req, res, next) {
  passport.authenticate("local", { failureRedirect: "/login",
    successRedirect: "/", failureFlash: true }
  )(req, res, next); 
}

// EDIT PROFILE ROUTE
async function editProfilePageFunction(req, res) {
  if (!req.user) {
    // If a user is not logged in, you will be redirected to the homepage
    res.redirect("/");
    return;
  }
  res.render("edit-profile", {
    // Rendering the edit-profile page
    title: "Novel Love — Edit Profile", // Giving the page its own head title
    // Making sure it contains the req.user properties (name, age, etc.) in the input fields
    user: req.user
  });
}

// POST METHOD ROUTE ON EDIT-PROFILE
async function editProfileActionFunction(req, res) {
  // Used for multiple things, one of them is making uploading pictures possible
  if (!req.user) {
    // If the user is not logged in, the user will be redirected to the homepage.
    res.redirect("/");
    return;
  }

  // MAKING A DELETE ACCOUNT BUTTON AVAILABLE
  if (req.body.deleteAccount === "on") {
    // If the checkbox is checked on
    await UserModel.deleteOne({ _id: req.user._id }), req.session.destroy(); // Deleting the user connected to the ID and then destroying the session.
    res.redirect("/"); // Afterwards, the user will be redirected to the homepage
    return;
  }

  // All information that is received through req.body using body-parser will be stored inside req.user and placed inside the database.
  if (req.file) {
    req.user.profilepicture = req.file.filename; // Profile picture
  }
  req.user.firstname = req.body.firstname; 
  req.user.lastname = req.body.lastname; 
  req.user.age = req.body.age; 
  req.user.email = req.body.email; 
  if(req.body.password) {
    req.user.password = req.body.password; 
  }
  req.user.favoriteBooks = req.body.genre; 
  req.user.currentBook = req.body.currentBook; 
  await req.user.save(); 
  res.render("edit-profile", {
    title: "Novel Love — Edit Profile",
    user: req.user,
  });
}

//function to have the user be liked
// async function likeUser(req, res) {
//   if (!req.user) {
//     // If the user is not logged in, the user will be redirected to the homepage.
//     res.redirect("/");
//     return;
//   }
//   req.user.currentBook = req.body.currentBook; // Currently reading book
//   await req.user.save(); // Save button
//   res.render("likes", {
//     // Rendering the updated edit-profile page
//     title: "These are your picks",
//     user: req.user
//   });
// }

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
    useUnifiedTopology: true
  });

  // The Express server will run on port 8000, or on another port given through the terminal (needed for deployment).
  app.listen(process.env.PORT || 8000, () => {
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
