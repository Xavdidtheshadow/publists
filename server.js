'use strict';

const app = require('./config/setup')();
require('./config/db')(app);
require('./config/session')(app);

const wunderlist = require('./wunderlist');
const request = require('request-promise');
const urlLib = require('url');

// seems silly to make a new file for 3 lines
const Parse = require('parse/node');
Parse.initialize(process.env.APP_ID, null, process.env.MASTER_KEY);
Parse.serverURL = app.get('server_url');

// ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/auth', (req, res) => {
  let url = urlLib.format({
    protocol: 'https', 
    host: 'www.wunderlist.com/oauth/authorize', 
    query: {
      client_id: process.env.WUNDERLIST_CLIENT_ID,
      redirect_uri: 'https://de3543d3.ngrok.io/callback',
      state: 'california' // i'm funny this'll either be a secret or uid or something?
    }
  });
  res.redirect(url);
});

app.get('/callback', (req, res) => {
  let code = req.query.code;
  console.log(code);
  if (req.query.state === 'california' && req.session.user) {
    console.log('in callback inner!');
    request({
      method: 'POST',
      uri: 'https://www.wunderlist.com/oauth/access_token',
      body: {
        client_id: process.env.WUNDERLIST_CLIENT_ID,
        client_secret: process.env.WUNDERLIST_CLIENT_SECRET,
        code: code
      },
      json: true
    }).then(data => {
      console.log('posted for access');
      let q = new Parse.Query(Parse.User).equalTo("objectId", req.session.user.objectId);
      q.first().then(u => {
        console.log('fetched user', u);
        u.save({access_token: data.access_token}, {useMasterKey: true}).then(newU => {
          req.session.user = newU;
          res.redirect('/');
        }, (err) => {
          console.log('err', err);
          res.status(err.code).send({status: err.code, message: err.message});
        });
      }, err => {
        console.log('this should not happen');
        res.status(403).send({message: "Invalid userID"});
      });
    });
  } else {
    console.log('bad user?');
    res.sendStatus(500);
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).send({message: "Invalid Username or Password"});
  } else {
    Parse.User.logIn(
      req.body.username.trim(), 
      req.body.password.trim(), {
        success: user => {
          req.session.user = user;
          res.redirect('/');
        },
        error: (user, error) => {
          res.send({status: error.code, message: error.message});
      }
    });
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(401).send({message: "Missing Username or Password"});
  } else {
    console.log(req.body.username, req.body.password);
    var user = new Parse.User();
    user.signUp({
      username: req.body.username.trim(),
      password: req.body.password.trim(),
      publicLists: {}
    }, {
      success: user => {
        // apparently parse stores info in localstorage too? 
        req.session.user = user;
        // res.redirect('/wunderlistAuth');
        res.redirect('/');
      },
      error: (user, error) => {
        res.send({status: error.code, message: error.message});
      }
    });
  }
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
    let lists = u.get('publicLists');

    if (lists[req.params.lid]) {
      wunderlist.fetch_tasks_by_list_id(req.params.lid, req.session.user.access_token).then(tasks => {
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
  wunderlist.fetch_lists(req.session.user.access_token).then(lists => {
    res.send({
      lists: lists,
      publicLists: req.session.user.publicLists
    });
  }).catch(err => {
    console.log(err.message);
    res.sendStatus(500);
  });
});

// app.get('/api/lists/:lid/tasks' ,(req, res) => {
//   wunderlist.fetch_tasks_by_list_id(req.params.lid, process.env.WUNDERLIST_ACCESS_TOKEN).then(tasks => {
//     res.send(tasks);
//   });
// });

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(err);
});

app.use((req, res, next) => {
  res.status(404).send(`url not found!`);
});

const server = app.listen(app.get('port'), () => {
  console.log(`App listening on port ${server.address().port}`);
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`);
});
