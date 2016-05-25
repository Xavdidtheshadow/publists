'use strict'

const request = require('request-promise')
const merge = require('lodash.merge')
const groupBy = require('lodash.groupby')
const sortBy = require('lodash.sortby')
const base_url = 'https://a.wunderlist.com/api/v1'

// makes sure the auth is there
const options = {
  transform: function (body) {
    return JSON.parse(body)
  },
  headers: {
    'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
  }
}

function tasks_url (lid, completed) {
  return `${base_url}/tasks?list_id=${lid}&completed=${completed}`
}

function subtasks_url (lid) {
  return `${base_url}/subtasks?list_id=${lid}`
}

function notes_url (lid) {
  return `${base_url}/notes?list_id=${lid}`
}

function lists_url () {
  return `${base_url}/lists`
}

function user_url () {
  return `${base_url}/user`
}

function build_options (access_token) {
  return merge({
    headers: {
      'X-Access-Token': access_token
    }
  }, options)
}

// [ list, tasks, subtasks, notes ]
function process_items (data) {
  let subtasks = groupBy(data[2], 'task_id')
  let notes = groupBy(data[3], 'task_id')
  data[1].forEach((item, index) => {
    data[1][index].subtasks = subtasks[item.id] ? sortBy(subtasks[item.id], 'created_at') : []
    data[1][index].note = notes[item.id] ? notes[item.id][0].content : undefined
  })
  console.log(data[1])
  return data
}

function combine_tasks (data) {
  // combines the arrays of 1 and 2
  data[1] = data[1].concat(data.splice(2, 1)[0])
  return data
}

module.exports = {
  fetch_tasks_with_items: function (lid, token) {
    return Promise.all([
      this.fetch_list(lid, token),
      request.get(tasks_url(lid, false), build_options(token)),
      request.get(tasks_url(lid, true), build_options(token)),
      request.get(subtasks_url(lid), build_options(token)),
      request.get(notes_url(lid), build_options(token))
    ]).then(combine_tasks).then(process_items)
  },
  fetch_lists: (token) => {
    return request.get(lists_url(), build_options(token))
  },
  fetch_list: (lid, token) => {
    return request.get(`${lists_url()}/${lid}`, build_options(token))
  },
  fetch_user: (token) => {
    return request.get(user_url(), build_options(token))
  },
  auth: (code) => {
    let opts = {
      method: 'POST',
      uri: 'https://www.wunderlist.com/oauth/access_token',
      body: {
        client_id: process.env.WUNDERLIST_CLIENT_ID,
        client_secret: process.env.WUNDERLIST_CLIENT_SECRET,
        code: code
      },
      json: true
    }

    return request(opts)
  },
  // returns an array of results: [access_token, user]
  getAuthedUser: function (code) {
    return this.auth(code).then((data) => {
      return Promise.all([data, this.fetch_user(data.access_token)])
    })
  }
}
