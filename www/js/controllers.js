angular.module('starter.controllers', ['ionic', 'starter.services','ngCordovaBeacon', 'ngCordova'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.controller('IBeaconCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
    $scope.beacons = {};
    $scope.user = [];
    $scope.pos = null;

    $scope.settings = {
            time: null
          };

    var myInterval;
    var myTime;
    var myBeacons = {};

        $ionicPlatform.ready(function() {
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor + ":" + $scope.settings.time;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            console.log($scope.beacons);
        });
 
        $scope.startScan = function() {
          myTime = $scope.settings.time; 
          myInterval = setInterval(function(){
            if ($scope.settings.time > 0) {
              $scope.settings.time-- ;
            }
            if($scope.settings.time == 0){
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
              for(var key in $scope.beacons){
                //console.log(key); // print
                var fields = key.split(":");
                var beaconKey = fields[0] + ":" + fields[1];
                var a = [];
                for(var key2 in $scope.beacons){
                  if(fields[0] == $scope.beacons[key2].major && fields[1] == $scope.beacons[key2].minor){
                    a.push($scope.beacons[key2]);
                    //console.log(a); // print
                  }
                  myBeacons[beaconKey] = a;
                }          
              }
            }
         }, 1000);


          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $scope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $scope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $scope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $scope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $scope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $scope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $scope.cardinal = 'WEST';
                      }
                      else {
                          $scope.cardinal = 'NORTH-WEST';
                      }
                  }
              );  
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $scope.settings.time = null;
          clearInterval(myInterval);
          $scope.pos = null; 
        };

    });
        $scope.create = function(settings) {
          var myPosition = null;
          console.log(settings);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            if(result !== false ) {
              
              if($scope.hasOwnProperty("user") !== true) {
                $scope.user = [];
              }
              
              for (var uniqueBeaconKey in $scope.beacons) {
                if ($scope.beacons.hasOwnProperty(uniqueBeaconKey)) {
                  doc = {_id: 'due',
                          Time:       myTime,
                          Misurazioni:   myBeacons,
                          Posizione: null
                  };
                }
            }
              myPosition = null;
              $scope.pos = null;       
              localDB2.put(doc, function(err, response) {
                 if (err) {
                    if(err.status == 409){ // se l'errore è di update fai questo...
                      console.log(doc);
                      localDB2.upsert('due', myDeltaFunction).then(function () {
                        // success!
                      }).catch(function (err) {
                        // error (not a 404 or 409)
                      });
                    }
                    else{
                      return console.log(err);
                    }
                 } else {
                    console.log("Document created Successfully");
                 }
              }); 

              } else {
                console.log("Action not completed");
              }
            });

          remoteDB2.changes({ 
            live: true,
            include_docs: true
          }).on('change', function (change) {
            if (change.doc && change.doc._id === 'due') {
              console.log(change);
              //console.log(change.doc.Posizione);
              myPosition = change.doc.Posizione;
              console.log(myPosition);
            }
            $scope.pos = myPosition;
          });


          // funzione che mi modifica i valori per l'update
          function myDeltaFunction(doc) { 
            doc.counter = doc.counter || 0;
            doc.counter++;
            doc.Time = myTime;
            doc.Misurazioni = myBeacons;
            doc.Posizione = $scope.pos;
            return doc;
          }
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.user.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.user.length; i++) {
                if($scope.user[i]._id === id) {
                    $scope.user.splice(i, 1);
                }
            }
        });

})

.controller('ReadBeaconCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $scope.cardinal = ' ';
    $scope.lastId = ' ';

    $scope.settings = {
            X_value: null,
            Y_value: null,
            borders: ' ',
            time: null
          };

    var myInterval;
    var myTime;
    var myBeacons = {};
    var watchID;
    var magn = {};

        $ionicPlatform.ready(function() {
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor + ":" + $scope.settings.time;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            console.log($scope.beacons);
        });
 
        $scope.startScan = function() {
          myTime = $scope.settings.time; 

          watchID = cordova.plugins.magnetometer.watchReadings(
            function success(reading){
              //console.log(JSON.stringify(reading));
              magn[$scope.settings.time] =reading;
              //console.log(magn);  
              // Output: {x: 23.113, y:-37.245, z:6.172, magnitude: 44.266}
            }, 
            function error(message){
             console.log(message);
            }
          );

          myInterval = setInterval(function(){
            if ($scope.settings.time > 0) {
              $scope.settings.time-- ;
            }
            if($scope.settings.time == 0){
              $scope.settings.time = null;
              clearInterval(myInterval);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
              for(var key in $scope.beacons){
                console.log(key); // print
                var fields = key.split(":");
                var beaconKey = fields[2];
                var a = {};
                for(var key2 in $scope.beacons){
                  if((key2.split(":")[2]) ==(fields[2])){
                    a[key2.split(":")[0]] = ($scope.beacons[key2]);
                    a['Magnetometro'] = magn[key2.split(":")[2]];
                    console.log(a); // print
                  }
                  //ordino l'array in base a major
                  /*a.sort(function (a, b) {
                    return parseInt(a.major) - parseInt(b.major);
                  });*/
                  myBeacons[beaconKey] = a;
                }          
              }
            }
         }, 3000)

          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $scope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $scope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $scope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $scope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $scope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $scope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $scope.cardinal = 'WEST';
                      }
                      else {
                          $scope.cardinal = 'NORTH-WEST';
                      }
                  }
              );  
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $scope.settings.time = null;
          clearInterval(myInterval);
          cordova.plugins.magnetometer.stop([watchID]);
        };

    });
        $scope.create = function(settings) {
          console.log(localDB); // <-------
          console.log(settings);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            if(result !== "") {
              $scope.lastId = result;
              if($scope.hasOwnProperty("todos") !== true) {
                $scope.todos = [];
              }
              
              for (var uniqueBeaconKey in $scope.beacons) {
                if ($scope.beacons.hasOwnProperty(uniqueBeaconKey)) {
                  doc = {_id: result,
                          X_position: $scope.settings.X_value,
                          Y_position: $scope.settings.Y_value,
                          Borders:    $scope.settings.borders,
                          Cardinal:   $scope.cardinal,
                          Time:       myTime,
                          Misurazioni:   myBeacons
                  };
                }
            }
                     
              localDB.put(doc, function(err, response) {
                 if (err) {
                    return console.log(err);
                 } else {
                    console.log("Document created Successfully");
                 }
              });

              
            } else {
              console.log("Action not completed");
            }
          });
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})


.controller('LocalCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $scope.cardinal = ' ';
    $scope.lastId = ' ';
    $scope.pos = 'Salotto';

    $scope.settings = {
            X_value: null,
            Y_value: null,
            borders: ' ',
            time: null
          };

    var myInterval;
    var myTime;
    var myBeacons = {};
    var watchID;
    var magn = {};

    var newDoc = {};
    var sumRSSI = 0;

    ///FUNZIONI
function sum(array) {
    var num = 0;
    for (var i = 0, l = array.length; i < l; i++) num += array[i];
    return num;
  };
  
  function mean(array) {
    return sum(array) / array.length;
  };
  
  function median(array) {
    array.sort(function(a, b) {
      return a - b;
    });
    var mid = array.length / 2;
    return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
  };


function percentile(arr, p) {
  arr.sort(function(a, b) {
      return a - b;
    });
    if (arr.length === 0) return 0;
    if (typeof p !== 'number') throw new TypeError('p must be a number');
    if (p <= 0) return arr[0];
    if (p >= 1) return arr[arr.length - 1];

    var index = (arr.length -1) * p,
        lower = Math.floor(index),
        upper = lower + 1,
        weight = index % 1;

    if (upper >= arr.length) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
}
  
  function modes(array) {
    if (!array.length) return [];
    var modeMap = {},
      maxCount = 0,
      modes = [];

    array.forEach(function(val) {
      if (!modeMap[val]) modeMap[val] = 1;
      else modeMap[val]++;

      if (modeMap[val] > maxCount) {
        modes = [val];
        maxCount = modeMap[val];
      }
      else if (modeMap[val] === maxCount) {
        modes.push(val);
        maxCount = modeMap[val];
      }
    });
    return modes;
  };
  
  function variance(array) {
    var mean = arr.mean(array);
    return arr.mean(array.map(function(num) {
      return Math.pow(num - mean, 2);
    }));
  };

  ////FINE FUNZIONI

        $ionicPlatform.ready(function() {
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor + ":" + $scope.settings.time;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();

            var idFingerprint = [];

            localDB.allDocs(function (err, response) {
              var righe = response['rows'];
              for (var i = 0; i < response['total_rows']; i++) {
                //console.log(idFingerprint);
                var num = righe[i];
                var var_id = num['id'];
                idFingerprint.push(var_id);
              }
              //console.log(idFingerprint);
              for(var i = 0; i < idFingerprint.length; i++){
                //console.log(idFingerprint[i]);
                
                localDB.get(idFingerprint[i]).then(function (doc) {                  
                  var misur = doc['Misurazioni'];
                  var sumBeaconA = 0;
                  var sumBeaconR = 0;
                  var sumQuadrati = 0;
                  var arr = [];
                  for(var j = 1; j <= Object.keys(misur).length; j++){
                    //console.log(Object.keys(misur).length);
                    var numMisurazione = misur[j.toString()];
                    var majorBeacon = numMisurazione['33432'];
                    var beaconrssi = majorBeacon['rssi'];
                    var beaconaccuracy = majorBeacon['accuracy'];
                    sumBeaconR += beaconrssi;
                    sumBeaconA += beaconaccuracy;
                    sumQuadrati += beaconrssi * beaconrssi;
                    arr.push(beaconrssi);
                    //console.log(beaconrssi);
                  }
                  //sumBeaconR /= 5;
                  //sumBeaconA /= 5;
                  //sumQuadrati = sumQuadrati / 5;
                  //var varianza = sumQuadrati - sumBeaconR * sumBeaconR;
                  newDoc[doc['_id']] = {'array': arr,
                                        'max': Math.min(...arr),
                                        'min': Math.max(...arr),
                                        'media': mean(arr),
                                        //'mediaAcc': sumBeaconA,
                                        //'varianza': varianza,
                                        'primoQ': percentile(arr, 0.75),
                                        'mediana': median(arr),
                                        'terzoQ': percentile(arr, 0.25),
                                        'moda': modes(arr)};                  

                }).catch(function (err) {
                  console.log(err);
                });
              }
              //console.log(newDoc);

              var minimo = 1000;
              /*
              for(var key in $scope.beacons){
                newBeacon = $scope.beacons[key];
                rssiupdate = newBeacon['accuracy'];
                minimo = 1000;
                for(var stanza in newDoc){
                  var temp = newDoc[stanza];
                  //console.log(temp['media']);
                  if(Math.abs(temp['mediaAcc'] - sumRSSI) < minimo){
                    minimo = Math.abs(temp['mediaAcc'] - sumRSSI);
                    $scope.pos = stanza;
                  }
                }
                //console.log(rssiupdate);
              }*/
            });
            //console.log($scope.beacons);
        });
 
        $scope.startScan = function() {
          /*localDB.info().then(function (info) {
            console.log(info);
          });*/

          myTime = $scope.settings.time; 

          watchID = cordova.plugins.magnetometer.watchReadings(
            function success(reading){
              //console.log(JSON.stringify(reading));
              magn[$scope.settings.time] =reading;
              //console.log(magn);  
              // Output: {x: 23.113, y:-37.245, z:6.172, magnitude: 44.266}
            }, 
            function error(message){
             console.log(message);
            }
          );

          myInterval = setInterval(function(){
            if ($scope.settings.time > 0) {
              $scope.settings.time-- ;
            }
            if($scope.settings.time == 0){
              $scope.settings.time = null;
              clearInterval(myInterval);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
              sumRSSI = 0; // usato per la media locale
              arrayLoc = []
              for(var key in $scope.beacons){
                console.log(key); // print
                var keyvalue = $scope.beacons[key];
                var rssivalue = keyvalue['rssi'];
                arrayLoc.push(rssivalue)
                sumRSSI += rssivalue;
                //console.log(rssivalue);              
              }
              /*arrayLoc.sort(function(a, b) {
                return a - b;
              });
              console.log(arrayLoc);*/
              var stanzaMedia, stanzaMin, stanzaMax, stanzaPrimoQ, stanzaTerzoQ, stanzaMediana;

              if(arrayLoc.length > 4){
                var docLoc = {};
                for (stanza in newDoc){
                  docLoc[stanza] = 0;
                }
                var medianaLoc = median(arrayLoc);
                var primquartLoc = percentile(arrayLoc, 0.75);
                var terzoquartLoc = percentile(arrayLoc, 0.25);
                var minLoc = Math.max(...arrayLoc);
                var maxLoc = Math.min(...arrayLoc);
                console.log(arrayLoc);
                console.log(medianaLoc, primquartLoc, terzoquartLoc, minLoc, maxLoc)

                sumRSSI /= Object.keys($scope.beacons).length;
                console.log(sumRSSI);
                console.log(newDoc);

                //trovo quello con media più vicina
                /*var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['media'] - sumRSSI) < minimo){
                      minimo = Math.abs(temp['media'] - sumRSSI);
                      stanzaMedia = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaMedia){
                    docLoc[stanza]++;
                  }
                }*/

                //trovo quello con minimo più vicina
                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['min'] - minLoc) < minimo){
                      minimo = Math.abs(temp['min'] - minLoc);
                      stanzaMin = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaMin){
                    docLoc[stanza]++;
                  }
                }

                //trovo quello con massimo più vicina
                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['max'] - maxLoc) < minimo){
                      minimo = Math.abs(temp['max'] - maxLoc);
                      stanzaMax = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaMax){
                    docLoc[stanza]++;
                  }
                }

                //trovo quello con primo quartile più vicina
                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['primoQ'] - primquartLoc) < minimo){
                      minimo = Math.abs(temp['primoQ'] - primquartLoc);
                      stanzaPrimoQ = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaPrimoQ){
                    docLoc[stanza]++;
                  }
                }

                //trovo quello con terzo quartile più vicina
                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['terzoQ'] - terzoquartLoc) < minimo){
                      minimo = Math.abs(temp['terzoQ'] - terzoquartLoc);
                      stanzaTerzoQ = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaTerzoQ){
                    docLoc[stanza]++;
                  }
                }

                //trovo quello con mediana più vicina
                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['mediana'] - medianaLoc) < minimo){
                      minimo = Math.abs(temp['mediana'] - medianaLoc);
                      stanzaMediana = stanza;
                    }
                  }
                for(stanza in docLoc){
                  if (stanza === stanzaMediana){
                    docLoc[stanza]++;
                  }
                }

                var votoMassimo = 0;
                for(stanza in docLoc){
                  if(docLoc[stanza] > votoMassimo){
                    votoMassimo = docLoc[stanza];
                    $scope.pos = stanza;
                  }
                }

                console.log(docLoc);
                console.log(votoMassimo);

              }

              else{
                sumRSSI /= Object.keys($scope.beacons).length;
                console.log(sumRSSI);
                console.log(newDoc);

                var minimo = 1000;
                for(var stanza in newDoc){
                    var temp = newDoc[stanza];
                    //console.log(temp);
                    if(Math.abs(temp['media'] - sumRSSI) < minimo){
                      minimo = Math.abs(temp['media'] - sumRSSI);
                      $scope.pos = stanza;
                    }
                  }
              }


            }
         }, 2000)

          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $scope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $scope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $scope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $scope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $scope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $scope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $scope.cardinal = 'WEST';
                      }
                      else {
                          $scope.cardinal = 'NORTH-WEST';
                      }
                  }
              );  
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
        };

        $scope.stopScan = function() {  
          //$cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $scope.settings.time = null;
          clearInterval(myInterval);
          cordova.plugins.magnetometer.stop([watchID]);
        };

    });
        $scope.create = function(settings) {
          console.log(localDB); // <-------
          console.log(settings);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            if(result !== "") {
              $scope.lastId = result;
              if($scope.hasOwnProperty("todos") !== true) {
                $scope.todos = [];
              }
              
              for (var uniqueBeaconKey in $scope.beacons) {
                if ($scope.beacons.hasOwnProperty(uniqueBeaconKey)) {
                  doc = {_id: result,
                          X_position: $scope.settings.X_value,
                          Y_position: $scope.settings.Y_value,
                          Borders:    $scope.settings.borders,
                          Cardinal:   $scope.cardinal,
                          Time:       myTime,
                          Misurazioni:   myBeacons
                  };
                }
            }
                     
              localDB.put(doc, function(err, response) {
                 if (err) {
                    return console.log(err);
                 } else {
                    console.log("Document created Successfully");
                 }
              });

              
            } else {
              console.log("Action not completed");
            }
          });
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})

.controller('FaroCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPlatform, $cordovaBeacon, $ionicPopup, PouchDBListener, $cordovaDeviceOrientation) {
    $scope.beacons = {};
    $scope.todos = [];

    $scope.dir = 0;
    $scope.cardinal = ' ';
    $scope.lastId = ' ';

    $scope.settings = {
            X_value: null,
            Y_value: null,
            borders: ' ',
            time: null
          };

    var myInterval;
    var myTime;
    var myBeacons = {};
    var watchID;
    var magn = {};

    //GRAFO
    /*var graph = {
      vertex: [{
      
            }]
      edge: [{}]
    }*/
    



    //FINE GRAFO


    var graph = new Graph();
    graph.addVertex(1);
    graph.addVertex(2);
    graph.addVertex(3);
    graph.addVertex(4);
    graph.addVertex(5);
    graph.addVertex(6);
    graph.print(); // 1 -> | 2 -> | 3 -> | 4 -> | 5 -> | 6 ->
    graph.addEdge(1, 2);
    graph.addEdge(1, 5);
    graph.addEdge(2, 3);
    graph.addEdge(2, 5);
    graph.addEdge(3, 4);
    graph.addEdge(4, 5);
    graph.addEdge(4, 6);
    graph.print();
    console.log('path from 6 to 1:', graph.pathFromTo(6, 1));

        $ionicPlatform.ready(function() {
        $cordovaBeacon.requestWhenInUseAuthorization();
        $rootScope.$on("$cordovaBeacon:didRangeBeaconsInRegion", function(event, pluginResult) {
            var uniqueBeaconKey;
            for(var i = 0; i < pluginResult.beacons.length; i++) {
                uniqueBeaconKey = /*pluginResult.beacons[i].uuid + ":"*/ + pluginResult.beacons[i].major + ":" + pluginResult.beacons[i].minor + ":" + $scope.settings.time;
                $scope.beacons[uniqueBeaconKey] = pluginResult.beacons[i];
            }
            $scope.$apply();
            console.log($scope.beacons);
        });
 
        $scope.startScan = function() {
          myTime = $scope.settings.time; 

          watchID = cordova.plugins.magnetometer.watchReadings(
            function success(reading){
              //console.log(JSON.stringify(reading));
              magn[$scope.settings.time] =reading;
              //console.log(magn);  
              // Output: {x: 23.113, y:-37.245, z:6.172, magnitude: 44.266}
            }, 
            function error(message){
             console.log(message);
            }
          );

          myInterval = setInterval(function(){
            if ($scope.settings.time > 0) {
              $scope.settings.time-- ;
            }
            if($scope.settings.time == 0){
              $scope.settings.time = null;
              clearInterval(myInterval);
              $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
              for(var key in $scope.beacons){
                console.log(key); // print
                var fields = key.split(":");
                var beaconKey = fields[2];
                var a = {};
                for(var key2 in $scope.beacons){
                  if((key2.split(":")[2]) ==(fields[2])){
                    a[key2.split(":")[0]] = ($scope.beacons[key2]);
                    a['Magnetometro'] = magn[key2.split(":")[2]];
                    console.log(a); // print
                  }
                  //ordino l'array in base a major
                  /*a.sort(function (a, b) {
                    return parseInt(a.major) - parseInt(b.major);
                  });*/
                  myBeacons[beaconKey] = a;
                }          
              }
            }
         }, 3000)

          var options = {
            frequency: 500
          };

          $scope.watchPromise = $cordovaDeviceOrientation.watchHeading(options);

          $scope.watchPromise.then(
                  null, 
                  function(error) {
                      console.log(error);
                  }, 
                  function(result) {
                      $scope.dir = result.trueHeading;
                      if($scope.dir > 337.5 && $scope.dir <= 359.99 || $scope.dir >= 0 && $scope.dir < 22.5){
                          $scope.cardinal = 'NORTH';
                      }
                      else if($scope.dir > 22.5 && $scope.dir < 67.5){
                          $scope.cardinal = 'NORTH-EST';
                      }
                      else if($scope.dir > 67.5 && $scope.dir < 112.5){
                          $scope.cardinal = 'EST';
                      }
                      else if($scope.dir > 112.5 && $scope.dir < 157.5){
                          $scope.cardinal = 'SOUTH-EST';
                      }
                      else if($scope.dir > 157.5 && $scope.dir < 202.5){
                          $scope.cardinal = 'SOUTH';
                      }
                      else if($scope.dir > 202.5 && $scope.dir < 247.5){
                          $scope.cardinal = 'SOUTH-WEST';
                      }
                      else if($scope.dir > 247.5 && $scope.dir < 292.5){
                          $scope.cardinal = 'WEST';
                      }
                      else {
                          $scope.cardinal = 'NORTH-WEST';
                      }
                  }
              );  
          $cordovaBeacon.startRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
        };

        $scope.stopScan = function() {  
          $cordovaDeviceOrientation.clearWatch($scope.watchPromise.watchID);
          $cordovaBeacon.stopRangingBeaconsInRegion($cordovaBeacon.createBeaconRegion("estimote", "B9407F30-F5F8-466E-AFF9-25556B57FE6D"));
          $scope.beacons = {};
          $scope.settings.time = null;
          clearInterval(myInterval);
          cordova.plugins.magnetometer.stop([watchID]);
        };

    });
        $scope.create = function(settings) {
          console.log(localDB); // <-------
          console.log(settings);
          $ionicPopup.prompt({
            position: 'Enter a new POSITION item',
            inputType: 'text'
          })
          .then(function(result) {
            if(result !== "") {
              $scope.lastId = result;
              if($scope.hasOwnProperty("todos") !== true) {
                $scope.todos = [];
              }
              
              for (var uniqueBeaconKey in $scope.beacons) {
                if ($scope.beacons.hasOwnProperty(uniqueBeaconKey)) {
                  doc = {_id: result,
                          X_position: $scope.settings.X_value,
                          Y_position: $scope.settings.Y_value,
                          Borders:    $scope.settings.borders,
                          Cardinal:   $scope.cardinal,
                          Time:       myTime,
                          Misurazioni:   myBeacons
                  };
                }
            }
                     
              localDB.put(doc, function(err, response) {
                 if (err) {
                    return console.log(err);
                 } else {
                    console.log("Document created Successfully");
                 }
              });

              
            } else {
              console.log("Action not completed");
            }
          });
        }
     
        $scope.$on('add', function(event, todo) {
            $scope.todos.push(todo);
        });
     
        $scope.$on('delete', function(event, id) {
            for(var i = 0; i < $scope.todos.length; i++) {
                if($scope.todos[i]._id === id) {
                    $scope.todos.splice(i, 1);
                }
            }
        });
})



.controller('WelcomeCtrl', function($scope, $state, $q, UserService, $ionicLoading) {
  // This is the success callback from the login method
  var fbLoginSuccess = function(response) {
    if (!response.authResponse){
      fbLoginError("Cannot find the authResponse");
      return;
    }

    var authResponse = response.authResponse;

    getFacebookProfileInfo(authResponse)
    .then(function(profileInfo) {
      // For the purpose of this example I will store user data on local storage
      UserService.setUser({
        authResponse: authResponse,
        userID: profileInfo.id,
        name: profileInfo.name,
        email: profileInfo.email,
        picture : "http://graph.facebook.com/" + authResponse.userID + "/picture?type=large"
      });
      $ionicLoading.hide();
      $state.go('app.home');
    }, function(fail){
      // Fail get profile info
      console.log('profile info fail', fail);
    });
  };

  // This is the fail callback from the login method
  var fbLoginError = function(error){
    console.log('fbLoginError', error);
    $ionicLoading.hide();
  };

  // This method is to get the user profile info from the facebook api
  var getFacebookProfileInfo = function (authResponse) {
    var info = $q.defer();

    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
      function (response) {
        console.log(response);
        info.resolve(response);
      },
      function (response) {
        console.log(response);
        info.reject(response);
      }
    );
    return info.promise;
  };

  //This method is executed when the user press the "Login with facebook" button
  $scope.facebookSignIn = function() {
    facebookConnectPlugin.getLoginStatus(function(success){
      if(success.status === 'connected'){
        // The user is logged in and has authenticated your app, and response.authResponse supplies
        // the user's ID, a valid access token, a signed request, and the time the access token
        // and signed request each expire
        console.log('getLoginStatus', success.status);

        // Check if we have our user saved
        var user = UserService.getUser('facebook');

        if(!user.userID){
          getFacebookProfileInfo(success.authResponse)
          .then(function(profileInfo) {
            // For the purpose of this example I will store user data on local storage
            UserService.setUser({
              authResponse: success.authResponse,
              userID: profileInfo.id,
              name: profileInfo.name,
              email: profileInfo.email,
              picture : "http://graph.facebook.com/" + success.authResponse.userID + "/picture?type=large"
            });

            $state.go('app.home');
          }, function(fail){
            // Fail get profile info
            console.log('profile info fail', fail);
          });
        }else{
          $state.go('app.home');
        }
      } else {
        // If (success.status === 'not_authorized') the user is logged in to Facebook,
        // but has not authenticated your app
        // Else the person is not logged into Facebook,
        // so we're not sure if they are logged into this app or not.

        console.log('getLoginStatus', success.status);

        $ionicLoading.show({
          template: 'Logging in...'
        });

        // Ask the permissions you need. You can learn more about
        // FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
      }
    });
  };
})
.controller('HomeCtrl', function($scope, UserService, $ionicActionSheet, $state, $ionicLoading){
  $scope.user = UserService.getUser();

  $scope.showLogOutMenu = function() {
    var hideSheet = $ionicActionSheet.show({
      destructiveText: 'Logout',
      titleText: 'Are you sure you want to logout? This app is awsome so I recommend you to stay.',
      cancelText: 'Cancel',
      cancel: function() {},
      buttonClicked: function(index) {
        return true;
      },
      destructiveButtonClicked: function(){
        $ionicLoading.show({
          template: 'Logging out...'
        });

        // Facebook logout
        facebookConnectPlugin.logout(function(){
          $ionicLoading.hide();
          $state.go('welcome');
        },
        function(fail){
          $ionicLoading.hide();
        });
      }
    });
  };
});
