'use strict';

// setup the parse server!
const ParseServer = require('parse-server').ParseServer;

module.exports = function(app) {
  var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

  if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
  }

  let api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    // cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY, 
    serverURL: app.get('server_url')
  });

  // Serve the Parse API on the /parse URL prefix
  var mountPath = '/parse';
  // console.log(api);
  app.use(mountPath, api);
};
