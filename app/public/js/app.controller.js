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
function AppController(AlbumManager, ImageManager, $scope) {

    $scope.selected_album = null;
    $scope.albums = [];
    $scope.images = [];
    
    // Deferred load the list of albums and set the scope
    // appropriately.
    AlbumManager.list_albums().then(function(response) {
        $scope.albums = response.data;
    });

    $scope.take_picture = function() {
        AlbumManager.take_picture($scope.selected_album.name).then(function(response) {
            // The response is expected to send back a list of images in the album
            // so we can reload this page. Perhaps this needs to be de-coupled.
            console.log(response);
            console.log("TAKE PIC HTTP ");
            $scope.images = response.data;
        });
    }

    // Watch when the album changes, and load the images from it...
    $scope.$watch("selected_album", function(new_value, old_value) {
        if(new_value === old_value) {
            return;
        }

        if(new_value) {
            ImageManager.list_images(new_value.name).then(function(response) {
                $scope.images = response.data;
            });
        } else {
            // Null new_value - clear the images??
            $scope.images = [];
        }
    });
}

app.service("AlbumManager", function($http) {
    return {
        list_albums: function() {
            return $http.get("/api/albums/list");
        },
        take_picture: function(album_name) {
            return $http.get("/api/albums/" + album_name + "/take_picture");
        },
    };
});

app.service("ImageManager", function($http) {
    return {
        list_images: function(album_name) {
            return $http.get("/api/image/" + album_name + "/list");
        }
    }
})



