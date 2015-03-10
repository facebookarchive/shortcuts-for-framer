require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"shortcuts":[function(require,module,exports){

/*
  Shortcuts for Framer 1.0
  http://github.com/facebook/shortcuts-for-framer

  Copyright (c) 2014, Facebook, Inc.
  All rights reserved.

  Readme:
  https://github.com/facebook/shortcuts-for-framer

  License:
  https://github.com/facebook/shortcuts-for-framer/blob/master/LICENSE.md
 */

/*
  CONFIGURATION
 */
var shortcuts;

shortcuts = {};

Framer.Defaults.FadeAnimation = {
  curve: "bezier-curve",
  time: 0.2
};

Framer.Defaults.SlideAnimation = {
  curve: "spring(400,40,0)"
};


/*
  LOOP ON EVERY LAYER

  Shorthand for applying a function to every layer in the document.

  Example:
  ```shortcuts.everyLayer(function(layer) {
    layer.visible = false;
  });```
 */

shortcuts.everyLayer = function(fn) {
  var _layer, layerName, results1;
  results1 = [];
  for (layerName in window.Layers) {
    _layer = window.Layers[layerName];
    results1.push(fn(_layer));
  }
  return results1;
};


/*
  SHORTHAND FOR ACCESSING LAYERS

  Convert each layer coming from the exporter into a Javascript object for shorthand access.

  This has to be called manually in Framer3 after you've ran the importer.

  myLayers = Framer.Importer.load("...")
  shortcuts.initialize(myLayers)

  If you have a layer in your PSD/Sketch called "NewsFeed", this will create a global Javascript variable called "NewsFeed" that you can manipulate with Framer.

  Example:
  `NewsFeed.visible = false;`

  Notes:
  Javascript has some names reserved for internal function that you can't override (for ex. )
  If you call initialize without anything, it will use all currently available layers.
 */

shortcuts.initialize = function(layers) {
  var layer;
  if (!layers) {
    layer = Framer.CurrentContext._layerList;
  }
  window.Layers = layers;
  return shortcuts.everyLayer(function(layer) {
    var sanitizedLayerName;
    sanitizedLayerName = layer.name.replace(/[-+!?:*\[\]\(\)\/]/g, '').trim().replace(/\s/g, '_');
    window[sanitizedLayerName] = layer;
    shortcuts.saveOriginalFrame(layer);
    return shortcuts.initializeTouchStates(layer);
  });
};


/*
  FIND CHILD LAYERS BY NAME

  Retrieves subLayers of selected layer that have a matching name.

  getChild: return the first sublayer whose name includes the given string
  getChildren: return all subLayers that match

  Useful when eg. iterating over table cells. Use getChild to access the button found in each cell. This is **case insensitive**.

  Example:
  `topLayer = NewsFeed.getChild("Top")` Looks for layers whose name matches Top. Returns the first matching layer.

  `childLayers = Table.getChildren("Cell")` Returns all children whose name match Cell in an array.
 */

Layer.prototype.getChild = function(needle, recursive) {
  var i, j, len, len1, ref, ref1, subLayer;
  if (recursive == null) {
    recursive = false;
  }
  ref = this.subLayers;
  for (i = 0, len = ref.length; i < len; i++) {
    subLayer = ref[i];
    if (subLayer.name.toLowerCase().indexOf(needle.toLowerCase()) !== -1) {
      return subLayer;
    }
  }
  if (recursive) {
    ref1 = this.subLayers;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      subLayer = ref1[j];
      if (subLayer.getChild(needle, recursive)) {
        return subLayer.getChild(needle, recursive);
      }
    }
  }
};

Layer.prototype.getChildren = function(needle, recursive) {
  var i, j, len, len1, ref, ref1, results, subLayer;
  if (recursive == null) {
    recursive = false;
  }
  results = [];
  if (recursive) {
    ref = this.subLayers;
    for (i = 0, len = ref.length; i < len; i++) {
      subLayer = ref[i];
      results = results.concat(subLayer.getChildren(needle, recursive));
    }
    if (this.name.toLowerCase().indexOf(needle.toLowerCase()) !== -1) {
      results.push(this);
    }
    return results;
  } else {
    ref1 = this.subLayers;
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      subLayer = ref1[j];
      if (subLayer.name.toLowerCase().indexOf(needle.toLowerCase()) !== -1) {
        results.push(subLayer);
      }
    }
    return results;
  }
};


/*
  CONVERT A NUMBER RANGE TO ANOTHER

  Converts a number within one range to another range

  Example:
  We want to map the opacity of a layer to its x location.

  The opacity will be 0 if the X coordinate is 0, and it will be 1 if the X coordinate is 640. All the X coordinates in between will result in intermediate values between 0 and 1.

  `myLayer.opacity = convertRange(0, 640, myLayer.x, 0, 1)`

  By default, this value might be outside the bounds of NewMin and NewMax if the OldValue is outside OldMin and OldMax. If you want to cap the final value to NewMin and NewMax, set capped to true.
  Make sure NewMin is smaller than NewMax if you're using this. If you need an inverse proportion, try swapping OldMin and OldMax.
 */

shortcuts.convertRange = function(OldMin, OldMax, OldValue, NewMin, NewMax, capped) {
  var NewRange, NewValue, OldRange;
  OldRange = OldMax - OldMin;
  NewRange = NewMax - NewMin;
  NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin;
  if (capped) {
    if (NewValue > NewMax) {
      return NewMax;
    } else if (NewValue < NewMin) {
      return NewMin;
    } else {
      return NewValue;
    }
  } else {
    return NewValue;
  }
};


/*
  ORIGINAL FRAME

  Stores the initial location and size of a layer in the "originalFrame" attribute, so you can revert to it later on.

  Example:
  The x coordinate of MyLayer is initially 400 (from the PSD)

  ```MyLayer.x = 200; // now we set it to 200.
  MyLayer.x = MyLayer.originalFrame.x // now we set it back to its original value, 400.```
 */

shortcuts.saveOriginalFrame = function(layer) {
  return layer.originalFrame = layer.frame;
};


/*
  SHORTHAND HOVER SYNTAX

  Quickly define functions that should run when I hover over a layer, and hover out.

  Example:
  `MyLayer.hover(function() { OtherLayer.show() }, function() { OtherLayer.hide() });`
 */

Layer.prototype.hover = function(enterFunction, leaveFunction) {
  this.on('mouseenter', enterFunction);
  return this.on('mouseleave', leaveFunction);
};


/*
  SHORTHAND TAP SYNTAX

  Instead of `MyLayer.on(Events.TouchEnd, handler)`, use `MyLayer.tap(handler)`
 */

Layer.prototype.tap = function(handler) {
  return this.on(Events.TouchEnd, handler);
};


/*
  SHORTHAND CLICK SYNTAX

  Instead of `MyLayer.on(Events.Click, handler)`, use `MyLayer.click(handler)`
 */

Layer.prototype.click = function(handler) {
  return this.on(Events.Click, handler);
};


/*
  SHORTHAND ANIMATION SYNTAX

  A shorter animation syntax that mirrors the jQuery syntax:
  layer.animate(properties, [time], [curve], [callback])

  All parameters except properties are optional and can be omitted.

  Old:
  ```MyLayer.animate({
    properties: {
      x: 500
    },
    time: 500,
    curve: 'bezier-curve'
  })```

  New:
  ```MyLayer.animateTo({
    x: 500
  })```

  Optionally (with 1000ms duration and spring):
    ```MyLayer.animateTo({
    x: 500
  }, 1000, "spring(100,10,0)")
 */

Layer.prototype.animateTo = function(properties, first, second, third) {
  var callback, curve, thisLayer, time;
  thisLayer = this;
  time = curve = callback = null;
  if (typeof first === "number") {
    time = first;
    if (typeof second === "string") {
      curve = second;
      callback = third;
    }
    if (typeof second === "function") {
      callback = second;
    }
  } else if (typeof first === "string") {
    curve = first;
    if (typeof second === "function") {
      callback = second;
    }
  } else if (typeof first === "function") {
    callback = first;
  }
  if ((time != null) && (curve == null)) {
    curve = 'bezier-curve';
  }
  if (curve == null) {
    curve = Framer.Defaults.Animation.curve;
  }
  if (time == null) {
    time = Framer.Defaults.Animation.time;
  }
  thisLayer.animationTo = new Animation({
    layer: thisLayer,
    properties: properties,
    curve: curve,
    time: time
  });
  thisLayer.animationTo.on('start', function() {
    return thisLayer.isAnimating = true;
  });
  thisLayer.animationTo.on('end', function() {
    thisLayer.isAnimating = null;
    if (callback != null) {
      return callback();
    }
  });
  return thisLayer.animationTo.start();
};


/*
  ANIMATE MOBILE LAYERS IN AND OUT OF THE VIEWPORT

  Shorthand syntax for animating layers in and out of the viewport. Assumes that the layer you are animating is a whole screen and has the same dimensions as your container.

  Enable the device preview in Framer Studio to use this – it lets this script figure out what the bounds of your screen are.

  Example:
  * `MyLayer.slideToLeft()` will animate the layer **to** the left corner of the screen (from its current position)

  * `MyLayer.slideFromLeft()` will animate the layer into the viewport **from** the left corner (from x=-width)

  Configuration:
  * (By default we use a spring curve that approximates iOS. To use a time duration, change the curve to bezier-curve.)
  * Framer.Defaults.SlideAnimation.time
  * Framer.Defaults.SlideAnimation.curve


  How to read the configuration:
  ```slideFromLeft:
    property: "x"     // animate along the X axis
    factor: "width"
    from: -1          // start value: outside the left corner ( x = -width_phone )
    to: 0             // end value: inside the left corner ( x = width_layer )
  ```
 */

shortcuts.slideAnimations = {
  slideFromLeft: {
    property: "x",
    factor: "width",
    from: -1,
    to: 0
  },
  slideToLeft: {
    property: "x",
    factor: "width",
    to: -1
  },
  slideFromRight: {
    property: "x",
    factor: "width",
    from: 1,
    to: 0
  },
  slideToRight: {
    property: "x",
    factor: "width",
    to: 1
  },
  slideFromTop: {
    property: "y",
    factor: "height",
    from: -1,
    to: 0
  },
  slideToTop: {
    property: "y",
    factor: "height",
    to: -1
  },
  slideFromBottom: {
    property: "y",
    factor: "height",
    from: 1,
    to: 0
  },
  slideToBottom: {
    property: "y",
    factor: "height",
    to: 1
  }
};

_.each(shortcuts.slideAnimations, function(opts, name) {
  return Layer.prototype[name] = function(time) {
    var _animationConfig, _curve, _factor, _phone, _property, _time, err, ref, ref1;
    _phone = (ref = Framer.Device) != null ? (ref1 = ref.screen) != null ? ref1.frame : void 0 : void 0;
    if (!_phone) {
      err = "Please select a device preview in Framer Studio to use the slide preset animations.";
      print(err);
      console.log(err);
      return;
    }
    _property = opts.property;
    _factor = _phone[opts.factor];
    if (opts.from != null) {
      this[_property] = opts.from * _factor;
    }
    _animationConfig = {};
    _animationConfig[_property] = opts.to * _factor;
    if (time) {
      _time = time;
      _curve = "bezier-curve";
    } else {
      _time = Framer.Defaults.SlideAnimation.time;
      _curve = Framer.Defaults.SlideAnimation.curve;
    }
    return this.animate({
      properties: _animationConfig,
      time: _time,
      curve: _curve
    });
  };
});


/*
  EASY FADE IN / FADE OUT

  .show() and .hide() are shortcuts to affect opacity and pointer events. This is essentially the same as hiding with `visible = false` but can be animated.

  .fadeIn() and .fadeOut() are shortcuts to fade in a hidden layer, or fade out a visible layer.

  These shortcuts work on individual layer objects as well as an array of layers.

  Example:
  * `MyLayer.fadeIn()` will fade in MyLayer using default timing.
  * `[MyLayer, OtherLayer].fadeOut(4)` will fade out both MyLayer and OtherLayer over 4 seconds.

  To customize the fade animation, change the variables time and curve inside `Framer.Defaults.FadeAnimation`.
 */

Layer.prototype.show = function() {
  this.opacity = 1;
  return this;
};

Layer.prototype.hide = function() {
  this.opacity = 0;
  this.style.pointerEvents = 'none';
  return this;
};

Layer.prototype.fadeIn = function(time) {
  if (time == null) {
    time = Framer.Defaults.FadeAnimation.time;
  }
  if (this.opacity === 1) {
    return;
  }
  if (!this.visible) {
    this.opacity = 0;
    this.visible = true;
  }
  return this.animateTo({
    opacity: 1
  }, time, Framer.Defaults.FadeAnimation.curve);
};

Layer.prototype.fadeOut = function(time) {
  var that;
  if (time == null) {
    time = Framer.Defaults.FadeAnimation.time;
  }
  if (this.opacity === 0) {
    return;
  }
  that = this;
  return this.animateTo({
    opacity: 0
  }, time, Framer.Defaults.FadeAnimation.curve, function() {
    return that.style.pointerEvents = 'none';
  });
};

_.each(['show', 'hide', 'fadeIn', 'fadeOut'], function(fnString) {
  return Object.defineProperty(Array.prototype, fnString, {
    enumerable: false,
    value: function(time) {
      _.each(this, function(layer) {
        if (layer instanceof Layer) {
          return Layer.prototype[fnString].call(layer, time);
        }
      });
      return this;
    }
  });
});


/*
  EASY HOVER AND TOUCH/CLICK STATES FOR LAYERS

  By naming your layer hierarchy in the following way, you can automatically have your layers react to hovers, clicks or taps.

  Button_touchable
  - Button_default (default state)
  - Button_down (touch/click state)
  - Button_hover (hover)
 */

shortcuts.initializeTouchStates = function(layer) {
  var _default, _down, _hover, hitTarget;
  _default = layer.getChild('default');
  if (layer.name.toLowerCase().indexOf('touchable') && _default) {
    if (!Framer.Utils.isMobile()) {
      _hover = layer.getChild('hover');
    }
    _down = layer.getChild('down');
    if (_hover != null) {
      _hover.hide();
    }
    if (_down != null) {
      _down.hide();
    }
    if (_hover || _down) {
      hitTarget = new Layer({
        background: 'transparent',
        frame: _default.frame
      });
      hitTarget.superLayer = layer;
      hitTarget.bringToFront();
    }
    if (_hover) {
      layer.hover(function() {
        _default.hide();
        return _hover.show();
      }, function() {
        _default.show();
        return _hover.hide();
      });
    }
    if (_down) {
      layer.on(Events.TouchStart, function() {
        _default.hide();
        if (_hover != null) {
          _hover.hide();
        }
        return _down.show();
      });
      return layer.on(Events.TouchEnd, function() {
        _down.hide();
        if (_hover) {
          return _hover.show();
        } else {
          return _default.show();
        }
      });
    }
  }
};

_.extend(exports, shortcuts);



},{}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMva29lbi9Eb2N1bWVudHMvUHJvamVjdHMvRnJhbWVyU2hvcnRjdXRzL1Nob3J0Y3V0c1RlbXBsYXRlLmZyYW1lci9tb2R1bGVzL3Nob3J0Y3V0cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUFBOzs7Ozs7Ozs7Ozs7R0FBQTtBQWlCQTtBQUFBOztHQWpCQTtBQUFBLElBQUEsU0FBQTs7QUFBQSxTQXFCQSxHQUFZLEVBckJaLENBQUE7O0FBQUEsTUF1Qk0sQ0FBQyxRQUFRLENBQUMsYUFBaEIsR0FDRTtBQUFBLEVBQUEsS0FBQSxFQUFPLGNBQVA7QUFBQSxFQUNBLElBQUEsRUFBTSxHQUROO0NBeEJGLENBQUE7O0FBQUEsTUEyQk0sQ0FBQyxRQUFRLENBQUMsY0FBaEIsR0FDRTtBQUFBLEVBQUEsS0FBQSxFQUFPLGtCQUFQO0NBNUJGLENBQUE7O0FBZ0NBO0FBQUE7Ozs7Ozs7OztHQWhDQTs7QUFBQSxTQTBDUyxDQUFDLFVBQVYsR0FBdUIsU0FBQyxFQUFELEdBQUE7QUFDckIsTUFBQSwyQkFBQTtBQUFBO09BQUEsMEJBQUEsR0FBQTtBQUNFLElBQUEsTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFPLENBQUEsU0FBQSxDQUF2QixDQUFBO0FBQUEsa0JBQ0EsRUFBQSxDQUFHLE1BQUgsRUFEQSxDQURGO0FBQUE7a0JBRHFCO0FBQUEsQ0ExQ3ZCLENBQUE7O0FBZ0RBO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQWhEQTs7QUFBQSxTQW1FUyxDQUFDLFVBQVYsR0FBdUIsU0FBQyxNQUFELEdBQUE7QUFFckIsTUFBQSxLQUFBO0FBQUEsRUFBQSxJQUE0QyxDQUFBLE1BQTVDO0FBQUEsSUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUE5QixDQUFBO0dBQUE7QUFBQSxFQUVBLE1BQU0sQ0FB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QUFBO2FBS0EsS0FBSyxDQUFDLEVBQU4sQ0FBUyxNQUFNLENBQUMsUUFBaEIsRUFBMEIsU0FBQSxHQUFBO0FBQ3hCLFFBQUEsS0FBSyxDQUFDLElBQU4sQ0FBQSxDQUFBLENBQUE7QUFFQSxRQUFBLElBQUcsTUFBSDtpQkFFRSxNQUFNLENBQUMsSUFBUCxDQUFBLEVBRkY7U0FBQSxNQUFBO2lCQUlFLFFBQVEsQ0FBQyxJQUFULENBQUEsRUFKRjtTQUh3QjtNQUFBLENBQTFCLEVBTkY7S0E3QkY7R0FIZ0M7QUFBQSxDQXhibEMsQ0FBQTs7QUFBQSxDQXdlQyxDQUFDLE1BQUYsQ0FBUyxPQUFULEVBQWtCLFNBQWxCLENBeGVBLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIyMjXG4gIFNob3J0Y3V0cyBmb3IgRnJhbWVyIDEuMFxuICBodHRwOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9zaG9ydGN1dHMtZm9yLWZyYW1lclxuXG4gIENvcHlyaWdodCAoYykgMjAxNCwgRmFjZWJvb2ssIEluYy5cbiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cblxuICBSZWFkbWU6XG4gIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9zaG9ydGN1dHMtZm9yLWZyYW1lclxuXG4gIExpY2Vuc2U6XG4gIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9zaG9ydGN1dHMtZm9yLWZyYW1lci9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4jIyNcblxuXG5cblxuIyMjXG4gIENPTkZJR1VSQVRJT05cbiMjI1xuXG5zaG9ydGN1dHMgPSB7fVxuXG5GcmFtZXIuRGVmYXVsdHMuRmFkZUFuaW1hdGlvbiA9XG4gIGN1cnZlOiBcImJlemllci1jdXJ2ZVwiXG4gIHRpbWU6IDAuMlxuXG5GcmFtZXIuRGVmYXVsdHMuU2xpZGVBbmltYXRpb24gPVxuICBjdXJ2ZTogXCJzcHJpbmcoNDAwLDQwLDApXCJcblxuXG5cbiMjI1xuICBMT09QIE9OIEVWRVJZIExBWUVSXG5cbiAgU2hvcnRoYW5kIGZvciBhcHBseWluZyBhIGZ1bmN0aW9uIHRvIGV2ZXJ5IGxheWVyIGluIHRoZSBkb2N1bWVudC5cblxuICBFeGFtcGxlOlxuICBgYGBzaG9ydGN1dHMuZXZlcnlMYXllcihmdW5jdGlvbihsYXllcikge1xuICAgIGxheWVyLnZpc2libGUgPSBmYWxzZTtcbiAgfSk7YGBgXG4jIyNcbnNob3J0Y3V0cy5ldmVyeUxheWVyID0gKGZuKSAtPlxuICBmb3IgbGF5ZXJOYW1lIG9mIHdpbmRvdy5MYXllcnNcbiAgICBfbGF5ZXIgPSB3aW5kb3cuTGF5ZXJzW2xheWVyTmFtZV1cbiAgICBmbiBfbGF5ZXJcblxuXG4jIyNcbiAgU0hPUlRIQU5EIEZPUiBBQ0NFU1NJTkcgTEFZRVJTXG5cbiAgQ29udmVydCBlYWNoIGxheWVyIGNvbWluZyBmcm9tIHRoZSBleHBvcnRlciBpbnRvIGEgSmF2YXNjcmlwdCBvYmplY3QgZm9yIHNob3J0aGFuZCBhY2Nlc3MuXG5cbiAgVGhpcyBoYXMgdG8gYmUgY2FsbGVkIG1hbnVhbGx5IGluIEZyYW1lcjMgYWZ0ZXIgeW91J3ZlIHJhbiB0aGUgaW1wb3J0ZXIuXG5cbiAgbXlMYXllcnMgPSBGcmFtZXIuSW1wb3J0ZXIubG9hZChcIi4uLlwiKVxuICBzaG9ydGN1dHMuaW5pdGlhbGl6ZShteUxheWVycylcblxuICBJZiB5b3UgaGF2ZSBhIGxheWVyIGluIHlvdXIgUFNEL1NrZXRjaCBjYWxsZWQgXCJOZXdzRmVlZFwiLCB0aGlzIHdpbGwgY3JlYXRlIGEgZ2xvYmFsIEphdmFzY3JpcHQgdmFyaWFibGUgY2FsbGVkIFwiTmV3c0ZlZWRcIiB0aGF0IHlvdSBjYW4gbWFuaXB1bGF0ZSB3aXRoIEZyYW1lci5cblxuICBFeGFtcGxlOlxuICBgTmV3c0ZlZWQudmlzaWJsZSA9IGZhbHNlO2BcblxuICBOb3RlczpcbiAgSmF2YXNjcmlwdCBoYXMgc29tZSBuYW1lcyByZXNlcnZlZCBmb3IgaW50ZXJuYWwgZnVuY3Rpb24gdGhhdCB5b3UgY2FuJ3Qgb3ZlcnJpZGUgKGZvciBleC4gKVxuICBJZiB5b3UgY2FsbCBpbml0aWFsaXplIHdpdGhvdXQgYW55dGhpbmcsIGl0IHdpbGwgdXNlIGFsbCBjdXJyZW50bHkgYXZhaWxhYmxlIGxheWVycy5cbiMjI1xuc2hvcnRjdXRzLmluaXRpYWxpemUgPSAobGF5ZXJzKSAtPlxuXG4gIGxheWVyID0gRnJhbWVyLkN1cnJlbnRDb250ZXh0Ll9sYXllckxpc3QgaWYgbm90IGxheWVyc1xuXG4gIHdpbmRvdy5MYXllcnMgPSBsYXllcnNcblxuICBzaG9ydGN1dHMuZXZlcnlMYXllciAobGF5ZXIpIC0+XG4gICAgc2FuaXRpemVkTGF5ZXJOYW1lID0gbGF5ZXIubmFtZS5yZXBsYWNlKC9bLSshPzoqXFxbXFxdXFwoXFwpXFwvXS9nLCAnJykudHJpbSgpLnJlcGxhY2UoL1xccy9nLCAnXycpXG4gICAgd2luZG93W3Nhbml0aXplZExheWVyTmFtZV0gPSBsYXllclxuICAgIHNob3J0Y3V0cy5zYXZlT3JpZ2luYWxGcmFtZSBsYXllclxuICAgIHNob3J0Y3V0cy5pbml0aWFsaXplVG91Y2hTdGF0ZXMgbGF5ZXJcblxuXG4jIyNcbiAgRklORCBDSElMRCBMQVlFUlMgQlkgTkFNRVxuXG4gIFJldHJpZXZlcyBzdWJMYXllcnMgb2Ygc2VsZWN0ZWQgbGF5ZXIgdGhhdCBoYXZlIGEgbWF0Y2hpbmcgbmFtZS5cblxuICBnZXRDaGlsZDogcmV0dXJuIHRoZSBmaXJzdCBzdWJsYXllciB3aG9zZSBuYW1lIGluY2x1ZGVzIHRoZSBnaXZlbiBzdHJpbmdcbiAgZ2V0Q2hpbGRyZW46IHJldHVybiBhbGwgc3ViTGF5ZXJzIHRoYXQgbWF0Y2hcblxuICBVc2VmdWwgd2hlbiBlZy4gaXRlcmF0aW5nIG92ZXIgdGFibGUgY2VsbHMuIFVzZSBnZXRDaGlsZCB0byBhY2Nlc3MgdGhlIGJ1dHRvbiBmb3VuZCBpbiBlYWNoIGNlbGwuIFRoaXMgaXMgKipjYXNlIGluc2Vuc2l0aXZlKiouXG5cbiAgRXhhbXBsZTpcbiAgYHRvcExheWVyID0gTmV3c0ZlZWQuZ2V0Q2hpbGQoXCJUb3BcIilgIExvb2tzIGZvciBsYXllcnMgd2hvc2UgbmFtZSBtYXRjaGVzIFRvcC4gUmV0dXJucyB0aGUgZmlyc3QgbWF0Y2hpbmcgbGF5ZXIuXG5cbiAgYGNoaWxkTGF5ZXJzID0gVGFibGUuZ2V0Q2hpbGRyZW4oXCJDZWxsXCIpYCBSZXR1cm5zIGFsbCBjaGlsZHJlbiB3aG9zZSBuYW1lIG1hdGNoIENlbGwgaW4gYW4gYXJyYXkuXG4jIyNcbkxheWVyOjpnZXRDaGlsZCA9IChuZWVkbGUsIHJlY3Vyc2l2ZSA9IGZhbHNlKSAtPlxuICAjIFNlYXJjaCBkaXJlY3QgY2hpbGRyZW5cbiAgZm9yIHN1YkxheWVyIGluIEBzdWJMYXllcnNcbiAgICByZXR1cm4gc3ViTGF5ZXIgaWYgc3ViTGF5ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YobmVlZGxlLnRvTG93ZXJDYXNlKCkpIGlzbnQgLTEgXG5cbiAgIyBSZWN1cnNpdmVseSBzZWFyY2ggY2hpbGRyZW4gb2YgY2hpbGRyZW5cbiAgaWYgcmVjdXJzaXZlXG4gICAgZm9yIHN1YkxheWVyIGluIEBzdWJMYXllcnNcbiAgICAgIHJldHVybiBzdWJMYXllci5nZXRDaGlsZChuZWVkbGUsIHJlY3Vyc2l2ZSkgaWYgc3ViTGF5ZXIuZ2V0Q2hpbGQobmVlZGxlLCByZWN1cnNpdmUpIFxuXG5cbkxheWVyOjpnZXRDaGlsZHJlbiA9IChuZWVkbGUsIHJlY3Vyc2l2ZSA9IGZhbHNlKSAtPlxuICByZXN1bHRzID0gW11cblxuICBpZiByZWN1cnNpdmVcbiAgICBmb3Igc3ViTGF5ZXIgaW4gQHN1YkxheWVyc1xuICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuY29uY2F0IHN1YkxheWVyLmdldENoaWxkcmVuKG5lZWRsZSwgcmVjdXJzaXZlKVxuICAgIHJlc3VsdHMucHVzaCBAIGlmIEBuYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihuZWVkbGUudG9Mb3dlckNhc2UoKSkgaXNudCAtMVxuICAgIHJldHVybiByZXN1bHRzXG5cbiAgZWxzZVxuICAgIGZvciBzdWJMYXllciBpbiBAc3ViTGF5ZXJzXG4gICAgICBpZiBzdWJMYXllci5uYW1lLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihuZWVkbGUudG9Mb3dlckNhc2UoKSkgaXNudCAtMSBcbiAgICAgICAgcmVzdWx0cy5wdXNoIHN1YkxheWVyIFxuICAgIHJldHVybiByZXN1bHRzXG5cblxuXG4jIyNcbiAgQ09OVkVSVCBBIE5VTUJFUiBSQU5HRSBUTyBBTk9USEVSXG5cbiAgQ29udmVydHMgYSBudW1iZXIgd2l0aGluIG9uZSByYW5nZSB0byBhbm90aGVyIHJhbmdlXG5cbiAgRXhhbXBsZTpcbiAgV2Ugd2FudCB0byBtYXAgdGhlIG9wYWNpdHkgb2YgYSBsYXllciB0byBpdHMgeCBsb2NhdGlvbi5cblxuICBUaGUgb3BhY2l0eSB3aWxsIGJlIDAgaWYgdGhlIFggY29vcmRpbmF0ZSBpcyAwLCBhbmQgaXQgd2lsbCBiZSAxIGlmIHRoZSBYIGNvb3JkaW5hdGUgaXMgNjQwLiBBbGwgdGhlIFggY29vcmRpbmF0ZXMgaW4gYmV0d2VlbiB3aWxsIHJlc3VsdCBpbiBpbnRlcm1lZGlhdGUgdmFsdWVzIGJldHdlZW4gMCBhbmQgMS5cblxuICBgbXlMYXllci5vcGFjaXR5ID0gY29udmVydFJhbmdlKDAsIDY0MCwgbXlMYXllci54LCAwLCAxKWBcblxuICBCeSBkZWZhdWx0LCB0aGlzIHZhbHVlIG1pZ2h0IGJlIG91dHNpZGUgdGhlIGJvdW5kcyBvZiBOZXdNaW4gYW5kIE5ld01heCBpZiB0aGUgT2xkVmFsdWUgaXMgb3V0c2lkZSBPbGRNaW4gYW5kIE9sZE1heC4gSWYgeW91IHdhbnQgdG8gY2FwIHRoZSBmaW5hbCB2YWx1ZSB0byBOZXdNaW4gYW5kIE5ld01heCwgc2V0IGNhcHBlZCB0byB0cnVlLlxuICBNYWtlIHN1cmUgTmV3TWluIGlzIHNtYWxsZXIgdGhhbiBOZXdNYXggaWYgeW91J3JlIHVzaW5nIHRoaXMuIElmIHlvdSBuZWVkIGFuIGludmVyc2UgcHJvcG9ydGlvbiwgdHJ5IHN3YXBwaW5nIE9sZE1pbiBhbmQgT2xkTWF4LlxuIyMjXG5zaG9ydGN1dHMuY29udmVydFJhbmdlID0gKE9sZE1pbiwgT2xkTWF4LCBPbGRWYWx1ZSwgTmV3TWluLCBOZXdNYXgsIGNhcHBlZCkgLT5cbiAgT2xkUmFuZ2UgPSAoT2xkTWF4IC0gT2xkTWluKVxuICBOZXdSYW5nZSA9IChOZXdNYXggLSBOZXdNaW4pXG4gIE5ld1ZhbHVlID0gKCgoT2xkVmFsdWUgLSBPbGRNaW4pICogTmV3UmFuZ2UpIC8gT2xkUmFuZ2UpICsgTmV3TWluXG5cbiAgaWYgY2FwcGVkXG4gICAgaWYgTmV3VmFsdWUgPiBOZXdNYXhcbiAgICAgIE5ld01heFxuICAgIGVsc2UgaWYgTmV3VmFsdWUgPCBOZXdNaW5cbiAgICAgIE5ld01pblxuICAgIGVsc2VcbiAgICAgIE5ld1ZhbHVlXG4gIGVsc2VcbiAgICBOZXdWYWx1ZVxuXG5cbiMjI1xuICBPUklHSU5BTCBGUkFNRVxuXG4gIFN0b3JlcyB0aGUgaW5pdGlhbCBsb2NhdGlvbiBhbmQgc2l6ZSBvZiBhIGxheWVyIGluIHRoZSBcIm9yaWdpbmFsRnJhbWVcIiBhdHRyaWJ1dGUsIHNvIHlvdSBjYW4gcmV2ZXJ0IHRvIGl0IGxhdGVyIG9uLlxuXG4gIEV4YW1wbGU6XG4gIFRoZSB4IGNvb3JkaW5hdGUgb2YgTXlMYXllciBpcyBpbml0aWFsbHkgNDAwIChmcm9tIHRoZSBQU0QpXG5cbiAgYGBgTXlMYXllci54ID0gMjAwOyAvLyBub3cgd2Ugc2V0IGl0IHRvIDIwMC5cbiAgTXlMYXllci54ID0gTXlMYXllci5vcmlnaW5hbEZyYW1lLnggLy8gbm93IHdlIHNldCBpdCBiYWNrIHRvIGl0cyBvcmlnaW5hbCB2YWx1ZSwgNDAwLmBgYFxuIyMjXG5zaG9ydGN1dHMuc2F2ZU9yaWdpbmFsRnJhbWUgPSAobGF5ZXIpIC0+XG4gIGxheWVyLm9yaWdpbmFsRnJhbWUgPSBsYXllci5mcmFtZVxuXG4jIyNcbiAgU0hPUlRIQU5EIEhPVkVSIFNZTlRBWFxuXG4gIFF1aWNrbHkgZGVmaW5lIGZ1bmN0aW9ucyB0aGF0IHNob3VsZCBydW4gd2hlbiBJIGhvdmVyIG92ZXIgYSBsYXllciwgYW5kIGhvdmVyIG91dC5cblxuICBFeGFtcGxlOlxuICBgTXlMYXllci5ob3ZlcihmdW5jdGlvbigpIHsgT3RoZXJMYXllci5zaG93KCkgfSwgZnVuY3Rpb24oKSB7IE90aGVyTGF5ZXIuaGlkZSgpIH0pO2BcbiMjI1xuTGF5ZXI6OmhvdmVyID0gKGVudGVyRnVuY3Rpb24sIGxlYXZlRnVuY3Rpb24pIC0+XG4gIHRoaXMub24gJ21vdXNlZW50ZXInLCBlbnRlckZ1bmN0aW9uXG4gIHRoaXMub24gJ21vdXNlbGVhdmUnLCBsZWF2ZUZ1bmN0aW9uXG5cblxuIyMjXG4gIFNIT1JUSEFORCBUQVAgU1lOVEFYXG5cbiAgSW5zdGVhZCBvZiBgTXlMYXllci5vbihFdmVudHMuVG91Y2hFbmQsIGhhbmRsZXIpYCwgdXNlIGBNeUxheWVyLnRhcChoYW5kbGVyKWBcbiMjI1xuXG5MYXllcjo6dGFwID0gKGhhbmRsZXIpIC0+XG4gIHRoaXMub24gRXZlbnRzLlRvdWNoRW5kLCBoYW5kbGVyXG5cblxuIyMjXG4gIFNIT1JUSEFORCBDTElDSyBTWU5UQVhcblxuICBJbnN0ZWFkIG9mIGBNeUxheWVyLm9uKEV2ZW50cy5DbGljaywgaGFuZGxlcilgLCB1c2UgYE15TGF5ZXIuY2xpY2soaGFuZGxlcilgXG4jIyNcblxuTGF5ZXI6OmNsaWNrID0gKGhhbmRsZXIpIC0+XG4gIHRoaXMub24gRXZlbnRzLkNsaWNrLCBoYW5kbGVyXG5cblxuXG4jIyNcbiAgU0hPUlRIQU5EIEFOSU1BVElPTiBTWU5UQVhcblxuICBBIHNob3J0ZXIgYW5pbWF0aW9uIHN5bnRheCB0aGF0IG1pcnJvcnMgdGhlIGpRdWVyeSBzeW50YXg6XG4gIGxheWVyLmFuaW1hdGUocHJvcGVydGllcywgW3RpbWVdLCBbY3VydmVdLCBbY2FsbGJhY2tdKVxuXG4gIEFsbCBwYXJhbWV0ZXJzIGV4Y2VwdCBwcm9wZXJ0aWVzIGFyZSBvcHRpb25hbCBhbmQgY2FuIGJlIG9taXR0ZWQuXG5cbiAgT2xkOlxuICBgYGBNeUxheWVyLmFuaW1hdGUoe1xuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgIHg6IDUwMFxuICAgIH0sXG4gICAgdGltZTogNTAwLFxuICAgIGN1cnZlOiAnYmV6aWVyLWN1cnZlJ1xuICB9KWBgYFxuXG4gIE5ldzpcbiAgYGBgTXlMYXllci5hbmltYXRlVG8oe1xuICAgIHg6IDUwMFxuICB9KWBgYFxuXG4gIE9wdGlvbmFsbHkgKHdpdGggMTAwMG1zIGR1cmF0aW9uIGFuZCBzcHJpbmcpOlxuICAgIGBgYE15TGF5ZXIuYW5pbWF0ZVRvKHtcbiAgICB4OiA1MDBcbiAgfSwgMTAwMCwgXCJzcHJpbmcoMTAwLDEwLDApXCIpXG4jIyNcblxuXG5cbkxheWVyOjphbmltYXRlVG8gPSAocHJvcGVydGllcywgZmlyc3QsIHNlY29uZCwgdGhpcmQpIC0+XG4gIHRoaXNMYXllciA9IHRoaXNcbiAgdGltZSA9IGN1cnZlID0gY2FsbGJhY2sgPSBudWxsXG5cbiAgaWYgdHlwZW9mKGZpcnN0KSA9PSBcIm51bWJlclwiXG4gICAgdGltZSA9IGZpcnN0XG4gICAgaWYgdHlwZW9mKHNlY29uZCkgPT0gXCJzdHJpbmdcIlxuICAgICAgY3VydmUgPSBzZWNvbmRcbiAgICAgIGNhbGxiYWNrID0gdGhpcmRcbiAgICBjYWxsYmFjayA9IHNlY29uZCBpZiB0eXBlb2Yoc2Vjb25kKSA9PSBcImZ1bmN0aW9uXCJcbiAgZWxzZSBpZiB0eXBlb2YoZmlyc3QpID09IFwic3RyaW5nXCJcbiAgICBjdXJ2ZSA9IGZpcnN0XG4gICAgY2FsbGJhY2sgPSBzZWNvbmQgaWYgdHlwZW9mKHNlY29uZCkgPT0gXCJmdW5jdGlvblwiXG4gIGVsc2UgaWYgdHlwZW9mKGZpcnN0KSA9PSBcImZ1bmN0aW9uXCJcbiAgICBjYWxsYmFjayA9IGZpcnN0XG5cbiAgaWYgdGltZT8gJiYgIWN1cnZlP1xuICAgIGN1cnZlID0gJ2Jlemllci1jdXJ2ZSdcbiAgXG4gIGN1cnZlID0gRnJhbWVyLkRlZmF1bHRzLkFuaW1hdGlvbi5jdXJ2ZSBpZiAhY3VydmU/XG4gIHRpbWUgPSBGcmFtZXIuRGVmYXVsdHMuQW5pbWF0aW9uLnRpbWUgaWYgIXRpbWU/XG5cbiAgdGhpc0xheWVyLmFuaW1hdGlvblRvID0gbmV3IEFuaW1hdGlvblxuICAgIGxheWVyOiB0aGlzTGF5ZXJcbiAgICBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzXG4gICAgY3VydmU6IGN1cnZlXG4gICAgdGltZTogdGltZVxuXG4gIHRoaXNMYXllci5hbmltYXRpb25Uby5vbiAnc3RhcnQnLCAtPlxuICAgIHRoaXNMYXllci5pc0FuaW1hdGluZyA9IHRydWVcblxuICB0aGlzTGF5ZXIuYW5pbWF0aW9uVG8ub24gJ2VuZCcsIC0+XG4gICAgdGhpc0xheWVyLmlzQW5pbWF0aW5nID0gbnVsbFxuICAgIGlmIGNhbGxiYWNrP1xuICAgICAgY2FsbGJhY2soKVxuXG4gIHRoaXNMYXllci5hbmltYXRpb25Uby5zdGFydCgpXG5cbiMjI1xuICBBTklNQVRFIE1PQklMRSBMQVlFUlMgSU4gQU5EIE9VVCBPRiBUSEUgVklFV1BPUlRcblxuICBTaG9ydGhhbmQgc3ludGF4IGZvciBhbmltYXRpbmcgbGF5ZXJzIGluIGFuZCBvdXQgb2YgdGhlIHZpZXdwb3J0LiBBc3N1bWVzIHRoYXQgdGhlIGxheWVyIHlvdSBhcmUgYW5pbWF0aW5nIGlzIGEgd2hvbGUgc2NyZWVuIGFuZCBoYXMgdGhlIHNhbWUgZGltZW5zaW9ucyBhcyB5b3VyIGNvbnRhaW5lci5cblxuICBFbmFibGUgdGhlIGRldmljZSBwcmV2aWV3IGluIEZyYW1lciBTdHVkaW8gdG8gdXNlIHRoaXMg4oCTwqBpdCBsZXRzIHRoaXMgc2NyaXB0IGZpZ3VyZSBvdXQgd2hhdCB0aGUgYm91bmRzIG9mIHlvdXIgc2NyZWVuIGFyZS5cblxuICBFeGFtcGxlOlxuICAqIGBNeUxheWVyLnNsaWRlVG9MZWZ0KClgIHdpbGwgYW5pbWF0ZSB0aGUgbGF5ZXIgKip0byoqIHRoZSBsZWZ0IGNvcm5lciBvZiB0aGUgc2NyZWVuIChmcm9tIGl0cyBjdXJyZW50IHBvc2l0aW9uKVxuXG4gICogYE15TGF5ZXIuc2xpZGVGcm9tTGVmdCgpYCB3aWxsIGFuaW1hdGUgdGhlIGxheWVyIGludG8gdGhlIHZpZXdwb3J0ICoqZnJvbSoqIHRoZSBsZWZ0IGNvcm5lciAoZnJvbSB4PS13aWR0aClcblxuICBDb25maWd1cmF0aW9uOlxuICAqIChCeSBkZWZhdWx0IHdlIHVzZSBhIHNwcmluZyBjdXJ2ZSB0aGF0IGFwcHJveGltYXRlcyBpT1MuIFRvIHVzZSBhIHRpbWUgZHVyYXRpb24sIGNoYW5nZSB0aGUgY3VydmUgdG8gYmV6aWVyLWN1cnZlLilcbiAgKiBGcmFtZXIuRGVmYXVsdHMuU2xpZGVBbmltYXRpb24udGltZVxuICAqIEZyYW1lci5EZWZhdWx0cy5TbGlkZUFuaW1hdGlvbi5jdXJ2ZVxuXG5cbiAgSG93IHRvIHJlYWQgdGhlIGNvbmZpZ3VyYXRpb246XG4gIGBgYHNsaWRlRnJvbUxlZnQ6XG4gICAgcHJvcGVydHk6IFwieFwiICAgICAvLyBhbmltYXRlIGFsb25nIHRoZSBYIGF4aXNcbiAgICBmYWN0b3I6IFwid2lkdGhcIlxuICAgIGZyb206IC0xICAgICAgICAgIC8vIHN0YXJ0IHZhbHVlOiBvdXRzaWRlIHRoZSBsZWZ0IGNvcm5lciAoIHggPSAtd2lkdGhfcGhvbmUgKVxuICAgIHRvOiAwICAgICAgICAgICAgIC8vIGVuZCB2YWx1ZTogaW5zaWRlIHRoZSBsZWZ0IGNvcm5lciAoIHggPSB3aWR0aF9sYXllciApXG4gIGBgYFxuIyMjXG5cblxuc2hvcnRjdXRzLnNsaWRlQW5pbWF0aW9ucyA9XG4gIHNsaWRlRnJvbUxlZnQ6XG4gICAgcHJvcGVydHk6IFwieFwiXG4gICAgZmFjdG9yOiBcIndpZHRoXCJcbiAgICBmcm9tOiAtMVxuICAgIHRvOiAwXG5cbiAgc2xpZGVUb0xlZnQ6XG4gICAgcHJvcGVydHk6IFwieFwiXG4gICAgZmFjdG9yOiBcIndpZHRoXCJcbiAgICB0bzogLTFcblxuICBzbGlkZUZyb21SaWdodDpcbiAgICBwcm9wZXJ0eTogXCJ4XCJcbiAgICBmYWN0b3I6IFwid2lkdGhcIlxuICAgIGZyb206IDFcbiAgICB0bzogMFxuXG4gIHNsaWRlVG9SaWdodDpcbiAgICBwcm9wZXJ0eTogXCJ4XCJcbiAgICBmYWN0b3I6IFwid2lkdGhcIlxuICAgIHRvOiAxXG5cbiAgc2xpZGVGcm9tVG9wOlxuICAgIHByb3BlcnR5OiBcInlcIlxuICAgIGZhY3RvcjogXCJoZWlnaHRcIlxuICAgIGZyb206IC0xXG4gICAgdG86IDBcblxuICBzbGlkZVRvVG9wOlxuICAgIHByb3BlcnR5OiBcInlcIlxuICAgIGZhY3RvcjogXCJoZWlnaHRcIlxuICAgIHRvOiAtMVxuXG4gIHNsaWRlRnJvbUJvdHRvbTpcbiAgICBwcm9wZXJ0eTogXCJ5XCJcbiAgICBmYWN0b3I6IFwiaGVpZ2h0XCJcbiAgICBmcm9tOiAxXG4gICAgdG86IDBcblxuICBzbGlkZVRvQm90dG9tOlxuICAgIHByb3BlcnR5OiBcInlcIlxuICAgIGZhY3RvcjogXCJoZWlnaHRcIlxuICAgIHRvOiAxXG5cblxuXG5fLmVhY2ggc2hvcnRjdXRzLnNsaWRlQW5pbWF0aW9ucywgKG9wdHMsIG5hbWUpIC0+XG4gIExheWVyLnByb3RvdHlwZVtuYW1lXSA9ICh0aW1lKSAtPlxuICAgIF9waG9uZSA9IEZyYW1lci5EZXZpY2U/LnNjcmVlbj8uZnJhbWVcblxuICAgIHVubGVzcyBfcGhvbmVcbiAgICAgIGVyciA9IFwiUGxlYXNlIHNlbGVjdCBhIGRldmljZSBwcmV2aWV3IGluIEZyYW1lciBTdHVkaW8gdG8gdXNlIHRoZSBzbGlkZSBwcmVzZXQgYW5pbWF0aW9ucy5cIlxuICAgICAgcHJpbnQgZXJyXG4gICAgICBjb25zb2xlLmxvZyBlcnJcbiAgICAgIHJldHVyblxuXG4gICAgX3Byb3BlcnR5ID0gb3B0cy5wcm9wZXJ0eVxuICAgIF9mYWN0b3IgPSBfcGhvbmVbb3B0cy5mYWN0b3JdXG5cbiAgICBpZiBvcHRzLmZyb20/XG4gICAgICAjIEluaXRpYXRlIHRoZSBzdGFydCBwb3NpdGlvbiBvZiB0aGUgYW5pbWF0aW9uIChpLmUuIG9mZiBzY3JlZW4gb24gdGhlIGxlZnQgY29ybmVyKVxuICAgICAgdGhpc1tfcHJvcGVydHldID0gb3B0cy5mcm9tICogX2ZhY3RvclxuXG4gICAgIyBEZWZhdWx0IGFuaW1hdGlvbiBzeW50YXggbGF5ZXIuYW5pbWF0ZSh7X3Byb3BlcnR5OiAwfSkgd291bGQgdHJ5IHRvIGFuaW1hdGUgJ19wcm9wZXJ0eScgbGl0ZXJhbGx5LCBpbiBvcmRlciBmb3IgaXQgdG8gYmxvdyB1cCB0byB3aGF0J3MgaW4gaXQgKGVnIHgpLCB3ZSB1c2UgdGhpcyBzeW50YXhcbiAgICBfYW5pbWF0aW9uQ29uZmlnID0ge31cbiAgICBfYW5pbWF0aW9uQ29uZmlnW19wcm9wZXJ0eV0gPSBvcHRzLnRvICogX2ZhY3RvclxuXG4gICAgaWYgdGltZVxuICAgICAgX3RpbWUgPSB0aW1lXG4gICAgICBfY3VydmUgPSBcImJlemllci1jdXJ2ZVwiXG4gICAgZWxzZVxuICAgICAgX3RpbWUgPSBGcmFtZXIuRGVmYXVsdHMuU2xpZGVBbmltYXRpb24udGltZVxuICAgICAgX2N1cnZlID0gRnJhbWVyLkRlZmF1bHRzLlNsaWRlQW5pbWF0aW9uLmN1cnZlXG5cbiAgICB0aGlzLmFuaW1hdGVcbiAgICAgIHByb3BlcnRpZXM6IF9hbmltYXRpb25Db25maWdcbiAgICAgIHRpbWU6IF90aW1lXG4gICAgICBjdXJ2ZTogX2N1cnZlXG5cblxuXG4jIyNcbiAgRUFTWSBGQURFIElOIC8gRkFERSBPVVRcblxuICAuc2hvdygpIGFuZCAuaGlkZSgpIGFyZSBzaG9ydGN1dHMgdG8gYWZmZWN0IG9wYWNpdHkgYW5kIHBvaW50ZXIgZXZlbnRzLiBUaGlzIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIGhpZGluZyB3aXRoIGB2aXNpYmxlID0gZmFsc2VgIGJ1dCBjYW4gYmUgYW5pbWF0ZWQuXG5cbiAgLmZhZGVJbigpIGFuZCAuZmFkZU91dCgpIGFyZSBzaG9ydGN1dHMgdG8gZmFkZSBpbiBhIGhpZGRlbiBsYXllciwgb3IgZmFkZSBvdXQgYSB2aXNpYmxlIGxheWVyLlxuXG4gIFRoZXNlIHNob3J0Y3V0cyB3b3JrIG9uIGluZGl2aWR1YWwgbGF5ZXIgb2JqZWN0cyBhcyB3ZWxsIGFzIGFuIGFycmF5IG9mIGxheWVycy5cblxuICBFeGFtcGxlOlxuICAqIGBNeUxheWVyLmZhZGVJbigpYCB3aWxsIGZhZGUgaW4gTXlMYXllciB1c2luZyBkZWZhdWx0IHRpbWluZy5cbiAgKiBgW015TGF5ZXIsIE90aGVyTGF5ZXJdLmZhZGVPdXQoNClgIHdpbGwgZmFkZSBvdXQgYm90aCBNeUxheWVyIGFuZCBPdGhlckxheWVyIG92ZXIgNCBzZWNvbmRzLlxuXG4gIFRvIGN1c3RvbWl6ZSB0aGUgZmFkZSBhbmltYXRpb24sIGNoYW5nZSB0aGUgdmFyaWFibGVzIHRpbWUgYW5kIGN1cnZlIGluc2lkZSBgRnJhbWVyLkRlZmF1bHRzLkZhZGVBbmltYXRpb25gLlxuIyMjXG5MYXllcjo6c2hvdyA9IC0+XG4gIEBvcGFjaXR5ID0gMVxuICBAXG5cbkxheWVyOjpoaWRlID0gLT5cbiAgQG9wYWNpdHkgPSAwXG4gIEBzdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gIEBcblxuTGF5ZXI6OmZhZGVJbiA9ICh0aW1lID0gRnJhbWVyLkRlZmF1bHRzLkZhZGVBbmltYXRpb24udGltZSkgLT5cbiAgcmV0dXJuIGlmIEBvcGFjaXR5ID09IDFcblxuICB1bmxlc3MgQHZpc2libGVcbiAgICBAb3BhY2l0eSA9IDBcbiAgICBAdmlzaWJsZSA9IHRydWVcblxuICBAYW5pbWF0ZVRvIG9wYWNpdHk6IDEsIHRpbWUsIEZyYW1lci5EZWZhdWx0cy5GYWRlQW5pbWF0aW9uLmN1cnZlXG5cbkxheWVyOjpmYWRlT3V0ID0gKHRpbWUgPSBGcmFtZXIuRGVmYXVsdHMuRmFkZUFuaW1hdGlvbi50aW1lKSAtPlxuICByZXR1cm4gaWYgQG9wYWNpdHkgPT0gMFxuXG4gIHRoYXQgPSBAXG4gIEBhbmltYXRlVG8gb3BhY2l0eTogMCwgdGltZSwgRnJhbWVyLkRlZmF1bHRzLkZhZGVBbmltYXRpb24uY3VydmUsIC0+IHRoYXQuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJ1xuXG4jIGFsbCBvZiB0aGUgZWFzeSBpbi9vdXQgaGVscGVycyB3b3JrIG9uIGFuIGFycmF5IG9mIHZpZXdzIGFzIHdlbGwgYXMgaW5kaXZpZHVhbCB2aWV3c1xuXy5lYWNoIFsnc2hvdycsICdoaWRlJywgJ2ZhZGVJbicsICdmYWRlT3V0J10sIChmblN0cmluZyktPiAgXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBBcnJheS5wcm90b3R5cGUsIGZuU3RyaW5nLCBcbiAgICBlbnVtZXJhYmxlOiBmYWxzZVxuICAgIHZhbHVlOiAodGltZSkgLT5cbiAgICAgIF8uZWFjaCBALCAobGF5ZXIpIC0+XG4gICAgICAgIExheWVyLnByb3RvdHlwZVtmblN0cmluZ10uY2FsbChsYXllciwgdGltZSkgaWYgbGF5ZXIgaW5zdGFuY2VvZiBMYXllclxuICAgICAgQFxuXG5cbiMjI1xuICBFQVNZIEhPVkVSIEFORCBUT1VDSC9DTElDSyBTVEFURVMgRk9SIExBWUVSU1xuXG4gIEJ5IG5hbWluZyB5b3VyIGxheWVyIGhpZXJhcmNoeSBpbiB0aGUgZm9sbG93aW5nIHdheSwgeW91IGNhbiBhdXRvbWF0aWNhbGx5IGhhdmUgeW91ciBsYXllcnMgcmVhY3QgdG8gaG92ZXJzLCBjbGlja3Mgb3IgdGFwcy5cblxuICBCdXR0b25fdG91Y2hhYmxlXG4gIC0gQnV0dG9uX2RlZmF1bHQgKGRlZmF1bHQgc3RhdGUpXG4gIC0gQnV0dG9uX2Rvd24gKHRvdWNoL2NsaWNrIHN0YXRlKVxuICAtIEJ1dHRvbl9ob3ZlciAoaG92ZXIpXG4jIyNcblxuc2hvcnRjdXRzLmluaXRpYWxpemVUb3VjaFN0YXRlcyA9IChsYXllcikgLT5cbiAgX2RlZmF1bHQgPSBsYXllci5nZXRDaGlsZCgnZGVmYXVsdCcpXG5cbiAgaWYgbGF5ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3RvdWNoYWJsZScpIGFuZCBfZGVmYXVsdFxuXG4gICAgdW5sZXNzIEZyYW1lci5VdGlscy5pc01vYmlsZSgpXG4gICAgICBfaG92ZXIgPSBsYXllci5nZXRDaGlsZCgnaG92ZXInKVxuICAgIF9kb3duID0gbGF5ZXIuZ2V0Q2hpbGQoJ2Rvd24nKVxuXG4gICAgIyBUaGVzZSBsYXllcnMgc2hvdWxkIGJlIGhpZGRlbiBieSBkZWZhdWx0XG4gICAgX2hvdmVyPy5oaWRlKClcbiAgICBfZG93bj8uaGlkZSgpXG5cbiAgICAjIENyZWF0ZSBmYWtlIGhpdCB0YXJnZXQgKHNvIHdlIGRvbid0IHJlLWZpcmUgZXZlbnRzKVxuICAgIGlmIF9ob3ZlciBvciBfZG93blxuICAgICAgaGl0VGFyZ2V0ID0gbmV3IExheWVyXG4gICAgICAgIGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCdcbiAgICAgICAgZnJhbWU6IF9kZWZhdWx0LmZyYW1lXG5cbiAgICAgIGhpdFRhcmdldC5zdXBlckxheWVyID0gbGF5ZXJcbiAgICAgIGhpdFRhcmdldC5icmluZ1RvRnJvbnQoKVxuXG4gICAgIyBUaGVyZSBpcyBhIGhvdmVyIHN0YXRlLCBzbyBkZWZpbmUgaG92ZXIgZXZlbnRzIChub3QgZm9yIG1vYmlsZSlcbiAgICBpZiBfaG92ZXJcbiAgICAgIGxheWVyLmhvdmVyIC0+XG4gICAgICAgIF9kZWZhdWx0LmhpZGUoKVxuICAgICAgICBfaG92ZXIuc2hvdygpXG4gICAgICAsIC0+XG4gICAgICAgIF9kZWZhdWx0LnNob3coKVxuICAgICAgICBfaG92ZXIuaGlkZSgpXG5cbiAgICAjIFRoZXJlIGlzIGEgZG93biBzdGF0ZSwgc28gZGVmaW5lIGRvd24gZXZlbnRzXG4gICAgaWYgX2Rvd25cbiAgICAgIGxheWVyLm9uIEV2ZW50cy5Ub3VjaFN0YXJ0LCAtPlxuICAgICAgICBfZGVmYXVsdC5oaWRlKClcbiAgICAgICAgX2hvdmVyPy5oaWRlKCkgIyB0b3VjaCBkb3duIHN0YXRlIG92ZXJyaWRlcyBob3ZlciBzdGF0ZVxuICAgICAgICBfZG93bi5zaG93KClcblxuICAgICAgbGF5ZXIub24gRXZlbnRzLlRvdWNoRW5kLCAtPlxuICAgICAgICBfZG93bi5oaWRlKClcblxuICAgICAgICBpZiBfaG92ZXJcbiAgICAgICAgICAjIElmIHRoZXJlIHdhcyBhIGhvdmVyIHN0YXRlLCBnbyBiYWNrIHRvIHRoZSBob3ZlciBzdGF0ZVxuICAgICAgICAgIF9ob3Zlci5zaG93KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIF9kZWZhdWx0LnNob3coKVxuXG5cbl8uZXh0ZW5kKGV4cG9ydHMsIHNob3J0Y3V0cylcblxuIl19
