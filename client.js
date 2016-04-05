'use strict';

const angular = require('angular');

let app = angular.module('publists', []);

app.controller('MainController', ['$scope', '$http', function($scope, $http) {
  $scope.message = 'yo';
  $scope.lists = [];
  $scope.model = {
    "94347210": true,
    "107797412": true,
    "145392985": true
  };
  $http.get('/lists').then(function(res){
    $scope.lists = res.data;
  });
}]);
