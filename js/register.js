(function () {
  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    alert(message);
  }

  function setupInputFx() {
    var inputs = document.querySelectorAll('.input');

    function addcl() {
      var parent = this.parentNode.parentNode;
      parent.classList.add('focus');
    }

    function remcl() {
      var parent = this.parentNode.parentNode;
      if (this.value === '') {
        parent.classList.remove('focus');
      }
    }

    inputs.forEach(function (input) {
      input.addEventListener('focus', addcl);
      input.addEventListener('blur', remcl);
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    var form = e.currentTarget;
    var username = form.username.value.trim();
    var email = form.email.value.trim();
    var password = form.password.value;
    var confirmPassword = form.confirm_password.value;

    if (password.length < 8) {
      notify('La password deve avere almeno 8 caratteri', 'error');
      return;
    }

    if (password !== confirmPassword) {
      notify('Le password non coincidono', 'error');
      return;
    }

    if (!window.AuthStore) {
      notify('Sistema utenti non disponibile', 'error');
      return;
    }

    var result = await window.AuthStore.registerUser({
      username: username,
      email: email,
      password: password
    });

    if (!result.ok) {
      notify(result.error, 'error');
      return;
    }

    notify('Registrazione completata', 'success');
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 800);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupInputFx();
    var form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', onSubmit);
    }
  });
})();
