'use strict';

const app = require('./config/setup')();
require('./config/db'); // delcares User schema
require('./config/session')(app);
const User = require('mongoose').model('User');

const wunderlist = require('./wunderlist');
const request = require('request-promise');
const urlLib = require('url');

// ROUTES
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/');
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
  if (req.query.state === 'california') {
    console.log('in callback inner!');
    wunderlist.getAuthedUser(code).then(results => {
      console.log('posted for access', results);
      return User.login(results[0].access_token, results[1].id);
    }).then(user => {
      req.session.user = user;
      res.redirect('/');
    }).catch(err => {
      // this could be a mongo or wunderlist error
      console.log('err', err);
      res.status(500).send({status: err.code, message: err.message});
    });
  } else {
    console.log('bad user?');
    res.sendStatus(500);
  }
});

app.get('/wunderlistAuth', (req, res) => {
  res.render('wunderlistButton');
});

app.post('/update', (req, res) => {
  if (!req.session.user) {
    res.status(401).send({message: "No session exists"});
  } else {
    User.findOneAndUpdate({
      wid: req.session.user.wid
    }, {
      public_lists: req.body.lists
    }).then(u => {
      req.session.user = u;
      console.log('saved!', req.session.user.public_lists);
      res.sendStatus(200);
    }).catch(err => {
      console.log('err', err);
      res.status(500).send({message: err});
    });
  }
});

app.get('/lists', (req, res) => {
  // res.render('lists');
});

app.get('/user/:wid/lists/:lid', (req, res, next) => {
  console.log('top of function!');
  // find one {wid: req.params.uid}
  // fix nested stuff 
  User.findOne({wid: req.params.wid}).then(user => {
    if (user.public_lists[req.params.lid]) {
      console.log('yeppin');
      return wunderlist.fetch_tasks_by_list_id(req.params.lid, user.access_token);
    } else {
      // anything without the tasks key will work
      console.log('nopin');
      return Promise.resolve({nope: true});
    }
  }).then(data => {
    if (data.tasks) {
      res.render('list', {tasks: data.tasks});
    } else {
      res.status(404).send('list not found or not public');
    }
  }).catch(err => {
    console.log('wunderlist error');
    res.status(500).send({error: err});
  });
});

app.get('/api/lists', (req, res) => {
  wunderlist.fetch_lists(req.session.user.access_token).then(lists => {
    res.send({
      lists: lists,
      public_lists: req.session.user.public_lists || {}
    });
  }).catch(err => {
    console.log(err.message);
    res.send(err);
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
