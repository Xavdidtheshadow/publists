'use strict'

import angular = require('angular')
import _ = require('lodash')

// this gets executed and put in global space
require('angular-ui-indeterminate')

var app = angular.module('publists', [
  require('angular-ui-bootstrap'),
  require('angular-sanitize'),
  'ui.indeterminate'
 ])

app.service('subtaskFunctions', function() {
  function round(num: number) {
    return Math.round(num * 100) / 100
  }

  return {
    subtaskPercentage: function(subtasks: Subtask[]):number {
      var numComplete = subtasks.filter(function(val) {
        return val.completed === true
      }).length
      console.log('completed ' + numComplete + ' out of ' + subtasks.length)
      var res = numComplete / subtasks.length * 100
      return round(res)
    }
  }
})

app.controller('SettingsController', ['$scope', '$http', '$timeout', function($scope, $http: ng.IHttpService, $timeout) {
  $scope.init = function () {
    $scope.model = {}
    $scope.loading = true
    $http.get('/api/lists').then(function(res: { data: {
      lists: List[],
      public_lists: {[s:string]: boolean},
      folders: Folder[]
    }}) {
      $scope.loading = false
      $scope.model.lists = res.data.lists
      $scope.model.public_lists = res.data.public_lists || {}
      $scope.model.nested_lids = <number[]> _.flatMap(res.data.folders, 'list_ids')
    })
  }

  $scope.toggle = function (item: List | Folder) {
    // cant use typeof becuase they come back from angular as objects
    if (item.type === 'list') {
      $scope.flip(item.id)
    } else {
      let folder = <Folder> item
      folder.list_ids.forEach((lid) => {
        $scope.flip(lid)
      })
    }
  }

  $scope.flip = function (id:string) {
    $scope.model.public_lists[id] = !$scope.model.public_lists[id]
  }

  $scope.computeClasses = function(item: List | Folder) {
    var classes:string[] = []

    if (item.type === 'list') {
      // can click everything
      // classes.push('clickable')
      if ($scope.model.nested_lids.indexOf(item.id) > -1) {
        classes.push('subtask')
      }
    }
    return classes
  }

  $scope.save = function () {
    $scope.model.message = null
    $http.post('/update', {
      public_lists: $scope.model.public_lists
    }).then(function (resp) {
      $scope.model.message = 'Saved!'
      $timeout(function () {
        $scope.model.message = null
      }, 2000)
    }).catch(function (err) {
      console.log(err)
      $scope.model.message = `Error (${err.status}): ${err.data.message}`
    })
  }

  $scope.init()
}])

interface ListsScope extends ng.IScope {
  // init: function()
  model: {
    lists: List[],
    wid: string,
  },
  loading: boolean,
  init(): void
}

app.controller('ListsController', ['$scope', '$http', function($scope: ListsScope, $http) {
  $scope.init = function() {
    $scope.loading = true
    var urlParts = location.href.split('/')

    $scope.model = {
      lists: [],
      wid: urlParts[4]
    }

    $http.get('/api/public_lists', {
      params: { wid: $scope.model.wid }
    }).then(function(res: {
      data: {
        name: string,
        lists: List[]
      }
    }) {
      $scope.model.lists = res.data.lists
      // $scope.model.statics.name = res.data.name
      $scope.loading = false
    })
  }

  $scope.init()
}])

app.controller('TasksController', ['$scope', '$http', 'subtaskFunctions', function($scope, $http: ng.IHttpService, subtaskFunctions) {
  $scope.init = function():void {
    $scope.loading = true
    $scope.model = { tasks: [] }

    var urlParts = location.href.split('/')
    $scope.model.wid = urlParts[4]
    $scope.model.lid = urlParts[6]

    $http.get('/api/tasks', {
      params: { wid: $scope.model.wid, lid: $scope.model.lid }
    }).then(function(res: {
      data: {
        list: List,
        tasks: Task[]
      }
    }) {
      $scope.loading = false
      $scope.model.tasks = res.data.tasks || []
      // console.log(res.data.list)
      $scope.model.list = res.data.list
    })
  }

  $scope.subtaskPercentage = subtaskFunctions.subtaskPercentage
  $scope.init()
}])

app.controller('TaskController', ['$scope', '$http', 'subtaskFunctions', function($scope, $http, subtaskFunctions) {
  $scope.init = function(): void {
    $scope.loading = true
    $scope.model = { task: {} }

    var urlParts = location.href.split('/')
    $scope.model.wid = urlParts[4]
    $scope.model.lid = urlParts[6]
    $scope.model.tid = urlParts[8]

    $http.get('/api/task_info', {
      params: { wid: $scope.model.wid, lid: $scope.model.lid, tid: $scope.model.tid }
    }).then(function(res: {
      data: {
        task: Task
      }
    }) {
      $scope.loading = false
      $scope.model.task = res.data.task
    }).catch(function(err) {
      // console.log(err)
      $scope.loading = false
      $scope.model.task = {title: 'Not Found'}
    })
  }

  $scope.subtaskPercentage = subtaskFunctions.subtaskPercentage
  $scope.init()
}])
