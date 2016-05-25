'use strict'

const session = require('express-session')
const RedisStore = require('connect-redis')(session)

function sessionPasser (req, res, next) {
  if (req.session === undefined) {
    console.error('!! Unable to access session, check redis connection !!')
    process.exit(1)
  } else if (req.session.user) {
    res.locals.user = true
    res.locals.wid = req.session.user.wid
  }
  next()
}

module.exports = function (app) {
  app.use(session({
    store: new RedisStore({
      url: process.env.REDIS_URL
    }),
    secret: process.env.COOKIE_SECRET,
    saveUninitialized: false,
    resave: false
  }))

  app.use(sessionPasser)
}
