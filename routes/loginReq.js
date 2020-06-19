const express = require("express");
const router = express.Router();

router.get("/login", getLoginPage);

function getLoginPage(req, res) {
  console.log(req.user);
  res.render("login", {
    title: "Novel Love — Login"
  });
}

module.exports = router;
