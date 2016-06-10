'use strict'

import angular = require('angular')
var ui = require('angular-ui-bootstrap')

var app = angular.module('publists', [ui])

app.controller('SettingsController', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.init = function () {
    $scope.model = {}
    $scope.loading = true
    $http.get('/api/lists').then(function(res: { data: { 
      lists: List[],
      public_lists: {[s:string]: boolean}
    }}) {
      $scope.loading = false
      $scope.model.lists = res.data.lists
      $scope.model.public_lists = res.data.public_lists || {}
    })
  }

  $scope.toggle = function (list:List) {
    $scope.model.public_lists[list.id] = !$scope.model.public_lists[list.id]
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

app.controller('ListsController', ['$scope', '$http', function($scope, $http) {
  $scope.init = function() {
    $scope.loading = true
    $scope.model = { 
      lists: [],
      statics: {
        name: ''
      }
    }

    var urlParts = location.href.split('/')
    $scope.model.wid = urlParts[4]

    $http.get('/api/public_lists', {
      params: { wid: $scope.model.wid }
    }).then(function(res: {
      data: {
        name: string,
        lists: List[]
      }
    }) {
      $scope.model.lists = res.data.lists
      $scope.model.statics.name = res.data.name
      $scope.loading = false
    })
  }

  $scope.init()
}])

app.controller('TasksController', ['$scope', '$http', function($scope, $http) {
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

  $scope.init()
}])
