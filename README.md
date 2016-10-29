# Auth0 Extension Tools

A set of tools and utilities to simplify the development of Auth0 Extensions.

## Usage

```js
const tools = require('auth0-extension-tools');
```

### Auth0 Management API

These are helpers that make it easy to get an access token for the Management API or to get an instance of the node-auth0 client:

```js
tools.managementApi.getAccessToken('me.auth0.com', 'myclient', 'mysecret2')
  .then(function(token) {
    // Call the Management API with this token.
  });

// This will cache the token for 1h.
tools.managementApi.getAccessTokenCached('me.auth0.com', 'myclient', 'mysecret2')
  .then(function(token) {
    // Call the Management API with this token.
  });

tools.managementApi.getClient({ domain: 'me.auth0.com', accessToken: 'ey...' })
  .then(function(client) {
    // Use the client...
    client.users.getAll(function(users) {

    })
  });

// This will cache the token for 1h. A new client is returned each time.
tools.managementApi.getClient({ domain: 'me.auth0.com', clientId: 'myclient', clientSecret: 'mysecret' })
  .then(function(client) {
    // Use the client...
    client.users.getAll(function(users) {

    })
  });
```

### Config

These are helpers that will make it easy to work with environment variables, nconf (when running locally), Webtask data/secrets, ...

A config provider is basically a function that looks like this:

```js
function configProvider(key) {
  if (key === 'foo') {
    return // the value for foo.
  }
}
```

This is already implemented by `nconf.get` for example. Eg:

```js
nconf
  .argv()
  .env()
  .file(path.join(__dirname, './server/config.json'));

nconf.get('foo') // Returns the value from foo.
```

The following helper will turn the Webtask context object (which is what you get when the request runs in Webtask) into a config provider:

```js
const provider = configProvider.fromWebtaskContext(req.webtaskContext);
provider('HOSTING_ENV') // This will give you 'webtask' by default.
provider('some_setting') // This will come from the Webtask params or secrets.
```

When an extension starts, you can then create a `config` object, initialize it with a config provider and then use it throughout your extension. Eg:

```js
const provider = tools.configProvider.fromWebtaskContext(req.webtaskContext);

const config = tools.configFactory();
config.setProvider(provider);

const mySetting = config('some_setting');
```

### Errors

The following errors are also available (in case you need to throw or handle specific errors):

```js
const tools = require('auth0-extension-tools');
tools.ArgumentError
tools.HookTokenError
tools.ManagementApiError
tools.NotFoundError
tools.ValidationError
```

### Hooks

When an extension is installed/updated/uninstalled a token will be sent during the Webhook request to make sure it comes from the portal. Here's how such a token can be validated:

```js
try {
  const path = './extension/uninstall';

  validateHookToken('me.auth0.com', WT_URL, path, EXTENSION_SECRET, token);
} catch (e) {
  // e will be a HookTokenError
}
```

### Storage

A storage context allows you to read and write data. For local development and stateful environments you can use the file storage context which you can initialize with a path and default data (if new).

The `mergeWrites` option allows you to just send changes to the file (similar to a `PATCH`).

```js
const storage = new tools.FileStorageContext(path.join(__dirname, './data.json'), { mergeWrites: true, defaultData: { foo: 'bar' } });
storage.read()
  .then(function(data) {
    console.log(data);
  });

storage.write({ foo: 'other-bar' })
  .then(function() {
    console.log('Done');
  });
```

When running in a Webtask, the request will expose a Webtask storage object, for which you can also create a context. When initializing the Webtask storage context you can provide it with the storage object, the options object (in which you enable `force` to bypass concurrency checks) and default data (if new).

```js
const storage = new tools.WebtaskStorageContext(req.webtaskContext.storage, { force: 1 }, { foo: 'bar' });
storage.read()
  .then(function(data) {
    console.log(data);
  });

storage.write({ foo: 'other-bar' })
  .then(function() {
    console.log('Done');
  });
```

### Records

A record provider exposes CRUD capabilities which makes it easy to interact with records from an Extension (eg: delete a record, update a record, ...). Depending on the underlying storage you may or may not have support for concurrency.

This library exposes a Blob record provider, which does not support concurrency. For each operation it will read a file, apply the change (eg: delete a record) and then write the full file again.

```js
const db = new tools.BlobRecordProvider(someStorageContext);
db.getRecords('documents')
  .then(function (documents) {
    console.log('All documents:', documents);
  });

db.getRecord('documents', '12345')
  .then(function (doc) {
    console.log('Document:', doc);
  });

db.create('documents', { name: 'my-foo.docx' })
  .then(function (doc) {
    console.log('Document:', doc);
  });

db.create('documents', { _id: 'my-custom-id', name: 'my-foo.docx' })
  .then(function (doc) {
    console.log('Document:', doc);
  });

// Update document with id 1939393
db.update('documents', 1939393, { name: 'my-foo.docx' })
  .then(function (doc) {
    console.log('Document:', doc);
  });

// Update document with id 1939393. If it doesn't exist, create it (upsert).
const upsert = true;
db.update('documents', 1939393, { name: 'my-foo.docx' }, upsert)
  .then(function (doc) {
    console.log('Document:', doc);
  });

db.delete('documents', 1939393)
  .then(function(hasBeenDeleted) {

  });
```

### Start an Express Server.

Here's what you need to use as an entrypoint for your Webtask:

```js
const tools = require('auth0-extension-tools');
const expressApp = require('./server');

module.exports = tools.createExpressServer(function(req, config, storage) {
  return expressApp(config, storage);
});
```

Then you can create your Express server like this:

```js
module.exports = (config, storage) => {
  // 'config' is a method that exposes process.env, Webtask params and secrets
  console.log('Starting Express. The Auth0 domain which this is configured for:', config('AUTH0_DOMAIN'));

  // 'storage' is a Webtask storage object: https://webtask.io/docs/storage
  storage.get(function (error, data) {
    console.log('Here is what we currently have in data:', JSON.stringify(data, null, 2));
  });

  const app = new Express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  ...

  // Finally you just have to return the app here.
  return app;
};
```

## Session Manager for Dashboard Administrators

When dashboard administrators login to an extension which has its own API the following is required:

 - The user needs a token to call the Extension API (an "API Token" or a session)
 - The Extension API needs the user's access token to call API v2

The session manager will create a local session for the user (the "API Token") and embed the access token for API v2 in the session.

The following snippet will generate the login URL to where the dashboard administrator needs to be redirected:

```js
const sessionManager = new tools.SessionManager('auth0.auth0.com', 'me.auth0.com', 'https://me.us.webtask.io/my-extension');
const url = sessionManager.createAuthorizeUrl({
  redirectUri: 'https://me.us.webtask.io/my-extension/login/callback',
  scopes: 'read:clients read:connections',
  expiration: 3600
});
```

After logging in the extension will receive an id token and access token which will be used to create a local session:

```js
const options = {
  secret: 'my-secret',
  issuer: 'https://me.us.webtask.io/my-extension',
  audience: 'urn:my-ext-aud'
};

sessionManager.create(idToken, accessToken, options)
  .then(function(token) {
    ...
  });
```
