'use strict';

const request = require('request-promise');

let options = {
  transform: function(body) {
    return JSON.parse(body);
  },
  headers: {
    'X-Access-Token': process.env.WUNDERLIST_ACCESS_TOKEN,
    'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
  }
};

function url(lid) {
  return `https://a.wunderlist.com/api/v1/tasks?list_id=${lid}`;
}

module.exports = {
  fetch_tasks_by_list_id: function(lid) {
    return request.get(url(lid), options);
  }
};
