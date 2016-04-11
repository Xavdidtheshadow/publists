'use strict';

const session = require('express-session');
const RedisStore = require('connect-redis')(session);

function sessionPasser(req, res, next) {
  res.locals.user = req.session.user ? true : false;
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
