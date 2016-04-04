'use strict';

const request = require('request-promise');
const base_url = 'https://a.wunderlist.com/api/v1';

let options = {
  transform: function(body) {
    return JSON.parse(body);
  },
  headers: {
    'X-Access-Token': process.env.WUNDERLIST_ACCESS_TOKEN,
    'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
  }
};

function tasks_url(lid) {
  return `${base_url}/tasks?list_id=${lid}`;
}

function lists_url() {
  return `${base_url}/lists`;
}

module.exports = {
  fetch_tasks_by_list_id: lid => {
    return request.get(tasks_url(lid), options);
  },
  fetch_lists: () => {
    return request.get(lists_url(), options);
  }
};
