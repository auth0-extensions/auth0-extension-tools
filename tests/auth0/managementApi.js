const tape = require('tape');
const nock = require('nock');
const jwt = require('jsonwebtoken');

const extensionTools = require('../../src');
const ArgumentError = require('../../src/errors').ArgumentError;
const ManagementApiError = require('../../src/errors').ManagementApiError;
const managementApi = require('../../src/auth0/managementApi');

tape('extension-tools should expose the managementApiHelper', function(t) {
  t.ok(extensionTools.managementApi === managementApi);
  t.end();
});

tape('managementApi#getAccessToken should handle network errors correctly', function(t) {
  managementApi.getAccessToken('foo.some.domain.tld', 'myclient', 'mysecret')
    .catch(function(err) {
      t.ok(err);
      t.ok(err.code);
      t.equal(err.code, 'ENOTFOUND');
      t.end();
    });
});

tape('managementApi#getAccessToken should handle unauthorized errors correctly', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(401, 'Unauthorized');

  managementApi.getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
    .catch(function(err) {
      t.ok(err);
      t.ok(err.status);
      t.equal(err.status, 401);
      t.equal(err.code, 'unauthorized');
      t.ok(err instanceof ManagementApiError);
      t.end();
      nock.cleanAll();
    });
});

tape('managementApi#getAccessToken should handle unknown errors correctly', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(200, 'foo');

  managementApi.getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
    .catch(function(err) {
      t.ok(err);
      t.ok(err.status);
      t.equal(err.status, 400);
      t.equal(err.code, 'unknown_error');
      t.ok(err instanceof ManagementApiError);
      t.end();
      nock.cleanAll();
    });
});

tape('managementApi#getAccessToken should handle forbidden errors correctly', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(403, {
      error: 'access_denied',
      error_description: 'Client is not authorized to access .... You might probably want to create a .. associated to this API.'
    });

  managementApi.getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
    .catch(function(err) {
      t.ok(err);
      t.ok(err.status);
      t.equal(err.status, 403);
      t.equal(err.code, 'access_denied');
      t.ok(err instanceof ManagementApiError);
      t.end();
      nock.cleanAll();
    });
});

tape('managementApi#getAccessToken should return access token', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'abc'
    });

  managementApi.getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
    .then(function(accessToken) {
      t.ok(accessToken);
      t.equal(accessToken, 'abc');
      t.end();
      nock.cleanAll();
    });
});

tape('managementApi#getAccessTokenCache should cache the access token', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'abc'
    });
  nock('https://tenant.auth0cluster2.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'def'
    });

  managementApi.getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret')
    .then(function(accessToken) {
      t.ok(accessToken);
      t.equal(accessToken, 'abc');

      managementApi.getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret')
        .then(function(accessToken2) {
          t.ok(accessToken2);
          t.equal(accessToken2, 'abc');

          managementApi.getAccessTokenCached('tenant.auth0cluster2.com', 'myclient', 'mysecret')
            .then(function(accessToken3) {
              t.ok(accessToken3);
              t.equal(accessToken3, 'def');
              t.end();
              nock.cleanAll();
            });
        });
    });
});

tape('managementApi#getAccessTokenCache should cache the access token based on its expiration', function(t) {
  t.timeoutAfter(10000);

  const token = jwt.sign({ foo: 'bar' }, 'shhhhh', { expiresIn: '14s' });

  nock('https://tenant.auth0cluster3.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: token
    });

  managementApi.getAccessTokenCached('tenant.auth0cluster3.com', 'myclient', 'mysecret')
    .then(function(accessToken) {
      t.ok(accessToken);
      t.equal(accessToken, token);

      setTimeout(function() {
        managementApi.getAccessTokenCached('tenant.auth0cluster3.com', 'myclient', 'mysecret')
          .then(function(accessToken2) {
            t.ok(accessToken2);
            t.equal(accessToken2, token);

            nock('https://tenant.auth0cluster3.com')
              .post('/oauth/token')
              .reply(200, {
                access_token: 'def'
              });

            setTimeout(function() {
              managementApi.getAccessTokenCached('tenant.auth0cluster3.com', 'myclient', 'mysecret')
                .then(function(accessToken3) {
                  t.ok(accessToken3);
                  t.equal(accessToken3, 'def');
                  t.end();
                  nock.cleanAll();
                });
            }, 2000);
          });
      }, 3000);
    });
});

tape('managementApi#getAccessTokenCache should handle errors correctly', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(400, {
      error: 'foo'
    });

  managementApi.getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret2')
    .catch(function(err) {
      t.ok(err);
      t.equal(err.code, 'foo');

      nock('https://tenant.auth0cluster.com')
        .post('/oauth/token')
        .reply(200, {
          access_token: 'abc'
        });

      managementApi.getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret2')
        .then(function(accessToken2) {
          t.ok(accessToken2);
          t.equal(accessToken2, 'abc');
          t.end();
          nock.cleanAll();
        });
    });
});

tape('managementApi#getClient should validate options', function(t) {
  try {
    managementApi.getClient();
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 1 });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo' });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo', accessToken: '' });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo', accessToken: 123 });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo', clientId: 123 });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo', clientId: 'abc' });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  try {
    managementApi.getClient({ domain: 'foo', clientId: 'abc', clientSecret: 456 });
  } catch (err) {
    t.ok(err);
    t.ok(err instanceof ArgumentError);
  }

  managementApi.getClient({ domain: 'foo', accessToken: 'def' })
    .then(function(auth0) {
      t.ok(auth0);
    });

  t.end();
});

tape('managementApi#getClient should create a client for accessToken', function(t) {
  managementApi.getClient({ domain: 'foo', accessToken: 'def' })
    .then(function(auth0) {
      t.ok(auth0);
      t.end();
    });
});

tape('managementApi#getClient should create a client for accessToken with headers', function(t) {
  managementApi.getClient({ domain: 'foo', accessToken: 'def', headers: { customHeader: 'custom' } })
    .then(function(auth0) {
      t.ok(auth0);
      const keys = Object.keys(auth0);
      keys.forEach(key => auth0[key].resource && t.equal(auth0[key].resource.restClient.options.headers.customHeader, 'custom'));
      t.end();
    });
});

tape('managementApi#getClient should create a client for clientId/secret', function(t) {
  nock('https://tenant.auth0cluster.com')
    .post('/oauth/token')
    .reply(200, {
      access_token: 'abc'
    });

  managementApi.getClient({ domain: 'tenant.auth0cluster.com', clientId: 'abc', clientSecret: 'def' })
    .then(function(auth0) {
      t.ok(auth0);
      t.end();
    });
});
