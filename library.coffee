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

Framer.config.displayInDevice = 
  enabled: true
  resizeToFit: true
  containerView: PSD?.Phone
  canvasWidth: 640
  canvasHeight: 1136
  deviceWidth: 770
  deviceHeight: 1610
  deviceImage: 'http://shortcuts-for-framer.s3.amazonaws.com/iphone-5s-white.png'
  bobbleImage: 'http://shortcuts-for-framer.s3.amazonaws.com/bobble.png'

Framer.config.defaultAnimation =
  curve: "spring(700,80,1000)"
  time: 500

Framer.config.fadeAnimation =
  curve: "ease-in-out"
  time: 200  

Framer.config.slideAnimation =
  curve: "ease-in-out"
  time: 200  



###
  LOOP ON EVERY VIEW

  Shorthand for applying a function to every view in the document.

  Example:
  ```Framer.utils.everyView(function(view) {
    view.visible = false;
  });```
###
Framer.utils.everyView = (fn) ->
  for viewName of PSD
    _view = PSD[viewName]
    fn _view


###
  SHORTHAND FOR ACCESSING VIEWS

  Convert each view coming from the exporter into a Javascript object for shorthand access.

  If you have a layer in your PSD/Sketch called "NewsFeed", this will create a global Javascript variable called "NewsFeed" that you can manipulate with Framer.

  Example:
  `NewsFeed.visible = false;`

  Notes:
  Javascript has some names reserved for internal function that you can't override (for ex. )
###
Framer.utils.everyView (view) ->
  window[view.name] = view


###
  FIND CHILD VIEWS BY NAME
  
  Retrieves subviews of selected view that have a matching name.
  
  getChild: return the first subview whose name includes the given string
  getChildren: return all subviews that match
  
  Useful when eg. iterating over table cells. Use getChild to access the button found in each cell. This is **case insensitive**.
  
  Example:
  `topView = NewsFeed.getChild("Top")` Looks for view whose name matches Top. Returns the first matching view.

  `childViews = Table.getChildren("Cell")` Returns all children whose name match Cell in an array.
###
View::getChild = (needle) ->
  # Search direct children
  for k of @subViews
    subView = @subViews[k]
    return subView if subView.name.toLowerCase().indexOf(needle.toLowerCase()) isnt -1
  
  # Recursively search children of children 
  for k of @subViews
    subView = @subViews[k]
    found = subView.getChild(needle)
    return found if found
  

View::getChildren = (needle) ->
  results = []
  
  for k of @subViews
    subView = @subViews[k]
    results = results.concat subView.getChildren(needle)

  if @name.toLowerCase().indexOf(needle.toLowerCase()) isnt -1
    results.push @

  results


###
  CONVERT A NUMBER RANGE TO ANOTHER
  
  Converts a number within one range to another range
  
  Example:
  We want to map the opacity of a view to its x location.
  
  The opacity will be 0 if the X coordinate is 0, and it will be 1 if the X coordinate is 640. All the X coordinates in between will result in intermediate values between 0 and 1.
  
  `myView.opacity = convertRange(0, 640, myView.x, 0, 1)`
###
Framer.utils.convertRange = (OldMin, OldMax, OldValue, NewMin, NewMax) ->
  OldRange = (OldMax - OldMin)
  NewRange = (NewMax - NewMin)
  (((OldValue - OldMin) * NewRange) / OldRange) + NewMin


###
  ORIGINAL FRAME

  Stores the initial location and size of a view in the "originalFrame" attribute, so you can revert to it later on.

  Example:
  The x coordinate of MyView is initially 400 (from the PSD)
  
  ```MyView.x = 200; // now we set it to 200.
  View.x = View.originalFrame.x // now we set it back to its original value, 400.```
###
Framer.utils.everyView (view) ->
  view.originalFrame = view.frame

###
  SHORTHAND HOVER SYNTAX

  Quickly define functions that should run when I hover over a view, and hover out.

  Example:
  `MyView.hover(function() { OtherView.show() }, function() { OtherView.hide() });`
###
View::hover = (enterFunction, leaveFunction) ->
  this.on 'mouseenter', enterFunction
  this.on 'mouseleave', leaveFunction

###
  SHORTHAND ANIMATION SYNTAX

  A shorter animation syntax that uses the default values `Framer.defaultAnimation.curve` and `Framer.defaultAnimation.time`.

  animateTo also sets isAnimating variables on the element depending on whether an animation is in progress. So before starting an animation, you can check if there is already an ongoing one.

  Old:
  ```myview.animate({
    properties: {
      x: 500
    },
    time: 500,
    curve: 'ease-in-out'
  })```

  New:
  ```myview.animateTo({
    x: 500
  })```

  Optionally (with 1000ms duration):
    ```myView.animateTo({
    x: 500
  }, 1000)
###



View::animateTo = (properties, time) ->
  thisView = this

  thisView.animationTo = new Animation
    view: thisView
    properties: properties
    curve: Framer.config.defaultAnimation.curve
    time: Framer.config.defaultAnimation.time

  if time?
    thisView.animationTo.curve = 'ease-in-out'
    thisView.animationTo.time = time

  thisView.animationTo.on 'start', ->
    thisView.isAnimating = true

  thisView.animationTo.on 'end', ->
    thisView.isAnimating = null
  
  thisView.animationTo.start()

###
  ANIMATE MOBILE VIEWS IN AND OUT OF THE VIEWPORT

  Shorthand syntax for animating views in and out of the viewport. Assumes that the view you are animating is a whole screen and has the same dimensions as your container.

  To use this, you need to place everything in a parent view called Phone. The library will automatically enable masking and size it to 640 * 1136.
  
  Example:
  * `myView.slideToLeft()` will animate the view **to** the left corner of the screen (from its current position)

  * `myView.slideFromLeft()` will animate the view into the viewport **from** the left corner (from x=-width)

  Configuration:
  * Framer.config.slideAnimation.time
  * Framer.config.slideAnimation.curve


  How to read the configuration: 
  ```slideFromLeft:
    property: "x"     // animate along the X axis
    factor: "width"   
    from: -1          // start value: outside the left corner ( x = -width_phone )
    to: 0             // end value: inside the left corner ( x = width_view )
  ```
###

_.defer ->
  # Deferred, so if you change the config in your app.js, it's taken into account.

  _phone = Framer.config.displayInDevice.containerView
  if _phone?
    _phone.x = 0
    _phone.y = 0
    _phone.width = Framer.config.displayInDevice.canvasWidth
    _phone.height = Framer.config.displayInDevice.canvasHeight
    _phone.clip = true


Framer.config.slideAnimations =
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



_.each Framer.config.slideAnimations, (opts, name) ->
  View.prototype[name] = ->
    _phone = Framer.config.containerView

    unless _phone
      console.log "Please wrap your project in a view named Phone, or set Framer.config.containerView to whatever your wrapper view is."
      return
    
    _property = opts.property
    _factor = _phone[opts.factor]

    if opts.from?
      # Initiate the start position of the animation (i.e. off screen on the left corner)
      this[_property] = opts.from * _factor

    # Default animation syntax view.animate({_property: 0}) would try to animate '_property' literally, in order for it to blow up to what's in it (eg x), we use this syntax
    _animationConfig = {}
    _animationConfig[_property] = opts.to * _factor
    
    this.animate
      properties: _animationConfig
      time: Framer.config.slideAnimation.time
      curve: Framer.config.slideAnimation.curve
      


###
  EASY FADE IN / FADE OUT

  .show() and .hide() are shortcuts to affect `myView.visible`. They immediately show or hide the view.

  .fadeIn() and .fadeOut() are shortcuts to fade in a hidden view, or fade out a visible view.

  To customize the fade animation, change the variables `Framer.config.defaultFadeAnimation.time` and `defaultFadeAnimation.curve`.
###
View::show = ->
  @visible = true
  @opacity = 1

View::hide = ->
  @visible = false


View::fadeIn = (time = Framer.config.fadeAnimation.time) ->
  return if @opacity == 1 and @visible

  unless @visible
    @opacity = 0
    @visible = true

  @animate
    properties:
      opacity: 1
    curve: Framer.config.fadeAnimation.curve
    time: time


View::fadeOut = (time = Framer.config.fadeAnimation.time) ->
  return if @opacity == 0 or !@visible

  that = @
  @animate
    properties:
      opacity: 0
    curve: Framer.config.fadeAnimation.curve
    time: time
    callback: ->
      that.visible = false


###
  EASY HOVER AND TOUCH/CLICK STATES FOR VIEWS

  By naming your view hierarchy in the following way, you can automatically have your views react to hovers, clicks or taps.

  Button_touchable
  - Button_default (default state)
  - Button_down (touch/click state)
  - Button_hover (hover)
###

Framer.utils.everyView (view) ->
  _default = view.getChild('default')

  if view.name.toLowerCase().indexOf('touchable') and _default

    unless utils.isMobile()
      _hover = view.getChild('hover')
    _down = view.getChild('down')

    # These views should be hidden by default
    _hover?.hide()
    _down?.hide()

    # Create fake hit target (so we don't re-fire events)
    if _hover or _down 
      hitTarget = new View
        frame: _default.frame

      hitTarget.superView = view
      hitTarget.bringToFront()

    # There is a hover state, so define hover events (not for mobile)
    if _hover
      view.hover ->
        _default.hide()
        _hover.show()
      , ->
        _default.show()
        _hover.hide()

    # There is a down state, so define down events
    if _down 
      view.on Events.TouchStart, ->
        _default.hide()
        _hover?.hide() # touch down state overrides hover state
        _down.show()

      view.on Events.TouchEnd, ->
        _down.hide()

        if _hover
          # If there was a hover state, go back to the hover state
          _hover.show()
        else
          _default.show()




###
  DISPLAY IN DEVICE

  If you're prototyping a mobile app, showing it in a device can be helpful for presentations.

  Wrapping everything in a top level view (group in Sketch/PS) called "Phone" will enable this mode and wrap the view in an iPhone image.
###

class Device
  build: (args) ->
    _.extend(@, args)

    if @enabled && @containerView && !utils.isMobile()
      @enableCursor()

      @backgroundView = new ImageView
        x: 0
        y: 0
        width: window.innerWidth
        height: window.innerHeight
        image: @backgroundImage
      @backgroundView.name = 'BackgroundView'
      @backgroundView.style.backgroundColor = 'white'

      @handView = new ImageView
        midX: window.innerWidth / 2
        midY: window.innerHeight / 2
        width: @handWidth
        height: @handHeight
        image: @handImage
      @handView.name = 'HandView'
      @handView.style.backgroundColor = 'transparent'
      @handView.superView = @backgroundView

      @deviceView = new ImageView
        midX: window.innerWidth / 2
        midY: window.innerHeight / 2
        width: @deviceWidth
        height: @deviceHeight
        image: @deviceImage
      @deviceView.name = 'DeviceView'

      window.addEventListener 'resize', =>
        @resize()

      window.addEventListener 'keydown', (e) =>
        if e.keyCode is 32
          @enabled = !@enabled
          @refresh()


      @refresh()
      @resize()

  enableCursor: ->
    document.body.style.cursor = "url(#{Framer.config.displayInDevice.bobbleImage}) 32 32, default"

  refresh: ->
    if @enabled
      @containerView.superView = @deviceView
      @containerView.midX = @deviceView.width/2
      @containerView.midY = @deviceView.height/2
      @backgroundView.show()
      @deviceView.show()
    else
      @containerView.superView = null
      @containerView.x = 0
      @containerView.y = 0
      @backgroundView.hide()
      @deviceView.hide()

  resize: ->
    # Position background to fill screen
    @backgroundView.width = window.innerWidth
    @backgroundView.height = window.innerHeight

    # Position device to be centered in background
    @deviceView.midX = @handView.midX = window.innerWidth/2

    if @resizeToFit
      # Resize the device to fit screen vertically
      scaleFactor = window.innerHeight / @deviceView.height * 0.95
      @deviceView.scale = @handView.scale = scaleFactor

    if @resizeToFit || window.innerHeight > @deviceView.height
      # Device is smaller than window, so vertically center
      @deviceView.midY = @handView.midY = window.innerHeight/2
    else
      # Window is smaller than mock, so align to top
      @deviceView.y = @handView.y = 0
      @backgroundView.height = @deviceView.height  


Framer.Device = new Device
_.defer ->
  Framer.Device.build Framer.config.displayInDevice
  


###
  SHORTHAND FOR TAP EVENTS

  Instead of `view.on(Events.TouchEnd, handler)`, use `view.tap(handler)`
###

View::tap = (handler) ->
  this.on Events.TouchEnd, handler