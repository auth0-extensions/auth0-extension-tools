var nock = require('nock');
var jwt = require('jsonwebtoken');

module.exports.wellKnownEndpoint = function(domain, cert, kid) {
  return nock('https://' + domain)
    .get('/.well-known/jwks.json')
    .reply(200, {
      keys: [
        {
          alg: 'RS256',
          use: 'sig',
          kty: 'RSA',
          x5c: [ cert.match(/-----BEGIN CERTIFICATE-----([\s\S]*)-----END CERTIFICATE-----/i)[1].replace('\n', '') ],
          kid: kid
        }
      ]
    });
};

module.exports.sign = function(cert, kid, payload) {
  return jwt.sign(payload, cert, { header: { kid: kid }, algorithm: 'RS256' });
};
