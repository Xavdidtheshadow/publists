'use strict';

const angular = require('angular');

let app = angular.module('publists', []);

app.controller('MainController', ['$scope', '$http', function($scope, $http) {
  $scope.message = 'yo';
  $scope.lists = [];
  $scope.model = {
    // "94347210": true,
    // "107797412": true,
    // "145392985": true
  };

  $http.get('/api/lists').then(function(res){
    console.log('gotten');
    $scope.lists = res.data;
  });

  $scope.toggle = function(list) {
    $scope.model[list.id] = !$scope.model[list.id];
  };

  $scope.save = function() {
    $http.post('/update', {
      lists: $scope.trueLists()
    });
  };

  $scope.trueLists = function() {
    var res = [];
    angular.forEach($scope.model, function(value, key) {
      if (value) this.push(key);
    }, res);
    return res;
  };
}]);
