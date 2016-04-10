'use strict';

const angular = require('angular');

let app = angular.module('publists', []);

app.controller('ListsController', ['$scope', '$http', function($scope, $http) {

  $scope.init = function() {
    $http.get('/api/lists').then(function(res){
      // console.log('gotten');
      $scope.lists = res.data.lists;
      $scope.model = res.data.publicLists;
    });
  };

  $scope.toggle = function(list) {
    $scope.model[list.id] = !$scope.model[list.id];
  };

  $scope.save = function() {
    $http.post('/update', {
      lists: $scope.model
    });
  };

  $scope.init();
}]);
