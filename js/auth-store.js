(function () {
  var STORAGE_KEY = 'registered-users-v1';
  var DEFAULT_USER = {
    username: 'miotti',
    email: 'miotti@example.com',
    password: 'vivaDuce'
  };

  var HASH_ALG = 'SHA-256';
  var ITERATIONS = 210000;
  var SALT_BYTES = 16;
  var ENCODER = new TextEncoder();
  var initPromise = null;

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function readUsers() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  function bytesToBase64(bytes) {
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function getCryptoApi() {
    return window.crypto && window.crypto.subtle ? window.crypto : null;
  }

  async function hashPassword(password, saltBase64, iterations) {
    var cryptoApi = getCryptoApi();
    if (!cryptoApi) {
      throw new Error('Crypto API non disponibile');
    }

    var keyMaterial = await cryptoApi.subtle.importKey(
      'raw',
      ENCODER.encode(String(password)),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    var derivedBits = await cryptoApi.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: base64ToBytes(saltBase64),
        iterations: iterations,
        hash: HASH_ALG
      },
      keyMaterial,
      256
    );

    return bytesToBase64(new Uint8Array(derivedBits));
  }

  function makeSaltBase64() {
    var cryptoApi = getCryptoApi();
    if (!cryptoApi) {
      throw new Error('Crypto API non disponibile');
    }
    var salt = new Uint8Array(SALT_BYTES);
    cryptoApi.getRandomValues(salt);
    return bytesToBase64(salt);
  }

  function safeUser(user) {
    return {
      username: user.username,
      email: user.email,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null
    };
  }

  function findByUsernameRaw(users, username) {
    var uname = normalize(username);
    return users.find(function (u) {
      return normalize(u.username) === uname;
    }) || null;
  }

  function findByEmailRaw(users, email) {
    var em = normalize(email);
    return users.find(function (u) {
      return normalize(u.email) === em;
    }) || null;
  }

  function timingSafeEqualBase64(a, b) {
    try {
      var aBytes = base64ToBytes(String(a || ''));
      var bBytes = base64ToBytes(String(b || ''));

      if (aBytes.length !== bBytes.length) return false;

      var diff = 0;
      for (var i = 0; i < aBytes.length; i++) {
        diff |= aBytes[i] ^ bBytes[i];
      }
      return diff === 0;
    } catch (e) {
      return false;
    }
  }

  async function toPasswordRecord(password) {
    var salt = makeSaltBase64();
    var hash = await hashPassword(password, salt, ITERATIONS);
    return {
      passwordHash: hash,
      salt: salt,
      iterations: ITERATIONS,
      hashAlg: HASH_ALG
    };
  }

  async function migrateLegacyUsers() {
    var users = readUsers();
    var changed = false;

    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var hasLegacyPassword = typeof user.password === 'string' && user.password.length > 0;
      var hasHash = typeof user.passwordHash === 'string' && user.passwordHash.length > 0;

      if (!hasHash && hasLegacyPassword) {
        var record = await toPasswordRecord(user.password);
        user.passwordHash = record.passwordHash;
        user.salt = record.salt;
        user.iterations = record.iterations;
        user.hashAlg = record.hashAlg;
        user.updatedAt = new Date().toISOString();
        delete user.password;
        changed = true;
      }

      if (hasHash && (!user.iterations || !user.salt || user.hashAlg !== HASH_ALG)) {
        user.iterations = user.iterations || ITERATIONS;
        user.hashAlg = HASH_ALG;
        changed = true;
      }
    }

    if (changed) {
      writeUsers(users);
    }
  }

  async function ensureSeedUser() {
    var users = readUsers();
    var exists = users.some(function (u) {
      return normalize(u.username) === normalize(DEFAULT_USER.username);
    });

    if (exists) return;

    var record = await toPasswordRecord(DEFAULT_USER.password);
    users.push({
      username: DEFAULT_USER.username,
      email: DEFAULT_USER.email,
      passwordHash: record.passwordHash,
      salt: record.salt,
      iterations: record.iterations,
      hashAlg: record.hashAlg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    writeUsers(users);
  }

  async function init() {
    if (!initPromise) {
      initPromise = (async function () {
        await ensureSeedUser();
        await migrateLegacyUsers();
      })();
    }
    return initPromise;
  }

  async function getUsers() {
    await init();
    return readUsers().map(safeUser);
  }

  async function registerUser(payload) {
    await init();

    var username = String(payload.username || '').trim();
    var email = String(payload.email || '').trim();
    var password = String(payload.password || '');

    if (!username || !email || !password) {
      return { ok: false, error: 'Compila tutti i campi' };
    }

    if (password.length < 8) {
      return { ok: false, error: 'Password troppo corta (minimo 8 caratteri)' };
    }

    var users = readUsers();

    if (findByUsernameRaw(users, username)) {
      return { ok: false, error: 'Nome utente gia registrato' };
    }

    if (findByEmailRaw(users, email)) {
      return { ok: false, error: 'Email gia registrata' };
    }

    var record = await toPasswordRecord(password);
    users.push({
      username: username,
      email: email,
      passwordHash: record.passwordHash,
      salt: record.salt,
      iterations: record.iterations,
      hashAlg: record.hashAlg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    writeUsers(users);
    return { ok: true };
  }

  async function validateLogin(username, password) {
    await init();

    var users = readUsers();
    var user = findByUsernameRaw(users, username);
    if (!user) {
      return { ok: false, error: 'Utente non trovato' };
    }

    if (!user.passwordHash || !user.salt) {
      return { ok: false, error: 'Record utente non valido' };
    }

    var inputHash = await hashPassword(password, user.salt, user.iterations || ITERATIONS);
    var isValid = timingSafeEqualBase64(inputHash, user.passwordHash);

    if (!isValid) {
      return { ok: false, error: 'Password errata' };
    }

    return { ok: true, user: safeUser(user) };
  }

  async function resetPassword(identifier, newPassword) {
    await init();

    var target = normalize(identifier);
    var password = String(newPassword || '');
    if (password.length < 8) {
      return { ok: false, error: 'Password troppo corta (minimo 8 caratteri)' };
    }

    var users = readUsers();
    var idx = users.findIndex(function (u) {
      return normalize(u.username) === target || normalize(u.email) === target;
    });

    if (idx === -1) {
      return { ok: false, error: 'Utente non trovato' };
    }

    var record = await toPasswordRecord(password);
    users[idx].passwordHash = record.passwordHash;
    users[idx].salt = record.salt;
    users[idx].iterations = record.iterations;
    users[idx].hashAlg = record.hashAlg;
    users[idx].updatedAt = new Date().toISOString();
    delete users[idx].password;

    writeUsers(users);
    return { ok: true, user: safeUser(users[idx]) };
  }

  async function findByIdentifier(identifier) {
    await init();
    var users = readUsers();
    var found = findByUsernameRaw(users, identifier) || findByEmailRaw(users, identifier);
    return found ? safeUser(found) : null;
  }

  window.AuthStore = {
    init: init,
    getUsers: getUsers,
    registerUser: registerUser,
    validateLogin: validateLogin,
    resetPassword: resetPassword,
    findByIdentifier: findByIdentifier
  };

  init();
})();
