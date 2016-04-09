'use strict';

const request = require('request-promise');
const merge = require('lodash.merge');
const base_url = 'https://a.wunderlist.com/api/v1';

const options = {
  transform: function(body) {
    return JSON.parse(body);
  },
  headers: {
    'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
  }
};

function tasks_url(lid) {
  return `${base_url}/tasks?list_id=${lid}`;
}

function lists_url() {
  return `${base_url}/lists`;
}

function build_options(access_token) {
  return merge({
    headers: {
    'X-Access-Token': access_token
  }}, options);
}

module.exports = {
  fetch_tasks_by_list_id: (lid, token) => {
    return request.get(tasks_url(lid), build_options(token));
  },
  fetch_lists: (token) => {
    return request.get(lists_url(), build_options(token));
  }
};
