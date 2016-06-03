'use strict'

import request = require('request-promise')
import _ = require('lodash')

const base_url = 'https://a.wunderlist.com/api/v1'

// makes sure the auth is there
const options = {
  transform: function (body:string) {
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

function build_options (access_token:string) {
  return _.merge({
    headers: {
      'X-Access-Token': access_token
    }
  }, options)
}

function order_subtasks (subtasks:Subtask[], pos:Position) {
  if (pos.values.length === 0) {
    return _.sortBy(subtasks, 'created_at')
  } else {
    let res:Subtask[] = []
    let indexed_tasks = _.groupBy(subtasks, 'id')
    pos.values.forEach((val) => {
      // subtask might not exist
      if (indexed_tasks[val]) {
        res.push(indexed_tasks[val][0])
        // so that we know which ones are left
        delete indexed_tasks[val]
      }
    })
    // add any remaining tasks
    res.concat(_.sortBy(subtasks, 'created_at'))
    return res
  }
}

function process_items (data:[List, Task[], Subtask[], Note[], Position[]]) {
  let subtasks = _.groupBy(data[2], 'task_id')
  let notes = _.groupBy(data[3], 'task_id')
  let orders = _.groupBy(data[4], 'task_id')
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

function combine_tasks(data:[List, Task[], Task[]]) {
  let sorted = _.sortBy(data[1].concat(data[2]), 'created_at')
  return [data[0], sorted]
}

export = {
  fetch_tasks_with_items: function(lid, token):Promise<[List, Task[]]> {
    // these objects are pretty spread
    return Promise.all([
      this.fetch_list(lid, token),
      request.get(tasks_url(lid, false), build_options(token)),
      request.get(tasks_url(lid, true), build_options(token))
    ]).then(combine_tasks)//.then(process_items)
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
    return this.auth(code).then((data:{ access_token:string }) => {
      return Promise.all([data, this.fetch_user(data.access_token)])
    })
  }
}
