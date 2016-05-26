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

function subtask_positions_url (lid) {
  return `${base_url}/subtask_positions?list_id=${lid}`
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

function order_subtasks (subtasks, order) {
  if (order.values.length === 0) {
    return sortBy(subtasks, 'created_at')
  } else {
    let res = []
    let indexed_tasks = groupBy(subtasks, 'id')
    order.values.forEach((val) => {
      // subtask might not exist
      if (indexed_tasks[val]) {
        res.push(indexed_tasks[val][0])
        // so that we know which ones are left
        delete indexed_tasks[val]
      }
    })
    // add any remaining tasks
    res.concat(sortBy(subtasks, 'created_at'))
    return res
  }
}

// [ list, tasks, subtasks, notes, orders ]
function process_items (data) {
  let subtasks = groupBy(data[2], 'task_id')
  let notes = groupBy(data[3], 'task_id')
  let orders = groupBy(data[4], 'task_id')
  data[1].forEach((task, index) => {
    // there's no reason that orders wouldn't be there, but you never know
    if (subtasks[task.id] && orders[task.id]) {
      data[1][index].subtasks = order_subtasks(subtasks[task.id], orders[task.id][0])
    } else {
      data[1][index].subtasks = []
    }
    data[1][index].note = notes[task.id] ? notes[task.id][0].content : undefined
  })
  return data
}

function combine_tasks (data) {
  // combines the arrays of 1 and 2
  let sorted = data[1].concat(data.splice(2, 1)[0])
  data[1] = sortBy(sorted, 'created_at')
  return data
}

module.exports = {
  fetch_tasks_with_items: function (lid, token) {
    // these objects are pretty spread
    return Promise.all([
      this.fetch_list(lid, token),
      request.get(tasks_url(lid, false), build_options(token)),
      request.get(tasks_url(lid, true), build_options(token)),
      request.get(subtasks_url(lid), build_options(token)),
      request.get(notes_url(lid), build_options(token)),
      request.get(subtask_positions_url(lid), build_options(token))
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
