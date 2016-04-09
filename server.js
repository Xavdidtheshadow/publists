'use strict';

const favicon = require('serve-favicon');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const sassMiddleware = require('node-sass-middleware');

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
app.use(sassMiddleware({
  src: __dirname + '/views',
  prefix: '/public',
  // never actually write the file
  response: true
}));

let Parse = require('parse/node');
Parse.initialize(process.env.APP_ID, null, process.env.MASTER_KEY);
Parse.serverURL = app.get('server_url');

app.set('port', (process.env.PORT));
app.set('view engine', 'jade');

app.use('/public', express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
app.use(session({
  store: new RedisStore({
    url: process.env.REDIS_URL
  }),
  secret: process.env.COOKIE_SECRET,
  saveUninitialized: false,
  resave: false
}));
// app.use(favicon(__dirname + '/public/favicon.ico'));

const wunderlist = require('./wunderlist');

// CUSTOM MIDDLWARE
function sessionPasser(req, res, next) {
  if (req.session.user) {
    console.log(req.session.user);
    res.locals.user = {
      username: req.session.user.username,
      publicLists: req.session.user.publicLists,
      objectId: req.session.user.objectId
    };
  }
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
  user.signUp({
    username: req.body.username,
    password: req.body.password,
    publicLists: {}
  }, {
    success: function(user) {
      // apparently parse stores info in localstorage too? 
      req.session.user = user;
      // res.redirect('/wunderlistAuth');
      res.redirect('/');
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

app.post('/update', (req, res) => {
  if (!req.session.user) {
    res.status(401).send({message: "No session exists"});
  } else {
    let q = new Parse.Query(Parse.User).equalTo("objectId", req.session.user.objectId);
    q.first().then(u => {
      console.log('fetched user', u);
      u.save({publicLists: req.body.lists}, {useMasterKey: true}).then(newU => {
        req.session.user = newU;
        console.log('saved!', req.body.lists);
        res.sendStatus(200);
      }, (err) => {
        console.log('err', err);
        res.status(err.code).send({status: err.code, message: err.message});
      });
    }, err => {
      console.log('err bottom');
      res.status(403).send({message: "Invalid userID"});
    });
  }
});

app.get('/lists', (req, res) => {
  // res.render('lists');
});

app.get('/user/:uid/lists/:lid', (req, res, next) => {
  console.log('top of function!');
  let q = new Parse.Query(Parse.User).equalTo("objectId", req.params.uid);
  q.first().then(u => {
    console.log('found user');
    let lists = u.get('publicLists');
    // console.log(u.publicLists[req.params.lid]);
    if (lists[req.params.lid]) {
      wunderlist.fetch_tasks_by_list_id(req.params.lid, process.env.WUNDERLIST_ACCESS_TOKEN).then(tasks => {
        res.render('list', {tasks: tasks});
      }).catch(err => {
        console.log('wunderlist error');
        res.status(500).send({error: err.message});
      });
    } else {
      console.log('list not found or not public');
      res.status(404).send('not found');
    }
  }, err => {
    console.log('bot error');
    res.status(500).send({error: err.message});
  });
});

app.get('/api/lists', (req, res) => {
  wunderlist.fetch_lists(process.env.WUNDERLIST_ACCESS_TOKEN).then(lists => {
    res.send({
      lists: lists,
      publicLists: req.session.user.publicLists
    });
  }).catch(err => {
    console.log(err.message);
    res.sendStatus(500);
  });
});

app.get('/api/lists/:lid/tasks' ,(req, res) => {
  wunderlist.fetch_tasks_by_list_id(req.params.lid, process.env.WUNDERLIST_ACCESS_TOKEN).then(tasks => {
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
