# Shortcuts for Framer 3

A collection of useful functions to make mobile prototyping with [Framer](http://www.framerjs.com/) easier.  For full reference, check our annotated source code in `library.coffee`.

## How to use

Include [library.js](https://rawgit.com/facebook/shortcuts-for-framer/master/build/library.js) right before `app.js` in your Framer `index.html` file. 

## General
* After importing your PSD/Sketch layers, call initialize to create global Javascript variables for every layer for quick access:
    
```
myLayers = Framer.Importer.load("...");
Framer.Shortcuts.initialize(myLayers);
```

* This will let you access `PSD["My Layer"]` as simply `My_Layer`
* Note that some Javascript variable names are [reserved](http://www.javascripter.net/faq/reserved.htm) and using them as layer names can cause problems. 
* `layer.originalFrame` stores the initial position and size of each exported layer, so you can easily revert back to them later

## Animation
* `layer.animateTo({x: 100}, [time], [curve], [callback])` is a shorthand that mirrors jQuery's animation syntax. You can specify a duration, curve and callback in order, and omit the ones you'd like. Note that in Framer 3, time is now specified in seconds.
* `layer.slideFromLeft()` `layer.slideToLeft()` (and similarly Left, Bottom, Top) are quick animation functions to animate full screen layers in and out of the viewport. Very useful for prototyping mobile flows.
* `layer.show()` `layer.hide()` shows and hides layers.
* `layer.fadeIn()` `layer.fadeOut()` fades in/out layers with an animation. You can use a custom duration too: `layer.fadeIn(0.5)`
* `show`, `hide`, `fadeIn` and `fadeOut` can take layers or arrays containing layers.

## Events
* Free hover and tap/click states: append `touchable` to a group's name, and include children that have `hover` and `down` in their name. Events will be automatically bound to show these hover and tap/click states.
* Shortcut: instead of `layer.on('touchup', function() {})` use `layer.tap(function() {})`. This also works with mouse events.
* Shortcut: instead of `layer.on('mouseover', function() {}); layer.on('mouseout', function() {});` use `layer.hover(function() {}, function() {})`

## Display in Device
* If your prototype has a parent `Phone` group, we automatically add a phone image around your prototype and resize to fit in a browser screen. Great for presenting!
* By default, the parent group is called `Phone` and the device is an iPhone in a 640x1136 canvas. Check the `Display In Device` section in the source code to see how you can configure for different devices.
* Press the space bar key to toggle this on and off.

## Others
* `layer.getChild('name')` and `layer.getChildren('name')` retrieve the children of a layer by name. Useful when traversing the layer hierarchy.
* `Framer.utils.convertRange(OldMin, OldMax, OldValue, NewMin, NewMax, [capped])` converts a number `oldValue` from one range `(oldMin, oldMax)` to another `(newMin, newMax)`. If you'd like to cap the output to NewMin and NewMax, enable `capped`.

## Customization
All the animation functions use curves and times that can be customized. In addition, the Display in Device functionality can be changed to enable different devices, to add a holding hand image, or a background. Check the very top of `library.js` to see all the options.

# Questions

Feel free to contact the project's maintainer, Cemre Gungor, on gem-at-fb-dot-com or [@gem_ray](https://twitter.com/gem_ray) on Twitter.
