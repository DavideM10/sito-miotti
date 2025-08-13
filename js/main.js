const inputs = document.querySelectorAll(".input");

function addcl(){
  let parent = this.parentNode.parentNode;
  parent.classList.add("focus");
}

function remcl(){
  let parent = this.parentNode.parentNode;
  if(this.value == ""){
    parent.classList.remove("focus");
  }
}

inputs.forEach(input => {
  input.addEventListener("focus", addcl);
  input.addEventListener("blur", remcl);
});

const form = document.querySelector('form');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const username = form.username.value.trim();
  const password = form.password.value.trim();

  const USER = "miotti";
  const PASS = "123456";

  if(username === USER && password === PASS){
    alert("Login effettuato con successo!");
    window.location.href = "dashboard.html";
  } else {
    alert("Credenziali errate, riprova!");
  }
});
