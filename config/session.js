'use strict';

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

function sessionPasser(req, res, next) {
  if (req.session.user) {
    // console.log(req.session.user);
    res.locals.user = {
      username: req.session.user.username,
      publicLists: req.session.user.publicLists,
      objectId: req.session.user.objectId,
      access_token: req.session.user.access_token ? true : false
    };
  }
  next();
}

module.exports = function(app) {
  app.use(session({
    store: new RedisStore({
      url: process.env.REDIS_URL
    }),
    secret: process.env.COOKIE_SECRET,
    saveUninitialized: false,
    resave: false
  }));

  app.use(sessionPasser);
};
