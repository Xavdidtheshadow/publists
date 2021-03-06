'use strict'

import bodyParser = require('body-parser')
// const favicon = require('serve-favicon')
import sassMiddleware = require('node-sass-middleware')
import express = require('express')
import path = require('path')

const root_path = path.join(__dirname, '..')

module.exports = function () {
  const app = express()

  app.set('port', (process.env.PORT))

  // settings
  app.set('production', process.env.NODE_ENV === 'production')
  // local only
  if (app.get('production')) {
    // nothing?
  } else {
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

  app.set('view engine', 'pug')

  app.use('/public', express.static(`${root_path}/public`))
  // app.use(favicon(`${root_path}/public/favicon.ico`))
  return app
}
