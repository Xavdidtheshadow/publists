'use strict';

// setup the parse server!

module.exports = function(app) {
  var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI;

  if (!databaseUri) {
    console.log('DATABASE_URI not specified, falling back to localhost.');
  }

  var ParseServer = require('parse-server').ParseServer;

  let api = new ParseServer({
    databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
    // cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
    appId: process.env.APP_ID,
    masterKey: process.env.MASTER_KEY, //Add your master key here. Keep it secret!
    serverURL: app.get('server_url'),  // Don't forget to change to https if needed
    liveQuery: {
      classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
    }
  });

  // Serve the Parse API on the /parse URL prefix
  var mountPath = '/parse';
  // console.log(api);
  app.use(mountPath, api);
};
