# Shortcuts for Framer

A collection of useful functions to make mobile prototyping with [Framer](http://www.framerjs.com/) easier.  For full reference, check our annotated source code in `library.coffee`.

# How to use

Include `library.js` right before `app.js` in your Framer `index.html` file.

# What is in Framer Library

## Customization
* Check the very top of `library.js` to see everything you can customize. All the animation functions use curves and times that can be customized. In addition, the Display in Device functionality can be changed to enable different devices, to add a holding hand image, or a background.

## General
* `PSD["My View"]` becomes `My_View` - create global Javascript variables for every view exported using the Photoshop or Sketch plugins
* `view.originalFrame` stores the initial position and size of each exported view, so you can easily revert back to them later.

## Animation
* `view.animateTo(properties, [time], [curve], [callback])` is a shorthand that mirrors jQuery's animation syntax. Optional parameters can be omitted, for example: `view.animateTo({ x: 100 }, function() { view.hide() } )`
* `view.slideFromLeft()` `view.slideToLeft()` (and similarly Left, Bottom, Top) are quick animation functions to animate full screen views in and out of the viewport. Very useful for prototyping mobile flows.
* `view.show()` `view.hide()` shows and hides views.
* `view.fadeIn()` `view.fadeOut()` fades in/out views with an animation. You can use a custom duration too: `view.fadeIn(500)`

## Events
* Free hover and tap/click states: append `touchable` to a group's name, and include children that have `hover` and `down` in their name. Events will be automatically bound to show these hover and tap/click states.
* Shortcut: instead of `view.on('touchup', function() {})` use `view.tap(function() {})`. This also works with mouse events.
* Shortcut: instead of `view.on('mouseover', function() {}); view.on('mouseout', function() {});` use `view.hover(function() {}, function() {})`

## Display in Device
* If your prototype has a parent `Phone` group, we automatically add a phone image around your prototype and resize to fit in a browser screen. Great for presenting!
* By default, the parent group is called `Phone` and the device is an iPhone in a 640x1136 canvas. Check the `Display In Device` section in the source code to see how you can configure for different devices.
* Press the space bar key to toggle this on and off.

## Others
* `view.getChild('name')` and `view.getChildren('name')` retrieve the children of a view by name. Useful when traversing the layer hierarchy.
* `Framer.utils.convertRange(OldMin, OldMax, OldValue, NewMin, NewMax, [capped])` converts a number `oldValue` from one range `(oldMin, oldMax)` to another `(newMin, newMax)`. If you'd like to cap the output to NewMin and NewMax, enable `capped`.

# Questions

Feel free to contact the project's maintainer, Cemre Gungor, on gem-at-fb-dot-com or [@gem_ray](https://twitter.com/gem_ray) on Twitter.
