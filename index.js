'use strict';

const express = require('express');
const wunderlist = require('./wunderlist');

const app = express();
app.set('port', (process.env.PORT || 3000));
app.set('view engine', 'jade');

// settings
app.set('production', process.env.NODE_ENV === 'production');
// local only
if (!app.get('production')) {
  require('dotenv').load();
}

app.get('/' ,(req, res) => {
  wunderlist.fetch_tasks_by_list_id(107797412).then(tasks => {
    res.send(tasks);
  });
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(err);
});

app.use(function(req, res, next) {
  res.status(404).send(`That's not a valid media type! Try [${media_types.join(' | ')}] instead`);
});

var server = app.listen(app.get('port'), function () {
  console.log(`Example app listening on port ${server.address().port}`);
  console.log(`Production mode ${app.get('production') ? '' : 'not'} enabled.`);
});