'use strict'

import request = require('request-promise')
import _ = require('lodash')

const base_url = 'https://a.wunderlist.com/api/v1'
const url_regex = /https?:\/\/[\w\.\/\&\?@=#-\d]*/
const url_replacement = '[link removed]'
type fetch_by = 'task' | 'list'
type fetch_level = 'task' | 'subtask'
type sortable = List | Task | Subtask

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

function list_positions_url() {
  return `${base_url}/list_positions`
}

// has to either pass 'task', 'list'
// or, 'subtask', 'task'
function task_positions_url (fetch_level:fetch_level, fetch_type:fetch_by, id:string) {
  return `${base_url}/${fetch_level}_positions?${fetch_type}_id=${id}`
}

function notes_url (fetch_type:fetch_by, id:string) {
  return `${base_url}/notes?${fetch_type}_id=${id}`
}

function lists_url () {
  return `${base_url}/lists`
}

function folders_url () {
  return `${base_url}/folders`
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

// order a set of items based on their position in the position array
function order_items(items: sortable[], order: Position) {
  let res: sortable[] = []

  if (!items) {
    // console.log(`order items called with no items!`, items)
    return res
  }

  let indexed_items:{[s:string]: sortable} = _.keyBy(items, 'id')
  order.values.forEach((val) => {
    // subtask might not exist
    if (indexed_items[val]) {
      res.push(indexed_items[val])
      // so that we know which ones are left
      delete indexed_items[val]
    }
  })
  // add any remaining tasks; there probably aren't any
  res = res.concat(<sortable[]> _.sortBy(_.values(indexed_items), 'id'))
  return res
}

// lists are sorted
function insert_folders(lists: (List|Folder)[], folders: Folder[]) {
  folders.forEach((folder) => {
    // have to do this in the block because multiple folders will change array indexes
    let ordered_ids = _.map(lists, 'id')

    let folder_start_position = _.min(_.map(folder.list_ids, (lid) => {
      return ordered_ids.indexOf(lid)
    }))

    lists.splice(folder_start_position, 0, folder)
  })
  // lists and folders
  return lists
}

// pretend we can get back all tasks (completed and not) with one call
function combine_tasks (data: [List, Task[], Task[], Subtask[], Note[], Position[]]) {
    let combined = data[1].concat(data[2])
    return [data[0], combined, data[3], data[4], data[5]]
}

function process_task(task: Task, subtasks: Subtask[], note: Note, position: Position, simple: boolean) {
  // there might be a way to combine these blocks, but i'm not thinking of it
  // console.log(subtasks)
  if (note) {
    if (simple) {
      task.note = note.content.replace(url_regex, url_replacement)
    } else {
      task.note = note.content
    }
  }

  if (simple) {
    task.subtasks = subtasks
  } else {
    task.subtasks = <Subtask[]> order_items(subtasks, position)
  }
  // console.log(subtasks, task.subtasks)
  return task
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
      request.get(task_positions_url('task', 'list', lid), build_options(token))
    ])
    .then(combine_tasks)
    .then((data: [List, Task[], Subtask[], Note[], Position[]]) => {
      // adds ordered subtasks and notes to tasks
      let subtasks = _.groupBy(data[2], 'task_id')
      let notes = _.keyBy(data[3], 'task_id')
      let fake_position = <Position> { values: [] }

      data[1].forEach((task) => {
        task = process_task(task, subtasks[task.id], notes[task.id], fake_position, true)
      })

      return {
        list: data[0],
        tasks: <Task[]> order_items(data[1], data[4][0])
      }
    })
  },
  fetch_lists: (token:string) => {
    return Promise.all([
      request.get(lists_url(), build_options(token)),
      request.get(list_positions_url(), build_options(token)),
      request.get(folders_url(), build_options(token)),
    ]).then((data: [List[], Position[], Folder[]]) => {
      let sorted_lists = <List[]> order_items(data[0], data[1][0])
      return {
        lists: insert_folders(sorted_lists, data[2]),
        folders: _.keyBy(data[2], 'id')
      }
    })
  },
  fetch_list: (lid:string, token:string) => {
    return request.get(`${lists_url()}/${lid}`, build_options(token))
  },
  fetch_task_with_info: (tid:string, token:string) => {
    return Promise.all([
      request.get(task_url(tid), build_options(token)),
      request.get(subtasks_url('task', tid), build_options(token)),
      request.get(notes_url('task', tid), build_options(token)),
      request.get(task_positions_url('subtask', 'task', tid), build_options(token))
    ]).then((data: [Task, Subtask[], Note[], Position[]]) => {
      return process_task(data[0], data[1], data[2][0], data[3][0], false)
    })
  },
  fetch_user: (token: string) => {
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
