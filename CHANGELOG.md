## [1.3.1] - 2017-01-09

### Changes

- Set nonce to random value if not specified in options to createAuthorizeUrl to undo breaking change

## [1.3.0] - 2017-01-04

### Changes

- Increase version of the auth0 npm module for rate limit retries
- [Breaking] Update to auth0 latest authorization endpoint, this requires an addition of a nonce parameter when calling createAuthorizeUrl
