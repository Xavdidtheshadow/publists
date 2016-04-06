'use strict';

const favicon = require('serve-favicon');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
app.use(require('helmet')());

// settings
app.set('production', process.env.NODE_ENV === 'production');
// local only
if (app.get('production')) {
  app.set('server_url', 'https://publists.herokuapp.com/parse');
} else {
  app.set('server_url', `http://localhost:${process.env.PORT}/parse`);
  require('dotenv').load();
}

// set up parse db
require('./db_config')(app);

let Parse = require('parse/node');
Parse.initialize(process.env.APP_ID);
Parse.serverURL = app.get('server_url');

app.set('port', (process.env.PORT));
app.set('view engine', 'jade');

app.use('/public', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
app.use(session({
  secret: 'mySecret',
  saveUninitialized: false,
  resave: false
}));
// app.use(favicon(__dirname + '/public/favicon.ico'));

const wunderlist = require('./wunderlist');

// CUSTOM MIDDLWARE
function sessionPasser(req, res, next) {
  res.locals.session = req.session.user;
  next();
}

app.use(sessionPasser);

// ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  var user = new Parse.User();
  user.set('username', req.body.username);
  user.set('password', req.body.password);
  user.set('publicLists', []);

  user.signUp(null, {
    success: function(user) {
      req.session.user = user;
      res.redirect('/wunderlistAuth');
    },
    error: function(user, error) {
      res.send({status: error.code, message: error.message});
    }
  });
});

app.post('/login', (req, res) => {
  Parse.User.logIn(req.body.username.trim(), req.body.password.trim(), {
    success: function(user) {
      // Do stuff after successful login.
    },
    error: function(user, error) {
      // The login failed. Check error to see why.
    }
  });
});

app.get('/wunderlistAuth', (req, res) => {
  res.render('wunderlistButton');
});

app.get('/lists', (req, res) => {
  wunderlist.fetch_lists().then(lists => {
    res.send(lists);
  });
});

app.get('/lists/:lid/tasks' ,(req, res) => {
  wunderlist.fetch_tasks_by_list_id(req.params.lid).then(tasks => {
    res.send(tasks);
  });
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(err);
});

app.use(function(req, res, next) {
  res.status(404).send(`url not found!`);
});

const server = app.listen(app.get('port'), function () {
  console.log(`App listening on port ${server.address().port}`);
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`);
});