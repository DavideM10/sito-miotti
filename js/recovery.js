(function () {
  function notify(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    alert(message);
  }

  async function onSubmit(e) {
    e.preventDefault();

    var form = e.currentTarget;
    var identifier = form.identifier.value.trim();
    var newPassword = form.new_password.value;
    var confirmPassword = form.confirm_password.value;

    if (!identifier) {
      notify('Inserisci username o email', 'error');
      return;
    }

    if (newPassword.length < 8) {
      notify('La nuova password deve avere almeno 8 caratteri', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      notify('Le password non coincidono', 'error');
      return;
    }

    if (!window.AuthStore) {
      notify('Sistema utenti non disponibile', 'error');
      return;
    }

    var result = await window.AuthStore.resetPassword(identifier, newPassword);
    if (!result.ok) {
      notify(result.error, 'error');
      return;
    }

    notify('Password aggiornata con successo', 'success');
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 900);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('recoverForm');
    if (form) {
      form.addEventListener('submit', onSubmit);
    }
  });
})();
