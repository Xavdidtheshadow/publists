'use strict'

import request = require('request-promise')
import _ = require('lodash')

const base_url = 'https://a.wunderlist.com/api/v1'
const url_regex = /https?:\/\/[\w\.\/\&\?@=#-\d]*/
const url_replacement = '[link removed]'
type fetch_by = 'task' | 'list'

// makes sure the auth is there
const options = {
  transform: function (body:string) {
    return JSON.parse(body)
  },
  headers: {
    'X-Client-ID': process.env.WUNDERLIST_CLIENT_ID
  }
}

function tasks_url (lid:string, completed:boolean) {
  return `${base_url}/tasks?list_id=${lid}&completed=${completed}`
}

function task_url (tid: string) {
  return `${base_url}/tasks/${tid}`
}

function subtasks_url (fetch_type:fetch_by, id:string) {
  return `${base_url}/subtasks?${fetch_type}_id=${id}`
}

function subtask_positions_url (fetch_type:fetch_by, id:string) {
  return `${base_url}/subtask_positions?${fetch_type}_id=${id}`
}

function notes_url (fetch_type:fetch_by, id:string) {
  return `${base_url}/notes?${fetch_type}_id=${id}`
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

// return an array of subtasks in their position order
function order_subtasks (subtasks:Subtask[], pos:Position) {
  if (pos.values.length === 0) {
    return _.sortBy(subtasks, 'created_at')
  } else {
    let res: Subtask[] = []
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

// adds ordered subtasks and notes to tasks
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
    if (notes[task.id]) {
      let note = notes[task.id][0].content.replace(url_regex, url_replacement)
      data[1][index].note = note  
    } else {
      data[1][index].note = undefined
    }
  })

  return [data[0], data[1]]
}

function process_task(data:[Task, Subtask[], Note[], Position[]]) {
  let task = data[0]
  task.subtasks = order_subtasks(data[1], data[3][0])
  if (data[2].length > 0) {
    task.note = data[2][0].content  
  }
  return task
}

function combine_tasks(data:[List, Task[], Task[], Subtask[], Note[], Position[]]) {
  let sorted = _.sortBy(data[1].concat(data[2]), 'created_at')
  return [data[0], sorted, data[3], data[4], data[5]]
}

export = {
  fetch_tasks_with_items: function(lid:string, token:string) {
    // these objects are pretty spread
    return Promise.all([
      this.fetch_list(lid, token),
      request.get(tasks_url(lid, false), build_options(token)),
      request.get(tasks_url(lid, true), build_options(token)),
      request.get(subtasks_url('list', lid), build_options(token)),
      request.get(notes_url('list', lid), build_options(token)),
      request.get(subtask_positions_url('list', lid), build_options(token))
    ]).then(combine_tasks).then(process_items)
  },
  fetch_lists: (token:string) => {
    return request.get(lists_url(), build_options(token))
  },
  fetch_list: (lid:string, token:string) => {
    return request.get(`${lists_url()}/${lid}`, build_options(token))
  },
  fetch_user: (token:string) => {
    return request.get(user_url(), build_options(token))
  },
  fetch_task_with_info: (tid:string, token:string) => {
    return Promise.all([
      request.get(task_url(tid), build_options(token)),
      request.get(subtasks_url('task', tid), build_options(token)),
      request.get(notes_url('task', tid), build_options(token)),
      request.get(subtask_positions_url('task', tid), build_options(token))
    ]).then(process_task)
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
