"use strict";

/***
 *  Define the app and inject any modules we wish to 
 *  refer to.
***/
var app = angular.module("PIMageApp", [
    "ngAnimate",
    "ngRoute"
]);

app.config(["$routeProvider", function($routeProvider) {
    $routeProvider.
        when("/", {
            templateUrl:    "templates/preview.html",
            controller:     "PreviewController"
        }).
        when("/album/:album_name", {
            templateUrl:    "templates/album.html",
            controller:     "AlbumController"
        }).
        otherwise({
            redirectTo:     "/"
        });
}]);

/******************************************************************************\
Service:
    AlbumManager

Dependencies:
    $http

Description:
    This is a simple service which abstracts the HTTP ReST API which the
    server exposes. This is useful since the service returns a bunch of
    promise objects which can be chained easily with .then().success() etc
\******************************************************************************/
app.service("AlbumManager", function($http) {
    return {
        list_albums: function() {
            return $http.get("/api/list_albums");
        },
        take_picture: function(album_name) {
            return $http.get("/api/take_picture/album/" + album_name);
        },
        delete_image_from_album: function(album_name, image_name) {
            return $http.delete("/api/album/" + album_name + "/image/" + image_name);
        },
        list_images_in_album: function(album_name) {
            return $http.get("/api/list_images/album/" + album_name);
        }
    };
});

/******************************************************************************\
Function:
    AppController

Dependencies:
    AlbumManager, $scope

Description:
    Main application controller
\******************************************************************************/
function AppController(AlbumManager, $scope, $location) {
    $scope.selected_album_name = null;

    // Deferred load the list of albums and set the scope
    // appropriately.
    $scope.albums = [];
    AlbumManager.list_albums().then(function(response) {
        $scope.albums = response.data;
    });
}

function AlbumController($scope, $routeParams, AlbumManager) {
    $scope.album_name = $routeParams.album_name;

    // Defer load the images for this Controller
    $scope.images = [];
    AlbumManager.list_images_in_album($scope.album_name).then(function(response) {
        $scope.images = response.data;
    });
    
    // Delete image client side hook
    $scope.delete_image = function(index, image_name) {
        AlbumManager.delete_image_from_album($scope.album_name, image_name).then(function(response) {
            if(response.data.status == "SUCCESS") {
                $scope.images.splice(index, 1);
            } else {
                console.log("Error - unable to delete image");
            }
        });
    }

    // Picture taking clientside hook
    $scope.take_picture = function() {
        AlbumManager.take_picture($scope.album_name).then(function(response) {
            // The response is expected to send back a list of images in the album
            // so we can reload this page. Perhaps this needs to be de-coupled.
            // TODO: This should return just the image dict we want to append to {images}
            if(response.data.status=="SUCCESS") {
                $scope.images.push({
                    id:   $scope.images.length,
                    name: response.data.image_name
                });
            } else {
                console.log("Error taking picture...");
            }
        });
    }
}


function PreviewController($scope) {
    console.log("PreviewController loaded");
}


/******************************************************************************\
Directive:
    pimImageThumb <pim-image-thumb>

Dependencies:
    None

Inputs:
    albumName <album-name> Name of the album
    imageName <image-name> Name of the image
    onDelete  <on-delete>  Function in root scope to bind to onDelete

Description:
    Directive to display an image hosted in a pim gallery. This is just a 
    preview directive. Implements functions like delete, edit image name,
    preview etc..
\******************************************************************************/
app.directive("pimImageThumb", function() {
    return {
        restrict: "E",

        scope: {
            albumName:  "@",    // Text binding for album name

            imageName:  "@",    // Text binding for image name

            onDelete:   "&",    // Hook up onDelete function to passed
                                // in method in root $scope
        },

        replace: true,          // Use provided template (as opposed to static
                                // content that the modal scope might define in the
                                // DOM)

        transclude: false,      // Custom content provided in the template is
                                // available in the directive.

        template: [
            "<div class='pim-image-thumb' ng-mouseenter='hovered = true' ng-mouseleave='hovered = false'>",
            "    <div class='pim-image-header' ng-class='{\"selected\": hovered}'>{{imageName}}</div>",
            "    <img ng-src='gallery/{{albumName}}/{{imageName}}' class='pim-image-img pim-center-image'></img>",
            "    <div class='pim-image-toolbox' ng-class='{\"hide_toolbox\": !hovered}' align='right'>",
            "        <i class='fa fa-search'></i>",
            "        <i class='fa fa-edit'></i>",
            "        <i class='fa fa-trash-o' ng-click='onDelete()'></i>",
            "    </div>",
            "</div>"
        ].join("\n"),

        // Link function to bind modal to the app
        link: function(scope, element, attributes) {
            // Set the toolbox visiblity to false
            scope.toolbox_visible = false;
        },
    };
});

app.directive("pimDropdown", function($location) {
    return {
        restrict: "E",

        scope: {
            selection:   "=", // 2-way binding to the selected item
            albums:      "=", // 2-way
            prompt:      "@", // text binding
        },

        replace: true,

        template: [
            "<div class='pim-dropdown-container' ng-class='{\"pim-expanded\": expanded}' ng-mouseleave='expanded=false'>",
            "    <div class='pim-dropdown-header' ng-click='expanded = !expanded'>",
            "        {{_prompt}}&nbsp;<i class='fa fa-chevron-down' style='position: absolute; right: 25px; top: 22px;'></i>",
            "    </div>",
            "    <div class='pim-dropdown-item' ng-repeat='album in albums' ng-click='change_album_to(album.name)'>",
            "        {{ album.name }}",
            "    </div>",
            "    <div class='pim-dropdown-add-album' ng-click='add_album()'>",
            "        <i class='fa fa-plus'></i>&nbsp;Add Album",
            "    </div>",
            "</div>",
        ].join("\n"),

        link: function(scope, element, attributes) {
            scope.expanded = false;
            scope._prompt = scope.prompt;

            scope.change_album_to = function(album_name) {
                scope.expanded = false;
                scope.selection = album_name;
                scope._prompt = album_name;
                $location.url("/album/" + album_name);
            }

            scope.add_album = function() {
                scope.expanded = false;
                // TODO: Add a new album modal etc
            }
        },
    };
});



