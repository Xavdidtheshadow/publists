'use strict';

const favicon = require('serve-favicon');

const express = require('express');
const app = express();

// settings
app.set('production', process.env.NODE_ENV === 'production');
// local only
if (!app.get('production')) {
  require('dotenv').load();
}

app.set('port', (process.env.PORT || 3000));
app.set('view engine', 'jade');
app.use(require('helmet')());
app.use('/public', express.static(__dirname + '/public'));
// app.use(favicon(__dirname + '/public/favicon.ico'));

const wunderlist = require('./wunderlist');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/lists' ,(req, res) => {
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

var server = app.listen(app.get('port'), function () {
  console.log(`App listening on port ${server.address().port}`);
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`);
});
