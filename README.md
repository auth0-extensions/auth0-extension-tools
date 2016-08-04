# Auth0 Extension Tools

A set of tools and utilities to simplify the development of Auth0 Extensions.

## Usage

```
const tools = require('auth0-extension-tools');
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
