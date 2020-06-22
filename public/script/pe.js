// POP UP WHEN YOU LEAVE PAGE AND STILL HAVE UNSAVED CHANGES

console.log("working script!");

let changed = false; // declaring this in the global scope to make it usable in multiple function scopes

window.addEventListener("beforeunload", function (event) {
  if (changed) {
    // if changed = false, the default should be prevented, otherwise you'll ALWAYS see the pop-up.
    event.preventDefault();
    event.returnValue = ""; // returnValue is a requirement from Chrome
  }
});

document.querySelectorAll("input").forEach(function (element) {
  // looking for all input elements and adding a function to each of them
  element.addEventListener("keyup", function (event) {
    // adding the keyup event and another function
    changed = true; // if there is a keyup, the value of changed is set to true
    console.log(event); // logging to console to check
  });
});

// prevent pop up from showing when save button is clicked
document.querySelectorAll("form").forEach(function (element) {
  element.addEventListener("submit", function (event) {
    // adding submit event and function
    changed = false; // if the form is submitted, the value of changed turns back in to false
    console.log(event);
  });
});

// IMMEDIATELY SHOW NEW UPLOADED PROFILE PICTURE

document.querySelectorAll("input[type=file]").forEach(function (element) {
  // using a CSS selector
  element.addEventListener("change", function (event) {
    // adding the change event and function
    const reader = new FileReader(); // fileReader is kind of like an API from the browser which you can ask to look or read a file
    reader.readAsDataURL(event.target.files[0]); // get the first item/value from the array (there is only one item/value) and read it as a data URL
    reader.onload = function (e) {
      document.getElementById("uploadedimage").src = e.target.result; // the `reader.onload` gives another function with the parameter `e`, which gets the source from the uploaded image by it's ID and calls it `e.target.result`.
    };
  });
});
