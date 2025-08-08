const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const certs = require('./mocks/certs');
const tokens = require('./mocks/tokens');
const tools = require('../src');

const tokenOptions = {
  secret: 'my-secret',
  issuer: 'https://app.bar.com',
  audience: 'urn:authz'
};

describe('sessionManager', function() {
  it('SessionManager#createAuthorizeUrl should return the authorize url', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  const url = sessionManager.createAuthorizeUrl({
    nonce: 'nonce',
    redirectUri: 'http://foo.bar.com/login/callback'
  });

  const expectedUrl = 'https://auth0.auth0.com/authorize?client_id=http%3A%2F%2Ffoo.bar.com&' +
    'response_type=token id_token&response_mode=form_post&scope=' +
    'openid%20name%20email&expiration=36000&redirect_uri=http%3A%2F%2Ffoo.bar.com' +
    '%2Flogin%2Fcallback&audience=https%3A%2F%2Fme.auth0.local%2Fapi%2Fv2%2F&nonce=nonce';
  expect(url === expectedUrl).to.be.ok;});

  it('SessionManager#createAuthorizeUrl should set custom scopes', function() {
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
  expect(url === expectedUrl).to.be.ok;});

  it('SessionManager#createAuthorizeUrl should set custom state', function() {
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
  expect(url === expectedUrl).to.be.ok;});

  it('SessionManager#createAuthorizeUrl should reject bad state', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');

  try {
    const url = sessionManager.createAuthorizeUrl({
      redirectUri: 'http://foo.bar.com/login/callback',
      scopes: 'read:clients read:connections',
      nonce: 'nonce',
      state: ''
    });
    expect(true).to.not.be.ok;
  } catch(err) {
    expect(err).to.be.ok;
    expect(err instanceof tools.ArgumentError).to.be.ok;
  }

  try {
    const url = sessionManager.createAuthorizeUrl({
      redirectUri: 'http://foo.bar.com/login/callback',
      scopes: 'read:clients read:connections',
      nonce: 'nonce',
      state: null
    });
    expect(true).to.not.be.ok;
  } catch(err) {
    expect(err).to.be.ok;
    expect(err instanceof tools.ArgumentError).to.be.ok;
  }});


  it('SessionManager#createAuthorizeUrl should set custom expiration', function() {
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
  expect(url === expectedUrl).to.be.ok;});

  it('SessionManager#create validate options', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', null)
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.audience', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: null, secret: 'foo', issuer: 'foo' })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.audience length', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: '', secret: 'foo', issuer: 'foo' })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.issuer', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', secret: 'foo', issuer: null })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.issuer length', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', secret: 'foo', issuer: '' })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.secret', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', issuer: 'bb', secret: null })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create validate options.secret length', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('a', 'b', { audience: 'aa', issuer: 'bb', secret: '' })
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;});
});

  it('SessionManager#create should return error if id_token is null', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create()
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;

      sessionManager.create('')
        .then(function(data) {
          expect(data).to.not.be.ok;})
        .catch(function(err2) {
          expect(err2).to.be.ok;
          expect(err2 instanceof tools.ArgumentError).to.be.ok;});
    });
});

  it('SessionManager#create should return error if id_token is invalid', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('xyz', 'xyz', tokenOptions)
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ValidationError).to.be.ok;});
});

  it('SessionManager#create should return error if access_token is null', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create('x')
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ArgumentError).to.be.ok;

      sessionManager.create('x', '')
        .then(function(data) {
          expect(data).to.not.be.ok;})
        .catch(function(err2) {
          expect(err2).to.be.ok;
          expect(err2 instanceof tools.ArgumentError).to.be.ok;});
    });
});

  it('SessionManager#create should return error if access_token is invalid', function() {
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key1', { sub: 'foo' }), 'xyz', tokenOptions)
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err instanceof tools.ValidationError).to.be.ok;});
});

  it('SessionManager#create should return error if kid for id_token is invalid', function() {
  tokens.wellKnownEndpoint('me.auth0.local', certs.bar.cert, 'key2');

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key1', { sub: 'foo' }), tokens.sign(certs.bar.private, 'key1', { sub: 'bar' }), tokenOptions)
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err.name === 'SigningKeyNotFoundError').to.be.ok;});
});

  it('SessionManager#create should return error if kid for access_token is invalid', function() {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.local', 'http://foo.bar.com');
  sessionManager.create(tokens.sign(certs.bar.private, 'key2', { sub: 'foo' }), tokens.sign(certs.bar.private, 'key1', { sub: 'bar' }), tokenOptions)
    .then(function(data) {
      expect(data).to.not.be.ok;})
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err.name === 'UnauthorizedError').to.be.ok;});
});

  it('SessionManager#create should return error if iss of id_token is incorrect', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'Invalid issuer: https://othertenant.auth0.local/').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if iss of access_token is incorrect', function() {
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');
  tokens.wellKnownEndpoint('auth0.auth0.com', certs.bar.cert, 'key2');

  const idToken = tokens.sign(certs.bar.private, 'key2', { iss: 'https://auth0.auth0.com/', sub: 'foo' });
  const accessToken = tokens.sign(certs.bar.private, 'key2', { iss: 'https://foo2.auth0.local/', sub: 'bar' });

  const sessionManager = new tools.SessionManager('auth0.auth0.com', 'bar.auth0.local', 'http://app.bar.com');
  sessionManager.create(idToken, accessToken, tokenOptions)
    .catch(function(err) {
      expect(err).to.be.ok;
      expect(err.message === 'Invalid issuer: https://foo2.auth0.local/').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if aud of id_token is incorrect', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'Audience mismatch for: http://app.bar.com').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if aud of access_token is incorrect', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'Audience mismatch for: https://bar.auth0.local/api/v2/').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if azp of access_token is incorrect', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'The access_token\'s azp does not match the id_token').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if subject of tokens do not match', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'Subjects don\'t match').to.be.ok;
      expect(err instanceof tools.UnauthorizedError).to.be.ok;});
});

  it('SessionManager#create should return error if id token was issued by a different issuer', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'invalid signature').to.be.ok;});
});

  it('SessionManager#create should return error if access token was issued by a different issuer', function() {
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
      expect(err).to.be.ok;
      expect(err.message === 'invalid signature').to.be.ok;});
});

  it('SessionManager#create should generate a session (api token)', function() {
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
      expect(token).to.be.ok;

      jwt.verify(token, tokenOptions.secret, { issuer: tokenOptions.issuer, audience: 'urn:authz' }, function(err, decoded) {
        expect(err).to.not.be.ok;
        expect(decoded).to.be.ok;
        expect(decoded.sub === 'google|me@example.com').to.be.ok;
        expect(decoded.email === 'me@example.com').to.be.ok;
        expect(decoded.access_token === accessToken).to.be.ok;});
    });
});

});