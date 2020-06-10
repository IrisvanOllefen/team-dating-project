// REQUIRE ALL NEEDED PACKAGES
const express = require("express"); // The server
const hbs = require("hbs"); // The templating tool
const mongoose = require("mongoose"); // The database (MongoDB)
const bodyParser = require("body-parser"); // Form input encoder
const session = require("express-session"); // Sessions
// const multer = require("multer"); // File uploads
const UserModel = require("./models/user"); // Self-made user schema/model

// CONFIGURATING ENV FILE TO BLOCK SENSITIVE INFORMATION
require("dotenv").config();

// THE URL TO MY DATABASE
const MONGO_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/test?retryWrites=true&w=majority`;

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
      saveUninitialized: true,
    })
  )
  .use(sessionFunction)
  .post("/registerform", registerFunction)
  .post("/loginform", loginFunction)
  .post(
    "/edit-profile",
    // upload.single("profilepicture"),
    editProfileActionFunction
  )
  .get("/login", getLoginPage)
  .get("/register", getRegisterpage)
  .get("/", homePageFunction)

  .get("/edit-profile", editProfilePageFunction);
 

// CREATNG PARTIALS
hbs.registerPartials(__dirname + "/views/partials", (error) => {
  // USING _dirname TO CREATE ABSOLUTE PATHS
  console.error(error);
});

// USING MULTER TO UPLOADING IMAGES TO PROFILES
// const upload = multer({
//   dest: "public/uploads/", // The destination folder for uploaded images
//   limits: { fileSize: 5000000 }, // Put a limit on the file size
//   fileFilter: function fileFilter(req, file, cb) {
//     // Creating a functtion to filter out allowed files with a callback
//     if (file.mimetype === "image/png") {
//       // Mimetypehas to be image/png, image/jpeg (or image/jpg) for the callback to return true
//       cb(null, true);
//     } else if (file.mimetype === "image/jpeg") {
//       cb(null, true);
//     } else {
//       // If the mimetype is anything else, the callback will return false
//       cb(null, false);
//     }
//   },
// });

// MIDDLEWARE FUNCTIONS
// Applying session middleware in an async function
async function sessionFunction(req, res, next) {
  if (req.session.userId) {
    const user = await UserModel.findById(req.session.userId) // All information about the logged in user will be available under req.user
      .populate("matches") // Populate is Mongoose Syntax and queries all matches from the user collection
      .exec(); // This is used to execute the query
    if (user) {
      req.user = user;
    }
  }
  next(); // Using next() to pass to the next query
}

//Get the login page
function getLoginPage(req, res) {
  res.render("login", {
    title: "Novel Love — Login"
  });
}

function getRegisterpage(req, res) {
  res.render("register", {
    title: "Novel Love — Register"
  });
}

// ROUTE TO THE HOMEPAGE
async function homePageFunction(req, res) {
  const users = await UserModel.find({}).exec(); // Looking for all users in UserModel to make them available in a drop down in the header to switch users/accounts
  if(req.session.user) {
    res.render("index", {
    // Rendering the index page
      title: "Chat Overview Page", // Giving it a specific title for inside the head (used template for this in .hbs file)
      users, // These are the users that are available in the drop down menu
      matches: req.user ? req.user.matches : null, // Checking to see if a user is logged in to show its matches. If the user is not logged in, null will be returned which makes sure there are no matches visible.
      user: req.session.user
    });
  } else {
    res.redirect("/login");
  }
}

// Registration function //
function registerFunction(req, res, next) {
  // const user = await UserModel.findById(req.body.userId).exec(); // Checking if the provided user exists in the database.
  // if (user) {
  //   // If the user exits in the database, the userId will be set and the session variable will be returned to the user.
  //   req.session.userId = user._id; // Using user._id because the user._id in the database is more reliable than the req.body.userId in the body itself because that one comes from the user.
  // }

  // UserModel.findOne({ email: req.body.email }, function(res, err, user) {
  //   if(user) {
  //     console.log("somebody has already taken this email");
  //     res.redirect("/register");
  //   } else {
  //     console.log("neem deze email maar");
  //   }
  // });

  UserModel.create({
    email: req.body.email,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    age: req.body.age,
    gender: req.body.gender,
    lookingfor: req.body.lookingfor,
  }, (err) => {
    if (err) {
      next(err);
    } else {
      res.redirect("/");
    }
  });

}

// Login Function //
function loginFunction(req, res, next) {
  if(req.body.email && req.body.password) {
    UserModel.findOne({
      email: req.body.email
    }, (err, user) => {
      if(err) {
        next(err);
      }
      if (user && user.password === req.body.password) {
        req.session.user = {
          firstname: user.firstname
        };
        res.redirect("/");
      } else {
        res.redirect("/register");
      }
    });
  }
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
    title: "Edit Profile Page", // Giving the page its own head title
    // Making sure it contains the req.user properties (name, age, etc.) in the input fields
    user: req.user,
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
  req.user.name = req.body.name; // Name
  req.user.age = req.body.age; // Age
  req.user.favoriteBooks = req.body.books; // Array of top 3 books
  req.user.currentBook = req.body.currentBook; // Currently reading book
  await req.user.save(); // Save button
  res.render("edit-profile", {
    // Rendering the updated edit-profile page
    title: "Edit Profile Page",
    user: req.user,
  });
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
