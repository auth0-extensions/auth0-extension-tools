const { expect } = require('chai');
const nock = require('nock');
const jwt = require('jsonwebtoken');

const extensionTools = require('../../src');
const ArgumentError = require('../../src/errors').ArgumentError;
const ManagementApiError = require('../../src/errors').ManagementApiError;
const managementApi = require('../../src/auth0/managementApi');

describe('errors', function() {
  it('extension-tools should expose the managementApiHelper', function() {
    expect(extensionTools.managementApi === managementApi).to.be.ok;
  });

  it('managementApi#getAccessToken should handle network errors correctly', function() {
    managementApi
      .getAccessToken('foo.some.domain.tld', 'myclient', 'mysecret')
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.code).to.be.ok;
        expect(err.code).to.equal('ENOTFOUND');
      });
  });

  it('managementApi#getAccessToken should handle unauthorized errors correctly', function() {
    nock('https://tenant.auth0cluster.com')
      .post('/oauth/token')
      .reply(401, 'Unauthorized');

    managementApi
      .getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.status).to.be.ok;
        expect(err.status).to.equal(401);
        expect(err.code).to.equal('unauthorized');
        expect(err instanceof ManagementApiError).to.be.ok;
        nock.cleanAll();
      });
  });

  it('managementApi#getAccessToken should handle unknown errors correctly', function() {
    nock('https://tenant.auth0cluster.com')
      .post('/oauth/token')
      .reply(200, 'foo');

    managementApi
      .getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.status).to.be.ok;
        expect(err.status).to.equal(400);
        expect(err.code).to.equal('unknown_error');
        expect(err instanceof ManagementApiError).to.be.ok;
        nock.cleanAll();
      });
  });

  it('managementApi#getAccessToken should handle forbidden errors correctly', function() {
    nock('https://tenant.auth0cluster.com').post('/oauth/token').reply(403, {
      error: 'access_denied',
      error_description:
        'Client is not authorized to access .... You might probably want to create a .. associated to this API.'
    });

    managementApi
      .getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.status).to.be.ok;
        expect(err.status).to.equal(403);
        expect(err.code).to.equal('access_denied');
        expect(err instanceof ManagementApiError).to.be.ok;
        nock.cleanAll();
      });
  });

  it('managementApi#getAccessToken should return access token', function() {
    nock('https://tenant.auth0cluster.com').post('/oauth/token').reply(200, {
      access_token: 'abc'
    });

    managementApi
      .getAccessToken('tenant.auth0cluster.com', 'myclient', 'mysecret')
      .then(function(accessToken) {
        expect(accessToken).to.be.ok;
        expect(accessToken).to.equal('abc');
        nock.cleanAll();
      });
  });

  it('managementApi#getAccessTokenCache should cache the access token', function() {
    nock('https://tenant.auth0cluster.com').post('/oauth/token').reply(200, {
      access_token: 'abc'
    });
    nock('https://tenant.auth0cluster2.com').post('/oauth/token').reply(200, {
      access_token: 'def'
    });

    managementApi
      .getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret')
      .then(function(accessToken) {
        expect(accessToken).to.be.ok;
        expect(accessToken).to.equal('abc');

        managementApi
          .getAccessTokenCached(
            'tenant.auth0cluster.com',
            'myclient',
            'mysecret'
          )
          .then(function(accessToken2) {
            expect(accessToken2).to.be.ok;
            expect(accessToken2).to.equal('abc');

            managementApi
              .getAccessTokenCached(
                'tenant.auth0cluster2.com',
                'myclient',
                'mysecret'
              )
              .then(function(accessToken3) {
                expect(accessToken3).to.be.ok;
                expect(accessToken3).to.equal('def');
                nock.cleanAll();
              });
          });
      });
  });

  it('managementApi#getAccessTokenCache should cache the access token based on its expiration', function() {
    this.timeout(10000);

    const token = jwt.sign({ foo: 'bar' }, 'shhhhh', { expiresIn: '14s' });

    nock('https://tenant.auth0cluster3.com').post('/oauth/token').reply(200, {
      access_token: token
    });

    managementApi
      .getAccessTokenCached('tenant.auth0cluster3.com', 'myclient', 'mysecret')
      .then(function(accessToken) {
        expect(accessToken).to.be.ok;
        expect(accessToken).to.equal(token);

        setTimeout(function() {
          managementApi
            .getAccessTokenCached(
              'tenant.auth0cluster3.com',
              'myclient',
              'mysecret'
            )
            .then(function(accessToken2) {
              expect(accessToken2).to.be.ok;
              expect(accessToken2).to.equal(token);

              nock('https://tenant.auth0cluster3.com')
                .post('/oauth/token')
                .reply(200, {
                  access_token: 'def'
                });

              setTimeout(function() {
                managementApi
                  .getAccessTokenCached(
                    'tenant.auth0cluster3.com',
                    'myclient',
                    'mysecret'
                  )
                  .then(function(accessToken3) {
                    expect(accessToken3).to.be.ok;
                    expect(accessToken3).to.equal('def');
                    nock.cleanAll();
                  });
              }, 2000);
            });
        }, 3000);
      });
  });

  it('managementApi#getAccessTokenCache should handle errors correctly', function() {
    nock('https://tenant.auth0cluster.com').post('/oauth/token').reply(400, {
      error: 'foo'
    });

    managementApi
      .getAccessTokenCached('tenant.auth0cluster.com', 'myclient', 'mysecret2')
      .catch(function(err) {
        expect(err).to.be.ok;
        expect(err.code).to.equal('foo');

        nock('https://tenant.auth0cluster.com')
          .post('/oauth/token')
          .reply(200, {
            access_token: 'abc'
          });

        managementApi
          .getAccessTokenCached(
            'tenant.auth0cluster.com',
            'myclient',
            'mysecret2'
          )
          .then(function(accessToken2) {
            expect(accessToken2).to.be.ok;
            expect(accessToken2).to.equal('abc');
            nock.cleanAll();
          });
      });
  });

  it('managementApi#getClient should validate options', function() {
    try {
      managementApi.getClient();
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({});
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 1 });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 'foo' });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 'foo', accessToken: '' });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 'foo', accessToken: 123 });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 'foo', clientId: 123 });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({ domain: 'foo', clientId: 'abc' });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    try {
      managementApi.getClient({
        domain: 'foo',
        clientId: 'abc',
        clientSecret: 456
      });
    } catch (err) {
      expect(err).to.be.ok;
      expect(err instanceof ArgumentError).to.be.ok;
    }

    managementApi
      .getClient({ domain: 'foo', accessToken: 'def' })
      .then(function(auth0) {
        expect(auth0).to.be.ok;
      });
  });

  it('managementApi#getClient should create a client for accessToken', function() {
    managementApi
      .getClient({ domain: 'foo', accessToken: 'def' })
      .then(function(auth0) {
        expect(auth0).to.be.ok;
      });
  });

  it('managementApi#getClient should create a client for accessToken with headers', function() {
    managementApi
      .getClient({
        domain: 'foo',
        accessToken: 'def',
        headers: { customHeader: 'custom' }
      })
      .then(function(auth0) {
        expect(auth0).to.be.ok;
        const keys = Object.keys(auth0);
        keys.forEach(
          key =>
            auth0[key].resource &&
            t.equal(
              auth0[key].resource.restClient.options.headers.customHeader,
              'custom'
            )
        );
      });
  });

  it('managementApi#getClient should create a client for clientId/secret', function() {
    nock('https://tenant.auth0cluster.com').post('/oauth/token').reply(200, {
      access_token: 'abc'
    });

    managementApi
      .getClient({
        domain: 'tenant.auth0cluster.com',
        clientId: 'abc',
        clientSecret: 'def'
      })
      .then(function(auth0) {
        expect(auth0).to.be.ok;
      });
  });
});
