'use strict'

const bodyParser = require('body-parser')
// const favicon = require('serve-favicon')
const sassMiddleware = require('node-sass-middleware')
const express = require('express')
const root_path = require('path').join(__dirname, '..')

module.exports = function () {
  const app = express()

  app.set('port', (process.env.PORT))

  // settings
  app.set('production', process.env.NODE_ENV === 'production')
  // local only
  if (app.get('production')) {
    app.set('server_url', 'https://publists.herokuapp.com/parse')
  } else {
    app.set('server_url', `http://localhost:${process.env.PORT}/parse`)
    // app.set('server_url', `https://de3543d3.ngrok.io/parse`)
    require('dotenv').load()
  }

  app.use(require('helmet')())

  app.use(sassMiddleware({
    src: `${root_path}/views`,
    prefix: '/public',
    // never actually write the file
    response: true
  }))

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  app.set('view engine', 'jade')

  app.use('/public', express.static(`${root_path}/public`))
  // app.use(favicon(`${root_path}/public/favicon.ico`))
  return app
}
