// describes wunderlist types, as I need them

interface Task {
  id: number,
  created_at: string, // this is a datetime string, really
  due_date: string, // also datetime
  list_id: number,
  starred: boolean,
  title: string,
  // I add these manually later during contensation
  subtasks?: Subtask[],
  note?: string
}

interface List {
  id: number,
  created_at: string, // this is a datetime string, really
  title: string
}

interface Position {
  id: number,
  values: number[],
  type: 'list_position'|'task_position'
}

interface Subtask {
  id: number,
  created_at: string, // this is a datetime string, really
  task_id: number,
  title: string
}

interface Note {
  id: number,
  content: string,
  task_id: number
}

interface User {
  wid: string,
  access_token: string,
  name: string,
  public_lists: {[s:string]: boolean}
}
