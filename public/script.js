const profilePictureInput = document.querySelector("#profilepicture");

if (profilePictureInput) {
  profilePictureInput.addEventListener("change", (event) => {
    const profilePicture = document.querySelector("#picture-profile");
    profilePicture.src = URL.createObjectURL(event.target.files[0]);
  });
}

console.log("test");