###
  Shortcuts for Framer 1.0
  http://github.com/facebook/shortcuts-for-framer

  Copyright (c) 2014, Facebook, Inc.
  All rights reserved.

  Readme:
  https://github.com/facebook/shortcuts-for-framer

  License:
  https://github.com/facebook/shortcuts-for-framer/blob/master/LICENSE.md
###




###
  CONFIGURATION
###

shortcuts = {}

Framer.Defaults.FadeAnimation =
  curve: "bezier-curve"
  time: 0.2

Framer.Defaults.SlideAnimation =
  curve: "spring(400,40,0)"



###
  LOOP ON EVERY LAYER

  Shorthand for applying a function to every layer in the document.

  Example:
  ```shortcuts.everyLayer(function(layer) {
    layer.visible = false;
  });```
###
shortcuts.everyLayer = (fn) ->
  for layerName of window.Layers
    _layer = window.Layers[layerName]
    fn _layer


###
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
###
shortcuts.initialize = (layers) ->

  layer = Framer.CurrentContext._layerList if not layers

  window.Layers = layers

  shortcuts.everyLayer (layer) ->
    sanitizedLayerName = layer.name.replace(/[-+!?:*\[\]\(\)\/]/g, '').trim().replace(/\s/g, '_')
    window[sanitizedLayerName] = layer
    shortcuts.saveOriginalFrame layer
    shortcuts.initializeTouchStates layer


###
  FIND CHILD LAYERS BY NAME

  Retrieves subLayers of selected layer that have a matching name.

  getChild: return the first sublayer whose name includes the given string
  getChildren: return all subLayers that match

  Useful when eg. iterating over table cells. Use getChild to access the button found in each cell. This is **case insensitive**.

  Example:
  `topLayer = NewsFeed.getChild("Top")` Looks for layers whose name matches Top. Returns the first matching layer.

  `childLayers = Table.getChildren("Cell")` Returns all children whose name match Cell in an array.
###
Layer::getChild = (needle, recursive = false) ->
  # Search direct children
  for subLayer in @subLayers
    return subLayer if subLayer.name.toLowerCase().indexOf(needle.toLowerCase()) isnt -1 

  # Recursively search children of children
  if recursive
    for subLayer in @subLayers
      return subLayer.getChild(needle, recursive) if subLayer.getChild(needle, recursive) 


Layer::getChildren = (needle, recursive = false) ->
  results = []

  if recursive
    for subLayer in @subLayers
      results = results.concat subLayer.getChildren(needle, recursive)
    results.push @ if @name.toLowerCase().indexOf(needle.toLowerCase()) isnt -1
    return results

  else
    for subLayer in @subLayers
      if subLayer.name.toLowerCase().indexOf(needle.toLowerCase()) isnt -1 
        results.push subLayer 
    return results



###
  CONVERT A NUMBER RANGE TO ANOTHER

  Converts a number within one range to another range

  Example:
  We want to map the opacity of a layer to its x location.

  The opacity will be 0 if the X coordinate is 0, and it will be 1 if the X coordinate is 640. All the X coordinates in between will result in intermediate values between 0 and 1.

  `myLayer.opacity = convertRange(0, 640, myLayer.x, 0, 1)`

  By default, this value might be outside the bounds of NewMin and NewMax if the OldValue is outside OldMin and OldMax. If you want to cap the final value to NewMin and NewMax, set capped to true.
  Make sure NewMin is smaller than NewMax if you're using this. If you need an inverse proportion, try swapping OldMin and OldMax.
###
shortcuts.convertRange = (OldMin, OldMax, OldValue, NewMin, NewMax, capped) ->
  OldRange = (OldMax - OldMin)
  NewRange = (NewMax - NewMin)
  NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin

  if capped
    if NewValue > NewMax
      NewMax
    else if NewValue < NewMin
      NewMin
    else
      NewValue
  else
    NewValue


###
  ORIGINAL FRAME

  Stores the initial location and size of a layer in the "originalFrame" attribute, so you can revert to it later on.

  Example:
  The x coordinate of MyLayer is initially 400 (from the PSD)

  ```MyLayer.x = 200; // now we set it to 200.
  MyLayer.x = MyLayer.originalFrame.x // now we set it back to its original value, 400.```
###
shortcuts.saveOriginalFrame = (layer) ->
  layer.originalFrame = layer.frame

###
  SHORTHAND HOVER SYNTAX

  Quickly define functions that should run when I hover over a layer, and hover out.

  Example:
  `MyLayer.hover(function() { OtherLayer.show() }, function() { OtherLayer.hide() });`
###
Layer::hover = (enterFunction, leaveFunction) ->
  this.on 'mouseenter', enterFunction
  this.on 'mouseleave', leaveFunction


###
  SHORTHAND TAP SYNTAX

  Instead of `MyLayer.on(Events.TouchEnd, handler)`, use `MyLayer.tap(handler)`
###

Layer::tap = (handler) ->
  this.on Events.TouchEnd, handler


###
  SHORTHAND CLICK SYNTAX

  Instead of `MyLayer.on(Events.Click, handler)`, use `MyLayer.click(handler)`
###

Layer::click = (handler) ->
  this.on Events.Click, handler



###
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
###



Layer::animateTo = (properties, first, second, third) ->
  thisLayer = this
  time = curve = callback = null

  if typeof(first) == "number"
    time = first
    if typeof(second) == "string"
      curve = second
      callback = third
    callback = second if typeof(second) == "function"
  else if typeof(first) == "string"
    curve = first
    callback = second if typeof(second) == "function"
  else if typeof(first) == "function"
    callback = first

  if time? && !curve?
    curve = 'bezier-curve'
  
  curve = Framer.Defaults.Animation.curve if !curve?
  time = Framer.Defaults.Animation.time if !time?

  thisLayer.animationTo = new Animation
    layer: thisLayer
    properties: properties
    curve: curve
    time: time

  thisLayer.animationTo.on 'start', ->
    thisLayer.isAnimating = true

  thisLayer.animationTo.on 'end', ->
    thisLayer.isAnimating = null
    if callback?
      callback()

  thisLayer.animationTo.start()

###
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
###


shortcuts.slideAnimations =
  slideFromLeft:
    property: "x"
    factor: "width"
    from: -1
    to: 0

  slideToLeft:
    property: "x"
    factor: "width"
    to: -1

  slideFromRight:
    property: "x"
    factor: "width"
    from: 1
    to: 0

  slideToRight:
    property: "x"
    factor: "width"
    to: 1

  slideFromTop:
    property: "y"
    factor: "height"
    from: -1
    to: 0

  slideToTop:
    property: "y"
    factor: "height"
    to: -1

  slideFromBottom:
    property: "y"
    factor: "height"
    from: 1
    to: 0

  slideToBottom:
    property: "y"
    factor: "height"
    to: 1



_.each shortcuts.slideAnimations, (opts, name) ->
  Layer.prototype[name] = (time) ->
    _phone = Framer.Device?.screen?.frame

    unless _phone
      err = "Please select a device preview in Framer Studio to use the slide preset animations."
      print err
      console.log err
      return

    _property = opts.property
    _factor = _phone[opts.factor]

    if opts.from?
      # Initiate the start position of the animation (i.e. off screen on the left corner)
      this[_property] = opts.from * _factor

    # Default animation syntax layer.animate({_property: 0}) would try to animate '_property' literally, in order for it to blow up to what's in it (eg x), we use this syntax
    _animationConfig = {}
    _animationConfig[_property] = opts.to * _factor

    if time
      _time = time
      _curve = "bezier-curve"
    else
      _time = Framer.Defaults.SlideAnimation.time
      _curve = Framer.Defaults.SlideAnimation.curve

    this.animate
      properties: _animationConfig
      time: _time
      curve: _curve



###
  EASY FADE IN / FADE OUT

  .show() and .hide() are shortcuts to affect opacity and pointer events. This is essentially the same as hiding with `visible = false` but can be animated.

  .fadeIn() and .fadeOut() are shortcuts to fade in a hidden layer, or fade out a visible layer.

  These shortcuts work on individual layer objects as well as an array of layers.

  Example:
  * `MyLayer.fadeIn()` will fade in MyLayer using default timing.
  * `[MyLayer, OtherLayer].fadeOut(4)` will fade out both MyLayer and OtherLayer over 4 seconds.

  To customize the fade animation, change the variables time and curve inside `Framer.Defaults.FadeAnimation`.
###
Layer::show = ->
  @opacity = 1
  @style.pointerEvents = 'auto'
  @

Layer::hide = ->
  @opacity = 0
  @style.pointerEvents = 'none'
  @

Layer::fadeIn = (time = Framer.Defaults.FadeAnimation.time) ->
  return if @opacity == 1

  unless @visible
    @opacity = 0
    @visible = true

  @animateTo opacity: 1, time, Framer.Defaults.FadeAnimation.curve

Layer::fadeOut = (time = Framer.Defaults.FadeAnimation.time) ->
  return if @opacity == 0

  that = @
  @animateTo opacity: 0, time, Framer.Defaults.FadeAnimation.curve, -> that.style.pointerEvents = 'none'

# all of the easy in/out helpers work on an array of views as well as individual views
_.each ['show', 'hide', 'fadeIn', 'fadeOut'], (fnString)->  
  Object.defineProperty Array.prototype, fnString, 
    enumerable: false
    value: (time) ->
      _.each @, (layer) ->
        Layer.prototype[fnString].call(layer, time) if layer instanceof Layer
      @


###
  EASY HOVER AND TOUCH/CLICK STATES FOR LAYERS

  By naming your layer hierarchy in the following way, you can automatically have your layers react to hovers, clicks or taps.

  Button_touchable
  - Button_default (default state)
  - Button_down (touch/click state)
  - Button_hover (hover)
###

shortcuts.initializeTouchStates = (layer) ->
  _default = layer.getChild('default')

  if layer.name.toLowerCase().indexOf('touchable') and _default

    unless Framer.Utils.isMobile()
      _hover = layer.getChild('hover')
    _down = layer.getChild('down')

    # These layers should be hidden by default
    _hover?.hide()
    _down?.hide()

    # Create fake hit target (so we don't re-fire events)
    if _hover or _down
      hitTarget = new Layer
        background: 'transparent'
        frame: _default.frame

      hitTarget.superLayer = layer
      hitTarget.bringToFront()

    # There is a hover state, so define hover events (not for mobile)
    if _hover
      layer.hover ->
        _default.hide()
        _hover.show()
      , ->
        _default.show()
        _hover.hide()

    # There is a down state, so define down events
    if _down
      layer.on Events.TouchStart, ->
        _default.hide()
        _hover?.hide() # touch down state overrides hover state
        _down.show()

      layer.on Events.TouchEnd, ->
        _down.hide()

        if _hover
          # If there was a hover state, go back to the hover state
          _hover.show()
        else
          _default.show()


_.extend(exports, shortcuts)

