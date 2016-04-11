'use strict';

const angular = require('angular');

let app = angular.module('publists', []);

app.controller('ListsController', ['$scope', '$http', function($scope, $http) {

  $scope.init = function() {
    $scope.model = {};
    $http.get('/api/lists').then(function(res){
      // console.log('gotten');
      $scope.model.lists = res.data.lists;
      $scope.model.public_lists = res.data.public_lists;
    });
  };

  $scope.toggle = function(list) {
    $scope.model.public_lists[list.id] = !$scope.model.public_lists[list.id];
  };

  $scope.save = function() {
    $http.post('/update', {
      lists: $scope.model.public_lists
    }).then(function(resp) {
      $scope.model.message = "Saved!";
    }).catch(function(err) {
      $scope.model.message = "Error!" + err;
    });
  };

  $scope.init();
}]);
