// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var pouchApp = angular.module('starter', ['ionic', 'starter.controllers','ngCordovaBeacon', 'ngCordova'])

var localDB = new PouchDB("todos");
var remoteDB = new PouchDB("http://Kevin:240195@192.168.1.4:5984/todos");

var localDB2 = new PouchDB("provadb");
var remoteDB2 = new PouchDB("http://Kevin:240195@192.168.1.4:5984/provadb");

pouchApp.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    localDB.sync(remoteDB, {live: true});
    localDB2.sync(remoteDB2, {live: true});
  });
})

pouchApp.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider


    .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

    .state('app.readbeacon', {
      url: '/readbeacon',
      views: {
        'menuContent': {
          templateUrl: 'templates/readbeacon.html',
          controller: 'ReadBeaconCtrl'
        }
      }
    })

    .state('app.ibeacon', {
      url: '/ibeacon',
      views: {
        'menuContent': {
          templateUrl: 'templates/ibeacon.html',
          controller: 'IBeaconCtrl'
        }
      }
    })

    .state('app.local', {
      url: '/local',
      views: {
        'menuContent': {
          templateUrl: 'templates/local.html',
          controller: 'LocalCtrl'
        }
      }
    })

    .state('app.faro', {
      url: '/faro',
      views: {
        'menuContent': {
          templateUrl: 'templates/faro.html',
          controller: 'FaroCtrl'
        }
      }
    })

    .state('welcome', {
    url: '/welcome',
    templateUrl: "templates/welcome.html",
    controller: 'WelcomeCtrl'
  })

   .state('app.home', {
    url: "/home",
    views: {
      'menuContent': {
        templateUrl: "templates/home.html",
        controller: 'HomeCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/welcome');
});


pouchApp.factory('PouchDBListener', ['$rootScope', function($rootScope) { 
    localDB.changes({
      continuous: true,
      onChange: function(change) {
        if (!change.deleted) {
          $rootScope.$apply(function() {
            localDB.get(change.id, function(err, doc) {
              $rootScope.$apply(function() {
                if (err) console.log(err);
                $rootScope.$broadcast('add', doc);
              })
            });
          })
        } else {
          $rootScope.$apply(function() {
            $rootScope.$broadcast('delete', change.id);
          });
        }
      }
    });

    localDB2.changes({
      continuous: true,
      onChange: function(change) {
        if (!change.deleted) {
          $rootScope.$apply(function() {
            localDB2.get(change.id, function(err, doc) {
              $rootScope.$apply(function() {
                if (err) console.log(err);
                $rootScope.$broadcast('add', doc);
              })
            });
                })
        } else {
          rootScope.$apply(function() {
            $rootScope.$broadcast('delete', change.id);
          });
        }
      }
    });
 
    return true;
}]);
