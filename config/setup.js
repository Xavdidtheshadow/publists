'use strict';
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const express = require('express');
const path = require('path');
const root_path = path.join(__dirname, '..');
module.exports = function () {
    const app = express();
    app.set('port', (process.env.PORT));
    app.set('production', process.env.NODE_ENV === 'production');
    if (app.get('production')) {
        app.set('server_url', 'https://publists.herokuapp.com/parse');
    }
    else {
        app.set('server_url', `http://localhost:${process.env.PORT}/parse`);
        require('dotenv').load();
    }
    app.use(require('helmet')());
    app.use(sassMiddleware({
        src: `${root_path}/views`,
        prefix: '/public',
        response: true
    }));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.set('view engine', 'pug');
    app.use('/public', express.static(`${root_path}/public`));
    return app;
};
