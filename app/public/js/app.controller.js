"use strict";

/***
 *  Define the app and inject any modules we wish to 
 *  refer to.
***/
var app = angular.module("PIMageApp", [
    "ngAnimate",
    "ngRoute"
]);

/******************************************************************************\
Application Route Management

Dependencies:
    $routeProvider

Description:
    This sets up the various templates which will be loaded into the
    ng-view in this app based on which route we are navigating to. We
    also can attach child controllers, and resolve things here.
\******************************************************************************/
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
        delete_image_from_album: function(album_name, image_name) {
            return $http.delete("/api/album/" + album_name + "/image/" + image_name);
        },
        list_images_in_album: function(album_name) {
            return $http.get("/api/list_images/album/" + album_name);
        }
    };
});

/******************************************************************************\
Service:
    CameraManager

Dependencies:
    $http

Description:
    This is a simple service which abstracts the HTTP ReST API which the
    server exposes for the RPI Camera
\******************************************************************************/
app.service("CameraManager", function($http) {
    return {
        take_picture: function(album_name) {
            return $http.get("/api/take_picture/album/" + album_name);
        },
        save_settings: function(settings) {
            return $http.post("/api/settings", settings);
        },
        get_settings: function() {
            return $http.get("/api/settings");
        },
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
function AppController(AlbumManager, CameraManager, $scope, $location, $timeout) {
    // Initialize scope
    $scope.albums = [];
    $scope.show_settings = false;

    // Defer load the settings when the pimSaveJsonBtn directive is
    // loaded. This settings model is passed in as reference to said
    // directive along with the API endpoint to get / set the settings.
    $scope.settings = null;
            
    // Deferred load the list of albums and set the scope
    // appropriately.
    AlbumManager.list_albums().then(function(response) {
        if(response.data.status == "SUCCESS") {
            $scope.albums = response.data.albums;    
        } else {
            console.log("Error - " + response.data);
        }
    });
}   

function AlbumController($scope, $routeParams, AlbumManager) {
    $scope.album_name = $routeParams.album_name;

    // Defer load the images for this Controller
    $scope.images = [];
    AlbumManager.list_images_in_album($scope.album_name).then(function(response) {
        if(response.data.status == "SUCCESS") {
            $scope.images = response.data.images;    
        } else {
            console.log("Error - " + response.data);
        }
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
        CameraManager.take_picture($scope.album_name).then(function(response) {
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

/******************************************************************************\
Directive:
    pimDropdown <pim-dropdown>

Dependencies:
    $location

Inputs:
    albums - the list of albums {id, name} which we wish to choose from
    prompt - what to display for the drop down

Description:
    Directive to display a simple drop down menu which allows us to pick
    from various albums.
\******************************************************************************/
app.directive("pimDropdown", function($location) {
    return {
        restrict: "E",

        scope: {
            albums:      "=", // 2-way
            prompt:      "@", // text binding
        },

        replace: true,

        template: [
            "<div class='pim-dropdown-container' ng-class='{\"pim-expanded\": expanded}' ng-mouseleave='expanded=false'>",
            "    <div class='pim-dropdown-header' ng-click='expanded = !expanded'>",
            "        {{prompt}}&nbsp;<i class='fa fa-chevron-down' style='position: absolute; right: 25px; top: 22px;'></i>",
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

            scope.change_album_to = function(album_name) {
                scope.expanded = false;
                scope.selection = album_name;
                $location.url("/album/" + album_name);
            }

            scope.add_album = function() {
                scope.expanded = false;
                // TODO: Add a new album modal etc
            }
        },
    };
});

/******************************************************************************\
Directive:
    pimCheckbox <pim-checkbox>

Dependencies:
    None

Inputs:
    value   - the boolean $scope variable we want to bind to this 
              checkbox. Note that this is expected to be 2-way bound.
    prompt  - the prompt to display in the checkbox

Description:
    Directive to render a simple checkbox
\******************************************************************************/
app.directive("pimCheckbox", function() {
    return {
        restrict: "E",

        scope: {
            value:      "=",
            prompt:     "@",
            promptAlt:  "@"
        },

        replace: true,
        transclude: true,

        template: [
            "<div class='pim-checkbox-container'>",
            "    <div class='pim-checkbox-indicator' ng-class='{\"selected\": value}' ng-click='value = !value'>",
            "    </div>",
            "    <div class='pim-checkbox-text' ng-transclude></div>",
            "    <div class='pim-checkbox-prompt-container'>",
            "        <div class='pim-checkbox-prompt' ng-click='value = !value' ng-class='{\"unselected\": value}'>{{prompt}}</div>",
            "        <div class='pim-checkbox-prompt-alt' ng-click='value = !value' ng-class='{\"unselected\": !value}'>{{promptAlt}}</div>",
            "    </div>",
            "</div>",
        ].join("\n"),

        link: function(scope, element, attributes) {
            //scope.value = scope.value || false;
        },
    };
});

/******************************************************************************\
Directive:
    pimSettingsSpacer <pim-settings-spacer>

Dependencies:
    None

Inputs:
    verticalSpace - the amount of CSS space (height) needed to be given to 
                    this div

Description:
    Directive to render a div which fills the prescribed amount of space
\******************************************************************************/
app.directive("pimSettingsSpacer", function() {
    return {
        restrict: "E",
        scope: {
            verticalSpace: "@"
        },
        replace: true,
        template: "<div style='width: 100%; height: {{_height}}; '></div>",
        link: function(scope, element, attributes) {
            scope._height = scope.verticalSpace || "10px";
        }
    };
});

/******************************************************************************\
Directive:
    pimHelpFrame <pim-help-frame>

Dependencies:
    None

Inputs:
    show - scope var which toggles if this is visible or not

Description:
    Directive to show help for various settings, can be collapsed away
\******************************************************************************/
app.directive("pimHelpFrame", function() {
    return {
        restrict: "E",
        scope: {
            show: "=",
        },
        replace: true,
        transclude: true,
        template: [
            "<div class='pim-help-div' ng-class='{\"hidden\": !show}'>",
            "   <div ng-transclude></div>",
            "</div>",
        ].join("\n"),
        link: function(scope, element, attributes) {
            // No link needed
        }
    };
});

/******************************************************************************\
Directive:
    pimSlider <pim-slider>

Dependencies:
    None

Inputs:
    =value   - value to bind this slider to
    @min     - min value
    @max     - max value
    @default - default, if source is undefined

Description:
    Slider directive for PIMage
\******************************************************************************/
app.directive("pimSlider", function() {
    return {
        restrict: "E",
        scope: {
            value: "=",
            min: "@",
            max: "@",
            default: "@"
        },
        replace: true,
        transclude: true,
        template: [
            "<div class='pim-slider-container' ng-mouseenter='focused = true' ng-mouseleave='focused = false'>",
            "    <div class='pim-slider-name-container'>",
            "        <div class='pim-slider-name' ng-transclude ng-class='{\"underfocus\": focused}'></div>",
            "        <div class='pim-slider-value' align='center' ng-class='{\"underfocus\": !focused}'>",
            "            {{value}}",
            "            <div class='pim-slider-value-reset' ng-click='value = default'>default</div>",
            "        </div>",
            "    </div>",
            "    <div class='pim-slider-min'>{{min}}</div>",
            "    <div class='pim-slider-max'>{{max}}</div>",
            "    <div class='pim-slider-input-container'>",
            "        <input class='pim-slider-input' ng-model='value' type='range' min='{{min}}' max='{{max}}'></input>",
            "    </div>",
            "</div>",
        ].join("\n"),
        link: function(scope, element, attributes) {
            scope.min = parseInt(scope.min, 10) || 0;
            scope.max = parseInt(scope.min, 10) || 100;
            scope.default = parseInt(scope.default, 10) || 50;
        }
    };
});

/******************************************************************************\
Directive:
    pimSaveJsonBtn <pim-save-json-btn>

Dependencies:
    $timeout, $http

Inputs:
    =model      - the model which is bound to this submit btn
    @api        - the api endpoint to do the HTTP POST to
    =shrunk     - boolean which controls if this is shrunk / expanded (optional)
    =autosave   - enables / disables automatically pushing to HTTP POST
    =loadOnInit - if set, the directive will fetch and set the model to the data
                  returned from the API endpoint (with a GET). This option allows
                  for not having the app explicitly go fetch the settings etc..

Description:
    Submit button which can be linked to a model. The API endpoint
    specified will be triggered with "model" being the data    
\******************************************************************************/
app.directive("pimSaveJsonBtn", function($timeout, $http) {
    return {
        restrict: "E",
        scope: {
            model:      "=",
            api:        "@",
            shrunk:     "=",
            autosave:   "=",
            loadOnInit: "=",
        },
        replace: true,
        template: [
            "<div class='pim-save-json-btn' ng-click='save_model()' ng-class='{\"hidden\": !model_dirty, \"shrunk\": shrunk}'>",
            "    <div ng-if='!shrunk' style='float: left; margin-right: 5px;'>Save </div>",
            "    <i class='fa fa-save' ng-show='!waiting_on_save'></i>",
            "    <i class='fa fa-spinner fa-spin' ng-show='waiting_on_save'></i>",
            "</div>",
        ].join("\n"),
        link: function(scope, element, attributes) {
            scope.model_dirty = false;
            scope.waiting_on_save = false;

            // If we were asked to load the settings when this directive is 
            // initialized - do so. Be wary of this, model is two way bound into
            // this directive. I did it this way so it is convienient for my
            // app to just use this directive without needing to initialize the
            // settings. In a way - this directive is reponsible for loading, saving
            // and presenting a UI for the user.
            if(scope.loadOnInit) {
                $http.get(scope.api).then(function(response) {
                    if(response.data.status == "SUCCESS") {
                        scope.model = response.data.settings;
                        console.log(scope.model);
                    } else {
                        console.log("Error - unable to load settings from " + scope.api);
                    }
                });
            }

            // Setup a watch on the model...
            scope.$watch("model", function(new_value, old_value) {
                // If the model changed, and one of the values is not
                // null (non-init case), then we identify that as a 
                // valid change in the model which might need to be
                // resolved.
                if(new_value != old_value &&
                   old_value != null) {
                    scope.model_dirty = true;
                }

                // If the user asked us to auto-save, then anytime
                // the model is dirty, auto-save :)
                if(scope.model_dirty && scope.autosave) {
                    scope.save_model();
                }
            }, true);

            // Save the model to the API endpoint, show the spinner
            // once it sends the POST, and remove the dirty flag along
            // with the spinner once the POST is successful
            scope.save_model = function() {
                scope.waiting_on_save = true;
                $http.post(scope.api, scope.model).then(function(response) {
                    $timeout(function() {
                        scope.waiting_on_save = false;
                        scope.model_dirty = false;
                    }, 100);
                });
            }
        },
    }
});
