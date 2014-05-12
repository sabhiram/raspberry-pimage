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

app.directive("pimImagePreview", function() {
    return {
        restrict: "E",

        scope: {
            albumName: "@",     // Setup 2-way binding between the "value"
                                // attribute and the data elm associated w/ it

            imageName: "@",     // Setup text binding for the class we wish to 
                                // assign this div
        },

        replace: true,          // Use provided template (as opposed to static
                                // content that the modal scope might define in the
                                // DOM)

        transclude: false,      // Custom content provided in the template is
                                // available in the directive.

        template: [
            "<div class='pim-image-container' ng-mouseenter='hovered = true' ng-mouseleave='hovered = false'>",
            "    <img ng-src='/gallery/{{albumName}}/{{imageName}}' class='pim-image-img pim-center-image'></img>",
            "    <div class='pim-image-toolbox' ng-class='{\"hide_toolbox\": !hovered}' align='right'>",
            "        <i class='fa fa-search'></i>",
            "        <i class='fa fa-edit'></i>",
            "        <i class='fa fa-trash-o'></i>",
            "    </div>",
            "</div>"
        ].join("\n"),

        // Link function to bind modal to the app
        link: function(scope, element, attributes) {
            scope.toolbox_visible = false;

            console.log("pimImagePreview link called");
        },
    };
});

/*
<pim-image-preview album-name="selected_album.name" image-name="image.name" width="100%" height="100%"></pim-image-preview>

*/

app.directive('pimHover', function () {
    return {
        restrict: 'A',
        scope: {
            pimHover: '@'
        },
        link: function(scope, element) {
            element.on('mouseenter', function() {
                element.addClass(scope.pimHover);
            }).on('mouseleave', function() {
                element.removeClass(scope.pimHover);
            });
        }
    };
});

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



