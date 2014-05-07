"use strict";


/***
 *  Define the app and inject any modules we wish to 
 *  refer to.
***/
var app = angular.module("PIMageApp", [
    "ngAnimate",
]);


/***
 *  Define the main controller for this application.
***/
function AppController($scope) {

    $scope.album_selection = null;
    /***
     *  Define a bunch of temporary albums, this will be resolved later
     *  by a HTTP fetch of all albums
     *  TODO: HTTP: GET /api/albums
    ***/
    $scope.albums = [
        { name: "2013 - December" },
        { name: "2014 - January" },
        { name: "2014 - February" },
        { name: "2014 - March" },
        { name: "2014 - April" },
        { name: "2014 - May" },
    ];


}
