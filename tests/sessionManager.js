const tape = require('tape');
const jwt = require('jsonwebtoken');
const certs = require('./mocks/certs');
const tokens = require('./mocks/tokens');
const tools = require('../src');

const tokenOptions = {
  secret: 'my-secret',
  issuer: 'https://app.bar.com',
  audience: 'urn:authz'
};

tape('SessionManager#createAuthorizeUrl should return the authorize url', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  const url = sessionManager.createAuthorizeUrl({
    nonce: 'nonce',
    redirectUri: 'http://foo.bar.com/login/callback'
  });

  const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=http%3A%2F%2Ffoo.bar.com&' +
    'response_type=token id_token&response_mode=form_post&scope=' +
    'openid%20name%20email&expiration=36000&redirect_uri=http%3A%2F%2Ffoo.bar.com' +
    '%2Flogin%2Fcallback&audience=https%3A%2F%2Fme.auth0.local%2Fapi%2Fv2%2F&nonce=nonce';
  t.ok(url === expectedUrl);
  t.end();
});

tape('SessionManager#createAuthorizeUrl should set custom scopes', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  const url = sessionManager.createAuthorizeUrl({
    redirectUri: 'http://foo.bar.com/login/callback',
    scopes: 'read:clients read:connections',
    nonce: 'nonce'
  });

  const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=' +
    'http%3A%2F%2Ffoo.bar.com&response_type=token id_token' +
    '&response_mode=form_post&scope=' +
    'openid%20name%20email%20read%3Aclients%20read%3Aconnections' +
    '&expiration=36000&redirect_uri=http%3A%2F%2Ffoo.bar.com%2Flogin%2Fcallback' +
    '&audience=https%3A%2F%2Fme.auth0.local%2Fapi%2Fv2%2F&nonce=nonce';
  t.ok(url === expectedUrl);
  t.end();
});

tape('SessionManager#createAuthorizeUrl should set custom state', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  const url = sessionManager.createAuthorizeUrl({
    redirectUri: 'http://foo.bar.com/login/callback',
    scopes: 'read:clients read:connections',
    nonce: 'nonce',
    state: 'state'
  });

  const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=' +
    'http%3A%2F%2Ffoo.bar.com&response_type=token id_token' +
    '&response_mode=form_post&scope=' +
    'openid%20name%20email%20read%3Aclients%20read%3Aconnections' +
    '&expiration=36000&redirect_uri=http%3A%2F%2Ffoo.bar.com%2Flogin%2Fcallback' +
    '&audience=https%3A%2F%2Fme.auth0.local%2Fapi%2Fv2%2F&nonce=nonce&state=state';
  t.ok(url === expectedUrl);
  t.end();
});

tape('SessionManager#createAuthorizeUrl should reject bad state', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');

  try {
    const url = sessionManager.createAuthorizeUrl({
      redirectUri: 'http://foo.bar.com/login/callback',
      scopes: 'read:clients read:connections',
      nonce: 'nonce',
      state: ''
    });
    t.notOk(true);
  } catch(err) {
    t.ok(err);
    t.ok(err instanceof tools.ArgumentError);
  }

  try {
    const url = sessionManager.createAuthorizeUrl({
      redirectUri: 'http://foo.bar.com/login/callback',
      scopes: 'read:clients read:connections',
      nonce: 'nonce',
      state: null
    });
    t.notOk(true);
  } catch(err) {
    t.ok(err);
    t.ok(err instanceof tools.ArgumentError);
  }

  t.end();
});


tape('SessionManager#createAuthorizeUrl should set custom expiration', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  const url = sessionManager.createAuthorizeUrl({
    redirectUri: 'http://foo.bar.com/login/callback',
    scopes: 'read:clients read:connections',
    nonce: 'nonce',
    expiration: 1
  });

  const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=' +
    'http%3A%2F%2Ffoo.bar.com&response_type=token id_token' +
    '&response_mode=form_post&scope=' +
    'openid%20name%20email%20read%3Aclients%20read%3Aconnections' +
    '&expiration=1&redirect_uri=http%3A%2F%2Ffoo.bar.com%2Flogin%2Fcallback' +
    '&audience=https%3A%2F%2Fme.auth0.local%2Fapi%2Fv2%2F&nonce=nonce';
  t.ok(url === expectedUrl);
  t.end();
});

tape('SessionManager#create validate options', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', null)
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.audience', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: null, secret: 'foo', issuer: 'foo' })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.audience length', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: '', secret: 'foo', issuer: 'foo' })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.issuer', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', secret: 'foo', issuer: null })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.issuer length', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', secret: 'foo', issuer: '' })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.secret', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', issuer: 'bb', secret: null })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create validate options.secret length', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', issuer: 'bb', secret: '' })
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);
      t.end();
    });
});

tape('SessionManager#create should return error if id_token is null', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create()
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);

      sessionManager.create('')
        .then(function(data) {
          t.notOk(data);
          t.end();
        })
        .catch(function(err2) {
          t.ok(err2);
          t.ok(err2 instanceof tools.ArgumentError);
          t.end();
        });
    });
});

tape('SessionManager#create should return error if id_token is invalid', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('xyz', 'xyz', tokenOptions)
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ValidationError);
      t.end();
    });
});

tape('SessionManager#create should return error if access_token is null', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('x')
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ArgumentError);

      sessionManager.create('x', '')
        .then(function(data) {
          t.notOk(data);
          t.end();
        })
        .catch(function(err2) {
          t.ok(err2);
          t.ok(err2 instanceof tools.ArgumentError);
          t.end();
        });
    });
});

tape('SessionManager#create should return error if access_token is invalid', function(t) {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key1', { sub: 'foo' }), 'xyz', tokenOptions)
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err instanceof tools.ValidationError);
      t.end();
    });
});

tape('SessionManager#create should return error if kid for id_token is invalid', function(t) {
  tokens.wellKnownEndpoint('me.auth0.local', certs.bar.cert, 'key2');

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key1', { sub: 'foo' }), tokens.sign(certs.bar.private, 'key1', { sub: 'bar' }), tokenOptions)
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name === 'SigningKeyNotFoundError');
      t.end();
    });
});

tape('SessionManager#create should return error if kid for access_token is invalid', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key2', { sub: 'foo' }), tokens.sign(certs.bar.private, 'key1', { sub: 'bar' }), tokenOptions)
    .then(function(data) {
      t.notOk(data);
      t.end();
    })
    .catch(function(err) {
      t.ok(err);
      t.ok(err.name === 'UnauthorizedError');
      t.end();
    });
});

tape('SessionManager#create should return error if iss of id_token is incorrect', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://othertenant.auth0.local/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    azp: 'http://app.bar.com',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'Invalid issuer: https://othertenant.auth0.local/');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if iss of access_token is incorrect', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', { iss: 'https://auth0.auth0.com/', sub: 'foo' });
  const accessToken = tokens.sign(certs.bar.private, 'key2', { iss: 'https://foo2.auth0.local/', sub: 'bar' });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'Invalid issuer: https://foo2.auth0.local/');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if aud of id_token is incorrect', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://othertenant.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    aud: 'https://bar.auth0.local/api/v2/'
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'Audience mismatch for: http://app.bar.com');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if aud of access_token is incorrect', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    azp: 'http://app.bar.com',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://othertenant.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'Audience mismatch for: https://bar.auth0.local/api/v2/');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if azp of access_token is incorrect', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    azp: 'somethingelse',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'The access_token\'s azp does not match the id_token');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if subject of tokens do not match', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    azp: 'http://app.bar.com',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'Subjects don\'t match');
      t.ok(err instanceof tools.UnauthorizedError);
      t.end();
    });
});

tape('SessionManager#create should return error if id token was issued by a different issuer', function(t) {
  tokens.wellKnownEndpoint('rta.appliance.local', certs.foo.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.foo.private, 'key2', {
    iss: 'https://rta.appliance.local/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'bar',
    azp: 'http://app.bar.com',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'invalid signature');
      t.end();
    });
});

tape('SessionManager#create should return error if access token was issued by a different issuer', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('rta.appliance.local', certs.foo.cert, 'key2');

  const idToken = tokens.sign(certs.foo.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://app.bar.com',
    sub: 'foo'
  });
  const accessToken = tokens.sign(certs.foo.private, 'key2', {
    iss: 'https://rta.appliance.local/',
    sub: 'bar',
    azp: 'http://app.bar.com',
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      t.ok(err);
      t.ok(err.message === 'invalid signature');
      t.end();
    });
});

tape('SessionManager#create should generate a session (api token)', function(t) {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    aud: 'http://app.bar.com',
    sub: 'google|me@example.com',
    exp: new Date().getTime(),
    email: 'me@example.com'
  });
  const accessToken = tokens.sign(certs.bar.private, 'key2', {
    iss: 'https://auth0.auth0.com/',
    sub: 'google|me@example.com',
    azp: 'http://app.bar.com',
    exp: new Date().getTime(),
    aud: [
      'https://auth0.auth0.com/userinfo',
      'https://bar.auth0.local/api/v2/'
    ]
  });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .then(function(token) {
      t.ok(token);

      jwt.verify(token, tokenOptions.secret, { issuer: tokenOptions.issuer, audience: 'urn:authz' }, function(err, decoded) {
        t.notOk(err);
        t.ok(decoded);
        t.ok(decoded.sub === 'google|me@example.com');
        t.ok(decoded.email === 'me@example.com');
        t.ok(decoded.access_token === accessToken);
        t.end();
      });
    });
});
