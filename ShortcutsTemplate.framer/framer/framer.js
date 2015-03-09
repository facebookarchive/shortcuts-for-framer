;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var AnimatorClassBezierPresets, AnimatorClasses, BezierCurveAnimator, Config, Defaults, EventEmitter, Frame, LinearAnimator, SpringDHOAnimator, SpringRK4Animator, Utils, evaluateRelativeProperty, isRelativeProperty, numberRE, relativePropertyRE, _,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require("./Underscore")._;

Utils = require("./Utils");

Config = require("./Config").Config;

Defaults = require("./Defaults").Defaults;

EventEmitter = require("./EventEmitter").EventEmitter;

Frame = require("./Frame").Frame;

LinearAnimator = require("./Animators/LinearAnimator").LinearAnimator;

BezierCurveAnimator = require("./Animators/BezierCurveAnimator").BezierCurveAnimator;

SpringRK4Animator = require("./Animators/SpringRK4Animator").SpringRK4Animator;

SpringDHOAnimator = require("./Animators/SpringDHOAnimator").SpringDHOAnimator;

AnimatorClasses = {
  "linear": LinearAnimator,
  "bezier-curve": BezierCurveAnimator,
  "spring-rk4": SpringRK4Animator,
  "spring-dho": SpringDHOAnimator
};

AnimatorClasses["spring"] = AnimatorClasses["spring-rk4"];

AnimatorClasses["cubic-bezier"] = AnimatorClasses["bezier-curve"];

AnimatorClassBezierPresets = ["ease", "ease-in", "ease-out", "ease-in-out"];

numberRE = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/;

relativePropertyRE = new RegExp('^(?:([+-])=|)(' + numberRE.source + ')([a-z%]*)$', 'i');

isRelativeProperty = function(v) {
  return _.isString(v) && relativePropertyRE.test(v);
};

evaluateRelativeProperty = function(target, k, v) {
  var match, number, rest, sign, unit, _ref;
  _ref = relativePropertyRE.exec(v), match = _ref[0], sign = _ref[1], number = _ref[2], unit = _ref[3], rest = 5 <= _ref.length ? __slice.call(_ref, 4) : [];
  if (sign) {
    return target[k] + (sign + 1) * number;
  } else {
    return +number;
  }
};

exports.Animation = (function(_super) {
  __extends(Animation, _super);

  function Animation(options) {
    if (options == null) {
      options = {};
    }
    this._updateValue = __bind(this._updateValue, this);
    this._update = __bind(this._update, this);
    this._start = __bind(this._start, this);
    this.start = __bind(this.start, this);
    options = Defaults.getDefaults("Animation", options);
    Animation.__super__.constructor.call(this, options);
    this.options = Utils.setDefaultProperties(options, {
      layer: null,
      properties: {},
      curve: "linear",
      curveOptions: {},
      time: 1,
      repeat: 0,
      delay: 0,
      debug: false
    });
    if (options.origin) {
      console.warn("Animation.origin: please use layer.originX and layer.originY");
    }
    if (options.properties instanceof Frame) {
      option.properties = option.properties.properties;
    }
    this.options.properties = this._filterAnimatableProperties(this.options.properties);
    this._parseAnimatorOptions();
    this._originalState = this._currentState();
    this._repeatCounter = this.options.repeat;
  }

  Animation.prototype.start = function() {
    var AnimatorClass, animation, k, property, v, _ref, _ref1, _ref2,
      _this = this;
    if (this.options.layer === null) {
      console.error("Animation: missing layer");
    }
    AnimatorClass = this._animatorClass();
    if (this.options.debug) {
      console.log("Animation.start " + AnimatorClass.name, this.options.curveOptions);
    }
    this._animator = new AnimatorClass(this.options.curveOptions);
    this._target = this.options.layer;
    this._stateA = this._currentState();
    this._stateB = {};
    _ref = this.options.properties;
    for (k in _ref) {
      v = _ref[k];
      if (_.isFunction(v)) {
        v = v();
      } else if (isRelativeProperty(v)) {
        v = evaluateRelativeProperty(this._target, k, v);
      }
      if (this._stateA[k] !== v) {
        this._stateB[k] = v;
      }
    }
    if (_.keys(this._stateA).length === 0) {
      console.warn("Animation: nothing to animate, no animatable properties");
      return false;
    }
    if (_.isEqual(this._stateA, this._stateB)) {
      console.warn("Animation: nothing to animate, all properties are equal to what it is now");
      return false;
    }
    _ref1 = this._target.animatingProperties();
    for (property in _ref1) {
      animation = _ref1[property];
      if (this._stateA.hasOwnProperty(property)) {
        animation.stop();
      }
    }
    if (this.options.debug) {
      console.log("Animation.start");
      _ref2 = this._stateB;
      for (k in _ref2) {
        v = _ref2[k];
        console.log("\t" + k + ": " + this._stateA[k] + " -> " + this._stateB[k]);
      }
    }
    if (this._repeatCounter > 0) {
      this.once("end", function() {
        var _ref3;
        _ref3 = _this._stateA;
        for (k in _ref3) {
          v = _ref3[k];
          _this._target[k] = v;
        }
        _this._repeatCounter--;
        return _this.start();
      });
    }
    if (this.options.delay) {
      Utils.delay(this.options.delay, this._start);
    } else {
      this._start();
    }
    return true;
  };

  Animation.prototype.stop = function(emit) {
    if (emit == null) {
      emit = true;
    }
    this.options.layer._context._animationList = _.without(this.options.layer._context._animationList, this);
    if (emit) {
      this.emit("stop");
    }
    return Framer.Loop.off("update", this._update);
  };

  Animation.prototype.reverse = function() {
    var animation, options;
    options = _.clone(this.options);
    options.properties = this._originalState;
    animation = new Animation(options);
    return animation;
  };

  Animation.prototype.copy = function() {
    return new Animation(_.clone(this.options));
  };

  Animation.prototype.revert = function() {
    return this.reverse();
  };

  Animation.prototype.inverse = function() {
    return this.reverse();
  };

  Animation.prototype.invert = function() {
    return this.reverse();
  };

  Animation.prototype.emit = function(event) {
    Animation.__super__.emit.apply(this, arguments);
    return this.options.layer.emit(event, this);
  };

  Animation.prototype._start = function() {
    this.options.layer._context._animationList.push(this);
    this.emit("start");
    return Framer.Loop.on("update", this._update);
  };

  Animation.prototype._update = function(delta) {
    var emit;
    if (this._animator.finished()) {
      this._updateValue(1);
      this.stop(emit = false);
      this.emit("end");
      return this.emit("stop");
    } else {
      return this._updateValue(this._animator.next(delta));
    }
  };

  Animation.prototype._updateValue = function(value) {
    var k, v, _ref;
    _ref = this._stateB;
    for (k in _ref) {
      v = _ref[k];
      this._target[k] = Utils.mapRange(value, 0, 1, this._stateA[k], this._stateB[k]);
    }
  };

  Animation.prototype._filterAnimatableProperties = function(properties) {
    var animatableProperties, k, v;
    animatableProperties = {};
    for (k in properties) {
      v = properties[k];
      if (_.isNumber(v) || _.isFunction(v) || isRelativeProperty(v)) {
        animatableProperties[k] = v;
      }
    }
    return animatableProperties;
  };

  Animation.prototype._currentState = function() {
    return _.pick(this.options.layer, _.keys(this.options.properties));
  };

  Animation.prototype._animatorClass = function() {
    var animatorClassName, parsedCurve;
    parsedCurve = Utils.parseFunction(this.options.curve);
    animatorClassName = parsedCurve.name.toLowerCase();
    if (AnimatorClasses.hasOwnProperty(animatorClassName)) {
      return AnimatorClasses[animatorClassName];
    }
    if (__indexOf.call(AnimatorClassBezierPresets, animatorClassName) >= 0) {
      return BezierCurveAnimator;
    }
    return LinearAnimator;
  };

  Animation.prototype._parseAnimatorOptions = function() {
    var animatorClass, animatorClassName, i, k, parsedCurve, value, _base, _base1, _i, _j, _len, _len1, _ref, _ref1, _results;
    animatorClass = this._animatorClass();
    parsedCurve = Utils.parseFunction(this.options.curve);
    animatorClassName = parsedCurve.name.toLowerCase();
    if (animatorClass === LinearAnimator || animatorClass === BezierCurveAnimator) {
      if (_.isString(this.options.curveOptions) || _.isArray(this.options.curveOptions)) {
        this.options.curveOptions = {
          values: this.options.curveOptions
        };
      }
      if ((_base = this.options.curveOptions).time == null) {
        _base.time = this.options.time;
      }
    }
    if ((animatorClass === BezierCurveAnimator) && __indexOf.call(AnimatorClassBezierPresets, animatorClassName) >= 0) {
      this.options.curveOptions.values = animatorClassName;
      if ((_base1 = this.options.curveOptions).time == null) {
        _base1.time = this.options.time;
      }
    }
    if (parsedCurve.args.length) {
      if (animatorClass === BezierCurveAnimator) {
        this.options.curveOptions.values = parsedCurve.args.map(function(v) {
          return parseFloat(v) || 0;
        });
      }
      if (animatorClass === SpringRK4Animator) {
        _ref = ["tension", "friction", "velocity"];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          k = _ref[i];
          value = parseFloat(parsedCurve.args[i]);
          if (value) {
            this.options.curveOptions[k] = value;
          }
        }
      }
      if (animatorClass === SpringDHOAnimator) {
        _ref1 = ["stiffness", "damping", "mass", "tolerance"];
        _results = [];
        for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
          k = _ref1[i];
          value = parseFloat(parsedCurve.args[i]);
          if (value) {
            _results.push(this.options.curveOptions[k] = value);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    }
  };

  return Animation;

})(EventEmitter);


},{"./Animators/BezierCurveAnimator":5,"./Animators/LinearAnimator":6,"./Animators/SpringDHOAnimator":7,"./Animators/SpringRK4Animator":8,"./Config":12,"./Defaults":15,"./EventEmitter":17,"./Frame":23,"./Underscore":32,"./Utils":33}],2:[function(require,module,exports){
var AnimationGroup, EventEmitter, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("./Underscore")._;

EventEmitter = require("./EventEmitter").EventEmitter;

AnimationGroup = (function(_super) {
  __extends(AnimationGroup, _super);

  function AnimationGroup(animations) {
    if (animations == null) {
      animations = [];
    }
    this.setAnimations(animations);
    this._currentAnimation = null;
  }

  AnimationGroup.prototype.setAnimations = function(animations) {
    return this._animations = _.map(animations, function(animation) {
      return animation.copy();
    });
  };

  AnimationGroup.prototype.start = function() {
    var _this = this;
    this.emit("start");
    _.map(this._animations, function(animation, index) {
      var nextAnimation;
      nextAnimation = _this._animations[index + 1];
      if (nextAnimation) {
        return animation.on(Events.AnimationEnd, function() {
          nextAnimation.start();
          return _this._currentAnimation = animation;
        });
      } else {
        return animation.on(Events.AnimationEnd, function() {
          _this.emit("end");
          return _this._currentAnimation = null;
        });
      }
    });
    return this._animations[0].start();
  };

  AnimationGroup.prototype.stop = function() {
    var _ref;
    return (_ref = this._currentAnimation) != null ? _ref.stop() : void 0;
  };

  return AnimationGroup;

})(EventEmitter);


},{"./EventEmitter":17,"./Underscore":32}],3:[function(require,module,exports){
var Config, EventEmitter, Utils, getTime, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("./Underscore")._;

Utils = require("./Utils");

Config = require("./Config").Config;

EventEmitter = require("./EventEmitter").EventEmitter;

if (window.performance) {
  getTime = function() {
    return window.performance.now();
  };
} else {
  getTime = function() {
    return Date.now();
  };
}

exports.AnimationLoop = (function(_super) {
  __extends(AnimationLoop, _super);

  function AnimationLoop() {
    this.start = __bind(this.start, this);
    this.delta = 1 / 60;
    this.raf = true;
    if (Utils.webkitVersion() > 600 && Utils.isDesktop()) {
      this.raf = false;
    }
    if (Utils.webkitVersion() > 600 && Utils.isFramerStudio()) {
      this.raf = false;
    }
  }

  AnimationLoop.prototype.start = function() {
    var animationLoop, tick, update, _timestamp;
    animationLoop = this;
    _timestamp = getTime();
    update = function() {
      var delta, timestamp;
      if (animationLoop.delta) {
        delta = animationLoop.delta;
      } else {
        timestamp = getTime();
        delta = (timestamp - _timestamp) / 1000;
        _timestamp = timestamp;
      }
      animationLoop.emit("update", delta);
      return animationLoop.emit("render", delta);
    };
    tick = function(timestamp) {
      if (animationLoop.raf) {
        update();
        return window.requestAnimationFrame(tick);
      } else {
        return window.setTimeout(function() {
          update();
          return window.requestAnimationFrame(tick);
        }, 0);
      }
    };
    return tick();
  };

  return AnimationLoop;

})(EventEmitter);


},{"./Config":12,"./EventEmitter":17,"./Underscore":32,"./Utils":33}],4:[function(require,module,exports){
var Config, Utils;

Utils = require("./Utils");

Config = require("./Config").Config;

exports.Animator = (function() {
  "The animator class is a very simple class that\n	- Takes a set of input values at setup({input values})\n	- Emits an output value for progress (0 -> 1) in value(progress)";
  function Animator(options) {
    if (options == null) {
      options = {};
    }
    this.setup(options);
  }

  Animator.prototype.setup = function(options) {
    throw Error("Not implemented");
  };

  Animator.prototype.next = function(delta) {
    throw Error("Not implemented");
  };

  Animator.prototype.finished = function() {
    throw Error("Not implemented");
  };

  return Animator;

})();


},{"./Config":12,"./Utils":33}],5:[function(require,module,exports){
var Animator, BezierCurveDefaults, UnitBezier, Utils, _, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("../Underscore")._;

Utils = require("../Utils");

Animator = require("../Animator").Animator;

BezierCurveDefaults = {
  "linear": [0, 0, 1, 1],
  "ease": [.25, .1, .25, 1],
  "ease-in": [.42, 0, 1, 1],
  "ease-out": [0, 0, .58, 1],
  "ease-in-out": [.42, 0, .58, 1]
};

exports.BezierCurveAnimator = (function(_super) {
  __extends(BezierCurveAnimator, _super);

  function BezierCurveAnimator() {
    _ref = BezierCurveAnimator.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  BezierCurveAnimator.prototype.setup = function(options) {
    if (_.isString(options) && BezierCurveDefaults.hasOwnProperty(options.toLowerCase())) {
      options = {
        values: BezierCurveDefaults[options.toLowerCase()]
      };
    }
    if (options.values && _.isString(options.values) && BezierCurveDefaults.hasOwnProperty(options.values.toLowerCase())) {
      options = {
        values: BezierCurveDefaults[options.values.toLowerCase()],
        time: options.time
      };
    }
    if (_.isArray(options) && options.length === 4) {
      options = {
        values: options
      };
    }
    this.options = Utils.setDefaultProperties(options, {
      values: BezierCurveDefaults["ease-in-out"],
      time: 1,
      precision: 1 / 1000
    });
    return this._unitBezier = new UnitBezier(this.options.values[0], this.options.values[1], this.options.values[2], this.options.values[3], this._time = 0);
  };

  BezierCurveAnimator.prototype.next = function(delta) {
    this._time += delta;
    if (this.finished()) {
      return 1;
    }
    return this._unitBezier.solve(this._time / this.options.time);
  };

  BezierCurveAnimator.prototype.finished = function() {
    return this._time >= this.options.time - this.options.precision;
  };

  return BezierCurveAnimator;

})(Animator);

UnitBezier = (function() {
  UnitBezier.prototype.epsilon = 1e-6;

  function UnitBezier(p1x, p1y, p2x, p2y) {
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;
    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;
  }

  UnitBezier.prototype.sampleCurveX = function(t) {
    return ((this.ax * t + this.bx) * t + this.cx) * t;
  };

  UnitBezier.prototype.sampleCurveY = function(t) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
  };

  UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
  };

  UnitBezier.prototype.solveCurveX = function(x) {
    var d2, i, t0, t1, t2, x2;
    t2 = x;
    i = 0;
    while (i < 8) {
      x2 = this.sampleCurveX(t2) - x;
      if (Math.abs(x2) < this.epsilon) {
        return t2;
      }
      d2 = this.sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < this.epsilon) {
        break;
      }
      t2 = t2 - x2 / d2;
      i++;
    }
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;
    if (t2 < t0) {
      return t0;
    }
    if (t2 > t1) {
      return t1;
    }
    while (t0 < t1) {
      x2 = this.sampleCurveX(t2);
      if (Math.abs(x2 - x) < this.epsilon) {
        return t2;
      }
      if (x > x2) {
        t0 = t2;
      } else {
        t1 = t2;
      }
      t2 = (t1 - t0) * .5 + t0;
    }
    return t2;
  };

  UnitBezier.prototype.solve = function(x) {
    return this.sampleCurveY(this.solveCurveX(x));
  };

  return UnitBezier;

})();


},{"../Animator":4,"../Underscore":32,"../Utils":33}],6:[function(require,module,exports){
var Animator, Utils, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("../Utils");

Animator = require("../Animator").Animator;

exports.LinearAnimator = (function(_super) {
  __extends(LinearAnimator, _super);

  function LinearAnimator() {
    _ref = LinearAnimator.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  LinearAnimator.prototype.setup = function(options) {
    this.options = Utils.setDefaultProperties(options, {
      time: 1,
      precision: 1 / 1000
    });
    return this._time = 0;
  };

  LinearAnimator.prototype.next = function(delta) {
    this._time += delta;
    if (this.finished()) {
      return 1;
    }
    return this._time / this.options.time;
  };

  LinearAnimator.prototype.finished = function() {
    return this._time >= this.options.time - this.options.precision;
  };

  return LinearAnimator;

})(Animator);


},{"../Animator":4,"../Utils":33}],7:[function(require,module,exports){
var Animator, Utils, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("../Utils");

Animator = require("../Animator").Animator;

exports.SpringDHOAnimator = (function(_super) {
  __extends(SpringDHOAnimator, _super);

  function SpringDHOAnimator() {
    this.finished = __bind(this.finished, this);
    _ref = SpringDHOAnimator.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  SpringDHOAnimator.prototype.setup = function(options) {
    this.options = Utils.setDefaultProperties(options, {
      velocity: 0,
      tolerance: 1 / 10000,
      stiffness: 50,
      damping: 2,
      mass: 0.2,
      time: null
    });
    console.log("SpringDHOAnimator.options", this.options, options);
    this._time = 0;
    this._value = 0;
    return this._velocity = this.options.velocity;
  };

  SpringDHOAnimator.prototype.next = function(delta) {
    var F_damper, F_spring, b, k;
    if (this.finished()) {
      return 1;
    }
    this._time += delta;
    k = 0 - this.options.stiffness;
    b = 0 - this.options.damping;
    F_spring = k * (this._value - 1);
    F_damper = b * this._velocity;
    this._velocity += ((F_spring + F_damper) / this.options.mass) * delta;
    this._value += this._velocity * delta;
    return this._value;
  };

  SpringDHOAnimator.prototype.finished = function() {
    return this._time > 0 && Math.abs(this._velocity) < this.options.tolerance;
  };

  return SpringDHOAnimator;

})(Animator);


},{"../Animator":4,"../Utils":33}],8:[function(require,module,exports){
var Animator, Utils, springAccelerationForState, springEvaluateState, springEvaluateStateWithDerivative, springIntegrateState, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("../Utils");

Animator = require("../Animator").Animator;

exports.SpringRK4Animator = (function(_super) {
  __extends(SpringRK4Animator, _super);

  function SpringRK4Animator() {
    this.finished = __bind(this.finished, this);
    _ref = SpringRK4Animator.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  SpringRK4Animator.prototype.setup = function(options) {
    this.options = Utils.setDefaultProperties(options, {
      tension: 500,
      friction: 10,
      velocity: 0,
      tolerance: 1 / 10000,
      time: null
    });
    this._time = 0;
    this._value = 0;
    this._velocity = this.options.velocity;
    return this._stopSpring = false;
  };

  SpringRK4Animator.prototype.next = function(delta) {
    var finalVelocity, net1DVelocity, netFloat, netValueIsLow, netVelocityIsLow, stateAfter, stateBefore;
    if (this.finished()) {
      return 1;
    }
    this._time += delta;
    stateBefore = {};
    stateAfter = {};
    stateBefore.x = this._value - 1;
    stateBefore.v = this._velocity;
    stateBefore.tension = this.options.tension;
    stateBefore.friction = this.options.friction;
    stateAfter = springIntegrateState(stateBefore, delta);
    this._value = 1 + stateAfter.x;
    finalVelocity = stateAfter.v;
    netFloat = stateAfter.x;
    net1DVelocity = stateAfter.v;
    netValueIsLow = Math.abs(netFloat) < this.options.tolerance;
    netVelocityIsLow = Math.abs(net1DVelocity) < this.options.tolerance;
    this._stopSpring = netValueIsLow && netVelocityIsLow;
    this._velocity = finalVelocity;
    return this._value;
  };

  SpringRK4Animator.prototype.finished = function() {
    return this._stopSpring;
  };

  return SpringRK4Animator;

})(Animator);

springAccelerationForState = function(state) {
  return -state.tension * state.x - state.friction * state.v;
};

springEvaluateState = function(initialState) {
  var output;
  output = {};
  output.dx = initialState.v;
  output.dv = springAccelerationForState(initialState);
  return output;
};

springEvaluateStateWithDerivative = function(initialState, dt, derivative) {
  var output, state;
  state = {};
  state.x = initialState.x + derivative.dx * dt;
  state.v = initialState.v + derivative.dv * dt;
  state.tension = initialState.tension;
  state.friction = initialState.friction;
  output = {};
  output.dx = state.v;
  output.dv = springAccelerationForState(state);
  return output;
};

springIntegrateState = function(state, speed) {
  var a, b, c, d, dvdt, dxdt;
  a = springEvaluateState(state);
  b = springEvaluateStateWithDerivative(state, speed * 0.5, a);
  c = springEvaluateStateWithDerivative(state, speed * 0.5, b);
  d = springEvaluateStateWithDerivative(state, speed, c);
  dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx);
  dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);
  state.x = state.x + dxdt * speed;
  state.v = state.v + dvdt * speed;
  return state;
};


},{"../Animator":4,"../Utils":33}],9:[function(require,module,exports){
var Layer,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layer = require("./Layer").Layer;

"Todo: make it work in a parent layer";

exports.BackgroundLayer = (function(_super) {
  __extends(BackgroundLayer, _super);

  function BackgroundLayer(options) {
    if (options == null) {
      options = {};
    }
    this.layout = __bind(this.layout, this);
    if (options.backgroundColor == null) {
      options.backgroundColor = "#fff";
    }
    BackgroundLayer.__super__.constructor.call(this, options);
    this.sendToBack();
    this.layout();
    this._context.eventManager.wrap(window).addEventListener("resize", this.layout);
  }

  BackgroundLayer.prototype.layout = function() {
    if (this.superLayer) {
      return this.frame = {
        x: 0,
        y: 0,
        width: this.superLayer.width,
        height: this.superLayer.height
      };
    } else if (this._context._parentLayer) {
      return this.frame = {
        x: 0,
        y: 0,
        width: this._context._parentLayer.width,
        height: this._context._parentLayer.height
      };
    } else {
      return this.frame = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
  };

  return BackgroundLayer;

})(Layer);


},{"./Layer":26}],10:[function(require,module,exports){
var CounterKey, DefinedPropertiesKey, DefinedPropertiesValuesKey, EventEmitter, Utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("./Underscore")._;

Utils = require("./Utils");

EventEmitter = require("./EventEmitter").EventEmitter;

CounterKey = "_ObjectCounter";

DefinedPropertiesKey = "_DefinedPropertiesKey";

DefinedPropertiesValuesKey = "_DefinedPropertiesValuesKey";

exports.BaseClass = (function(_super) {
  __extends(BaseClass, _super);

  BaseClass.define = function(propertyName, descriptor) {
    if (this !== BaseClass && descriptor.exportable === true) {
      descriptor.propertyName = propertyName;
      if (this[DefinedPropertiesKey] == null) {
        this[DefinedPropertiesKey] = {};
      }
      this[DefinedPropertiesKey][propertyName] = descriptor;
    }
    Object.defineProperty(this.prototype, propertyName, descriptor);
    return Object.__;
  };

  BaseClass.simpleProperty = function(name, fallback, exportable) {
    if (exportable == null) {
      exportable = true;
    }
    return {
      exportable: exportable,
      "default": fallback,
      get: function() {
        return this._getPropertyValue(name);
      },
      set: function(value) {
        return this._setPropertyValue(name, value);
      }
    };
  };

  BaseClass.prototype._setPropertyValue = function(k, v) {
    return this[DefinedPropertiesValuesKey][k] = v;
  };

  BaseClass.prototype._getPropertyValue = function(k) {
    return Utils.valueOrDefault(this[DefinedPropertiesValuesKey][k], this._getPropertyDefaultValue(k));
  };

  BaseClass.prototype._getPropertyDefaultValue = function(k) {
    return this.constructor[DefinedPropertiesKey][k]["default"];
  };

  BaseClass.prototype._propertyList = function() {
    return this.constructor[DefinedPropertiesKey];
  };

  BaseClass.prototype.keys = function() {
    return _.keys(this.properties);
  };

  BaseClass.define("properties", {
    get: function() {
      var k, properties, v, _ref;
      properties = {};
      _ref = this.constructor[DefinedPropertiesKey];
      for (k in _ref) {
        v = _ref[k];
        if (v.exportable !== false) {
          properties[k] = this[k];
        }
      }
      return properties;
    },
    set: function(value) {
      var k, v, _results;
      _results = [];
      for (k in value) {
        v = value[k];
        if (this.constructor[DefinedPropertiesKey].hasOwnProperty(k)) {
          if (this.constructor[DefinedPropertiesKey].exportable !== false) {
            _results.push(this[k] = v);
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });

  BaseClass.define("id", {
    get: function() {
      return this._id;
    }
  });

  BaseClass.prototype.toString = function() {
    var properties;
    properties = _.map(this.properties, (function(v, k) {
      return "" + k + ":" + v;
    }), 4);
    return "[" + this.constructor.name + " id:" + this.id + " " + (properties.join(" ")) + "]";
  };

  function BaseClass(options) {
    this.toString = __bind(this.toString, this);
    this._getPropertyValue = __bind(this._getPropertyValue, this);
    this._setPropertyValue = __bind(this._setPropertyValue, this);
    var descriptor, name, _base, _ref;
    BaseClass.__super__.constructor.apply(this, arguments);
    this._context = typeof Framer !== "undefined" && Framer !== null ? Framer.CurrentContext : void 0;
    this[DefinedPropertiesValuesKey] = {};
    if ((_base = this.constructor)[CounterKey] == null) {
      _base[CounterKey] = 0;
    }
    this.constructor[CounterKey] += 1;
    this._id = this.constructor[CounterKey];
    _ref = this.constructor[DefinedPropertiesKey];
    for (name in _ref) {
      descriptor = _ref[name];
      this[name] = Utils.valueOrDefault(options != null ? options[name] : void 0, this._getPropertyDefaultValue(name));
    }
  }

  return BaseClass;

})(EventEmitter);


},{"./EventEmitter":17,"./Underscore":32,"./Utils":33}],11:[function(require,module,exports){
var CompatImageView, CompatLayer, CompatScrollView, CompatView, Layer, compatProperty, compatWarning, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layer = require("./Layer").Layer;

compatWarning = function(msg) {
  return console.warn(msg);
};

compatProperty = function(name, originalName) {
  return {
    exportable: false,
    get: function() {
      compatWarning("" + originalName + " is a deprecated property");
      return this[name];
    },
    set: function(value) {
      compatWarning("" + originalName + " is a deprecated property");
      return this[name] = value;
    }
  };
};

CompatLayer = (function(_super) {
  var addSubView, removeSubView;

  __extends(CompatLayer, _super);

  function CompatLayer(options) {
    if (options == null) {
      options = {};
    }
    if (options.hasOwnProperty("superView")) {
      options.superLayer = options.superView;
    }
    CompatLayer.__super__.constructor.call(this, options);
  }

  CompatLayer.define("superView", compatProperty("superLayer", "superView"));

  CompatLayer.define("subViews", compatProperty("subLayers", "subViews"));

  CompatLayer.define("siblingViews", compatProperty("siblingLayers", "siblingViews"));

  addSubView = function(layer) {
    return this.addSubLayer(layer);
  };

  removeSubView = function(layer) {
    return this.removeSubLayer(layer);
  };

  return CompatLayer;

})(Layer);

CompatView = (function(_super) {
  __extends(CompatView, _super);

  function CompatView(options) {
    if (options == null) {
      options = {};
    }
    compatWarning("Views are now called Layers");
    CompatView.__super__.constructor.call(this, options);
  }

  return CompatView;

})(CompatLayer);

CompatImageView = (function(_super) {
  __extends(CompatImageView, _super);

  function CompatImageView() {
    _ref = CompatImageView.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return CompatImageView;

})(CompatView);

CompatScrollView = (function(_super) {
  __extends(CompatScrollView, _super);

  function CompatScrollView() {
    CompatScrollView.__super__.constructor.apply(this, arguments);
    this.scroll = true;
  }

  return CompatScrollView;

})(CompatView);

window.Layer = CompatLayer;

window.Framer.Layer = CompatLayer;

window.View = CompatView;

window.ImageView = CompatImageView;

window.ScrollView = CompatScrollView;

window.utils = window.Utils;


},{"./Layer":26}],12:[function(require,module,exports){
var FramerCSS, Utils;

Utils = require("./Utils");

FramerCSS = "body {\n	margin: 0;\n}\n\n.framerContext {	\n	position: absolute;\n	left: 0;\n	top: 0;\n	right: 0;\n	bottom: 0;\n	pointer-events: none;\n	overflow: hidden;\n}\n\n.framerLayer {\n	display: block;\n	position: absolute;\n	background-repeat: no-repeat;\n	background-size: cover;\n	-webkit-overflow-scrolling: touch;\n	-webkit-box-sizing: border-box;\n	-webkit-user-select: none;\n}\n\n.framerLayer input,\n.framerLayer textarea,\n.framerLayer select,\n.framerLayer option,\n.framerLayer div[contenteditable=true]\n{\n	pointer-events: auto;\n	-webkit-user-select: auto;\n}\n\n.framerDebug {\n	padding: 6px;\n	color: #fff;\n	font: 10px/1em Monaco;\n}\n";

Utils.domComplete(function() {
  return Utils.insertCSS(FramerCSS);
});


},{"./Utils":33}],13:[function(require,module,exports){
var Config, Counter, EventEmitter, EventManager, Utils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("./Utils");

_ = require("./Underscore")._;

Config = require("./Config").Config;

EventManager = require("./EventManager").EventManager;

EventEmitter = require("./EventEmitter").EventEmitter;

Counter = 1;

exports.Context = (function(_super) {
  __extends(Context, _super);

  function Context(options) {
    if (options == null) {
      options = {};
    }
    Context.__super__.constructor.apply(this, arguments);
    Counter++;
    options = Utils.setDefaultProperties(options, {
      contextName: null,
      parentLayer: null,
      name: null
    });
    if (!options.name) {
      throw Error("Contexts need a name");
    }
    this._parentLayer = options.parentLayer;
    this._name = options.name;
    this.reset();
  }

  Context.prototype.reset = function() {
    var animation, _i, _len, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
    if ((_ref = this.eventManager) != null) {
      _ref.reset();
    }
    this.eventManager = new EventManager;
    if ((_ref1 = this._rootElement) != null) {
      if ((_ref2 = _ref1.parentNode) != null) {
        if (typeof _ref2.removeChild === "function") {
          _ref2.removeChild(this._rootElement);
        }
      }
    }
    this._rootElement = this._createRootElement();
    if ((_ref3 = this._delayTimers) != null) {
      _ref3.map(function(timer) {
        return window.clearTimeout(timer);
      });
    }
    if ((_ref4 = this._delayIntervals) != null) {
      _ref4.map(function(timer) {
        return window.clearInterval(timer);
      });
    }
    if (this._animationList) {
      _ref5 = this._animationList;
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        animation = _ref5[_i];
        animation.stop(false);
      }
    }
    this._layerList = [];
    this._animationList = [];
    this._delayTimers = [];
    this._delayIntervals = [];
    return this.emit("reset", this);
  };

  Context.prototype.getRootElement = function() {
    return this._rootElement;
  };

  Context.prototype.getLayers = function() {
    return _.clone(this._layerList);
  };

  Context.prototype._createRootElement = function() {
    var element, parentElement, _ref;
    element = document.createElement("div");
    element.id = "FramerContextRoot-" + this._name;
    element.classList.add("framerContext");
    parentElement = (_ref = this._parentLayer) != null ? _ref._element : void 0;
    Framer.Loop.once("render", function() {
      if (parentElement == null) {
        parentElement = document.body;
      }
      return parentElement.appendChild(element);
    });
    return element;
  };

  Context.prototype.run = function(f) {
    var previousContext;
    previousContext = Framer.CurrentContext;
    Framer.CurrentContext = this;
    f();
    return Framer.CurrentContext = previousContext;
  };

  return Context;

})(EventEmitter);


},{"./Config":12,"./EventEmitter":17,"./EventManager":18,"./Underscore":32,"./Utils":33}],14:[function(require,module,exports){
var Context, EventKeys, Utils, errorWarning, hideDebug, showDebug, toggleDebug, _debugStyle, _errorContext, _errorShown;

Utils = require("./Utils");

Context = require("./Context").Context;

_debugStyle = {
  border: "1px solid rgba(50,150,200,.35)",
  backgroundColor: "rgba(50,150,200,.35)"
};

showDebug = function() {
  var layer, _i, _len, _ref, _results;
  _ref = Framer.CurrentContext.getLayers();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    layer = _ref[_i];
    layer._debugStyle = _.pick(layer.style, _.keys(_debugStyle));
    layer.style = _debugStyle;
    layer._debugElement = document.createElement("div");
    layer._debugElement.innerHTML = layer.name || layer.id;
    layer._debugElement.classList.add("framerDebug");
    _results.push(layer._element.appendChild(layer._debugElement));
  }
  return _results;
};

hideDebug = function() {
  var layer, _i, _len, _ref, _results;
  _ref = Framer.CurrentContext.getLayers();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    layer = _ref[_i];
    layer.style = layer._debugStyle;
    layer._debugElement.parentElement.removeChild(layer._debugElement);
    _results.push(layer._debugElement = null);
  }
  return _results;
};

toggleDebug = Utils.toggle(showDebug, hideDebug);

EventKeys = {
  Shift: 16,
  Escape: 27
};

window.document.onkeyup = function(event) {
  if (event.keyCode === EventKeys.Escape) {
    return toggleDebug()();
  }
};

_errorContext = null;

_errorShown = false;

errorWarning = function(event) {
  var layer, _errorWarningLayer;
  if (!_errorContext) {
    _errorContext = new Context({
      name: "Error"
    });
  }
  if (_errorShown) {
    return;
  }
  _errorShown = true;
  layer = new Layer({
    x: 20,
    y: -50,
    width: 300,
    height: 40
  });
  layer.states.add({
    visible: {
      x: 20,
      y: 20,
      width: 300,
      height: 40
    }
  });
  layer.html = "Javascript Error, see the console";
  layer.style = {
    font: "12px/1.35em Menlo",
    color: "white",
    textAlign: "center",
    lineHeight: "" + layer.height + "px",
    borderRadius: "5px",
    backgroundColor: "rgba(255,0,0,.8)"
  };
  layer.states.animationOptions = {
    curve: "spring",
    curveOptions: {
      tension: 1000,
      friction: 30
    }
  };
  layer.states["switch"]("visible");
  layer.on(Events.Click, function() {
    return this.states["switch"]("default");
  });
  return _errorWarningLayer = layer;
};

window.error = errorWarning;


},{"./Context":13,"./Utils":33}],15:[function(require,module,exports){
var Originals, Utils, _;

_ = require("./Underscore")._;

Utils = require("./Utils");

Originals = {
  Layer: {
    backgroundColor: "rgba(0,124,255,.5)",
    width: 100,
    height: 100
  },
  Animation: {
    curve: "linear",
    time: 1
  },
  DeviceView: {
    fullScreen: false,
    padding: 50,
    deviceType: "iphone-5s-spacegray",
    deviceZoom: "fit",
    contentZoom: 1,
    orientation: "portrait",
    keyboard: false,
    animationOptions: {
      curve: "spring(400,40,0)"
    }
  }
};

exports.Defaults = {
  getDefaults: function(className, options) {
    var defaults, k, v, _ref;
    defaults = _.clone(Originals[className]);
    _ref = Framer.Defaults[className];
    for (k in _ref) {
      v = _ref[k];
      defaults[k] = _.isFunction(v) ? v() : v;
    }
    for (k in defaults) {
      v = defaults[k];
      if (!options.hasOwnProperty(k)) {
        options[k] = v;
      }
    }
    return options;
  },
  setup: function() {
    var className, classValues, k, v, _ref;
    if (window.FramerDefaults) {
      _ref = window.FramerDefaults;
      for (className in _ref) {
        classValues = _ref[className];
        for (k in classValues) {
          v = classValues[k];
          Originals[className][k] = v;
        }
      }
    }
    return exports.Defaults.reset();
  },
  reset: function() {
    return window.Framer.Defaults = _.clone(Originals);
  }
};


},{"./Underscore":32,"./Utils":33}],16:[function(require,module,exports){
var AppleWatch38Device, AppleWatch42Device, BaseClass, Defaults, DeviceViewDefaultDevice, Devices, Events, Layer, Nexus5BaseDevice, Nexus5BaseDeviceHand, Utils, iPadAirBaseDevice, iPadAirBaseDeviceHand, iPadMiniBaseDevice, iPadMiniBaseDeviceHand, iPhone5BaseDevice, iPhone5BaseDeviceHand, iPhone5CBaseDevice, iPhone5CBaseDeviceHand, iPhone6BaseDevice, iPhone6BaseDeviceHand, iPhone6PlusBaseDevice, iPhone6PlusBaseDeviceHand, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("./Utils");

_ = require("./Underscore")._;

DeviceViewDefaultDevice = "iphone-6-silver";

BaseClass = require("./BaseClass").BaseClass;

Layer = require("./Layer").Layer;

Defaults = require("./Defaults").Defaults;

Events = require("./Events").Events;

/*

Device._setup()
Device._update()
Device._setupContext()

Device.fullScreen bool
Device.deviceType str
Device.padding int

Device.orientation(orientation:float)
Device.orientationName landscape|portrait|unknown
Device.rotateLeft()
Device.rotateRight()

Device.setDeviceScale(zoom:float, animate:bool)
Device.setContentScale(zoom:float, animate:bool)

Device.keyboard bool
Device.setKeyboard(visible:bool, animate:bool)
Device.showKeyboard(animate:bool)
Device.hideKeyboard(animate:bool)
Device.toggleKeyboard(animate:bool)


# Events
Events.DeviceTypeDidChange
Events.DeviceFullScreenDidChange
Events.DeviceKeyboardWillShow
Events.DeviceKeyboardDidShow
*/


exports.DeviceView = (function(_super) {
  __extends(DeviceView, _super);

  function DeviceView(options) {
    var defaults;
    if (options == null) {
      options = {};
    }
    this._animateKeyboard = __bind(this._animateKeyboard, this);
    this._updateDeviceImage = __bind(this._updateDeviceImage, this);
    this._update = __bind(this._update, this);
    defaults = Defaults.getDefaults("DeviceView", options);
    this._setup();
    this.animationOptions = defaults.animationOptions;
    this.deviceType = defaults.deviceType;
    _.extend(this, Utils.setDefaultProperties(options, defaults));
  }

  DeviceView.prototype._setup = function() {
    var layer, _i, _len, _ref, _results,
      _this = this;
    if (this._setupDone) {
      return;
    }
    this._setupDone = true;
    this.background = new Layer;
    this.background.clip = true;
    this.background.backgroundColor = "transparent";
    this.background.classList.add("DeviceBackground");
    this.phone = new Layer;
    this.screen = new Layer({
      superLayer: this.phone
    });
    this.viewport = new Layer({
      superLayer: this.screen
    });
    this.content = new Layer({
      superLayer: this.viewport
    });
    this.phone.backgroundColor = "transparent";
    this.phone.classList.add("DevicePhone");
    this.screen.backgroundColor = "transparent";
    this.screen.classList.add("DeviceScreen");
    this.viewport.backgroundColor = "transparent";
    this.viewport.classList.add("DeviceViewPort");
    this.content.backgroundColor = "transparent";
    this.content.classList.add("DeviceContent");
    this.content.originX = 0;
    this.content.originY = 0;
    this.keyboardLayer = new Layer({
      superLayer: this.viewport
    });
    this.keyboardLayer.on("click", function() {
      return _this.toggleKeyboard();
    });
    this.keyboardLayer.classList.add("DeviceKeyboard");
    this.keyboardLayer.backgroundColor = "transparent";
    Framer.CurrentContext.eventManager.wrap(window).addEventListener("resize", this._update);
    _ref = [this.background, this.phone, this.viewport, this.content, this.screen];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      _results.push(layer.on("touchmove", function(event) {
        return event.preventDefault();
      }));
    }
    return _results;
  };

  DeviceView.prototype._update = function() {
    var backgroundOverlap, contentScaleFactor, height, layer, width, _i, _len, _ref, _ref1;
    contentScaleFactor = this.contentScale;
    if (contentScaleFactor > 1) {
      contentScaleFactor = 1;
    }
    if (this._shouldRenderFullScreen()) {
      _ref = [this.background, this.phone, this.viewport, this.content, this.screen];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        layer = _ref[_i];
        layer.x = layer.y = 0;
        layer.width = window.innerWidth / contentScaleFactor;
        layer.height = window.innerHeight / contentScaleFactor;
        layer.scale = 1;
      }
      this.content.scale = contentScaleFactor;
      return this._positionKeyboard();
    } else {
      backgroundOverlap = 100;
      this.background.x = 0 - backgroundOverlap;
      this.background.y = 0 - backgroundOverlap;
      this.background.width = window.innerWidth + (2 * backgroundOverlap);
      this.background.height = window.innerHeight + (2 * backgroundOverlap);
      this.phone.scale = this._calculatePhoneScale();
      this.phone.center();
      _ref1 = this._getOrientationDimensions(this._device.screenWidth / contentScaleFactor, this._device.screenHeight / contentScaleFactor), width = _ref1[0], height = _ref1[1];
      this.screen.width = this._device.screenWidth;
      this.screen.height = this._device.screenHeight;
      this.viewport.width = this.content.width = width;
      this.viewport.height = this.content.height = height;
      return this.screen.center();
    }
  };

  DeviceView.prototype._shouldRenderFullScreen = function() {
    if (!this._device) {
      return true;
    }
    if (this.fullScreen === true) {
      return true;
    }
    if (this.deviceType === "fullscreen") {
      return true;
    }
    if (Utils.deviceType() === this._device.deviceType) {
      return true;
    }
    return false;
  };

  DeviceView.prototype._deviceImageUrl = function(name) {
    var resourceUrl;
    if (!name) {
      return null;
    }
    if (Utils.isFramerStudio() && window.FramerStudioInfo) {
      resourceUrl = window.FramerStudioInfo.deviceImagesUrl;
    } else {
      resourceUrl = "//resources.framerjs.com/static/DeviceResources";
    }
    if (Utils.isJP2Supported()) {
      return "" + resourceUrl + "/" + (name.replace(".png", ".jp2"));
    } else {
      return "" + resourceUrl + "/" + name;
    }
  };

  DeviceView.prototype.setupContext = function() {
    this._context = new Framer.Context({
      parentLayer: this.content,
      name: "Device"
    });
    return Framer.CurrentContext = this._context;
  };

  DeviceView.define("fullScreen", {
    get: function() {
      return this._fullScreen;
    },
    set: function(fullScreen) {
      return this._setFullScreen(fullScreen);
    }
  });

  DeviceView.prototype._setFullScreen = function(fullScreen) {
    if (this._deviceType === "fullscreen") {
      return;
    }
    if (!_.isBool(fullScreen)) {
      return;
    }
    if (fullScreen === this._fullScreen) {
      return;
    }
    this._fullScreen = fullScreen;
    if (fullScreen === true) {
      this.phone.image = "";
    } else {
      this._updateDeviceImage();
    }
    this._update();
    this.keyboard = false;
    this._positionKeyboard();
    return this.emit("change:fullScreen");
  };

  DeviceView.define("deviceType", {
    get: function() {
      return this._deviceType;
    },
    set: function(deviceType) {
      var device, shouldZoomToFit;
      if (deviceType === this._deviceType) {
        return;
      }
      device = null;
      if (_.isString(deviceType)) {
        device = Devices[deviceType.toLowerCase()];
      }
      if (!device) {
        throw Error("No device named " + deviceType + ". Options are: " + (_.keys(Devices)));
      }
      if (this._device === device) {
        return;
      }
      shouldZoomToFit = this._deviceType === "fullscreen";
      this._device = _.clone(device);
      this._deviceType = deviceType;
      this.fullscreen = false;
      this._updateDeviceImage();
      this._update();
      this.keyboard = false;
      this._positionKeyboard();
      this.emit("change:deviceType");
      if (shouldZoomToFit) {
        return this.deviceScale = "fit";
      }
    }
  });

  DeviceView.prototype._updateDeviceImage = function() {
    if (this._shouldRenderFullScreen()) {
      return this.phone.image = "";
    } else {
      this.phone._cacheImage = true;
      this.phone.image = this._deviceImageUrl("" + this._deviceType + ".png");
      this.phone.width = this._device.deviceImageWidth;
      return this.phone.height = this._device.deviceImageHeight;
    }
  };

  DeviceView.define("deviceScale", {
    get: function() {
      if (this._shouldRenderFullScreen()) {
        return 1;
      }
      return this._deviceScale || 1;
    },
    set: function(deviceScale) {
      return this.setDeviceScale(deviceScale, false);
    }
  });

  DeviceView.prototype.setDeviceScale = function(deviceScale, animate) {
    var phoneScale;
    if (animate == null) {
      animate = false;
    }
    if (deviceScale === "fit" || deviceScale < 0) {
      deviceScale = "fit";
    } else {
      deviceScale = parseFloat(deviceScale);
    }
    if (deviceScale === this._deviceScale) {
      return;
    }
    this._deviceScale = deviceScale;
    if (this._shouldRenderFullScreen()) {
      return;
    }
    if (deviceScale === "fit") {
      phoneScale = this._calculatePhoneScale();
    } else {
      phoneScale = deviceScale;
    }
    this.phone.animateStop();
    if (animate) {
      this.phone.animate(_.extend(this.animationOptions, {
        properties: {
          scale: phoneScale
        }
      }));
    } else {
      this.phone.scale = phoneScale;
      this.phone.center();
    }
    return this.emit("change:deviceScale");
  };

  DeviceView.prototype._calculatePhoneScale = function() {
    var height, paddingOffset, phoneScale, width, _ref, _ref1;
    if (this._deviceScale && this._deviceScale !== "fit") {
      return this._deviceScale;
    }
    _ref = this._getOrientationDimensions(this.phone.width, this.phone.height), width = _ref[0], height = _ref[1];
    paddingOffset = ((_ref1 = this._device) != null ? _ref1.paddingOffset : void 0) || 0;
    phoneScale = _.min([(window.innerWidth - ((this.padding + paddingOffset) * 2)) / width, (window.innerHeight - ((this.padding + paddingOffset) * 2)) / height]);
    return phoneScale;
  };

  DeviceView.define("contentScale", {
    get: function() {
      return this._contentScale || 1;
    },
    set: function(contentScale) {
      return this.setContentScale(contentScale, false);
    }
  });

  DeviceView.prototype.setContentScale = function(contentScale, animate) {
    if (animate == null) {
      animate = false;
    }
    contentScale = parseFloat(contentScale);
    if (contentScale <= 0) {
      return;
    }
    if (contentScale === this._contentScale) {
      return;
    }
    this._contentScale = contentScale;
    if (animate) {
      this.content.animate(_.extend(this.animationOptions, {
        properties: {
          scale: this._contentScale
        }
      }));
    } else {
      this.content.scale = this._contentScale;
    }
    this._update();
    return this.emit("change:contentScale");
  };

  DeviceView.define("orientation", {
    get: function() {
      return this._orientation || 0;
    },
    set: function(orientation) {
      return this.setOrientation(orientation, false);
    }
  });

  DeviceView.prototype.setOrientation = function(orientation, animate) {
    var animation, contentProperties, height, phoneProperties, width, x, y, _hadKeyboard, _ref, _ref1,
      _this = this;
    if (animate == null) {
      animate = false;
    }
    if (orientation === "portrait") {
      orientation = 0;
    }
    if (orientation === "landscape") {
      orientation = 90;
    }
    if (this._shouldRenderFullScreen()) {
      return;
    }
    orientation = parseInt(orientation);
    if (orientation !== 0 && orientation !== 90 && orientation !== (-90)) {
      return;
    }
    if (orientation === this._orientation) {
      return;
    }
    this._orientation = orientation;
    phoneProperties = {
      rotationZ: this._orientation,
      scale: this._calculatePhoneScale()
    };
    _ref = this._getOrientationDimensions(this._device.screenWidth, this._device.screenHeight), width = _ref[0], height = _ref[1];
    _ref1 = [(this.screen.width - width) / 2, (this.screen.height - height) / 2], x = _ref1[0], y = _ref1[1];
    contentProperties = {
      rotationZ: -this._orientation,
      width: width,
      height: height,
      x: x,
      y: y
    };
    _hadKeyboard = this.keyboard;
    if (_hadKeyboard) {
      this.hideKeyboard(false);
    }
    this.phone.animateStop();
    this.viewport.animateStop();
    if (animate) {
      animation = this.phone.animate(_.extend(this.animationOptions, {
        properties: phoneProperties
      }));
      this.viewport.animate(_.extend(this.animationOptions, {
        properties: contentProperties
      }));
      animation.on(Events.AnimationEnd, function() {
        return _this._update();
      });
      if (_hadKeyboard) {
        animation.on(Events.AnimationEnd, function() {
          return _this.showKeyboard(true);
        });
      }
    } else {
      this.phone.properties = phoneProperties;
      this.viewport.properties = contentProperties;
      this._update();
      if (_hadKeyboard) {
        this.showKeyboard(true);
      }
    }
    this._renderKeyboard();
    return this.emit("change:orientation");
  };

  DeviceView.prototype.isPortrait = function() {
    return Math.abs(this._orientation) !== 90;
  };

  DeviceView.prototype.isLandscape = function() {
    return !this.isPortrait();
  };

  DeviceView.define("orientationName", {
    get: function() {
      if (this.isPortrait()) {
        return "portrait";
      }
      if (this.isLandscape()) {
        return "landscape";
      }
    },
    set: function(orientationName) {
      return this.setOrientation(orientationName, false);
    }
  });

  DeviceView.prototype.rotateLeft = function(animate) {
    if (animate == null) {
      animate = true;
    }
    if (this.orientation === 90) {
      return;
    }
    return this.setOrientation(this.orientation + 90, animate);
  };

  DeviceView.prototype.rotateRight = function(animate) {
    if (animate == null) {
      animate = true;
    }
    if (this.orientation === -90) {
      return;
    }
    return this.setOrientation(this.orientation - 90, animate);
  };

  DeviceView.prototype._getOrientationDimensions = function(width, height) {
    if (this.isLandscape()) {
      return [height, width];
    } else {
      return [width, height];
    }
  };

  DeviceView.define("keyboard", {
    get: function() {
      return this._keyboard;
    },
    set: function(keyboard) {
      return this.setKeyboard(keyboard, false);
    }
  });

  DeviceView.prototype.setKeyboard = function(keyboard, animate) {
    var _ref, _ref1,
      _this = this;
    if (animate == null) {
      animate = false;
    }
    if (!this._device.hasOwnProperty("keyboards")) {
      return;
    }
    if (_.isString(keyboard)) {
      if ((_ref = keyboard.toLowerCase()) === "1" || _ref === "true") {
        keyboard = true;
      } else if ((_ref1 = keyboard.toLowerCase()) === "0" || _ref1 === "false") {
        keyboard = false;
      } else {
        return;
      }
    }
    if (!_.isBool(keyboard)) {
      return;
    }
    if (keyboard === this._keyboard) {
      return;
    }
    this._keyboard = keyboard;
    this.emit("change:keyboard");
    if (keyboard === true) {
      this.emit("keyboard:show:start");
      return this._animateKeyboard(this._keyboardShowY(), animate, function() {
        return _this.emit("keyboard:show:end");
      });
    } else {
      this.emit("keyboard:hide:start");
      return this._animateKeyboard(this._keyboardHideY(), animate, function() {
        return _this.emit("keyboard:hide:end");
      });
    }
  };

  DeviceView.prototype.showKeyboard = function(animate) {
    if (animate == null) {
      animate = true;
    }
    return this.setKeyboard(true, animate);
  };

  DeviceView.prototype.hideKeyboard = function(animate) {
    if (animate == null) {
      animate = true;
    }
    return this.setKeyboard(false, animate);
  };

  DeviceView.prototype.toggleKeyboard = function(animate) {
    if (animate == null) {
      animate = true;
    }
    return this.setKeyboard(!this.keyboard, animate);
  };

  DeviceView.prototype._renderKeyboard = function() {
    if (!this._device.keyboards) {
      return;
    }
    this.keyboardLayer.image = this._deviceImageUrl(this._device.keyboards[this.orientationName].image);
    this.keyboardLayer.width = this._device.keyboards[this.orientationName].width;
    return this.keyboardLayer.height = this._device.keyboards[this.orientationName].height;
  };

  DeviceView.prototype._positionKeyboard = function() {
    this.keyboardLayer.centerX();
    if (this.keyboard) {
      return this._animateKeyboard(this._keyboardShowY(), false);
    } else {
      return this._animateKeyboard(this._keyboardHideY(), false);
    }
  };

  DeviceView.prototype._animateKeyboard = function(y, animate, callback) {
    var animation;
    this.keyboardLayer.bringToFront();
    this.keyboardLayer.animateStop();
    if (animate === false) {
      this.keyboardLayer.y = y;
      return typeof callback === "function" ? callback() : void 0;
    } else {
      animation = this.keyboardLayer.animate(_.extend(this.animationOptions, {
        properties: {
          y: y
        }
      }));
      return animation.on(Events.AnimationEnd, callback);
    }
  };

  DeviceView.prototype._keyboardShowY = function() {
    return this.viewport.height - this.keyboardLayer.height;
  };

  DeviceView.prototype._keyboardHideY = function() {
    return this.viewport.height;
  };

  return DeviceView;

})(BaseClass);

iPhone6BaseDevice = {
  deviceImageWidth: 870,
  deviceImageHeight: 1738,
  screenWidth: 750,
  screenHeight: 1334,
  deviceType: "phone"
};

iPhone6BaseDeviceHand = _.extend({}, iPhone6BaseDevice, {
  deviceImageWidth: 1988,
  deviceImageHeight: 2368,
  paddingOffset: -150
});

iPhone6PlusBaseDevice = {
  deviceImageWidth: 1280,
  deviceImageHeight: 2524,
  screenWidth: 1080,
  screenHeight: 1920,
  deviceType: "phone"
};

iPhone6PlusBaseDeviceHand = _.extend({}, iPhone6PlusBaseDevice, {
  deviceImageWidth: 2720,
  deviceImageHeight: 3032,
  paddingOffset: -150
});

iPhone5BaseDevice = {
  deviceImageWidth: 780,
  deviceImageHeight: 1608,
  screenWidth: 640,
  screenHeight: 1136,
  deviceType: "phone"
};

iPhone5BaseDeviceHand = _.extend({}, iPhone5BaseDevice, {
  deviceImageWidth: 1884,
  deviceImageHeight: 2234,
  paddingOffset: -200
});

iPhone5CBaseDevice = {
  deviceImageWidth: 776,
  deviceImageHeight: 1612,
  screenWidth: 640,
  screenHeight: 1136,
  deviceType: "phone"
};

iPhone5CBaseDeviceHand = _.extend({}, iPhone5CBaseDevice, {
  deviceImageWidth: 1894,
  deviceImageHeight: 2244,
  paddingOffset: -200
});

iPadMiniBaseDevice = {
  deviceImageWidth: 872,
  deviceImageHeight: 1292,
  screenWidth: 768,
  screenHeight: 1024,
  deviceType: "tablet"
};

iPadMiniBaseDeviceHand = _.extend({}, iPadMiniBaseDevice, {
  deviceImageWidth: 1380,
  deviceImageHeight: 2072,
  paddingOffset: -120
});

iPadAirBaseDevice = {
  deviceImageWidth: 1769,
  deviceImageHeight: 2509,
  screenWidth: 1536,
  screenHeight: 2048,
  deviceType: "tablet"
};

iPadAirBaseDeviceHand = _.extend({}, iPadAirBaseDevice, {
  deviceImageWidth: 4744,
  deviceImageHeight: 4101,
  paddingOffset: -120
});

Nexus5BaseDevice = {
  deviceImageWidth: 1208,
  deviceImageHeight: 2440,
  screenWidth: 1080,
  screenHeight: 1920,
  deviceType: "phone"
};

Nexus5BaseDeviceHand = _.extend({}, Nexus5BaseDevice, {
  deviceImageWidth: 2692,
  deviceImageHeight: 2996,
  paddingOffset: -120
});

AppleWatch42Device = {
  deviceImageWidth: 552,
  deviceImageHeight: 938,
  screenWidth: 312,
  screenHeight: 390
};

AppleWatch38Device = {
  deviceImageWidth: 508,
  deviceImageHeight: 900,
  screenWidth: 272,
  screenHeight: 340
};

Devices = {
  "fullscreen": {
    name: "Fullscreen",
    deviceType: "desktop"
  },
  "desktop-safari-1024-600": {
    deviceType: "browser",
    name: "Desktop Safari 1024 x 600",
    screenWidth: 1024,
    screenHeight: 600,
    deviceImageWidth: 1136,
    deviceImageHeight: 760
  },
  "desktop-safari-1280-800": {
    deviceType: "browser",
    name: "Desktop Safari 1280 x 800",
    screenWidth: 1280,
    screenHeight: 800,
    deviceImageWidth: 1392,
    deviceImageHeight: 960
  },
  "desktop-safari-1440-900": {
    deviceType: "browser",
    name: "Desktop Safari 1440 x 900",
    screenWidth: 1440,
    screenHeight: 900,
    deviceImageWidth: 1552,
    deviceImageHeight: 1060
  },
  "iphone-6-spacegray": iPhone6BaseDevice,
  "iphone-6-spacegray-hand": iPhone6BaseDeviceHand,
  "iphone-6-silver": iPhone6BaseDevice,
  "iphone-6-silver-hand": iPhone6BaseDeviceHand,
  "iphone-6-gold": iPhone6BaseDevice,
  "iphone-6-gold-hand": iPhone6BaseDeviceHand,
  "iphone-6plus-spacegray": iPhone6PlusBaseDevice,
  "iphone-6plus-spacegray-hand": iPhone6PlusBaseDeviceHand,
  "iphone-6plus-silver": iPhone6PlusBaseDevice,
  "iphone-6plus-silver-hand": iPhone6PlusBaseDeviceHand,
  "iphone-6plus-gold": iPhone6PlusBaseDevice,
  "iphone-6plus-gold-hand": iPhone6PlusBaseDeviceHand,
  "iphone-5s-spacegray": iPhone5BaseDevice,
  "iphone-5s-spacegray-hand": iPhone5BaseDeviceHand,
  "iphone-5s-silver": iPhone5BaseDevice,
  "iphone-5s-silver-hand": iPhone5BaseDeviceHand,
  "iphone-5s-gold": iPhone5BaseDevice,
  "iphone-5s-gold-hand": iPhone5BaseDeviceHand,
  "iphone-5c-green": iPhone5CBaseDevice,
  "iphone-5c-green-hand": iPhone5CBaseDeviceHand,
  "iphone-5c-blue": iPhone5CBaseDevice,
  "iphone-5c-blue-hand": iPhone5CBaseDeviceHand,
  "iphone-5c-pink": iPhone5CBaseDevice,
  "iphone-5c-pink-hand": iPhone5CBaseDeviceHand,
  "iphone-5c-white": iPhone5CBaseDevice,
  "iphone-5c-white-hand": iPhone5CBaseDeviceHand,
  "iphone-5c-yellow": iPhone5CBaseDevice,
  "iphone-5c-yellow-hand": iPhone5CBaseDeviceHand,
  "ipad-mini-spacegray": iPadMiniBaseDevice,
  "ipad-mini-spacegray-hand": iPadMiniBaseDeviceHand,
  "ipad-mini-silver": iPadMiniBaseDevice,
  "ipad-mini-silver-hand": iPadMiniBaseDeviceHand,
  "ipad-air-spacegray": iPadAirBaseDevice,
  "ipad-air-spacegray-hand": iPadAirBaseDeviceHand,
  "ipad-air-silver": iPadAirBaseDevice,
  "ipad-air-silver-hand": iPadAirBaseDeviceHand,
  "nexus-5-black": Nexus5BaseDevice,
  "nexus-5-black-hand": Nexus5BaseDeviceHand,
  "applewatchsport-38-aluminum-sportband-black": AppleWatch38Device,
  "applewatchsport-38-aluminum-sportband-blue": AppleWatch38Device,
  "applewatchsport-38-aluminum-sportband-green": AppleWatch38Device,
  "applewatchsport-38-aluminum-sportband-pink": AppleWatch38Device,
  "applewatchsport-38-aluminum-sportband-white": AppleWatch38Device,
  "applewatch-38-black-bracelet": AppleWatch38Device,
  "applewatch-38-steel-bracelet": AppleWatch38Device,
  "applewatchedition-38-gold-buckle-blue": AppleWatch38Device,
  "applewatchedition-38-gold-buckle-gray": AppleWatch38Device,
  "applewatchedition-38-gold-buckle-red": AppleWatch38Device,
  "applewatchedition-38-gold-sportband-black": AppleWatch38Device,
  "applewatchedition-38-gold-sportband-white": AppleWatch38Device,
  "applewatchsport-42-aluminum-sportband-black": AppleWatch42Device,
  "applewatchsport-42-aluminum-sportband-blue": AppleWatch42Device,
  "applewatchsport-42-aluminum-sportband-green": AppleWatch42Device,
  "applewatchsport-42-aluminum-sportband-pink": AppleWatch42Device,
  "applewatchsport-42-aluminum-sportband-white": AppleWatch42Device,
  "applewatch-42-black-bracelet": AppleWatch42Device,
  "applewatch-42-steel-bracelet": AppleWatch42Device,
  "applewatchedition-42-gold-buckle-blue": AppleWatch42Device,
  "applewatchedition-42-gold-buckle-gray": AppleWatch42Device,
  "applewatchedition-42-gold-buckle-red": AppleWatch42Device,
  "applewatchedition-42-gold-sportband-black": AppleWatch42Device,
  "applewatchedition-42-gold-sportband-white": AppleWatch42Device
};

exports.DeviceView.Devices = Devices;


},{"./BaseClass":10,"./Defaults":15,"./Events":19,"./Layer":26,"./Underscore":32,"./Utils":33}],17:[function(require,module,exports){
var EventEmitter;

EventEmitter = require("eventemitter3").EventEmitter;

exports.EventEmitter = EventEmitter;


},{"eventemitter3":35}],18:[function(require,module,exports){
var EventManagerElement, EventManagerIdCounter,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

EventManagerIdCounter = 0;

EventManagerElement = (function() {
  function EventManagerElement(element) {
    this.element = element;
    this._events = {};
  }

  EventManagerElement.prototype.addEventListener = function(eventName, listener) {
    var _base;
    if ((_base = this._events)[eventName] == null) {
      _base[eventName] = [];
    }
    this._events[eventName].push(listener);
    return this.element.addEventListener(eventName, listener);
  };

  EventManagerElement.prototype.removeEventListener = function(event, listener) {
    if (!this._events) {
      return;
    }
    if (!this._events[event]) {
      return;
    }
    this._events[event] = _.without(this._events[event], listener);
    this.element.removeEventListener(event, listener);
  };

  EventManagerElement.prototype.removeAllEventListeners = function(eventName) {
    var eventListener, events, _i, _j, _len, _len1, _ref;
    events = eventName ? [eventName] : _.keys(this._events);
    for (_i = 0, _len = events.length; _i < _len; _i++) {
      eventName = events[_i];
      _ref = this._events[eventName];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        eventListener = _ref[_j];
        this.removeEventListener(eventName, eventListener);
      }
    }
  };

  EventManagerElement.prototype.once = function(event, listener) {
    var fn,
      _this = this;
    fn = function() {
      _this.removeListener(event, fn);
      return listener.apply(null, arguments);
    };
    return this.on(event, fn);
  };

  EventManagerElement.prototype.on = EventManagerElement.prototype.addEventListener;

  EventManagerElement.prototype.off = EventManagerElement.prototype.removeEventListener;

  return EventManagerElement;

})();

exports.EventManager = (function() {
  function EventManager(element) {
    this.wrap = __bind(this.wrap, this);
    this._elements = {};
  }

  EventManager.prototype.wrap = function(element) {
    if (!element._eventManagerId) {
      element._eventManagerId = EventManagerIdCounter++;
    }
    if (!this._elements[element._eventManagerId]) {
      this._elements[element._eventManagerId] = new EventManagerElement(element);
    }
    return this._elements[element._eventManagerId];
  };

  EventManager.prototype.reset = function() {
    var element, elementEventManager, _ref, _results;
    _ref = this._elements;
    _results = [];
    for (element in _ref) {
      elementEventManager = _ref[element];
      _results.push(elementEventManager.removeAllEventListeners());
    }
    return _results;
  };

  return EventManager;

})();


},{}],19:[function(require,module,exports){
var Events, Utils, _;

_ = require("./Underscore")._;

Utils = require("./Utils");

Events = {};

if (Utils.isTouch()) {
  Events.TouchStart = "touchstart";
  Events.TouchEnd = "touchend";
  Events.TouchMove = "touchmove";
} else {
  Events.TouchStart = "mousedown";
  Events.TouchEnd = "mouseup";
  Events.TouchMove = "mousemove";
}

Events.Click = Events.TouchEnd;

Events.MouseOver = "mouseover";

Events.MouseOut = "mouseout";

Events.MouseMove = "mousemove";

Events.AnimationStart = "start";

Events.AnimationStop = "stop";

Events.AnimationEnd = "end";

Events.Scroll = "scroll";

Events.ImageLoaded = "load";

Events.ImageLoadError = "error";

Events.touchEvent = function(event) {
  var touchEvent, _ref, _ref1;
  touchEvent = (_ref = event.touches) != null ? _ref[0] : void 0;
  if (touchEvent == null) {
    touchEvent = (_ref1 = event.changedTouches) != null ? _ref1[0] : void 0;
  }
  if (touchEvent == null) {
    touchEvent = event;
  }
  return touchEvent;
};

Events.wrap = function(element) {
  return Framer.CurrentContext.eventManager.wrap(element);
};

exports.Events = Events;


},{"./Underscore":32,"./Utils":33}],20:[function(require,module,exports){
exports.MobileScrollFix = require("./MobileScrollFix");

exports.OmitNew = require("./OmitNew");


},{"./MobileScrollFix":21,"./OmitNew":22}],21:[function(require,module,exports){
var Utils,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Utils = require("../Utils");

exports.enable = function() {
  var MobileScrollFixLayer, handleScrollingLayerTouchMove, handleScrollingLayerTouchStart;
  document.ontouchmove = function(event) {
    if (event.target === document.body) {
      return event.preventDefault();
    }
  };
  handleScrollingLayerTouchMove = function(event) {
    return event.stopPropagation();
  };
  handleScrollingLayerTouchStart = function(event) {
    var element, startTopScroll;
    element = this._element;
    startTopScroll = element.scrollTop;
    if (startTopScroll <= 0) {
      element.scrollTop = 1;
    }
    if (startTopScroll + element.offsetHeight >= element.scrollHeight) {
      return element.scrollTop = element.scrollHeight - element.offsetHeight - 1;
    }
  };
  MobileScrollFixLayer = (function(_super) {
    __extends(MobileScrollFixLayer, _super);

    function MobileScrollFixLayer(options) {
      this._updateScrollListeners = __bind(this._updateScrollListeners, this);
      MobileScrollFixLayer.__super__.constructor.call(this, options);
      this.on("change:scrollVertical", this._updateScrollListeners);
      this._updateScrollListeners();
    }

    MobileScrollFixLayer.prototype._updateScrollListeners = function() {
      if (this.scrollVertical === true) {
        this.on("touchmove", handleScrollingLayerTouchMove);
        return this.on("touchstart", handleScrollingLayerTouchStart);
      } else {
        this.off("touchmove", handleScrollingLayerTouchMove);
        return this.off("touchstart", handleScrollingLayerTouchStart);
      }
    };

    return MobileScrollFixLayer;

  })(Framer.Layer);
  return window.Layer = window.Framer.Layer = MobileScrollFixLayer;
};


},{"../Utils":33}],22:[function(require,module,exports){
var __slice = [].slice;

exports.enable = function(module) {
  var ClassWrapper;
  if (module == null) {
    module = window;
  }
  ClassWrapper = function(Klass) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.prototype = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Klass, args, function(){});
    };
  };
  module.Frame = ClassWrapper(Framer.Frame);
  module.Layer = ClassWrapper(Framer.Layer);
  module.BackgroundLayer = ClassWrapper(Framer.BackgroundLayer);
  module.VideoLayer = ClassWrapper(Framer.VideoLayer);
  return module.Animation = ClassWrapper(Framer.Animation);
};


},{}],23:[function(require,module,exports){
var BaseClass,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseClass = require("./BaseClass").BaseClass;

exports.Frame = (function(_super) {
  __extends(Frame, _super);

  Frame.define("x", Frame.simpleProperty("x", 0));

  Frame.define("y", Frame.simpleProperty("y", 0));

  Frame.define("width", Frame.simpleProperty("width", 0));

  Frame.define("height", Frame.simpleProperty("height", 0));

  Frame.define("minX", Frame.simpleProperty("x", 0, false));

  Frame.define("minY", Frame.simpleProperty("y", 0, false));

  function Frame(options) {
    var k, _i, _len, _ref;
    if (options == null) {
      options = {};
    }
    Frame.__super__.constructor.call(this, options);
    _ref = ["minX", "midX", "maxX", "minY", "midY", "maxY"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      if (options.hasOwnProperty(k)) {
        this[k] = options[k];
      }
    }
  }

  Frame.define("midX", {
    get: function() {
      return Utils.frameGetMidX(this);
    },
    set: function(value) {
      return Utils.frameSetMidX(this, value);
    }
  });

  Frame.define("maxX", {
    get: function() {
      return Utils.frameGetMaxX(this);
    },
    set: function(value) {
      return Utils.frameSetMaxX(this, value);
    }
  });

  Frame.define("midY", {
    get: function() {
      return Utils.frameGetMidY(this);
    },
    set: function(value) {
      return Utils.frameSetMidY(this, value);
    }
  });

  Frame.define("maxY", {
    get: function() {
      return Utils.frameGetMaxY(this);
    },
    set: function(value) {
      return Utils.frameSetMaxY(this, value);
    }
  });

  return Frame;

})(BaseClass);


},{"./BaseClass":10}],24:[function(require,module,exports){
var Defaults, Framer, _;

_ = require("./Underscore")._;

Framer = {};

Framer._ = _;

Framer.Utils = require("./Utils");

Framer.Frame = (require("./Frame")).Frame;

Framer.Layer = (require("./Layer")).Layer;

Framer.BackgroundLayer = (require("./BackgroundLayer")).BackgroundLayer;

Framer.VideoLayer = (require("./VideoLayer")).VideoLayer;

Framer.Events = (require("./Events")).Events;

Framer.Animation = (require("./Animation")).Animation;

Framer.AnimationGroup = (require("./AnimationGroup")).AnimationGroup;

Framer.Screen = (require("./Screen")).Screen;

Framer.print = (require("./Print")).print;

if (window) {
  _.extend(window, Framer);
}

Framer.Context = (require("./Context")).Context;

Framer.Config = (require("./Config")).Config;

Framer.EventEmitter = (require("./EventEmitter")).EventEmitter;

Framer.BaseClass = (require("./BaseClass")).BaseClass;

Framer.LayerStyle = (require("./LayerStyle")).LayerStyle;

Framer.AnimationLoop = (require("./AnimationLoop")).AnimationLoop;

Framer.LinearAnimator = (require("./Animators/LinearAnimator")).LinearAnimator;

Framer.BezierCurveAnimator = (require("./Animators/BezierCurveAnimator")).BezierCurveAnimator;

Framer.SpringDHOAnimator = (require("./Animators/SpringDHOAnimator")).SpringDHOAnimator;

Framer.SpringRK4Animator = (require("./Animators/SpringRK4Animator")).SpringRK4Animator;

Framer.Importer = (require("./Importer")).Importer;

Framer.DeviceView = (require("./DeviceView")).DeviceView;

Framer.Debug = (require("./Debug")).Debug;

Framer.Extras = require("./Extras/Extras");

Framer.Loop = new Framer.AnimationLoop();

Utils.domComplete(Framer.Loop.start);

if (window) {
  window.Framer = Framer;
}

Framer.DefaultContext = new Framer.Context({
  name: "Default"
});

Framer.CurrentContext = Framer.DefaultContext;

require("./Compat");

if (Utils.isMobile()) {
  Framer.Extras.MobileScrollFix.enable();
}

Defaults = (require("./Defaults")).Defaults;

Defaults.setup();

Framer.resetDefaults = Defaults.reset;


},{"./Animation":1,"./AnimationGroup":2,"./AnimationLoop":3,"./Animators/BezierCurveAnimator":5,"./Animators/LinearAnimator":6,"./Animators/SpringDHOAnimator":7,"./Animators/SpringRK4Animator":8,"./BackgroundLayer":9,"./BaseClass":10,"./Compat":11,"./Config":12,"./Context":13,"./Debug":14,"./Defaults":15,"./DeviceView":16,"./EventEmitter":17,"./Events":19,"./Extras/Extras":20,"./Frame":23,"./Importer":25,"./Layer":26,"./LayerStyle":29,"./Print":30,"./Screen":31,"./Underscore":32,"./Utils":33,"./VideoLayer":34}],25:[function(require,module,exports){
var ChromeAlert, Utils, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = require("./Underscore")._;

Utils = require("./Utils");

ChromeAlert = "Importing layers is currently only supported on Safari. If you really want it to work with Chrome quit it, open a terminal and run:\nopen -a Google\ Chrome -–allow-file-access-from-files";

exports.Importer = (function() {
  function Importer(path, extraLayerProperties) {
    this.path = path;
    this.extraLayerProperties = extraLayerProperties != null ? extraLayerProperties : {};
    this.paths = {
      layerInfo: Utils.pathJoin(this.path, "layers.json"),
      images: Utils.pathJoin(this.path, "images"),
      documentName: this.path.split("/").pop()
    };
    this._createdLayers = [];
    this._createdLayersByName = {};
  }

  Importer.prototype.load = function() {
    var layer, layerInfo, layersByName, _i, _j, _len, _len1, _ref, _ref1,
      _this = this;
    layersByName = {};
    layerInfo = this._loadlayerInfo();
    layerInfo.map(function(layerItemInfo) {
      return _this._createLayer(layerItemInfo);
    });
    _ref = this._createdLayers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      layer = _ref[_i];
      this._correctLayer(layer);
    }
    _ref1 = this._createdLayers;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      layer = _ref1[_j];
      if (!layer.superLayer) {
        layer.superLayer = null;
      }
    }
    return this._createdLayersByName;
  };

  Importer.prototype._loadlayerInfo = function() {
    var importedKey, _ref;
    importedKey = "" + this.paths.documentName + "/layers.json.js";
    if ((_ref = window.__imported__) != null ? _ref.hasOwnProperty(importedKey) : void 0) {
      return window.__imported__[importedKey];
    }
    return Framer.Utils.domLoadJSONSync(this.paths.layerInfo);
  };

  Importer.prototype._createLayer = function(info, superLayer) {
    var LayerClass, layer, layerInfo, _ref,
      _this = this;
    LayerClass = Layer;
    layerInfo = {
      shadow: true,
      name: info.name,
      frame: info.layerFrame,
      clip: false,
      backgroundColor: null,
      visible: (_ref = info.visible) != null ? _ref : true
    };
    _.extend(layerInfo, this.extraLayerProperties);
    if (info.image) {
      layerInfo.frame = info.image.frame;
      layerInfo.image = Utils.pathJoin(this.path, info.image.path);
    }
    if (info.maskFrame) {
      layerInfo.frame = info.maskFrame;
      layerInfo.clip = true;
    }
    if (info.children.length === 0 && __indexOf.call(_.pluck(superLayer != null ? superLayer.superLayers() : void 0, "clip"), true) >= 0) {
      layerInfo.frame = info.image.frame;
      layerInfo.clip = false;
    }
    if (superLayer != null ? superLayer.contentLayer : void 0) {
      layerInfo.superLayer = superLayer.contentLayer;
    } else if (superLayer) {
      layerInfo.superLayer = superLayer;
    }
    layer = new LayerClass(layerInfo);
    layer.name = layerInfo.name;
    if (layerInfo.name.toLowerCase().indexOf("scroll") !== -1) {
      layer.scroll = true;
    }
    if (layerInfo.name.toLowerCase().indexOf("draggable") !== -1) {
      layer.draggable.enabled = true;
    }
    if (!layer.image && !info.children.length && !info.maskFrame) {
      layer.frame = new Frame;
    }
    _.clone(info.children).reverse().map(function(info) {
      return _this._createLayer(info, layer);
    });
    if (!layer.image && !info.maskFrame) {
      layer.frame = layer.contentFrame();
    }
    layer._info = info;
    this._createdLayers.push(layer);
    return this._createdLayersByName[layer.name] = layer;
  };

  Importer.prototype._correctLayer = function(layer) {
    var traverse;
    traverse = function(layer) {
      var subLayer, _i, _len, _ref, _results;
      if (layer.superLayer) {
        layer.frame = Utils.convertPoint(layer.frame, null, layer.superLayer);
      }
      _ref = layer.subLayers;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        subLayer = _ref[_i];
        _results.push(traverse(subLayer));
      }
      return _results;
    };
    if (!layer.superLayer) {
      return traverse(layer);
    }
  };

  return Importer;

})();

exports.Importer.load = function(path) {
  var importer;
  importer = new exports.Importer(path);
  return importer.load();
};


},{"./Underscore":32,"./Utils":33}],26:[function(require,module,exports){
var Animation, BaseClass, Config, Defaults, EventEmitter, Frame, LayerDraggable, LayerStates, LayerStyle, Utils, layerProperty, layerValueTypeError, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

_ = require("./Underscore")._;

Utils = require("./Utils");

Config = require("./Config").Config;

Defaults = require("./Defaults").Defaults;

BaseClass = require("./BaseClass").BaseClass;

EventEmitter = require("./EventEmitter").EventEmitter;

Animation = require("./Animation").Animation;

Frame = require("./Frame").Frame;

LayerStyle = require("./LayerStyle").LayerStyle;

LayerStates = require("./LayerStates").LayerStates;

LayerDraggable = require("./LayerDraggable").LayerDraggable;

layerValueTypeError = function(name, value) {
  throw new Error("Layer." + name + ": value '" + value + "' of type '" + (typeof value) + "'' is not valid");
};

layerProperty = function(obj, name, cssProperty, fallback, validator, set) {
  var result;
  return result = {
    exportable: true,
    "default": fallback,
    get: function() {
      return this._properties[name];
    },
    set: function(value) {
      if (value && validator && !validator(value)) {
        layerValueTypeError(name, value);
      }
      this._properties[name] = value;
      this._element.style[cssProperty] = LayerStyle[cssProperty](this);
      if (typeof set === "function") {
        set(this, value);
      }
      return this.emit("change:" + name, value);
    }
  };
};

exports.Layer = (function(_super) {
  __extends(Layer, _super);

  function Layer(options) {
    var k, _i, _len, _ref;
    if (options == null) {
      options = {};
    }
    this.addListener = __bind(this.addListener, this);
    this._properties = {};
    this._style = {};
    this._dirtyStyle = {};
    this._needsRender = false;
    this._prefer2d = false;
    this._cacheImage = false;
    this._createElement();
    if (options.hasOwnProperty("frame")) {
      options = _.extend(options, options.frame);
    }
    options = Defaults.getDefaults("Layer", options);
    Layer.__super__.constructor.call(this, options);
    this._context._layerList.push(this);
    this._id = this._context._layerList.length;
    _ref = ["minX", "midX", "maxX", "minY", "midY", "maxY"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      if (options.hasOwnProperty(k)) {
        this[k] = options[k];
      }
    }
    if (!options.superLayer) {
      if (!options.shadow) {
        this._insertElement();
      }
    } else {
      this.superLayer = options.superLayer;
    }
    if (options.hasOwnProperty("index")) {
      this.index = options.index;
    }
    this._subLayers = [];
    this._context.emit("layer:create", this);
  }

  Layer.define("width", layerProperty(Layer, "width", "width", 100, _.isNumber));

  Layer.define("height", layerProperty(Layer, "height", "height", 100, _.isNumber));

  Layer.define("visible", layerProperty(Layer, "visible", "display", true, _.isBool));

  Layer.define("opacity", layerProperty(Layer, "opacity", "opacity", 1, _.isNumber));

  Layer.define("index", layerProperty(Layer, "index", "zIndex", 0, _.isNumber));

  Layer.define("clip", layerProperty(Layer, "clip", "overflow", true, _.isBool));

  Layer.define("scrollHorizontal", layerProperty(Layer, "scrollHorizontal", "overflowX", false, _.isBool, function(layer, value) {
    if (value === true) {
      return layer.ignoreEvents = false;
    }
  }));

  Layer.define("scrollVertical", layerProperty(Layer, "scrollVertical", "overflowY", false, _.isBool, function(layer, value) {
    if (value === true) {
      return layer.ignoreEvents = false;
    }
  }));

  Layer.define("scroll", {
    exportable: true,
    get: function() {
      return this.scrollHorizontal === true || this.scrollVertical === true;
    },
    set: function(value) {
      return this.scrollHorizontal = this.scrollVertical = value;
    }
  });

  Layer.define("ignoreEvents", layerProperty(Layer, "ignoreEvents", "pointerEvents", true, _.isBool));

  Layer.define("x", layerProperty(Layer, "x", "webkitTransform", 0, _.isNumber));

  Layer.define("y", layerProperty(Layer, "y", "webkitTransform", 0, _.isNumber));

  Layer.define("z", layerProperty(Layer, "z", "webkitTransform", 0, _.isNumber));

  Layer.define("scaleX", layerProperty(Layer, "scaleX", "webkitTransform", 1, _.isNumber));

  Layer.define("scaleY", layerProperty(Layer, "scaleY", "webkitTransform", 1, _.isNumber));

  Layer.define("scaleZ", layerProperty(Layer, "scaleZ", "webkitTransform", 1, _.isNumber));

  Layer.define("scale", layerProperty(Layer, "scale", "webkitTransform", 1, _.isNumber));

  Layer.define("skewX", layerProperty(Layer, "skewX", "webkitTransform", 0, _.isNumber));

  Layer.define("skewY", layerProperty(Layer, "skewY", "webkitTransform", 0, _.isNumber));

  Layer.define("skew", layerProperty(Layer, "skew", "webkitTransform", 0, _.isNumber));

  Layer.define("originX", layerProperty(Layer, "originX", "webkitTransformOrigin", 0.5, _.isNumber));

  Layer.define("originY", layerProperty(Layer, "originY", "webkitTransformOrigin", 0.5, _.isNumber));

  Layer.define("perspective", layerProperty(Layer, "perspective", "webkitPerspective", 0, _.isNumber));

  Layer.define("rotationX", layerProperty(Layer, "rotationX", "webkitTransform", 0, _.isNumber));

  Layer.define("rotationY", layerProperty(Layer, "rotationY", "webkitTransform", 0, _.isNumber));

  Layer.define("rotationZ", layerProperty(Layer, "rotationZ", "webkitTransform", 0, _.isNumber));

  Layer.define("rotation", layerProperty(Layer, "rotationZ", "webkitTransform", 0, _.isNumber));

  Layer.prototype.set_rotation = function(value) {
    return this.set_rotationZ(value);
  };

  Layer.define("blur", layerProperty(Layer, "blur", "webkitFilter", 0, _.isNumber));

  Layer.define("brightness", layerProperty(Layer, "brightness", "webkitFilter", 100, _.isNumber));

  Layer.define("saturate", layerProperty(Layer, "saturate", "webkitFilter", 100, _.isNumber));

  Layer.define("hueRotate", layerProperty(Layer, "hueRotate", "webkitFilter", 0, _.isNumber));

  Layer.define("contrast", layerProperty(Layer, "contrast", "webkitFilter", 100, _.isNumber));

  Layer.define("invert", layerProperty(Layer, "invert", "webkitFilter", 0, _.isNumber));

  Layer.define("grayscale", layerProperty(Layer, "grayscale", "webkitFilter", 0, _.isNumber));

  Layer.define("sepia", layerProperty(Layer, "sepia", "webkitFilter", 0, _.isNumber));

  Layer.define("shadowX", layerProperty(Layer, "shadowX", "boxShadow", 0, _.isNumber));

  Layer.define("shadowY", layerProperty(Layer, "shadowY", "boxShadow", 0, _.isNumber));

  Layer.define("shadowBlur", layerProperty(Layer, "shadowBlur", "boxShadow", 0, _.isNumber));

  Layer.define("shadowSpread", layerProperty(Layer, "shadowSpread", "boxShadow", 0, _.isNumber));

  Layer.define("shadowColor", layerProperty(Layer, "shadowColor", "boxShadow", ""));

  Layer.define("backgroundColor", layerProperty(Layer, "backgroundColor", "backgroundColor", null, _.isString));

  Layer.define("color", layerProperty(Layer, "color", "color", null, _.isString));

  Layer.define("borderColor", layerProperty(Layer, "borderColor", "border", null, _.isString));

  Layer.define("borderWidth", layerProperty(Layer, "borderWidth", "border", 0, _.isNumber));

  Layer.define("force2d", layerProperty(Layer, "force2d", "webkitTransform", false, _.isBool));

  Layer.define("name", {
    exportable: true,
    "default": "",
    get: function() {
      return this._getPropertyValue("name");
    },
    set: function(value) {
      this._setPropertyValue("name", value);
      return this._element.setAttribute("name", value);
    }
  });

  Layer.define("borderRadius", {
    exportable: true,
    "default": 0,
    get: function() {
      return this._properties["borderRadius"];
    },
    set: function(value) {
      if (value && !_.isNumber(value)) {
        console.warn("Layer.borderRadius should be a numeric property, not type " + (typeof value));
      }
      this._properties["borderRadius"] = value;
      this._element.style["borderRadius"] = LayerStyle["borderRadius"](this);
      return this.emit("change:borderRadius", value);
    }
  });

  Layer.define("point", {
    get: function() {
      return _.pick(this, ["x", "y"]);
    },
    set: function(point) {
      var k, _i, _len, _ref, _results;
      if (!point) {
        return;
      }
      _ref = ["x", "y"];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        if (point.hasOwnProperty(k)) {
          _results.push(this[k] = point[k]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });

  Layer.define("frame", {
    get: function() {
      return _.pick(this, ["x", "y", "width", "height"]);
    },
    set: function(frame) {
      var k, _i, _len, _ref, _results;
      if (!frame) {
        return;
      }
      _ref = ["x", "y", "width", "height"];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        if (frame.hasOwnProperty(k)) {
          _results.push(this[k] = frame[k]);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    }
  });

  Layer.define("minX", {
    get: function() {
      return this.x;
    },
    set: function(value) {
      return this.x = value;
    }
  });

  Layer.define("midX", {
    get: function() {
      return Utils.frameGetMidX(this);
    },
    set: function(value) {
      return Utils.frameSetMidX(this, value);
    }
  });

  Layer.define("maxX", {
    get: function() {
      return Utils.frameGetMaxX(this);
    },
    set: function(value) {
      return Utils.frameSetMaxX(this, value);
    }
  });

  Layer.define("minY", {
    get: function() {
      return this.y;
    },
    set: function(value) {
      return this.y = value;
    }
  });

  Layer.define("midY", {
    get: function() {
      return Utils.frameGetMidY(this);
    },
    set: function(value) {
      return Utils.frameSetMidY(this, value);
    }
  });

  Layer.define("maxY", {
    get: function() {
      return Utils.frameGetMaxY(this);
    },
    set: function(value) {
      return Utils.frameSetMaxY(this, value);
    }
  });

  Layer.prototype.convertPoint = function(point) {
    return Utils.convertPoint(point, null, this);
  };

  Layer.define("screenFrame", {
    get: function() {
      return Utils.convertPoint(this.frame, this, null);
    },
    set: function(frame) {
      if (!this.superLayer) {
        return this.frame = frame;
      } else {
        return this.frame = Utils.convertPoint(frame, null, this.superLayer);
      }
    }
  });

  Layer.prototype.contentFrame = function() {
    return Utils.frameMerge(_.pluck(this.subLayers, "frame"));
  };

  Layer.prototype.centerFrame = function() {
    var frame;
    if (this.superLayer) {
      frame = this.frame;
      Utils.frameSetMidX(frame, parseInt(this.superLayer.width / 2.0));
      Utils.frameSetMidY(frame, parseInt(this.superLayer.height / 2.0));
      return frame;
    } else if (this._context._parentLayer) {
      frame = this.frame;
      Utils.frameSetMidX(frame, parseInt(this._context._parentLayer.width / 2.0));
      Utils.frameSetMidY(frame, parseInt(this._context._parentLayer.height / 2.0));
      return frame;
    } else {
      frame = this.frame;
      Utils.frameSetMidX(frame, parseInt(window.innerWidth / 2.0));
      Utils.frameSetMidY(frame, parseInt(window.innerHeight / 2.0));
      return frame;
    }
  };

  Layer.prototype.center = function() {
    this.frame = this.centerFrame();
    return this;
  };

  Layer.prototype.centerX = function(offset) {
    if (offset == null) {
      offset = 0;
    }
    this.x = this.centerFrame().x + offset;
    return this;
  };

  Layer.prototype.centerY = function(offset) {
    if (offset == null) {
      offset = 0;
    }
    this.y = this.centerFrame().y + offset;
    return this;
  };

  Layer.prototype.pixelAlign = function() {
    this.x = parseInt(this.x);
    return this.y = parseInt(this.y);
  };

  Layer.prototype.screenScaleX = function() {
    var context, scale, superLayer, _i, _len, _ref;
    scale = this.scale * this.scaleX;
    _ref = this.superLayers(context = true);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      superLayer = _ref[_i];
      scale = scale * superLayer.scale * superLayer.scaleX;
    }
    return scale;
  };

  Layer.prototype.screenScaleY = function() {
    var context, scale, superLayer, _i, _len, _ref;
    scale = this.scale * this.scaleY;
    _ref = this.superLayers(context = true);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      superLayer = _ref[_i];
      scale = scale * superLayer.scale * superLayer.scaleY;
    }
    return scale;
  };

  Layer.prototype.screenScaledFrame = function() {
    var context, factorX, factorY, frame, layerScaledFrame, layers, superLayer, _i, _len;
    frame = {
      x: 0,
      y: 0,
      width: this.width * this.screenScaleX(),
      height: this.height * this.screenScaleY()
    };
    layers = this.superLayers(context = true);
    layers.push(this);
    layers.reverse();
    for (_i = 0, _len = layers.length; _i < _len; _i++) {
      superLayer = layers[_i];
      factorX = superLayer._superOrParentLayer() ? superLayer._superOrParentLayer().screenScaleX() : 1;
      factorY = superLayer._superOrParentLayer() ? superLayer._superOrParentLayer().screenScaleY() : 1;
      layerScaledFrame = superLayer.scaledFrame();
      frame.x += layerScaledFrame.x * factorX;
      frame.y += layerScaledFrame.y * factorY;
    }
    return frame;
  };

  Layer.prototype.scaledFrame = function() {
    var frame, scaleX, scaleY;
    frame = this.frame;
    scaleX = this.scale * this.scaleX;
    scaleY = this.scale * this.scaleY;
    frame.width *= scaleX;
    frame.height *= scaleY;
    frame.x += (1 - scaleX) * this.originX * this.width;
    frame.y += (1 - scaleY) * this.originY * this.height;
    return frame;
  };

  Layer.define("style", {
    get: function() {
      return this._element.style;
    },
    set: function(value) {
      _.extend(this._element.style, value);
      return this.emit("change:style");
    }
  });

  Layer.prototype.computedStyle = function() {
    var getComputedStyle;
    getComputedStyle = document.defaultView.getComputedStyle;
    if (getComputedStyle == null) {
      getComputedStyle = window.getComputedStyle;
    }
    return getComputedStyle(this._element);
  };

  Layer.define("classList", {
    get: function() {
      return this._element.classList;
    }
  });

  Layer.prototype._createElement = function() {
    if (this._element != null) {
      return;
    }
    this._element = document.createElement("div");
    return this._element.classList.add("framerLayer");
  };

  Layer.prototype._insertElement = function() {
    this.bringToFront();
    return this._context.getRootElement().appendChild(this._element);
  };

  Layer.define("html", {
    get: function() {
      var _ref;
      return (_ref = this._elementHTML) != null ? _ref.innerHTML : void 0;
    },
    set: function(value) {
      if (!this._elementHTML) {
        this._elementHTML = document.createElement("div");
        this._element.appendChild(this._elementHTML);
      }
      this._elementHTML.innerHTML = value;
      return this.emit("change:html");
    }
  });

  Layer.prototype.querySelector = function(query) {
    return this._element.querySelector(query);
  };

  Layer.prototype.querySelectorAll = function(query) {
    return this._element.querySelectorAll(query);
  };

  Layer.prototype.destroy = function() {
    var _ref;
    if (this.superLayer) {
      this.superLayer._subLayers = _.without(this.superLayer._subLayers, this);
    }
    if ((_ref = this._element.parentNode) != null) {
      _ref.removeChild(this._element);
    }
    this.removeAllListeners();
    this._context._layerList = _.without(this._context._layerList, this);
    return this._context.emit("layer:destroy", this);
  };

  Layer.prototype.copy = function() {
    var copiedSublayer, layer, subLayer, _i, _len, _ref;
    layer = this.copySingle();
    _ref = this.subLayers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      subLayer = _ref[_i];
      copiedSublayer = subLayer.copy();
      copiedSublayer.superLayer = layer;
    }
    return layer;
  };

  Layer.prototype.copySingle = function() {
    return new Layer(this.properties);
  };

  Layer.define("image", {
    exportable: true,
    "default": "",
    get: function() {
      return this._getPropertyValue("image");
    },
    set: function(value) {
      var currentValue, imageUrl, loader, _ref, _ref1,
        _this = this;
      if (!(_.isString(value) || value === null)) {
        layerValueTypeError("image", value);
      }
      currentValue = this._getPropertyValue("image");
      if (currentValue === value) {
        return this.emit("load");
      }
      this.backgroundColor = null;
      this._setPropertyValue("image", value);
      if (value === null || value === "") {
        this.style["background-image"] = null;
        return;
      }
      imageUrl = value;
      if (Utils.isLocal() && !imageUrl.match(/^https?:\/\//) && this._cacheImage === false) {
        imageUrl += "?nocache=" + (Date.now());
      }
      if ((_ref = this.events) != null ? _ref.hasOwnProperty("load" || ((_ref1 = this.events) != null ? _ref1.hasOwnProperty("error") : void 0)) : void 0) {
        loader = new Image();
        loader.name = imageUrl;
        loader.src = imageUrl;
        loader.onload = function() {
          _this.style["background-image"] = "url('" + imageUrl + "')";
          return _this.emit("load", loader);
        };
        return loader.onerror = function() {
          return _this.emit("error", loader);
        };
      } else {
        return this.style["background-image"] = "url('" + imageUrl + "')";
      }
    }
  });

  Layer.define("superLayer", {
    exportable: false,
    get: function() {
      return this._superLayer || null;
    },
    set: function(layer) {
      if (layer === this._superLayer) {
        return;
      }
      if (!layer instanceof Layer) {
        throw Error("Layer.superLayer needs to be a Layer object");
      }
      Utils.domCompleteCancel(this.__insertElement);
      if (this._superLayer) {
        this._superLayer._subLayers = _.without(this._superLayer._subLayers, this);
        this._superLayer._element.removeChild(this._element);
        this._superLayer.emit("change:subLayers", {
          added: [],
          removed: [this]
        });
      }
      if (layer) {
        layer._element.appendChild(this._element);
        layer._subLayers.push(this);
        layer.emit("change:subLayers", {
          added: [this],
          removed: []
        });
      } else {
        this._insertElement();
      }
      this._superLayer = layer;
      this.bringToFront();
      return this.emit("change:superLayer");
    }
  });

  Layer.define("subLayers", {
    exportable: false,
    get: function() {
      return _.clone(this._subLayers);
    }
  });

  Layer.define("siblingLayers", {
    exportable: false,
    get: function() {
      var _this = this;
      if (this.superLayer === null) {
        return _.filter(this._context._layerList, function(layer) {
          return layer !== _this && layer.superLayer === null;
        });
      }
      return _.without(this.superLayer.subLayers, this);
    }
  });

  Layer.prototype.addSubLayer = function(layer) {
    return layer.superLayer = this;
  };

  Layer.prototype.removeSubLayer = function(layer) {
    if (__indexOf.call(this.subLayers, layer) < 0) {
      return;
    }
    return layer.superLayer = null;
  };

  Layer.prototype.subLayersByName = function(name) {
    return _.filter(this.subLayers, function(layer) {
      return layer.name === name;
    });
  };

  Layer.prototype.superLayers = function(context) {
    var currentLayer, superLayers;
    if (context == null) {
      context = false;
    }
    superLayers = [];
    currentLayer = this;
    if (context === false) {
      while (currentLayer.superLayer) {
        superLayers.push(currentLayer.superLayer);
        currentLayer = currentLayer.superLayer;
      }
    } else {
      while (currentLayer._superOrParentLayer()) {
        superLayers.push(currentLayer._superOrParentLayer());
        currentLayer = currentLayer._superOrParentLayer();
      }
    }
    return superLayers;
  };

  Layer.prototype._superOrParentLayer = function() {
    if (this.superLayer) {
      return this.superLayer;
    }
    if (this._context._parentLayer) {
      return this._context._parentLayer;
    }
  };

  Layer.prototype.animate = function(options) {
    var animation, start;
    start = options.start;
    if (start == null) {
      start = true;
    }
    delete options.start;
    options.layer = this;
    animation = new Animation(options);
    if (start) {
      animation.start();
    }
    return animation;
  };

  Layer.prototype.animations = function() {
    var _this = this;
    return _.filter(this._context._animationList, function(animation) {
      return animation.options.layer === _this;
    });
  };

  Layer.prototype.animatingProperties = function() {
    var animation, properties, propertyName, _i, _j, _len, _len1, _ref, _ref1;
    properties = {};
    _ref = this.animations();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      animation = _ref[_i];
      _ref1 = _.keys(animation._stateA);
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        propertyName = _ref1[_j];
        properties[propertyName] = animation;
      }
    }
    return properties;
  };

  Layer.define("isAnimating", {
    exportable: false,
    get: function() {
      return this.animations().length !== 0;
    }
  });

  Layer.prototype.animateStop = function() {
    return _.invoke(this.animations(), "stop");
  };

  Layer.prototype.bringToFront = function() {
    return this.index = _.max(_.union([0], this.siblingLayers.map(function(layer) {
      return layer.index;
    }))) + 1;
  };

  Layer.prototype.sendToBack = function() {
    return this.index = _.min(_.union([0], this.siblingLayers.map(function(layer) {
      return layer.index;
    }))) - 1;
  };

  Layer.prototype.placeBefore = function(layer) {
    var l, _i, _len, _ref;
    if (__indexOf.call(this.siblingLayers, layer) < 0) {
      return;
    }
    _ref = this.siblingLayers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      l = _ref[_i];
      if (l.index <= layer.index) {
        l.index -= 1;
      }
    }
    return this.index = layer.index + 1;
  };

  Layer.prototype.placeBehind = function(layer) {
    var l, _i, _len, _ref;
    if (__indexOf.call(this.siblingLayers, layer) < 0) {
      return;
    }
    _ref = this.siblingLayers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      l = _ref[_i];
      if (l.index >= layer.index) {
        l.index += 1;
      }
    }
    return this.index = layer.index - 1;
  };

  Layer.define("states", {
    get: function() {
      return this._states != null ? this._states : this._states = new LayerStates(this);
    }
  });

  Layer.define("draggable", {
    get: function() {
      if (this._draggable == null) {
        this._draggable = new LayerDraggable(this);
      }
      return this._draggable;
    },
    set: function() {
      throw Error("You can't set the draggable object");
    }
  });

  Layer.define("scrollFrame", {
    get: function() {
      return new Frame({
        x: this.scrollX,
        y: this.scrollY,
        width: this.width,
        height: this.height
      });
    },
    set: function(frame) {
      this.scrollX = frame.x;
      return this.scrollY = frame.y;
    }
  });

  Layer.define("scrollX", {
    get: function() {
      return this._element.scrollLeft;
    },
    set: function(value) {
      if (!_.isNumber(value)) {
        layerValueTypeError("scrollX", value);
      }
      return this._element.scrollLeft = value;
    }
  });

  Layer.define("scrollY", {
    get: function() {
      return this._element.scrollTop;
    },
    set: function(value) {
      if (!_.isNumber(value)) {
        layerValueTypeError("scrollY", value);
      }
      return this._element.scrollTop = value;
    }
  });

  Layer.prototype.addListener = function() {
    var eventName, eventNames, listener, originalListener, _i, _j, _len, _results,
      _this = this;
    eventNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), originalListener = arguments[_i++];
    if (!originalListener) {
      return;
    }
    listener = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return originalListener.call.apply(originalListener, [_this].concat(__slice.call(args), [_this]));
    };
    originalListener.modifiedListener = listener;
    if (typeof eventNames === 'string') {
      eventNames = [eventNames];
    }
    _results = [];
    for (_j = 0, _len = eventNames.length; _j < _len; _j++) {
      eventName = eventNames[_j];
      _results.push((function(eventName) {
        var _base;
        Layer.__super__.addListener.call(_this, eventName, listener);
        _this._context.eventManager.wrap(_this._element).addEventListener(eventName, listener);
        if (_this._eventListeners == null) {
          _this._eventListeners = {};
        }
        if ((_base = _this._eventListeners)[eventName] == null) {
          _base[eventName] = [];
        }
        _this._eventListeners[eventName].push(listener);
        if (!_.startsWith(eventName, "change:")) {
          return _this.ignoreEvents = false;
        }
      })(eventName));
    }
    return _results;
  };

  Layer.prototype.removeListener = function() {
    var eventName, eventNames, listener, _i, _j, _len, _results,
      _this = this;
    eventNames = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), listener = arguments[_i++];
    if (listener.modifiedListener) {
      listener = listener.modifiedListener;
    }
    if (typeof eventNames === 'string') {
      eventNames = [eventNames];
    }
    _results = [];
    for (_j = 0, _len = eventNames.length; _j < _len; _j++) {
      eventName = eventNames[_j];
      _results.push((function(eventName) {
        Layer.__super__.removeListener.call(_this, eventName, listener);
        _this._context.eventManager.wrap(_this._element).removeEventListener(eventName, listener);
        if (_this._eventListeners) {
          return _this._eventListeners[eventName] = _.without(_this._eventListeners[eventName], listener);
        }
      })(eventName));
    }
    return _results;
  };

  Layer.prototype.once = function(eventName, listener) {
    var originalListener,
      _this = this;
    originalListener = listener;
    listener = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      originalListener.apply(null, args);
      return _this.removeListener(eventName, listener);
    };
    return this.addListener(eventName, listener);
  };

  Layer.prototype.removeAllListeners = function() {
    var eventName, listener, listeners, _ref, _results;
    if (!this._eventListeners) {
      return;
    }
    _ref = this._eventListeners;
    _results = [];
    for (eventName in _ref) {
      listeners = _ref[eventName];
      _results.push((function() {
        var _i, _len, _results1;
        _results1 = [];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          _results1.push(this.removeListener(eventName, listener));
        }
        return _results1;
      }).call(this));
    }
    return _results;
  };

  Layer.prototype.on = Layer.prototype.addListener;

  Layer.prototype.off = Layer.prototype.removeListener;

  Layer.prototype.toString = function() {
    var round;
    round = function(value) {
      if (parseInt(value) === value) {
        return parseInt(value);
      }
      return Utils.round(value, 1);
    };
    if (this.name) {
      return "&lt;Layer id:" + this.id + " name:" + this.name + " (" + (round(this.x)) + "," + (round(this.y)) + ") " + (round(this.width)) + "x" + (round(this.height)) + "&gt;";
    }
    return "&lt;Layer id:" + this.id + " (" + (round(this.x)) + "," + (round(this.y)) + ") " + (round(this.width)) + "x" + (round(this.height)) + "&gt;";
  };

  return Layer;

})(BaseClass);


},{"./Animation":1,"./BaseClass":10,"./Config":12,"./Defaults":15,"./EventEmitter":17,"./Frame":23,"./LayerDraggable":27,"./LayerStates":28,"./LayerStyle":29,"./Underscore":32,"./Utils":33}],27:[function(require,module,exports){
var EventEmitter, Events, Utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require("./Underscore")._;

Utils = require("./Utils");

EventEmitter = require("./EventEmitter").EventEmitter;

Events = require("./Events").Events;

Events.DragStart = "dragstart";

Events.DragMove = "dragmove";

Events.DragEnd = "dragend";

"This takes any layer and makes it draggable by the user on mobile or desktop.\n\nSome interesting things are:\n\n- The draggable.calculateVelocity().x|y contains the current average speed \n  in the last 100ms (defined with VelocityTimeOut).\n- You can enable/disable or slowdown/speedup scrolling with\n  draggable.speed.x|y\n";

exports.LayerDraggable = (function(_super) {
  __extends(LayerDraggable, _super);

  LayerDraggable.VelocityTimeOut = 100;

  function LayerDraggable(layer) {
    this.layer = layer;
    this._touchEnd = __bind(this._touchEnd, this);
    this._touchStart = __bind(this._touchStart, this);
    this._updatePosition = __bind(this._updatePosition, this);
    this._deltas = [];
    this._isDragging = false;
    this.enabled = true;
    this.speedX = 1.0;
    this.speedY = 1.0;
    this.maxDragFrame = null;
    this.attach();
  }

  LayerDraggable.prototype.attach = function() {
    return this.layer.on(Events.TouchStart, this._touchStart);
  };

  LayerDraggable.prototype.remove = function() {
    return this.layer.off(Events.TouchStart, this._touchStart);
  };

  LayerDraggable.prototype.emit = function(eventName, event) {
    this.layer.emit(eventName, event);
    return LayerDraggable.__super__.emit.call(this, eventName, event);
  };

  LayerDraggable.prototype.calculateVelocity = function() {
    var curr, prev, time, timeSinceLastMove, velocity;
    if (this._deltas.length < 2) {
      return {
        x: 0,
        y: 0
      };
    }
    curr = this._deltas.slice(-1)[0];
    prev = this._deltas.slice(-2, -1)[0];
    time = curr.t - prev.t;
    timeSinceLastMove = new Date().getTime() - prev.t;
    if (timeSinceLastMove > this.VelocityTimeOut) {
      return {
        x: 0,
        y: 0
      };
    }
    velocity = {
      x: (curr.x - prev.x) / time,
      y: (curr.y - prev.y) / time
    };
    if (velocity.x === Infinity) {
      velocity.x = 0;
    }
    if (velocity.y === Infinity) {
      velocity.y = 0;
    }
    return velocity;
  };

  LayerDraggable.prototype._updatePosition = function(event) {
    var correctedDelta, delta, maxDragFrame, maxX, maxY, minX, minY, newX, newY, touchEvent;
    if (this.enabled === false) {
      return;
    }
    this.emit(Events.DragMove, event);
    touchEvent = Events.touchEvent(event);
    delta = {
      x: touchEvent.clientX - this._start.x,
      y: touchEvent.clientY - this._start.y
    };
    correctedDelta = {
      x: delta.x * this.speedX * (1 / this._screenScale.x),
      y: delta.y * this.speedY * (1 / this._screenScale.y),
      t: event.timeStamp
    };
    newX = parseInt(this._start.x + correctedDelta.x - this._offset.x);
    newY = parseInt(this._start.y + correctedDelta.y - this._offset.y);
    if (this.maxDragFrame) {
      maxDragFrame = this.maxDragFrame;
      if (_.isFunction(maxDragFrame)) {
        maxDragFrame = maxDragFrame();
      }
      minX = Utils.frameGetMinX(maxDragFrame);
      maxX = Utils.frameGetMaxX(maxDragFrame) - this.layer.width;
      minY = Utils.frameGetMinY(maxDragFrame);
      maxY = Utils.frameGetMaxY(maxDragFrame) - this.layer.height;
      if (newX < minX) {
        newX = minX;
      }
      if (newX > maxX) {
        newX = maxX;
      }
      if (newY < minY) {
        newY = minY;
      }
      if (newY > maxY) {
        newY = maxY;
      }
    }
    this.layer.x = newX;
    this.layer.y = newY;
    this._deltas.push(correctedDelta);
    return this.emit(Events.DragMove, event);
  };

  LayerDraggable.prototype._touchStart = function(event) {
    var touchEvent;
    this.layer.animateStop();
    this._isDragging = true;
    touchEvent = Events.touchEvent(event);
    this._start = {
      x: touchEvent.clientX,
      y: touchEvent.clientY
    };
    this._offset = {
      x: touchEvent.clientX - this.layer.x,
      y: touchEvent.clientY - this.layer.y
    };
    this._screenScale = {
      x: this.layer.screenScaleX(),
      y: this.layer.screenScaleY()
    };
    document.addEventListener(Events.TouchMove, this._updatePosition);
    document.addEventListener(Events.TouchEnd, this._touchEnd);
    return this.emit(Events.DragStart, event);
  };

  LayerDraggable.prototype._touchEnd = function(event) {
    this._isDragging = false;
    document.removeEventListener(Events.TouchMove, this._updatePosition);
    document.removeEventListener(Events.TouchEnd, this._touchEnd);
    this.emit(Events.DragEnd, event);
    return this._deltas = [];
  };

  return LayerDraggable;

})(EventEmitter);


},{"./EventEmitter":17,"./Events":19,"./Underscore":32,"./Utils":33}],28:[function(require,module,exports){
var BaseClass, Defaults, Events, LayerStatesIgnoredKeys, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

_ = require("./Underscore")._;

Events = require("./Events").Events;

BaseClass = require("./BaseClass").BaseClass;

Defaults = require("./Defaults").Defaults;

LayerStatesIgnoredKeys = ["ignoreEvents"];

Events.StateWillSwitch = "willSwitch";

Events.StateDidSwitch = "didSwitch";

exports.LayerStates = (function(_super) {
  __extends(LayerStates, _super);

  function LayerStates(layer) {
    this.layer = layer;
    this._states = {};
    this._orderedStates = [];
    this.animationOptions = {};
    this.add("default", this.layer.properties);
    this._currentState = "default";
    this._previousStates = [];
    LayerStates.__super__.constructor.apply(this, arguments);
  }

  LayerStates.prototype.add = function(stateName, properties) {
    var error, k, v;
    if (_.isObject(stateName)) {
      for (k in stateName) {
        v = stateName[k];
        this.add(k, v);
      }
      return;
    }
    error = function() {
      throw Error("Usage example: layer.states.add(\"someName\", {x:500})");
    };
    if (!_.isString(stateName)) {
      error();
    }
    if (!_.isObject(properties)) {
      error();
    }
    this._orderedStates.push(stateName);
    return this._states[stateName] = properties;
  };

  LayerStates.prototype.remove = function(stateName) {
    if (!this._states.hasOwnProperty(stateName)) {
      return;
    }
    delete this._states[stateName];
    return this._orderedStates = _.without(this._orderedStates, stateName);
  };

  LayerStates.prototype["switch"] = function(stateName, animationOptions, instant) {
    var animatablePropertyKeys, animatingKeys, k, properties, propertyName, v, value, _ref, _ref1,
      _this = this;
    if (instant == null) {
      instant = false;
    }
    if (!this._states.hasOwnProperty(stateName)) {
      throw Error("No such state: '" + stateName + "'");
    }
    this.emit(Events.StateWillSwitch, this._currentState, stateName, this);
    this._previousStates.push(this._currentState);
    this._currentState = stateName;
    properties = {};
    animatingKeys = this.animatingKeys();
    _ref = this._states[stateName];
    for (propertyName in _ref) {
      value = _ref[propertyName];
      if (__indexOf.call(LayerStatesIgnoredKeys, propertyName) >= 0) {
        continue;
      }
      if (__indexOf.call(animatingKeys, propertyName) < 0) {
        continue;
      }
      if (_.isFunction(value)) {
        value = value.call(this.layer, this.layer, stateName);
      }
      properties[propertyName] = value;
    }
    animatablePropertyKeys = [];
    for (k in properties) {
      v = properties[k];
      if (_.isNumber(v)) {
        animatablePropertyKeys.push(k);
      }
    }
    if (animatablePropertyKeys.length === 0) {
      instant = true;
    }
    if (instant === true) {
      this.layer.properties = properties;
      return this.emit(Events.StateDidSwitch, _.last(this._previousStates), stateName, this);
    } else {
      if (animationOptions == null) {
        animationOptions = this.animationOptions;
      }
      animationOptions.properties = properties;
      if ((_ref1 = this._animation) != null) {
        _ref1.stop();
      }
      this._animation = this.layer.animate(animationOptions);
      return this._animation.on("stop", function() {
        for (k in properties) {
          v = properties[k];
          if (!_.isNumber(v)) {
            _this.layer[k] = v;
          }
        }
        return _this.emit(Events.StateDidSwitch, _.last(_this._previousStates), stateName, _this);
      });
    }
  };

  LayerStates.prototype.switchInstant = function(stateName) {
    return this["switch"](stateName, null, true);
  };

  LayerStates.define("state", {
    get: function() {
      return this._currentState;
    }
  });

  LayerStates.define("current", {
    get: function() {
      return this._currentState;
    }
  });

  LayerStates.prototype.states = function() {
    return _.clone(this._orderedStates);
  };

  LayerStates.prototype.animatingKeys = function() {
    var keys, state, stateName, _ref;
    keys = [];
    _ref = this._states;
    for (stateName in _ref) {
      state = _ref[stateName];
      if (stateName === "default") {
        continue;
      }
      keys = _.union(keys, _.keys(state));
    }
    return keys;
  };

  LayerStates.prototype.previous = function(states, animationOptions) {
    if (states == null) {
      states = this.states();
    }
    return this["switch"](Utils.arrayPrev(states, this._currentState), animationOptions);
  };

  LayerStates.prototype.next = function() {
    var states;
    states = Utils.arrayFromArguments(arguments);
    if (!states.length) {
      states = this.states();
    }
    return this["switch"](Utils.arrayNext(states, this._currentState));
  };

  LayerStates.prototype.last = function(animationOptions) {
    return this["switch"](_.last(this._previousStates), animationOptions);
  };

  LayerStates.prototype.emit = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    LayerStates.__super__.emit.apply(this, arguments);
    return (_ref = this.layer).emit.apply(_ref, args);
  };

  return LayerStates;

})(BaseClass);


},{"./BaseClass":10,"./Defaults":15,"./Events":19,"./Underscore":32}],29:[function(require,module,exports){
var filterFormat, _Force2DProperties, _WebkitProperties;

filterFormat = function(value, unit) {
  return "" + (Utils.round(value, 2)) + unit;
};

_WebkitProperties = [["blur", "blur", 0, "px"], ["brightness", "brightness", 100, "%"], ["saturate", "saturate", 100, "%"], ["hue-rotate", "hueRotate", 0, "deg"], ["contrast", "contrast", 100, "%"], ["invert", "invert", 0, "%"], ["grayscale", "grayscale", 0, "%"], ["sepia", "sepia", 0, "%"]];

_Force2DProperties = {
  "z": 0,
  "scaleX": 1,
  "scaleY": 1,
  "scaleZ": 1,
  "skewX": 0,
  "skewY": 0,
  "rotationX": 0,
  "rotationY": 0
};

exports.LayerStyle = {
  width: function(layer) {
    return layer._properties.width + "px";
  },
  height: function(layer) {
    return layer._properties.height + "px";
  },
  display: function(layer) {
    if (layer._properties.visible === true) {
      return "block";
    }
    return "none";
  },
  opacity: function(layer) {
    return layer._properties.opacity;
  },
  overflow: function(layer) {
    if (layer._properties.scrollHorizontal === true || layer._properties.scrollVertical === true) {
      return "auto";
    }
    if (layer._properties.clip === true) {
      return "hidden";
    }
    return "visible";
  },
  overflowX: function(layer) {
    if (layer._properties.scrollHorizontal === true) {
      return "scroll";
    }
    if (layer._properties.clip === true) {
      return "hidden";
    }
    return "visible";
  },
  overflowY: function(layer) {
    if (layer._properties.scrollVertical === true) {
      return "scroll";
    }
    if (layer._properties.clip === true) {
      return "hidden";
    }
    return "visible";
  },
  zIndex: function(layer) {
    return layer._properties.index;
  },
  webkitFilter: function(layer) {
    var css, cssName, fallback, layerName, unit, _i, _len, _ref;
    css = [];
    for (_i = 0, _len = _WebkitProperties.length; _i < _len; _i++) {
      _ref = _WebkitProperties[_i], cssName = _ref[0], layerName = _ref[1], fallback = _ref[2], unit = _ref[3];
      if (layer[layerName] !== fallback) {
        css.push("" + cssName + "(" + (filterFormat(layer[layerName], unit)) + ")");
      }
    }
    return css.join(" ");
  },
  webkitTransform: function(layer) {
    if (layer._prefer2d || layer._properties.force2d) {
      return exports.LayerStyle.webkitTransformForce2d(layer);
    }
    return "		translate3d(" + layer._properties.x + "px," + layer._properties.y + "px," + layer._properties.z + "px) 		scale(" + layer._properties.scale + ")		scale3d(" + layer._properties.scaleX + "," + layer._properties.scaleY + "," + layer._properties.scaleZ + ")		skew(" + layer._properties.skew + "deg," + layer._properties.skew + "deg) 		skewX(" + layer._properties.skewX + "deg)  		skewY(" + layer._properties.skewY + "deg) 		rotateX(" + layer._properties.rotationX + "deg) 		rotateY(" + layer._properties.rotationY + "deg) 		rotateZ(" + layer._properties.rotationZ + "deg) 		";
  },
  webkitTransformForce2d: function(layer) {
    var css, p, v;
    css = [];
    for (p in _Force2DProperties) {
      v = _Force2DProperties[p];
      if (layer._properties[p] !== v) {
        console.warn("Layer property '" + p + "'' will be ignored with force2d enabled");
      }
    }
    css.push("translate(" + layer._properties.x + "px," + layer._properties.y + "px)");
    css.push("scale(" + layer._properties.scale + ")");
    css.push("skew(" + layer._properties.skew + "deg," + layer._properties.skew + "deg)");
    css.push("rotate(" + layer._properties.rotationZ + "deg)");
    return css.join(" ");
  },
  webkitTransformOrigin: function(layer) {
    return "" + (layer._properties.originX * 100) + "% " + (layer._properties.originY * 100) + "%";
  },
  webkitPerspective: function(layer) {
    return "" + layer._properties.perspective;
  },
  pointerEvents: function(layer) {
    if (layer._properties.ignoreEvents) {
      return "none";
    } else {
      return "auto";
    }
  },
  boxShadow: function(layer) {
    if (!layer._properties.shadowColor) {
      return "";
    }
    return "" + layer._properties.shadowX + "px " + layer._properties.shadowY + "px " + layer._properties.shadowBlur + "px " + layer._properties.shadowSpread + "px " + layer._properties.shadowColor;
  },
  backgroundColor: function(layer) {
    return layer._properties.backgroundColor;
  },
  color: function(layer) {
    return layer._properties.color;
  },
  borderRadius: function(layer) {
    if (!_.isNumber(layer._properties.borderRadius)) {
      return layer._properties.borderRadius;
    }
    return layer._properties.borderRadius + "px";
  },
  border: function(layer) {
    return "" + layer._properties.borderWidth + "px solid " + layer._properties.borderWidth;
  }
};


},{}],30:[function(require,module,exports){
var Context, Utils, printContext, printLayer,
  __slice = [].slice;

Utils = require("./Utils");

Context = require("./Context").Context;

"\nTodo:\n- Better looks\n- Resizable\n- Live in own space on top of all Framer stuff\n";

printContext = null;

printLayer = null;

exports.print = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if (!printContext) {
    printContext = new Context({
      name: "Print"
    });
  }
  printContext.run(function() {
    var printNode, update;
    if (!printLayer) {
      printLayer = new Layer;
      printLayer.scrollVertical = true;
      printLayer.ignoreEvents = false;
      printLayer.html = "";
      printLayer.style = {
        "font": "12px/1.35em Menlo",
        "color": "rgba(0,0,0,.7)",
        "padding": "8px",
        "padding-bottom": "30px",
        "border-top": "1px solid #d9d9d9"
      };
      printLayer.opacity = 0.9;
      printLayer.style.zIndex = 999;
      printLayer.visible = true;
      printLayer.backgroundColor = "white";
      update = function() {
        printLayer.width = window.innerWidth;
        printLayer.height = 160;
        return printLayer.maxY = window.innerHeight;
      };
      update();
      printContext.eventManager.wrap(window).addEventListener("resize", update);
    }
    printNode = document.createElement("div");
    printNode.innerHTML = "&raquo; " + args.map(Utils.stringify).join(", ") + "<br>";
    printNode.style["-webkit-user-select"] = "text";
    printNode.style["cursor"] = "auto";
    return printLayer._element.appendChild(printNode);
  });
  return Utils.delay(0, function() {
    return printLayer._element.scrollTop = printLayer._element.scrollHeight;
  });
};


},{"./Context":13,"./Utils":33}],31:[function(require,module,exports){
var BaseClass, ScreenClass, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

BaseClass = require("./BaseClass").BaseClass;

ScreenClass = (function(_super) {
  __extends(ScreenClass, _super);

  function ScreenClass() {
    this.addListener = __bind(this.addListener, this);
    _ref = ScreenClass.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ScreenClass.define("width", {
    get: function() {
      return window.innerWidth;
    }
  });

  ScreenClass.define("height", {
    get: function() {
      return window.innerHeight;
    }
  });

  ScreenClass.prototype.addListener = function(eventName, listener) {
    var _this = this;
    if (eventName === "resize") {
      Framer.CurrentContext.eventManager.wrap(window).addEventListener("resize", function() {
        return _this.emit("resize");
      });
    }
    return ScreenClass.__super__.addListener.call(this, eventName, listener);
  };

  ScreenClass.prototype.on = ScreenClass.prototype.addListener;

  return ScreenClass;

})(BaseClass);

exports.Screen = new ScreenClass;


},{"./BaseClass":10}],32:[function(require,module,exports){
var _;

_ = require("lodash");

_.str = require('underscore.string');

_.mixin(_.str.exports());

_.isBool = function(v) {
  return typeof v === 'boolean';
};

exports._ = _;


},{"lodash":36,"underscore.string":37}],33:[function(require,module,exports){
var Screen, Utils, _, __domComplete, __domReady, _textSizeNode,
  __slice = [].slice,
  _this = this;

_ = require("./Underscore")._;

Screen = require("./Screen").Screen;

Utils = {};

Utils.reset = function() {
  return Framer.CurrentContext.reset();
};

Utils.getValue = function(value) {
  if (_.isFunction(value)) {
    return value();
  }
  return value;
};

Utils.setDefaultProperties = function(obj, defaults, warn) {
  var k, result, v;
  if (warn == null) {
    warn = true;
  }
  result = {};
  for (k in defaults) {
    v = defaults[k];
    if (obj.hasOwnProperty(k)) {
      result[k] = obj[k];
    } else {
      result[k] = defaults[k];
    }
  }
  if (warn) {
    for (k in obj) {
      v = obj[k];
      if (!defaults.hasOwnProperty(k)) {
        console.warn("Utils.setDefaultProperties: got unexpected option: '" + k + " -> " + v + "'", obj);
      }
    }
  }
  return result;
};

Utils.valueOrDefault = function(value, defaultValue) {
  if (value === (void 0) || value === null) {
    value = defaultValue;
  }
  return value;
};

Utils.arrayToObject = function(arr) {
  var item, obj, _i, _len;
  obj = {};
  for (_i = 0, _len = arr.length; _i < _len; _i++) {
    item = arr[_i];
    obj[item[0]] = item[1];
  }
  return obj;
};

Utils.arrayNext = function(arr, item) {
  return arr[arr.indexOf(item) + 1] || _.first(arr);
};

Utils.arrayPrev = function(arr, item) {
  return arr[arr.indexOf(item) - 1] || _.last(arr);
};

Utils.sum = function(arr) {
  return _.reduce(arr, function(a, b) {
    return a + b;
  });
};

Utils.average = function(arr) {
  return Utils.sum(arr) / arr.length;
};

Utils.mean = Utils.average;

Utils.median = function(x) {
  var sorted;
  if (x.length === 0) {
    return null;
  }
  sorted = x.slice().sort(function(a, b) {
    return a - b;
  });
  if (sorted.length % 2 === 1) {
    return sorted[(sorted.length - 1) / 2];
  } else {
    return (sorted[(sorted.length / 2) - 1] + sorted[sorted.length / 2]) / 2;
  }
};

if (window.requestAnimationFrame == null) {
  window.requestAnimationFrame = window.webkitRequestAnimationFrame;
}

if (window.requestAnimationFrame == null) {
  window.requestAnimationFrame = function(f) {
    return Utils.delay(1 / 60, f);
  };
}

Utils.getTime = function() {
  return Date.now() / 1000;
};

Utils.delay = function(time, f) {
  var timer;
  timer = setTimeout(f, time * 1000);
  Framer.CurrentContext._delayTimers.push(timer);
  return timer;
};

Utils.interval = function(time, f) {
  var timer;
  timer = setInterval(f, time * 1000);
  Framer.CurrentContext._delayIntervals.push(timer);
  return timer;
};

Utils.debounce = function(threshold, fn, immediate) {
  var timeout;
  if (threshold == null) {
    threshold = 0.1;
  }
  timeout = null;
  threshold *= 1000;
  return function() {
    var args, delayed, obj;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    obj = this;
    delayed = function() {
      if (!immediate) {
        fn.apply(obj, args);
      }
      return timeout = null;
    };
    if (timeout) {
      clearTimeout(timeout);
    } else if (immediate) {
      fn.apply(obj, args);
    }
    return timeout = setTimeout(delayed, threshold);
  };
};

Utils.throttle = function(delay, fn) {
  var timer;
  if (delay === 0) {
    return fn;
  }
  delay *= 1000;
  timer = false;
  return function() {
    if (timer) {
      return;
    }
    timer = true;
    if (delay !== -1) {
      setTimeout((function() {
        return timer = false;
      }), delay);
    }
    return fn.apply(null, arguments);
  };
};

Utils.memoize = function(fn) {
  return function() {
    var args, currentArg, hash, i;
    args = Array.prototype.slice.call(arguments);
    hash = "";
    i = args.length;
    currentArg = null;
    while (i--) {
      currentArg = args[i];
      hash += (currentArg === Object(currentArg) ? JSON.stringify(currentArg) : currentArg);
      fn.memoize || (fn.memoize = {});
    }
    if (hash in fn.memoize) {
      return fn.memoize[hash];
    } else {
      return fn.memoize[hash] = fn.apply(this, args);
    }
  };
};

Utils.randomColor = function(alpha) {
  var c;
  if (alpha == null) {
    alpha = 1.0;
  }
  c = function() {
    return parseInt(Math.random() * 255);
  };
  return "rgba(" + (c()) + ", " + (c()) + ", " + (c()) + ", " + alpha + ")";
};

Utils.randomChoice = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};

Utils.randomNumber = function(a, b) {
  if (a == null) {
    a = 0;
  }
  if (b == null) {
    b = 1;
  }
  return Utils.mapRange(Math.random(), 0, 1, a, b);
};

Utils.labelLayer = function(layer, text, style) {
  if (style == null) {
    style = {};
  }
  style = _.extend({
    font: "10px/1em Menlo",
    lineHeight: "" + layer.height + "px",
    textAlign: "center",
    color: "#fff"
  }, style);
  layer.style = style;
  return layer.html = text;
};

Utils.stringify = function(obj) {
  try {
    if (_.isObject(obj)) {
      return JSON.stringify(obj);
    }
  } catch (_error) {
    "";
  }
  if (obj === null) {
    return "null";
  }
  if (obj === void 0) {
    return "undefined";
  }
  if (obj.toString) {
    return obj.toString();
  }
  return obj;
};

Utils.uuid = function() {
  var chars, digit, output, r, random, _i;
  chars = "0123456789abcdefghijklmnopqrstuvwxyz".split("");
  output = new Array(36);
  random = 0;
  for (digit = _i = 1; _i <= 32; digit = ++_i) {
    if (random <= 0x02) {
      random = 0x2000000 + (Math.random() * 0x1000000) | 0;
    }
    r = random & 0xf;
    random = random >> 4;
    output[digit] = chars[digit === 19 ? (r & 0x3) | 0x8 : r];
  }
  return output.join("");
};

Utils.arrayFromArguments = function(args) {
  if (_.isArray(args[0])) {
    return args[0];
  }
  return Array.prototype.slice.call(args);
};

Utils.cycle = function() {
  var args, curr;
  args = Utils.arrayFromArguments(arguments);
  curr = -1;
  return function() {
    curr++;
    if (curr >= args.length) {
      curr = 0;
    }
    return args[curr];
  };
};

Utils.toggle = Utils.cycle;

Utils.isWebKit = function() {
  return window.WebKitCSSMatrix !== void 0;
};

Utils.webkitVersion = function() {
  var regexp, result, version;
  version = -1;
  regexp = /AppleWebKit\/([\d.]+)/;
  result = regexp.exec(navigator.userAgent);
  if (result) {
    version = parseFloat(result[1]);
  }
  return version;
};

Utils.isChrome = function() {
  return /chrome/.test(navigator.userAgent.toLowerCase());
};

Utils.isSafari = function() {
  return /safari/.test(navigator.userAgent.toLowerCase());
};

Utils.isTouch = function() {
  return window.ontouchstart === null;
};

Utils.isDesktop = function() {
  return Utils.deviceType() === "desktop";
};

Utils.isPhone = function() {
  return Utils.deviceType() === "phone";
};

Utils.isTablet = function() {
  return Utils.deviceType() === "tablet";
};

Utils.isMobile = function() {
  return Utils.isPhone() || Utils.isTablet();
};

Utils.isLocal = function() {
  return Utils.isLocalUrl(window.location.href);
};

Utils.isLocalUrl = function(url) {
  return url.slice(0, 7) === "file://";
};

Utils.isFramerStudio = function() {
  return navigator.userAgent.indexOf("FramerStudio") !== -1;
};

Utils.devicePixelRatio = function() {
  return window.devicePixelRatio;
};

Utils.isJP2Supported = function() {
  return Utils.isWebKit() && !Utils.isChrome();
};

Utils.deviceType = function() {
  if (/(mobi)/i.test(navigator.userAgent)) {
    return "phone";
  }
  if (/(tablet)|(iPad)/i.test(navigator.userAgent)) {
    return "tablet";
  }
  return "desktop";
};

Utils.pathJoin = function() {
  return Utils.arrayFromArguments(arguments).join("/");
};

Utils.round = function(value, decimals) {
  var d;
  d = Math.pow(10, decimals);
  return Math.round(value * d) / d;
};

Utils.mapRange = function(value, fromLow, fromHigh, toLow, toHigh) {
  return toLow + (((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));
};

Utils.modulate = function(value, rangeA, rangeB, limit) {
  var fromHigh, fromLow, result, toHigh, toLow;
  if (limit == null) {
    limit = false;
  }
  fromLow = rangeA[0], fromHigh = rangeA[1];
  toLow = rangeB[0], toHigh = rangeB[1];
  result = toLow + (((value - fromLow) / (fromHigh - fromLow)) * (toHigh - toLow));
  if (limit === true) {
    if (toLow < toHigh) {
      if (result < toLow) {
        return toLow;
      }
      if (result > toHigh) {
        return toHigh;
      }
    } else {
      if (result > toLow) {
        return toLow;
      }
      if (result < toHigh) {
        return toHigh;
      }
    }
  }
  return result;
};

Utils.parseFunction = function(str) {
  var result;
  result = {
    name: "",
    args: []
  };
  if (_.endsWith(str, ")")) {
    result.name = str.split("(")[0];
    result.args = str.split("(")[1].split(",").map(function(a) {
      return _.trim(_.rtrim(a, ")"));
    });
  } else {
    result.name = str;
  }
  return result;
};

__domComplete = [];

__domReady = false;

if (typeof document !== "undefined" && document !== null) {
  document.onreadystatechange = function(event) {
    var f, _results;
    if (document.readyState === "complete") {
      __domReady = true;
      _results = [];
      while (__domComplete.length) {
        _results.push(f = __domComplete.shift()());
      }
      return _results;
    }
  };
}

Utils.domComplete = function(f) {
  if (document.readyState === "complete") {
    return f();
  } else {
    return __domComplete.push(f);
  }
};

Utils.domCompleteCancel = function(f) {
  return __domComplete = _.without(__domComplete, f);
};

Utils.domLoadScript = function(url, callback) {
  var head, script;
  script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;
  script.onload = callback;
  head = document.getElementsByTagName("head")[0];
  head.appendChild(script);
  return script;
};

Utils.domLoadData = function(path, callback) {
  var request;
  request = new XMLHttpRequest();
  request.addEventListener("load", function() {
    return callback(null, request.responseText);
  }, false);
  request.addEventListener("error", function() {
    return callback(true, null);
  }, false);
  request.open("GET", path, true);
  return request.send(null);
};

Utils.domLoadJSON = function(path, callback) {
  return Utils.domLoadData(path, function(err, data) {
    return callback(err, JSON.parse(data));
  });
};

Utils.domLoadDataSync = function(path) {
  var data, e, request;
  request = new XMLHttpRequest();
  request.open("GET", path, false);
  try {
    request.send(null);
  } catch (_error) {
    e = _error;
    console.debug("XMLHttpRequest.error", e);
  }
  data = request.responseText;
  if (!data) {
    throw Error("Utils.domLoadDataSync: no data was loaded (url not found?)");
  }
  return request.responseText;
};

Utils.domLoadJSONSync = function(path) {
  return JSON.parse(Utils.domLoadDataSync(path));
};

Utils.domLoadScriptSync = function(path) {
  var scriptData;
  scriptData = Utils.domLoadDataSync(path);
  eval(scriptData);
  return scriptData;
};

Utils.insertCSS = function(css) {
  var styleElement;
  styleElement = document.createElement("style");
  styleElement.type = "text/css";
  styleElement.innerHTML = css;
  return Utils.domComplete(function() {
    return document.body.appendChild(styleElement);
  });
};

Utils.loadImage = function(url, callback, context) {
  var element;
  element = new Image;
  if (context == null) {
    context = Framer.CurrentContext;
  }
  context.eventManager.wrap(element).addEventListener("load", function(event) {
    return callback();
  });
  context.eventManager.wrap(element).addEventListener("error", function(event) {
    return callback(true);
  });
  return element.src = url;
};

Utils.pointMin = function() {
  var point, points;
  points = Utils.arrayFromArguments(arguments);
  return point = {
    x: _.min(point.map(function(size) {
      return size.x;
    })),
    y: _.min(point.map(function(size) {
      return size.y;
    }))
  };
};

Utils.pointMax = function() {
  var point, points;
  points = Utils.arrayFromArguments(arguments);
  return point = {
    x: _.max(point.map(function(size) {
      return size.x;
    })),
    y: _.max(point.map(function(size) {
      return size.y;
    }))
  };
};

Utils.pointDistance = function(pointA, pointB) {
  var distance;
  return distance = {
    x: Math.abs(pointB.x - pointA.x),
    y: Math.abs(pointB.y - pointA.y)
  };
};

Utils.pointInvert = function(point) {
  return point = {
    x: 0 - point.x,
    y: 0 - point.y
  };
};

Utils.pointTotal = function(point) {
  return point.x + point.y;
};

Utils.pointAbs = function(point) {
  return point = {
    x: Math.abs(point.x),
    y: Math.abs(point.y)
  };
};

Utils.pointInFrame = function(point, frame) {
  if (point.x < frame.minX || point.x > frame.maxX) {
    return false;
  }
  if (point.y < frame.minY || point.y > frame.maxY) {
    return false;
  }
  return true;
};

Utils.sizeMin = function() {
  var size, sizes;
  sizes = Utils.arrayFromArguments(arguments);
  return size = {
    width: _.min(sizes.map(function(size) {
      return size.width;
    })),
    height: _.min(sizes.map(function(size) {
      return size.height;
    }))
  };
};

Utils.sizeMax = function() {
  var size, sizes;
  sizes = Utils.arrayFromArguments(arguments);
  return size = {
    width: _.max(sizes.map(function(size) {
      return size.width;
    })),
    height: _.max(sizes.map(function(size) {
      return size.height;
    }))
  };
};

Utils.frameGetMinX = function(frame) {
  return frame.x;
};

Utils.frameSetMinX = function(frame, value) {
  return frame.x = value;
};

Utils.frameGetMidX = function(frame) {
  if (frame.width === 0) {
    return 0;
  } else {
    return frame.x + (frame.width / 2.0);
  }
};

Utils.frameSetMidX = function(frame, value) {
  return frame.x = frame.width === 0 ? 0 : value - (frame.width / 2.0);
};

Utils.frameGetMaxX = function(frame) {
  if (frame.width === 0) {
    return 0;
  } else {
    return frame.x + frame.width;
  }
};

Utils.frameSetMaxX = function(frame, value) {
  return frame.x = frame.width === 0 ? 0 : value - frame.width;
};

Utils.frameGetMinY = function(frame) {
  return frame.y;
};

Utils.frameSetMinY = function(frame, value) {
  return frame.y = value;
};

Utils.frameGetMidY = function(frame) {
  if (frame.height === 0) {
    return 0;
  } else {
    return frame.y + (frame.height / 2.0);
  }
};

Utils.frameSetMidY = function(frame, value) {
  return frame.y = frame.height === 0 ? 0 : value - (frame.height / 2.0);
};

Utils.frameGetMaxY = function(frame) {
  if (frame.height === 0) {
    return 0;
  } else {
    return frame.y + frame.height;
  }
};

Utils.frameSetMaxY = function(frame, value) {
  return frame.y = frame.height === 0 ? 0 : value - frame.height;
};

Utils.frameSize = function(frame) {
  var size;
  return size = {
    width: frame.width,
    height: frame.height
  };
};

Utils.framePoint = function(frame) {
  var point;
  return point = {
    x: frame.x,
    y: frame.y
  };
};

Utils.frameMerge = function() {
  var frame, frames;
  frames = Utils.arrayFromArguments(arguments);
  frame = {
    x: _.min(frames.map(Utils.frameGetMinX)),
    y: _.min(frames.map(Utils.frameGetMinY))
  };
  frame.width = _.max(frames.map(Utils.frameGetMaxX)) - frame.x;
  frame.height = _.max(frames.map(Utils.frameGetMaxY)) - frame.y;
  return frame;
};

Utils.convertPoint = function(input, layerA, layerB) {
  var layer, point, superLayersA, superLayersB, _i, _j, _len, _len1;
  point = _.defaults(input, {
    x: 0,
    y: 0
  });
  superLayersA = (layerA != null ? layerA.superLayers() : void 0) || [];
  superLayersB = (layerB != null ? layerB.superLayers() : void 0) || [];
  if (layerB) {
    superLayersB.push(layerB);
  }
  for (_i = 0, _len = superLayersA.length; _i < _len; _i++) {
    layer = superLayersA[_i];
    point.x += layer.x - layer.scrollFrame.x;
    point.y += layer.y - layer.scrollFrame.y;
  }
  for (_j = 0, _len1 = superLayersB.length; _j < _len1; _j++) {
    layer = superLayersB[_j];
    point.x -= layer.x + layer.scrollFrame.x;
    point.y -= layer.y + layer.scrollFrame.y;
  }
  return point;
};

Utils.globalLayers = function(importedLayers) {
  var layer, layerName;
  for (layerName in importedLayers) {
    layer = importedLayers[layerName];
    layerName = layerName.replace(/\s/g, "");
    if (window.hasOwnProperty(layerName) && !window.Framer._globalWarningGiven) {
      print("Warning: Cannot make layer '" + layerName + "' a global, a variable with that name already exists");
    } else {
      window[layerName] = layer;
    }
  }
  return window.Framer._globalWarningGiven = true;
};

_textSizeNode = null;

Utils.textSize = function(text, style, constraints) {
  var frame, rect, shouldCreateNode;
  if (style == null) {
    style = {};
  }
  if (constraints == null) {
    constraints = {};
  }
  shouldCreateNode = !_textSizeNode;
  if (shouldCreateNode) {
    _textSizeNode = document.createElement("div");
    _textSizeNode.id = "_textSizeNode";
  }
  _textSizeNode.innerHTML = text;
  style = _.extend(style, {
    position: "fixed",
    display: "inline",
    visibility: "hidden",
    top: "-10000px",
    left: "-10000px"
  });
  delete style.width;
  delete style.height;
  delete style.bottom;
  delete style.right;
  if (constraints.width) {
    style.width = "" + constraints.width + "px";
  }
  if (constraints.height) {
    style.height = "" + constraints.height + "px";
  }
  _.extend(_textSizeNode.style, style);
  if (shouldCreateNode) {
    if (!window.document.body) {
      document.write(_textSizeNode.outerHTML);
      _textSizeNode = document.getElementById("_textSizeNode");
    } else {
      window.document.body.appendChild(_textSizeNode);
    }
  }
  rect = _textSizeNode.getBoundingClientRect();
  return frame = {
    width: rect.right - rect.left,
    height: rect.bottom - rect.top
  };
};

_.extend(exports, Utils);


},{"./Screen":31,"./Underscore":32}],34:[function(require,module,exports){
var Layer,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Layer = require("./Layer").Layer;

exports.VideoLayer = (function(_super) {
  __extends(VideoLayer, _super);

  function VideoLayer(options) {
    if (options == null) {
      options = {};
    }
    VideoLayer.__super__.constructor.call(this, options);
    this.player = document.createElement("video");
    this.player.setAttribute("webkit-playsinline", "true");
    this.player.style.width = "100%";
    this.player.style.height = "100%";
    this.player.on = this.player.addEventListener;
    this.player.off = this.player.removeEventListener;
    this.video = options.video;
    this._element.appendChild(this.player);
  }

  VideoLayer.define("video", {
    get: function() {
      return this.player.src;
    },
    set: function(video) {
      return this.player.src = video;
    }
  });

  return VideoLayer;

})(Layer);


},{"./Layer":26}],35:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],36:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * @license
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modern -o ./dist/lodash.js`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre ES5 environments */
  var undefined;

  /** Used to pool arrays and objects used internally */
  var arrayPool = [],
      objectPool = [];

  /** Used to generate unique IDs */
  var idCounter = 0;

  /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
  var keyPrefix = +new Date + '';

  /** Used as the size when optimizations are enabled for large arrays */
  var largeArraySize = 75;

  /** Used as the max size of the `arrayPool` and `objectPool` */
  var maxPoolSize = 40;

  /** Used to detect and test whitespace */
  var whitespace = (
    // whitespace
    ' \t\x0B\f\xA0\ufeff' +

    // line terminators
    '\n\r\u2028\u2029' +

    // unicode category "Zs" space separators
    '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
  );

  /** Used to match empty string literals in compiled template source */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /**
   * Used to match ES6 template delimiters
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match regexp flags from their coerced string values */
  var reFlags = /\w*$/;

  /** Used to detected named functions */
  var reFuncName = /^\s*function[ \n\r\t]+\w/;

  /** Used to match "interpolate" template delimiters */
  var reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match leading whitespace and zeros to be removed */
  var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

  /** Used to ensure capturing order of template delimiters */
  var reNoMatch = /($^)/;

  /** Used to detect functions containing a `this` reference */
  var reThis = /\bthis\b/;

  /** Used to match unescaped characters in compiled string literals */
  var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

  /** Used to assign default `context` object properties */
  var contextProps = [
    'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object',
    'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
    'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify */
  var templateCounter = 0;

  /** `Object#toString` result shortcuts */
  var argsClass = '[object Arguments]',
      arrayClass = '[object Array]',
      boolClass = '[object Boolean]',
      dateClass = '[object Date]',
      funcClass = '[object Function]',
      numberClass = '[object Number]',
      objectClass = '[object Object]',
      regexpClass = '[object RegExp]',
      stringClass = '[object String]';

  /** Used to identify object classifications that `_.clone` supports */
  var cloneableClasses = {};
  cloneableClasses[funcClass] = false;
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

  /** Used as an internal `_.debounce` options object */
  var debounceOptions = {
    'leading': false,
    'maxWait': 0,
    'trailing': false
  };

  /** Used as the property descriptor for `__bindData__` */
  var descriptor = {
    'configurable': false,
    'enumerable': false,
    'value': null,
    'writable': false
  };

  /** Used to determine if values are of the language type Object */
  var objectTypes = {
    'boolean': false,
    'function': true,
    'object': true,
    'number': false,
    'string': false,
    'undefined': false
  };

  /** Used to escape characters for inclusion in compiled string literals */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\t': 't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Used as a reference to the global object */
  var root = (objectTypes[typeof window] && window) || this;

  /** Detect free variable `exports` */
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  /** Detect free variable `module` */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports` */
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */
  var freeGlobal = objectTypes[typeof global] && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
    root = freeGlobal;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * The base implementation of `_.indexOf` without support for binary searches
   * or `fromIndex` constraints.
   *
   * @private
   * @param {Array} array The array to search.
   * @param {*} value The value to search for.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the matched value or `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    var index = (fromIndex || 0) - 1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * An implementation of `_.contains` for cache objects that mimics the return
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
   *
   * @private
   * @param {Object} cache The cache object to inspect.
   * @param {*} value The value to search for.
   * @returns {number} Returns `0` if `value` is found, else `-1`.
   */
  function cacheIndexOf(cache, value) {
    var type = typeof value;
    cache = cache.cache;

    if (type == 'boolean' || value == null) {
      return cache[value] ? 0 : -1;
    }
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value;
    cache = (cache = cache[type]) && cache[key];

    return type == 'object'
      ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
      : (cache ? 0 : -1);
  }

  /**
   * Adds a given value to the corresponding cache object.
   *
   * @private
   * @param {*} value The value to add to the cache.
   */
  function cachePush(value) {
    var cache = this.cache,
        type = typeof value;

    if (type == 'boolean' || value == null) {
      cache[value] = true;
    } else {
      if (type != 'number' && type != 'string') {
        type = 'object';
      }
      var key = type == 'number' ? value : keyPrefix + value,
          typeCache = cache[type] || (cache[type] = {});

      if (type == 'object') {
        (typeCache[key] || (typeCache[key] = [])).push(value);
      } else {
        typeCache[key] = true;
      }
    }
  }

  /**
   * Used by `_.max` and `_.min` as the default callback when a given
   * collection is a string value.
   *
   * @private
   * @param {string} value The character to inspect.
   * @returns {number} Returns the code unit of given character.
   */
  function charAtCallback(value) {
    return value.charCodeAt(0);
  }

  /**
   * Used by `sortBy` to compare transformed `collection` elements, stable sorting
   * them in ascending order.
   *
   * @private
   * @param {Object} a The object to compare to `b`.
   * @param {Object} b The object to compare to `a`.
   * @returns {number} Returns the sort order indicator of `1` or `-1`.
   */
  function compareAscending(a, b) {
    var ac = a.criteria,
        bc = b.criteria,
        index = -1,
        length = ac.length;

    while (++index < length) {
      var value = ac[index],
          other = bc[index];

      if (value !== other) {
        if (value > other || typeof value == 'undefined') {
          return 1;
        }
        if (value < other || typeof other == 'undefined') {
          return -1;
        }
      }
    }
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
    // that causes it, under certain circumstances, to return the same value for
    // `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247
    //
    // This also ensures a stable sort in V8 and other engines.
    // See http://code.google.com/p/v8/issues/detail?id=90
    return a.index - b.index;
  }

  /**
   * Creates a cache object to optimize linear searches of large arrays.
   *
   * @private
   * @param {Array} [array=[]] The array to search.
   * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
   */
  function createCache(array) {
    var index = -1,
        length = array.length,
        first = array[0],
        mid = array[(length / 2) | 0],
        last = array[length - 1];

    if (first && typeof first == 'object' &&
        mid && typeof mid == 'object' && last && typeof last == 'object') {
      return false;
    }
    var cache = getObject();
    cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

    var result = getObject();
    result.array = array;
    result.cache = cache;
    result.push = cachePush;

    while (++index < length) {
      result.push(array[index]);
    }
    return result;
  }

  /**
   * Used by `template` to escape characters for inclusion in compiled
   * string literals.
   *
   * @private
   * @param {string} match The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(match) {
    return '\\' + stringEscapes[match];
  }

  /**
   * Gets an array from the array pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Array} The array from the pool.
   */
  function getArray() {
    return arrayPool.pop() || [];
  }

  /**
   * Gets an object from the object pool or creates a new one if the pool is empty.
   *
   * @private
   * @returns {Object} The object from the pool.
   */
  function getObject() {
    return objectPool.pop() || {
      'array': null,
      'cache': null,
      'criteria': null,
      'false': false,
      'index': 0,
      'null': false,
      'number': null,
      'object': null,
      'push': null,
      'string': null,
      'true': false,
      'undefined': false,
      'value': null
    };
  }

  /**
   * Releases the given array back to the array pool.
   *
   * @private
   * @param {Array} [array] The array to release.
   */
  function releaseArray(array) {
    array.length = 0;
    if (arrayPool.length < maxPoolSize) {
      arrayPool.push(array);
    }
  }

  /**
   * Releases the given object back to the object pool.
   *
   * @private
   * @param {Object} [object] The object to release.
   */
  function releaseObject(object) {
    var cache = object.cache;
    if (cache) {
      releaseObject(cache);
    }
    object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
    if (objectPool.length < maxPoolSize) {
      objectPool.push(object);
    }
  }

  /**
   * Slices the `collection` from the `start` index up to, but not including,
   * the `end` index.
   *
   * Note: This function is used instead of `Array#slice` to support node lists
   * in IE < 9 and to ensure dense arrays are returned.
   *
   * @private
   * @param {Array|Object|string} collection The collection to slice.
   * @param {number} start The start index.
   * @param {number} end The end index.
   * @returns {Array} Returns the new array.
   */
  function slice(array, start, end) {
    start || (start = 0);
    if (typeof end == 'undefined') {
      end = array ? array.length : 0;
    }
    var index = -1,
        length = end - start || 0,
        result = Array(length < 0 ? 0 : length);

    while (++index < length) {
      result[index] = array[start + index];
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new `lodash` function using the given context object.
   *
   * @static
   * @memberOf _
   * @category Utilities
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns the `lodash` function.
   */
  function runInContext(context) {
    // Avoid issues with some ES3 environments that attempt to use values, named
    // after built-in constructors like `Object`, for the creation of literals.
    // ES5 clears this up by stating that literals must use built-in constructors.
    // See http://es5.github.io/#x11.1.5.
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;

    /** Native constructor references */
    var Array = context.Array,
        Boolean = context.Boolean,
        Date = context.Date,
        Function = context.Function,
        Math = context.Math,
        Number = context.Number,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /**
     * Used for `Array` method references.
     *
     * Normally `Array.prototype` would suffice, however, using an array literal
     * avoids issues in Narwhal.
     */
    var arrayRef = [];

    /** Used for native method references */
    var objectProto = Object.prototype;

    /** Used to restore the original `_` reference in `noConflict` */
    var oldDash = context._;

    /** Used to resolve the internal [[Class]] of values */
    var toString = objectProto.toString;

    /** Used to detect if a method is native */
    var reNative = RegExp('^' +
      String(toString)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/toString| for [^\]]+/g, '.*?') + '$'
    );

    /** Native method shortcuts */
    var ceil = Math.ceil,
        clearTimeout = context.clearTimeout,
        floor = Math.floor,
        fnToString = Function.prototype.toString,
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
        hasOwnProperty = objectProto.hasOwnProperty,
        push = arrayRef.push,
        setTimeout = context.setTimeout,
        splice = arrayRef.splice,
        unshift = arrayRef.unshift;

    /** Used to set meta data on functions */
    var defineProperty = (function() {
      // IE 8 only accepts DOM elements
      try {
        var o = {},
            func = isNative(func = Object.defineProperty) && func,
            result = func(o, o, o) && func;
      } catch(e) { }
      return result;
    }());

    /* Native method shortcuts for methods with the same name as other `lodash` methods */
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,
        nativeIsFinite = context.isFinite,
        nativeIsNaN = context.isNaN,
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random;

    /** Used to lookup a built-in constructor by [[Class]] */
    var ctorByClass = {};
    ctorByClass[arrayClass] = Array;
    ctorByClass[boolClass] = Boolean;
    ctorByClass[dateClass] = Date;
    ctorByClass[funcClass] = Function;
    ctorByClass[objectClass] = Object;
    ctorByClass[numberClass] = Number;
    ctorByClass[regexpClass] = RegExp;
    ctorByClass[stringClass] = String;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps the given value to enable intuitive
     * method chaining.
     *
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
     * and `unshift`
     *
     * Chaining is supported in custom builds as long as the `value` method is
     * implicitly or explicitly included in the build.
     *
     * The chainable wrapper functions are:
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
     * `compose`, `concat`, `countBy`, `create`, `createCallback`, `curry`,
     * `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`, `flatten`,
     * `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`, `forOwnRight`,
     * `functions`, `groupBy`, `indexBy`, `initial`, `intersection`, `invert`,
     * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
     * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `pull`, `push`,
     * `range`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,
     * `sortBy`, `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`,
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`,
     * and `zip`
     *
     * The non-chainable wrapper functions are:
     * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `findIndex`,
     * `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`, `identity`,
     * `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`, `isElement`,
     * `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`, `isNull`, `isNumber`,
     * `isObject`, `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`,
     * `lastIndexOf`, `mixin`, `noConflict`, `parseInt`, `pop`, `random`, `reduce`,
     * `reduceRight`, `result`, `shift`, `size`, `some`, `sortedIndex`, `runInContext`,
     * `template`, `unescape`, `uniqueId`, and `value`
     *
     * The wrapper functions `first` and `last` return wrapped values when `n` is
     * provided, otherwise they return unwrapped values.
     *
     * Explicit chaining can be enabled by using the `_.chain` method.
     *
     * @name _
     * @constructor
     * @category Chaining
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns a `lodash` instance.
     * @example
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // returns an unwrapped value
     * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * // returns a wrapped value
     * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
       ? value
       : new lodashWrapper(value);
    }

    /**
     * A fast path for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap in a `lodash` instance.
     * @param {boolean} chainAll A flag to enable chaining for all methods
     * @returns {Object} Returns a `lodash` instance.
     */
    function lodashWrapper(value, chainAll) {
      this.__chain__ = !!chainAll;
      this.__wrapped__ = value;
    }
    // ensure `new lodashWrapper` is an instance of `lodash`
    lodashWrapper.prototype = lodash.prototype;

    /**
     * An object used to flag environments features.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    var support = lodash.support = {};

    /**
     * Detect if functions can be decompiled by `Function#toString`
     * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);

    /**
     * Detect if `Function#name` is supported (all but IE).
     *
     * @memberOf _.support
     * @type boolean
     */
    support.funcNames = typeof Function.name == 'string';

    /**
     * By default, the template delimiters used by Lo-Dash are similar to those in
     * embedded Ruby (ERB). Change the following template settings to use alternative
     * delimiters.
     *
     * @static
     * @memberOf _
     * @type Object
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'escape': /<%-([\s\S]+?)%>/g,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'evaluate': /<%([\s\S]+?)%>/g,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type RegExp
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type string
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type Object
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type Function
         */
        '_': lodash
      }
    };

    /*--------------------------------------------------------------------------*/

    /**
     * The base implementation of `_.bind` that creates the bound function and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new bound function.
     */
    function baseBind(bindData) {
      var func = bindData[0],
          partialArgs = bindData[2],
          thisArg = bindData[4];

      function bound() {
        // `Function#bind` spec
        // http://es5.github.io/#x15.3.4.5
        if (partialArgs) {
          // avoid `arguments` object deoptimizations by using `slice` instead
          // of `Array.prototype.slice.call` and not assigning `arguments` to a
          // variable as a ternary expression
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        // mimic the constructor's `return` behavior
        // http://es5.github.io/#x13.2.2
        if (this instanceof bound) {
          // ensure `new bound` is an instance of `func`
          var thisBinding = baseCreate(func.prototype),
              result = func.apply(thisBinding, args || arguments);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisArg, args || arguments);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.clone` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates clones with source counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, isDeep, callback, stackA, stackB) {
      if (callback) {
        var result = callback(value);
        if (typeof result != 'undefined') {
          return result;
        }
      }
      // inspect [[Class]]
      var isObj = isObject(value);
      if (isObj) {
        var className = toString.call(value);
        if (!cloneableClasses[className]) {
          return value;
        }
        var ctor = ctorByClass[className];
        switch (className) {
          case boolClass:
          case dateClass:
            return new ctor(+value);

          case numberClass:
          case stringClass:
            return new ctor(value);

          case regexpClass:
            result = ctor(value.source, reFlags.exec(value));
            result.lastIndex = value.lastIndex;
            return result;
        }
      } else {
        return value;
      }
      var isArr = isArray(value);
      if (isDeep) {
        // check for circular references and return corresponding clone
        var initedStack = !stackA;
        stackA || (stackA = getArray());
        stackB || (stackB = getArray());

        var length = stackA.length;
        while (length--) {
          if (stackA[length] == value) {
            return stackB[length];
          }
        }
        result = isArr ? ctor(value.length) : {};
      }
      else {
        result = isArr ? slice(value) : assign({}, value);
      }
      // add array properties assigned by `RegExp#exec`
      if (isArr) {
        if (hasOwnProperty.call(value, 'index')) {
          result.index = value.index;
        }
        if (hasOwnProperty.call(value, 'input')) {
          result.input = value.input;
        }
      }
      // exit for shallow clone
      if (!isDeep) {
        return result;
      }
      // add the source value to the stack of traversed objects
      // and associate it with its clone
      stackA.push(value);
      stackB.push(result);

      // recursively populate clone (susceptible to call stack limits)
      (isArr ? forEach : forOwn)(value, function(objValue, key) {
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);
      });

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} prototype The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    function baseCreate(prototype, properties) {
      return isObject(prototype) ? nativeCreate(prototype) : {};
    }
    // fallback for browsers without `Object.create`
    if (!nativeCreate) {
      baseCreate = (function() {
        function Object() {}
        return function(prototype) {
          if (isObject(prototype)) {
            Object.prototype = prototype;
            var result = new Object;
            Object.prototype = null;
          }
          return result || context.Object();
        };
      }());
    }

    /**
     * The base implementation of `_.createCallback` without support for creating
     * "_.pluck" or "_.where" style callbacks.
     *
     * @private
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     */
    function baseCreateCallback(func, thisArg, argCount) {
      if (typeof func != 'function') {
        return identity;
      }
      // exit early for no `thisArg` or already bound by `Function#bind`
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {
        return func;
      }
      var bindData = func.__bindData__;
      if (typeof bindData == 'undefined') {
        if (support.funcNames) {
          bindData = !func.name;
        }
        bindData = bindData || !support.funcDecomp;
        if (!bindData) {
          var source = fnToString.call(func);
          if (!support.funcNames) {
            bindData = !reFuncName.test(source);
          }
          if (!bindData) {
            // checks if `func` references the `this` keyword and stores the result
            bindData = reThis.test(source);
            setBindData(func, bindData);
          }
        }
      }
      // exit early if there are no `this` references or `func` is bound
      if (bindData === false || (bindData !== true && bindData[1] & 1)) {
        return func;
      }
      switch (argCount) {
        case 1: return function(value) {
          return func.call(thisArg, value);
        };
        case 2: return function(a, b) {
          return func.call(thisArg, a, b);
        };
        case 3: return function(value, index, collection) {
          return func.call(thisArg, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(thisArg, accumulator, value, index, collection);
        };
      }
      return bind(func, thisArg);
    }

    /**
     * The base implementation of `createWrapper` that creates the wrapper and
     * sets its meta data.
     *
     * @private
     * @param {Array} bindData The bind data array.
     * @returns {Function} Returns the new function.
     */
    function baseCreateWrapper(bindData) {
      var func = bindData[0],
          bitmask = bindData[1],
          partialArgs = bindData[2],
          partialRightArgs = bindData[3],
          thisArg = bindData[4],
          arity = bindData[5];

      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          key = func;

      function bound() {
        var thisBinding = isBind ? thisArg : this;
        if (partialArgs) {
          var args = slice(partialArgs);
          push.apply(args, arguments);
        }
        if (partialRightArgs || isCurry) {
          args || (args = slice(arguments));
          if (partialRightArgs) {
            push.apply(args, partialRightArgs);
          }
          if (isCurry && args.length < arity) {
            bitmask |= 16 & ~32;
            return baseCreateWrapper([func, (isCurryBound ? bitmask : bitmask & ~3), args, null, thisArg, arity]);
          }
        }
        args || (args = arguments);
        if (isBindKey) {
          func = thisBinding[key];
        }
        if (this instanceof bound) {
          thisBinding = baseCreate(func.prototype);
          var result = func.apply(thisBinding, args);
          return isObject(result) ? result : thisBinding;
        }
        return func.apply(thisBinding, args);
      }
      setBindData(bound, bindData);
      return bound;
    }

    /**
     * The base implementation of `_.difference` that accepts a single array
     * of values to exclude.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {Array} [values] The array of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     */
    function baseDifference(array, values) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          isLarge = length >= largeArraySize && indexOf === baseIndexOf,
          result = [];

      if (isLarge) {
        var cache = createCache(values);
        if (cache) {
          indexOf = cacheIndexOf;
          values = cache;
        } else {
          isLarge = false;
        }
      }
      while (++index < length) {
        var value = array[index];
        if (indexOf(values, value) < 0) {
          result.push(value);
        }
      }
      if (isLarge) {
        releaseObject(values);
      }
      return result;
    }

    /**
     * The base implementation of `_.flatten` without support for callback
     * shorthands or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
     * @param {number} [fromIndex=0] The index to start from.
     * @returns {Array} Returns a new flattened array.
     */
    function baseFlatten(array, isShallow, isStrict, fromIndex) {
      var index = (fromIndex || 0) - 1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];

        if (value && typeof value == 'object' && typeof value.length == 'number'
            && (isArray(value) || isArguments(value))) {
          // recursively flatten arrays (susceptible to call stack limits)
          if (!isShallow) {
            value = baseFlatten(value, isShallow, isStrict);
          }
          var valIndex = -1,
              valLength = value.length,
              resIndex = result.length;

          result.length += valLength;
          while (++valIndex < valLength) {
            result[resIndex++] = value[valIndex];
          }
        } else if (!isStrict) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,
     * that allows partial "_.where" style comparisons.
     *
     * @private
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {
      // used to indicate that when comparing objects, `a` has at least the properties of `b`
      if (callback) {
        var result = callback(a, b);
        if (typeof result != 'undefined') {
          return !!result;
        }
      }
      // exit early for identical values
      if (a === b) {
        // treat `+0` vs. `-0` as not equal
        return a !== 0 || (1 / a == 1 / b);
      }
      var type = typeof a,
          otherType = typeof b;

      // exit early for unlike primitive values
      if (a === a &&
          !(a && objectTypes[type]) &&
          !(b && objectTypes[otherType])) {
        return false;
      }
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior
      // http://es5.github.io/#x15.3.4.4
      if (a == null || b == null) {
        return a === b;
      }
      // compare [[Class]] names
      var className = toString.call(a),
          otherClass = toString.call(b);

      if (className == argsClass) {
        className = objectClass;
      }
      if (otherClass == argsClass) {
        otherClass = objectClass;
      }
      if (className != otherClass) {
        return false;
      }
      switch (className) {
        case boolClass:
        case dateClass:
          // coerce dates and booleans to numbers, dates to milliseconds and booleans
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal
          return +a == +b;

        case numberClass:
          // treat `NaN` vs. `NaN` as equal
          return (a != +a)
            ? b != +b
            // but treat `+0` vs. `-0` as not equal
            : (a == 0 ? (1 / a == 1 / b) : a == +b);

        case regexpClass:
        case stringClass:
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)
          // treat string primitives and their corresponding object instances as equal
          return a == String(b);
      }
      var isArr = className == arrayClass;
      if (!isArr) {
        // unwrap any `lodash` wrapped values
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),
            bWrapped = hasOwnProperty.call(b, '__wrapped__');

        if (aWrapped || bWrapped) {
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);
        }
        // exit for functions and DOM nodes
        if (className != objectClass) {
          return false;
        }
        // in older versions of Opera, `arguments` objects have `Array` constructors
        var ctorA = a.constructor,
            ctorB = b.constructor;

        // non `Object` object instances with different constructors are not equal
        if (ctorA != ctorB &&
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&
              ('constructor' in a && 'constructor' in b)
            ) {
          return false;
        }
      }
      // assume cyclic structures are equal
      // the algorithm for detecting cyclic structures is adapted from ES 5.1
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)
      var initedStack = !stackA;
      stackA || (stackA = getArray());
      stackB || (stackB = getArray());

      var length = stackA.length;
      while (length--) {
        if (stackA[length] == a) {
          return stackB[length] == b;
        }
      }
      var size = 0;
      result = true;

      // add `a` and `b` to the stack of traversed objects
      stackA.push(a);
      stackB.push(b);

      // recursively compare objects and arrays (susceptible to call stack limits)
      if (isArr) {
        // compare lengths to determine if a deep comparison is necessary
        length = a.length;
        size = b.length;
        result = size == length;

        if (result || isWhere) {
          // deep compare the contents, ignoring non-numeric properties
          while (size--) {
            var index = length,
                value = b[size];

            if (isWhere) {
              while (index--) {
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {
                  break;
                }
              }
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {
              break;
            }
          }
        }
      }
      else {
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
        // which, in this case, is more costly
        forIn(b, function(value, key, b) {
          if (hasOwnProperty.call(b, key)) {
            // count the number of properties.
            size++;
            // deep compare each property value.
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));
          }
        });

        if (result && !isWhere) {
          // ensure both objects have the same number of properties
          forIn(a, function(value, key, a) {
            if (hasOwnProperty.call(a, key)) {
              // `size` will be `-1` if `a` has more properties than `b`
              return (result = --size > -1);
            }
          });
        }
      }
      stackA.pop();
      stackB.pop();

      if (initedStack) {
        releaseArray(stackA);
        releaseArray(stackB);
      }
      return result;
    }

    /**
     * The base implementation of `_.merge` without argument juggling or support
     * for `thisArg` binding.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {Array} [stackA=[]] Tracks traversed source objects.
     * @param {Array} [stackB=[]] Associates values with source counterparts.
     */
    function baseMerge(object, source, callback, stackA, stackB) {
      (isArray(source) ? forEach : forOwn)(source, function(source, key) {
        var found,
            isArr,
            result = source,
            value = object[key];

        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
          // avoid merging previously merged cyclic sources
          var stackLength = stackA.length;
          while (stackLength--) {
            if ((found = stackA[stackLength] == source)) {
              value = stackB[stackLength];
              break;
            }
          }
          if (!found) {
            var isShallow;
            if (callback) {
              result = callback(value, source);
              if ((isShallow = typeof result != 'undefined')) {
                value = result;
              }
            }
            if (!isShallow) {
              value = isArr
                ? (isArray(value) ? value : [])
                : (isPlainObject(value) ? value : {});
            }
            // add `source` and associated `value` to the stack of traversed objects
            stackA.push(source);
            stackB.push(value);

            // recursively merge objects and arrays (susceptible to call stack limits)
            if (!isShallow) {
              baseMerge(value, source, callback, stackA, stackB);
            }
          }
        }
        else {
          if (callback) {
            result = callback(value, source);
            if (typeof result == 'undefined') {
              result = source;
            }
          }
          if (typeof result != 'undefined') {
            value = result;
          }
        }
        object[key] = value;
      });
    }

    /**
     * The base implementation of `_.random` without argument juggling or support
     * for returning floating-point numbers.
     *
     * @private
     * @param {number} min The minimum possible value.
     * @param {number} max The maximum possible value.
     * @returns {number} Returns a random number.
     */
    function baseRandom(min, max) {
      return min + floor(nativeRandom() * (max - min + 1));
    }

    /**
     * The base implementation of `_.uniq` without support for callback shorthands
     * or `thisArg` binding.
     *
     * @private
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function} [callback] The function called per iteration.
     * @returns {Array} Returns a duplicate-value-free array.
     */
    function baseUniq(array, isSorted, callback) {
      var index = -1,
          indexOf = getIndexOf(),
          length = array ? array.length : 0,
          result = [];

      var isLarge = !isSorted && length >= largeArraySize && indexOf === baseIndexOf,
          seen = (callback || isLarge) ? getArray() : result;

      if (isLarge) {
        var cache = createCache(seen);
        indexOf = cacheIndexOf;
        seen = cache;
      }
      while (++index < length) {
        var value = array[index],
            computed = callback ? callback(value, index, array) : value;

        if (isSorted
              ? !index || seen[seen.length - 1] !== computed
              : indexOf(seen, computed) < 0
            ) {
          if (callback || isLarge) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      if (isLarge) {
        releaseArray(seen.array);
        releaseObject(seen);
      } else if (callback) {
        releaseArray(seen);
      }
      return result;
    }

    /**
     * Creates a function that aggregates a collection, creating an object composed
     * of keys generated from the results of running each element of the collection
     * through a callback. The given `setter` function sets the keys and values
     * of the composed object.
     *
     * @private
     * @param {Function} setter The setter function.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter) {
      return function(collection, callback, thisArg) {
        var result = {};
        callback = lodash.createCallback(callback, thisArg, 3);

        var index = -1,
            length = collection ? collection.length : 0;

        if (typeof length == 'number') {
          while (++index < length) {
            var value = collection[index];
            setter(result, value, callback(value, index, collection), collection);
          }
        } else {
          forOwn(collection, function(value, key, collection) {
            setter(result, value, callback(value, key, collection), collection);
          });
        }
        return result;
      };
    }

    /**
     * Creates a function that, when called, either curries or invokes `func`
     * with an optional `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to reference.
     * @param {number} bitmask The bitmask of method flags to compose.
     *  The bitmask may be composed of the following flags:
     *  1 - `_.bind`
     *  2 - `_.bindKey`
     *  4 - `_.curry`
     *  8 - `_.curry` (bound)
     *  16 - `_.partial`
     *  32 - `_.partialRight`
     * @param {Array} [partialArgs] An array of arguments to prepend to those
     *  provided to the new function.
     * @param {Array} [partialRightArgs] An array of arguments to append to those
     *  provided to the new function.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new function.
     */
    function createWrapper(func, bitmask, partialArgs, partialRightArgs, thisArg, arity) {
      var isBind = bitmask & 1,
          isBindKey = bitmask & 2,
          isCurry = bitmask & 4,
          isCurryBound = bitmask & 8,
          isPartial = bitmask & 16,
          isPartialRight = bitmask & 32;

      if (!isBindKey && !isFunction(func)) {
        throw new TypeError;
      }
      if (isPartial && !partialArgs.length) {
        bitmask &= ~16;
        isPartial = partialArgs = false;
      }
      if (isPartialRight && !partialRightArgs.length) {
        bitmask &= ~32;
        isPartialRight = partialRightArgs = false;
      }
      var bindData = func && func.__bindData__;
      if (bindData && bindData !== true) {
        // clone `bindData`
        bindData = slice(bindData);
        if (bindData[2]) {
          bindData[2] = slice(bindData[2]);
        }
        if (bindData[3]) {
          bindData[3] = slice(bindData[3]);
        }
        // set `thisBinding` is not previously bound
        if (isBind && !(bindData[1] & 1)) {
          bindData[4] = thisArg;
        }
        // set if previously bound but not currently (subsequent curried functions)
        if (!isBind && bindData[1] & 1) {
          bitmask |= 8;
        }
        // set curried arity if not yet set
        if (isCurry && !(bindData[1] & 4)) {
          bindData[5] = arity;
        }
        // append partial left arguments
        if (isPartial) {
          push.apply(bindData[2] || (bindData[2] = []), partialArgs);
        }
        // append partial right arguments
        if (isPartialRight) {
          unshift.apply(bindData[3] || (bindData[3] = []), partialRightArgs);
        }
        // merge flags
        bindData[1] |= bitmask;
        return createWrapper.apply(null, bindData);
      }
      // fast path for `_.bind`
      var creater = (bitmask == 1 || bitmask === 17) ? baseBind : baseCreateWrapper;
      return creater([func, bitmask, partialArgs, partialRightArgs, thisArg, arity]);
    }

    /**
     * Used by `escape` to convert characters to HTML entities.
     *
     * @private
     * @param {string} match The matched character to escape.
     * @returns {string} Returns the escaped character.
     */
    function escapeHtmlChar(match) {
      return htmlEscapes[match];
    }

    /**
     * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
     * customized, this method returns the custom method, otherwise it returns
     * the `baseIndexOf` function.
     *
     * @private
     * @returns {Function} Returns the "indexOf" function.
     */
    function getIndexOf() {
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;
      return result;
    }

    /**
     * Checks if `value` is a native function.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
     */
    function isNative(value) {
      return typeof value == 'function' && reNative.test(value);
    }

    /**
     * Sets `this` binding data on a given function.
     *
     * @private
     * @param {Function} func The function to set data on.
     * @param {Array} value The data array to set.
     */
    var setBindData = !defineProperty ? noop : function(func, value) {
      descriptor.value = value;
      defineProperty(func, '__bindData__', descriptor);
    };

    /**
     * A fallback implementation of `isPlainObject` which checks if a given value
     * is an object created by the `Object` constructor, assuming objects created
     * by the `Object` constructor have no inherited enumerable properties and that
     * there are no `Object.prototype` extensions.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     */
    function shimIsPlainObject(value) {
      var ctor,
          result;

      // avoid non Object objects, `arguments` objects, and DOM elements
      if (!(value && toString.call(value) == objectClass) ||
          (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) {
        return false;
      }
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      forIn(value, function(value, key) {
        result = key;
      });
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);
    }

    /**
     * Used by `unescape` to convert HTML entities to characters.
     *
     * @private
     * @param {string} match The matched character to unescape.
     * @returns {string} Returns the unescaped character.
     */
    function unescapeHtmlChar(match) {
      return htmlUnescapes[match];
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Checks if `value` is an `arguments` object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
     * @example
     *
     * (function() { return _.isArguments(arguments); })(1, 2, 3);
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    function isArguments(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == argsClass || false;
    }

    /**
     * Checks if `value` is an array.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
     * @example
     *
     * (function() { return _.isArray(arguments); })();
     * // => false
     *
     * _.isArray([1, 2, 3]);
     * // => true
     */
    var isArray = nativeIsArray || function(value) {
      return value && typeof value == 'object' && typeof value.length == 'number' &&
        toString.call(value) == arrayClass || false;
    };

    /**
     * A fallback implementation of `Object.keys` which produces an array of the
     * given object's own enumerable property names.
     *
     * @private
     * @type Function
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     */
    var shimKeys = function(object) {
      var index, iterable = object, result = [];
      if (!iterable) return result;
      if (!(objectTypes[typeof object])) return result;
        for (index in iterable) {
          if (hasOwnProperty.call(iterable, index)) {
            result.push(index);
          }
        }
      return result
    };

    /**
     * Creates an array composed of the own enumerable property names of an object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names.
     * @example
     *
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
     */
    var keys = !nativeKeys ? shimKeys : function(object) {
      if (!isObject(object)) {
        return [];
      }
      return nativeKeys(object);
    };

    /**
     * Used to convert characters to HTML entities:
     *
     * Though the `>` character is escaped for symmetry, characters like `>` and `/`
     * don't require escaping in HTML and have no special meaning unless they're part
     * of a tag or an unquoted attribute value.
     * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
     */
    var htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    /** Used to convert HTML entities to characters */
    var htmlUnescapes = invert(htmlEscapes);

    /** Used to match HTML entities and HTML characters */
    var reEscapedHtml = RegExp('(' + keys(htmlUnescapes).join('|') + ')', 'g'),
        reUnescapedHtml = RegExp('[' + keys(htmlEscapes).join('') + ']', 'g');

    /*--------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object. Subsequent sources will overwrite property assignments of previous
     * sources. If a callback is provided it will be executed to produce the
     * assigned values. The callback is bound to `thisArg` and invoked with two
     * arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @type Function
     * @alias extend
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize assigning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });
     * // => { 'name': 'fred', 'employer': 'slate' }
     *
     * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
     *
     * var object = { 'name': 'barney' };
     * defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var assign = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {
        callback = args[--argsLength];
      }
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          result[index] = callback ? callback(result[index], iterable[index]) : iterable[index];
        }
        }
      }
      return result
    };

    /**
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also
     * be cloned, otherwise they will be assigned by reference. If a callback
     * is provided it will be executed to produce the cloned values. If the
     * callback returns `undefined` cloning will be handled by the method instead.
     * The callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to clone.
     * @param {boolean} [isDeep=false] Specify a deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var shallow = _.clone(characters);
     * shallow[0] === characters[0];
     * // => true
     *
     * var deep = _.clone(characters, true);
     * deep[0] === characters[0];
     * // => false
     *
     * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
     *
     * var clone = _.clone(document.body);
     * clone.childNodes.length;
     * // => 0
     */
    function clone(value, isDeep, callback, thisArg) {
      // allows working with "Collections" methods without using their `index`
      // and `collection` arguments for `isDeep` and `callback`
      if (typeof isDeep != 'boolean' && isDeep != null) {
        thisArg = callback;
        callback = isDeep;
        isDeep = false;
      }
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates a deep clone of `value`. If a callback is provided it will be
     * executed to produce the cloned values. If the callback returns `undefined`
     * cloning will be handled by the method instead. The callback is bound to
     * `thisArg` and invoked with one argument; (value).
     *
     * Note: This method is loosely based on the structured clone algorithm. Functions
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.
     * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to deep clone.
     * @param {Function} [callback] The function to customize cloning values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the deep cloned value.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * var deep = _.cloneDeep(characters);
     * deep[0] === characters[0];
     * // => false
     *
     * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
     *
     * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
     *
     * clone.node == view.node;
     * // => false
     */
    function cloneDeep(value, callback, thisArg) {
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));
    }

    /**
     * Creates an object that inherits from the given `prototype` object. If a
     * `properties` object is provided its own enumerable properties are assigned
     * to the created object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties ? assign(result, properties) : result;
    }

    /**
     * Assigns own enumerable properties of source object(s) to the destination
     * object for all destination properties that resolve to `undefined`. Once a
     * property is set, additional defaults of the same property will be ignored.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param- {Object} [guard] Allows working with `_.reduce` without using its
     *  `key` and `object` arguments as sources.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var object = { 'name': 'barney' };
     * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
     * // => { 'name': 'barney', 'employer': 'slate' }
     */
    var defaults = function(object, source, guard) {
      var index, iterable = object, result = iterable;
      if (!iterable) return result;
      var args = arguments,
          argsIndex = 0,
          argsLength = typeof guard == 'number' ? 2 : args.length;
      while (++argsIndex < argsLength) {
        iterable = args[argsIndex];
        if (iterable && objectTypes[typeof iterable]) {
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (typeof result[index] == 'undefined') result[index] = iterable[index];
        }
        }
      }
      return result
    };

    /**
     * This method is like `_.findIndex` except that it returns the key of the
     * first element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': false },
     *   'fred': {    'age': 40, 'blocked': true },
     *   'pebbles': { 'age': 1,  'blocked': false }
     * };
     *
     * _.findKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => 'barney' (property order is not guaranteed across environments)
     *
     * // using "_.where" callback shorthand
     * _.findKey(characters, { 'age': 1 });
     * // => 'pebbles'
     *
     * // using "_.pluck" callback shorthand
     * _.findKey(characters, 'blocked');
     * // => 'fred'
     */
    function findKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwn(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to search.
     * @param {Function|Object|string} [callback=identity] The function called per
     *  iteration. If a property name or object is provided it will be used to
     *  create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.
     * @example
     *
     * var characters = {
     *   'barney': {  'age': 36, 'blocked': true },
     *   'fred': {    'age': 40, 'blocked': false },
     *   'pebbles': { 'age': 1,  'blocked': true }
     * };
     *
     * _.findLastKey(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`
     *
     * // using "_.where" callback shorthand
     * _.findLastKey(characters, { 'age': 40 });
     * // => 'fred'
     *
     * // using "_.pluck" callback shorthand
     * _.findLastKey(characters, 'blocked');
     * // => 'pebbles'
     */
    function findLastKey(object, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forOwnRight(object, function(value, key, object) {
        if (callback(value, key, object)) {
          result = key;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over own and inherited enumerable properties of an object,
     * executing the callback for each property. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, key, object). Callbacks may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forIn(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)
     */
    var forIn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        for (index in iterable) {
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forIn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * Shape.prototype.move = function(x, y) {
     *   this.x += x;
     *   this.y += y;
     * };
     *
     * _.forInRight(new Shape, function(value, key) {
     *   console.log(key);
     * });
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'
     */
    function forInRight(object, callback, thisArg) {
      var pairs = [];

      forIn(object, function(value, key) {
        pairs.push(key, value);
      });

      var length = pairs.length;
      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(pairs[length--], pairs[length], object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Iterates over own enumerable properties of an object, executing the callback
     * for each property. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, key, object). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)
     */
    var forOwn = function(collection, callback, thisArg) {
      var index, iterable = collection, result = iterable;
      if (!iterable) return result;
      if (!objectTypes[typeof iterable]) return result;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
        var ownIndex = -1,
            ownProps = objectTypes[typeof iterable] && keys(iterable),
            length = ownProps ? ownProps.length : 0;

        while (++ownIndex < length) {
          index = ownProps[ownIndex];
          if (callback(iterable[index], index, collection) === false) return result;
        }
      return result
    };

    /**
     * This method is like `_.forOwn` except that it iterates over elements
     * of a `collection` in the opposite order.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns `object`.
     * @example
     *
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   console.log(key);
     * });
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'
     */
    function forOwnRight(object, callback, thisArg) {
      var props = keys(object),
          length = props.length;

      callback = baseCreateCallback(callback, thisArg, 3);
      while (length--) {
        var key = props[length];
        if (callback(object[key], key, object) === false) {
          break;
        }
      }
      return object;
    }

    /**
     * Creates a sorted array of property names of all enumerable properties,
     * own and inherited, of `object` that have function values.
     *
     * @static
     * @memberOf _
     * @alias methods
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property names that have function values.
     * @example
     *
     * _.functions(_);
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
     */
    function functions(object) {
      var result = [];
      forIn(object, function(value, key) {
        if (isFunction(value)) {
          result.push(key);
        }
      });
      return result.sort();
    }

    /**
     * Checks if the specified property name exists as a direct property of `object`,
     * instead of an inherited property.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to check.
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.
     * @example
     *
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
     * // => true
     */
    function has(object, key) {
      return object ? hasOwnProperty.call(object, key) : false;
    }

    /**
     * Creates an object composed of the inverted keys and values of the given object.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the created inverted object.
     * @example
     *
     * _.invert({ 'first': 'fred', 'second': 'barney' });
     * // => { 'fred': 'first', 'barney': 'second' }
     */
    function invert(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = {};

      while (++index < length) {
        var key = props[index];
        result[object[key]] = key;
      }
      return result;
    }

    /**
     * Checks if `value` is a boolean value.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.
     * @example
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        value && typeof value == 'object' && toString.call(value) == boolClass || false;
    }

    /**
     * Checks if `value` is a date.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     */
    function isDate(value) {
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;
    }

    /**
     * Checks if `value` is a DOM element.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     */
    function isElement(value) {
      return value && value.nodeType === 1 || false;
    }

    /**
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
     * length of `0` and objects with no own enumerable properties are considered
     * "empty".
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object|string} value The value to inspect.
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({});
     * // => true
     *
     * _.isEmpty('');
     * // => true
     */
    function isEmpty(value) {
      var result = true;
      if (!value) {
        return result;
      }
      var className = toString.call(value),
          length = value.length;

      if ((className == arrayClass || className == stringClass || className == argsClass ) ||
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
        return !length;
      }
      forOwn(value, function() {
        return (result = false);
      });
      return result;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent to each other. If a callback is provided it will be executed
     * to compare values. If the callback returns `undefined` comparisons will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (a, b).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} a The value to compare.
     * @param {*} b The other value to compare.
     * @param {Function} [callback] The function to customize comparing values.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var copy = { 'name': 'fred' };
     *
     * object == copy;
     * // => false
     *
     * _.isEqual(object, copy);
     * // => true
     *
     * var words = ['hello', 'goodbye'];
     * var otherWords = ['hi', 'goodbye'];
     *
     * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
     * // => true
     */
    function isEqual(a, b, callback, thisArg) {
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));
    }

    /**
     * Checks if `value` is, or can be coerced to, a finite number.
     *
     * Note: This is not the same as native `isFinite` which will return true for
     * booleans and empty strings. See http://es5.github.io/#x15.1.2.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.
     * @example
     *
     * _.isFinite(-101);
     * // => true
     *
     * _.isFinite('10');
     * // => true
     *
     * _.isFinite(true);
     * // => false
     *
     * _.isFinite('');
     * // => false
     *
     * _.isFinite(Infinity);
     * // => false
     */
    function isFinite(value) {
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
    }

    /**
     * Checks if `value` is a function.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     */
    function isFunction(value) {
      return typeof value == 'function';
    }

    /**
     * Checks if `value` is the language type of Object.
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(1);
     * // => false
     */
    function isObject(value) {
      // check if the value is the ECMAScript language type of Object
      // http://es5.github.io/#x8
      // and avoid a V8 bug
      // http://code.google.com/p/v8/issues/detail?id=2291
      return !!(value && objectTypes[typeof value]);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * Note: This is not the same as native `isNaN` which will return `true` for
     * `undefined` and other non-numeric values. See http://es5.github.io/#x15.1.2.4.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // `NaN` as a primitive is the only value that is not equal to itself
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(undefined);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is a number.
     *
     * Note: `NaN` is considered a number. See http://es5.github.io/#x8.5.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(8.4 * 5);
     * // => true
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        value && typeof value == 'object' && toString.call(value) == numberClass || false;
    }

    /**
     * Checks if `value` is an object created by the `Object` constructor.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * _.isPlainObject(new Shape);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     */
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
      if (!(value && toString.call(value) == objectClass)) {
        return false;
      }
      var valueOf = value.valueOf,
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

      return objProto
        ? (value == objProto || getPrototypeOf(value) == objProto)
        : shimIsPlainObject(value);
    };

    /**
     * Checks if `value` is a regular expression.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.
     * @example
     *
     * _.isRegExp(/fred/);
     * // => true
     */
    function isRegExp(value) {
      return value && typeof value == 'object' && toString.call(value) == regexpClass || false;
    }

    /**
     * Checks if `value` is a string.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.
     * @example
     *
     * _.isString('fred');
     * // => true
     */
    function isString(value) {
      return typeof value == 'string' ||
        value && typeof value == 'object' && toString.call(value) == stringClass || false;
    }

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     */
    function isUndefined(value) {
      return typeof value == 'undefined';
    }

    /**
     * Creates an object with the same keys as `object` and values generated by
     * running each own enumerable property of `object` through the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new object with values of the results of each `callback` execution.
     * @example
     *
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     *
     * var characters = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // using "_.pluck" callback shorthand
     * _.mapValues(characters, 'age');
     * // => { 'fred': 40, 'pebbles': 1 }
     */
    function mapValues(object, callback, thisArg) {
      var result = {};
      callback = lodash.createCallback(callback, thisArg, 3);

      forOwn(object, function(value, key, object) {
        result[key] = callback(value, key, object);
      });
      return result;
    }

    /**
     * Recursively merges own enumerable properties of the source object(s), that
     * don't resolve to `undefined` into the destination object. Subsequent sources
     * will overwrite property assignments of previous sources. If a callback is
     * provided it will be executed to produce the merged values of the destination
     * and source properties. If the callback returns `undefined` merging will
     * be handled by the method instead. The callback is bound to `thisArg` and
     * invoked with two arguments; (objectValue, sourceValue).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The destination object.
     * @param {...Object} [source] The source objects.
     * @param {Function} [callback] The function to customize merging properties.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the destination object.
     * @example
     *
     * var names = {
     *   'characters': [
     *     { 'name': 'barney' },
     *     { 'name': 'fred' }
     *   ]
     * };
     *
     * var ages = {
     *   'characters': [
     *     { 'age': 36 },
     *     { 'age': 40 }
     *   ]
     * };
     *
     * _.merge(names, ages);
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }
     *
     * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
     *
     * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
     *
     * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
     */
    function merge(object) {
      var args = arguments,
          length = 2;

      if (!isObject(object)) {
        return object;
      }
      // allows working with `_.reduce` and `_.reduceRight` without using
      // their `index` and `collection` arguments
      if (typeof args[2] != 'number') {
        length = args.length;
      }
      if (length > 3 && typeof args[length - 2] == 'function') {
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);
      } else if (length > 2 && typeof args[length - 1] == 'function') {
        callback = args[--length];
      }
      var sources = slice(arguments, 1, length),
          index = -1,
          stackA = getArray(),
          stackB = getArray();

      while (++index < length) {
        baseMerge(object, sources[index], callback, stackA, stackB);
      }
      releaseArray(stackA);
      releaseArray(stackB);
      return object;
    }

    /**
     * Creates a shallow clone of `object` excluding the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` omitting the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The properties to omit or the
     *  function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object without the omitted properties.
     * @example
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');
     * // => { 'name': 'fred' }
     *
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
     * // => { 'name': 'fred' }
     */
    function omit(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var props = [];
        forIn(object, function(value, key) {
          props.push(key);
        });
        props = baseDifference(props, baseFlatten(arguments, true, false, 1));

        var index = -1,
            length = props.length;

        while (++index < length) {
          var key = props[index];
          result[key] = object[key];
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (!callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * Creates a two dimensional array of an object's key-value pairs,
     * i.e. `[[key1, value1], [key2, value2]]`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns new array of key-value pairs.
     * @example
     *
     * _.pairs({ 'barney': 36, 'fred': 40 });
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)
     */
    function pairs(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        var key = props[index];
        result[index] = [key, object[key]];
      }
      return result;
    }

    /**
     * Creates a shallow clone of `object` composed of the specified properties.
     * Property names may be specified as individual arguments or as arrays of
     * property names. If a callback is provided it will be executed for each
     * property of `object` picking the properties the callback returns truey
     * for. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The source object.
     * @param {Function|...string|string[]} [callback] The function called per
     *  iteration or property names to pick, specified as individual property
     *  names or arrays of property names.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns an object composed of the picked properties.
     * @example
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');
     * // => { 'name': 'fred' }
     *
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
     * // => { 'name': 'fred' }
     */
    function pick(object, callback, thisArg) {
      var result = {};
      if (typeof callback != 'function') {
        var index = -1,
            props = baseFlatten(arguments, true, false, 1),
            length = isObject(object) ? props.length : 0;

        while (++index < length) {
          var key = props[index];
          if (key in object) {
            result[key] = object[key];
          }
        }
      } else {
        callback = lodash.createCallback(callback, thisArg, 3);
        forIn(object, function(value, key, object) {
          if (callback(value, key, object)) {
            result[key] = value;
          }
        });
      }
      return result;
    }

    /**
     * An alternative to `_.reduce` this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable properties through a callback, with each callback execution
     * potentially mutating the `accumulator` object. The callback is bound to
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).
     * Callbacks may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
     * // => [1, 9, 25]
     *
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function transform(object, callback, accumulator, thisArg) {
      var isArr = isArray(object);
      if (accumulator == null) {
        if (isArr) {
          accumulator = [];
        } else {
          var ctor = object && object.constructor,
              proto = ctor && ctor.prototype;

          accumulator = baseCreate(proto);
        }
      }
      if (callback) {
        callback = lodash.createCallback(callback, thisArg, 4);
        (isArr ? forEach : forOwn)(object, function(value, index, object) {
          return callback(accumulator, value, index, object);
        });
      }
      return accumulator;
    }

    /**
     * Creates an array composed of the own enumerable property values of `object`.
     *
     * @static
     * @memberOf _
     * @category Objects
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns an array of property values.
     * @example
     *
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });
     * // => [1, 2, 3] (property order is not guaranteed across environments)
     */
    function values(object) {
      var index = -1,
          props = keys(object),
          length = props.length,
          result = Array(length);

      while (++index < length) {
        result[index] = object[props[index]];
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array of elements from the specified indexes, or keys, of the
     * `collection`. Indexes may be specified as individual arguments or as arrays
     * of indexes.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`
     *   to retrieve, specified as individual indexes or arrays of indexes.
     * @returns {Array} Returns a new array of elements corresponding to the
     *  provided indexes.
     * @example
     *
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
     * // => ['a', 'c', 'e']
     *
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);
     * // => ['fred', 'pebbles']
     */
    function at(collection) {
      var args = arguments,
          index = -1,
          props = baseFlatten(args, true, false, 1),
          length = (args[2] && args[2][args[1]] === collection) ? 1 : props.length,
          result = Array(length);

      while(++index < length) {
        result[index] = collection[props[index]];
      }
      return result;
    }

    /**
     * Checks if a given value is present in a collection using strict equality
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the
     * offset from the end of the collection.
     *
     * @static
     * @memberOf _
     * @alias include
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {*} target The value to check for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.
     * @example
     *
     * _.contains([1, 2, 3], 1);
     * // => true
     *
     * _.contains([1, 2, 3], 1, 2);
     * // => false
     *
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');
     * // => true
     *
     * _.contains('pebbles', 'eb');
     * // => true
     */
    function contains(collection, target, fromIndex) {
      var index = -1,
          indexOf = getIndexOf(),
          length = collection ? collection.length : 0,
          result = false;

      fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
      if (isArray(collection)) {
        result = indexOf(collection, target, fromIndex) > -1;
      } else if (typeof length == 'number') {
        result = (isString(collection) ? collection.indexOf(target, fromIndex) : indexOf(collection, target, fromIndex)) > -1;
      } else {
        forOwn(collection, function(value) {
          if (++index >= fromIndex) {
            return !(result = value === target);
          }
        });
      }
      return result;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` through the callback. The corresponding value
     * of each key is the number of times the key was returned by the callback.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': 1, '6': 2 }
     *
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
    });

    /**
     * Checks if the given callback returns truey value for **all** elements of
     * a collection. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias all
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if all elements passed the callback check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes']);
     * // => false
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.every(characters, 'age');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.every(characters, { 'age': 36 });
     * // => false
     */
    function every(collection, callback, thisArg) {
      var result = true;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if (!(result = !!callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return (result = !!callback(value, index, collection));
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning an array of all elements
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias select
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that passed the callback check.
     * @example
     *
     * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [2, 4, 6]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.filter(characters, 'blocked');
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     *
     * // using "_.where" callback shorthand
     * _.filter(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     */
    function filter(collection, callback, thisArg) {
      var result = [];
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            result.push(value);
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result.push(value);
          }
        });
      }
      return result;
    }

    /**
     * Iterates over elements of a collection, returning the first element that
     * the callback returns truey for. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias detect, findWhere
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.find(characters, function(chr) {
     *   return chr.age < 40;
     * });
     * // => { 'name': 'barney', 'age': 36, 'blocked': false }
     *
     * // using "_.where" callback shorthand
     * _.find(characters, { 'age': 1 });
     * // =>  { 'name': 'pebbles', 'age': 1, 'blocked': false }
     *
     * // using "_.pluck" callback shorthand
     * _.find(characters, 'blocked');
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }
     */
    function find(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          var value = collection[index];
          if (callback(value, index, collection)) {
            return value;
          }
        }
      } else {
        var result;
        forOwn(collection, function(value, index, collection) {
          if (callback(value, index, collection)) {
            result = value;
            return false;
          }
        });
        return result;
      }
    }

    /**
     * This method is like `_.find` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the found element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(num) {
     *   return num % 2 == 1;
     * });
     * // => 3
     */
    function findLast(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);
      forEachRight(collection, function(value, index, collection) {
        if (callback(value, index, collection)) {
          result = value;
          return false;
        }
      });
      return result;
    }

    /**
     * Iterates over elements of a collection, executing the callback for each
     * element. The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection). Callbacks may exit iteration early by
     * explicitly returning `false`.
     *
     * Note: As with other "Collections" methods, objects with a `length` property
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`
     * may be used for object iteration.
     *
     * @static
     * @memberOf _
     * @alias each
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');
     * // => logs each number and returns '1,2,3'
     *
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });
     * // => logs each number and returns the object (property order is not guaranteed across environments)
     */
    function forEach(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (++index < length) {
          if (callback(collection[index], index, collection) === false) {
            break;
          }
        }
      } else {
        forOwn(collection, callback);
      }
      return collection;
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias eachRight
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array|Object|string} Returns `collection`.
     * @example
     *
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');
     * // => logs each number from right to left and returns '3,2,1'
     */
    function forEachRight(collection, callback, thisArg) {
      var length = collection ? collection.length : 0;
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        while (length--) {
          if (callback(collection[length], length, collection) === false) {
            break;
          }
        }
      } else {
        var props = keys(collection);
        length = props.length;
        forOwn(collection, function(value, key, collection) {
          key = props ? props[--length] : --length;
          return callback(collection[key], key, collection);
        });
      }
      return collection;
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of a collection through the callback. The corresponding value
     * of each key is an array of the elements responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
     * // => { '4': [4.2], '6': [6.1, 6.4] }
     *
     * // using "_.pluck" callback shorthand
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of the collection through the given callback. The corresponding
     * value of each key is the last element responsible for generating the key.
     * The callback is bound to `thisArg` and invoked with three arguments;
     * (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var keys = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.indexBy(keys, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     */
    var indexBy = createAggregator(function(result, value, key) {
      result[key] = value;
    });

    /**
     * Invokes the method named by `methodName` on each element in the `collection`
     * returning an array of the results of each invoked method. Additional arguments
     * will be provided to each invoked method. If `methodName` is a function it
     * will be invoked for, and `this` bound to, each element in the `collection`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|string} methodName The name of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [arg] Arguments to invoke the method with.
     * @returns {Array} Returns a new array of the results of each invoked method.
     * @example
     *
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invoke([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    function invoke(collection, methodName) {
      var args = slice(arguments, 2),
          index = -1,
          isFunc = typeof methodName == 'function',
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
      });
      return result;
    }

    /**
     * Creates an array of values by running each element in the collection
     * through the callback. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias collect
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of the results of each `callback` execution.
     * @example
     *
     * _.map([1, 2, 3], function(num) { return num * 3; });
     * // => [3, 6, 9]
     *
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
     * // => [3, 6, 9] (property order is not guaranteed across environments)
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(characters, 'name');
     * // => ['barney', 'fred']
     */
    function map(collection, callback, thisArg) {
      var index = -1,
          length = collection ? collection.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      if (typeof length == 'number') {
        var result = Array(length);
        while (++index < length) {
          result[index] = callback(collection[index], index, collection);
        }
      } else {
        result = [];
        forOwn(collection, function(value, key, collection) {
          result[++index] = callback(value, key, collection);
        });
      }
      return result;
    }

    /**
     * Retrieves the maximum value of a collection. If the collection is empty or
     * falsey `-Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.max(characters, function(chr) { return chr.age; });
     * // => { 'name': 'fred', 'age': 40 };
     *
     * // using "_.pluck" callback shorthand
     * _.max(characters, 'age');
     * // => { 'name': 'fred', 'age': 40 };
     */
    function max(collection, callback, thisArg) {
      var computed = -Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value > result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current > computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the minimum value of a collection. If the collection is empty or
     * falsey `Infinity` is returned. If a callback is provided it will be executed
     * for each value in the collection to generate the criterion by which the value
     * is ranked. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.min(characters, function(chr) { return chr.age; });
     * // => { 'name': 'barney', 'age': 36 };
     *
     * // using "_.pluck" callback shorthand
     * _.min(characters, 'age');
     * // => { 'name': 'barney', 'age': 36 };
     */
    function min(collection, callback, thisArg) {
      var computed = Infinity,
          result = computed;

      // allows working with functions like `_.map` without using
      // their `index` argument as a callback
      if (typeof callback != 'function' && thisArg && thisArg[callback] === collection) {
        callback = null;
      }
      if (callback == null && isArray(collection)) {
        var index = -1,
            length = collection.length;

        while (++index < length) {
          var value = collection[index];
          if (value < result) {
            result = value;
          }
        }
      } else {
        callback = (callback == null && isString(collection))
          ? charAtCallback
          : lodash.createCallback(callback, thisArg, 3);

        forEach(collection, function(value, index, collection) {
          var current = callback(value, index, collection);
          if (current < computed) {
            computed = current;
            result = value;
          }
        });
      }
      return result;
    }

    /**
     * Retrieves the value of a specified property from all elements in the collection.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {string} property The name of the property to pluck.
     * @returns {Array} Returns a new array of property values.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * _.pluck(characters, 'name');
     * // => ['barney', 'fred']
     */
    var pluck = map;

    /**
     * Reduces a collection to a value which is the accumulated result of running
     * each element in the collection through the callback, where each successive
     * callback execution consumes the return value of the previous execution. If
     * `accumulator` is not provided the first element of the collection will be
     * used as the initial `accumulator` value. The callback is bound to `thisArg`
     * and invoked with four arguments; (accumulator, value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @alias foldl, inject
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
     * // => 6
     *
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
     * // => { 'a': 3, 'b': 6, 'c': 9 }
     */
    function reduce(collection, callback, accumulator, thisArg) {
      if (!collection) return accumulator;
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);

      var index = -1,
          length = collection.length;

      if (typeof length == 'number') {
        if (noaccum) {
          accumulator = collection[++index];
        }
        while (++index < length) {
          accumulator = callback(accumulator, collection[index], index, collection);
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          accumulator = noaccum
            ? (noaccum = false, value)
            : callback(accumulator, value, index, collection)
        });
      }
      return accumulator;
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @alias foldr
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function} [callback=identity] The function called per iteration.
     * @param {*} [accumulator] Initial value of the accumulator.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * var list = [[0, 1], [2, 3], [4, 5]];
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, callback, accumulator, thisArg) {
      var noaccum = arguments.length < 3;
      callback = lodash.createCallback(callback, thisArg, 4);
      forEachRight(collection, function(value, index, collection) {
        accumulator = noaccum
          ? (noaccum = false, value)
          : callback(accumulator, value, index, collection);
      });
      return accumulator;
    }

    /**
     * The opposite of `_.filter` this method returns the elements of a
     * collection that the callback does **not** return truey for.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of elements that failed the callback check.
     * @example
     *
     * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
     * // => [1, 3, 5]
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.reject(characters, 'blocked');
     * // => [{ 'name': 'barney', 'age': 36, 'blocked': false }]
     *
     * // using "_.where" callback shorthand
     * _.reject(characters, { 'age': 36 });
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]
     */
    function reject(collection, callback, thisArg) {
      callback = lodash.createCallback(callback, thisArg, 3);
      return filter(collection, function(value, index, collection) {
        return !callback(value, index, collection);
      });
    }

    /**
     * Retrieves a random element or `n` random elements from a collection.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to sample.
     * @param {number} [n] The number of elements to sample.
     * @param- {Object} [guard] Allows working with functions like `_.map`
     *  without using their `index` arguments as `n`.
     * @returns {Array} Returns the random sample(s) of `collection`.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     *
     * _.sample([1, 2, 3, 4], 2);
     * // => [3, 1]
     */
    function sample(collection, n, guard) {
      if (collection && typeof collection.length != 'number') {
        collection = values(collection);
      }
      if (n == null || guard) {
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;
      }
      var result = shuffle(collection);
      result.length = nativeMin(nativeMax(0, n), result.length);
      return result;
    }

    /**
     * Creates an array of shuffled values, using a version of the Fisher-Yates
     * shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to shuffle.
     * @returns {Array} Returns a new shuffled collection.
     * @example
     *
     * _.shuffle([1, 2, 3, 4, 5, 6]);
     * // => [4, 1, 6, 3, 5, 2]
     */
    function shuffle(collection) {
      var index = -1,
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      forEach(collection, function(value) {
        var rand = baseRandom(0, ++index);
        result[index] = result[rand];
        result[rand] = value;
      });
      return result;
    }

    /**
     * Gets the size of the `collection` by returning `collection.length` for arrays
     * and array-like objects or the number of own enumerable properties for objects.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns `collection.length` or number of own enumerable properties.
     * @example
     *
     * _.size([1, 2]);
     * // => 2
     *
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });
     * // => 3
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      var length = collection ? collection.length : 0;
      return typeof length == 'number' ? length : keys(collection).length;
    }

    /**
     * Checks if the callback returns a truey value for **any** element of a
     * collection. The function returns as soon as it finds a passing value and
     * does not iterate over the entire collection. The callback is bound to
     * `thisArg` and invoked with three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias any
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {boolean} Returns `true` if any element passed the callback check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'blocked': false },
     *   { 'name': 'fred',   'age': 40, 'blocked': true }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.some(characters, 'blocked');
     * // => true
     *
     * // using "_.where" callback shorthand
     * _.some(characters, { 'age': 1 });
     * // => false
     */
    function some(collection, callback, thisArg) {
      var result;
      callback = lodash.createCallback(callback, thisArg, 3);

      var index = -1,
          length = collection ? collection.length : 0;

      if (typeof length == 'number') {
        while (++index < length) {
          if ((result = callback(collection[index], index, collection))) {
            break;
          }
        }
      } else {
        forOwn(collection, function(value, index, collection) {
          return !(result = callback(value, index, collection));
        });
      }
      return !!result;
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection through the callback. This method
     * performs a stable sort, that is, it will preserve the original sort order
     * of equal elements. The callback is bound to `thisArg` and invoked with
     * three arguments; (value, index|key, collection).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an array of property names is provided for `callback` the collection
     * will be sorted by each property value.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Array|Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of sorted elements.
     * @example
     *
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
     * // => [3, 1, 2]
     *
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
     * // => [3, 1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'barney',  'age': 26 },
     *   { 'name': 'fred',    'age': 30 }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.map(_.sortBy(characters, 'age'), _.values);
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]
     *
     * // sorting by multiple properties
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]
     */
    function sortBy(collection, callback, thisArg) {
      var index = -1,
          isArr = isArray(callback),
          length = collection ? collection.length : 0,
          result = Array(typeof length == 'number' ? length : 0);

      if (!isArr) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      forEach(collection, function(value, key, collection) {
        var object = result[++index] = getObject();
        if (isArr) {
          object.criteria = map(callback, function(key) { return value[key]; });
        } else {
          (object.criteria = getArray())[0] = callback(value, key, collection);
        }
        object.index = index;
        object.value = value;
      });

      length = result.length;
      result.sort(compareAscending);
      while (length--) {
        var object = result[length];
        result[length] = object.value;
        if (!isArr) {
          releaseArray(object.criteria);
        }
        releaseObject(object);
      }
      return result;
    }

    /**
     * Converts the `collection` to an array.
     *
     * @static
     * @memberOf _
     * @category Collections
     * @param {Array|Object|string} collection The collection to convert.
     * @returns {Array} Returns the new converted array.
     * @example
     *
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
     * // => [2, 3, 4]
     */
    function toArray(collection) {
      if (collection && typeof collection.length == 'number') {
        return slice(collection);
      }
      return values(collection);
    }

    /**
     * Performs a deep comparison of each element in a `collection` to the given
     * `properties` object, returning an array of all elements that have equivalent
     * property values.
     *
     * @static
     * @memberOf _
     * @type Function
     * @category Collections
     * @param {Array|Object|string} collection The collection to iterate over.
     * @param {Object} props The object of property values to filter by.
     * @returns {Array} Returns a new array of elements that have the given properties.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * _.where(characters, { 'age': 36 });
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]
     *
     * _.where(characters, { 'pets': ['dino'] });
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]
     */
    var where = filter;

    /*--------------------------------------------------------------------------*/

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are all falsey.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to compact.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * Creates an array excluding all values of the provided arrays using strict
     * equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {...Array} [values] The arrays of values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
     * // => [1, 3, 4]
     */
    function difference(array) {
      return baseDifference(array, baseFlatten(arguments, true, true, 1));
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element that passes the callback check, instead of the element itself.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': false },
     *   { 'name': 'fred',    'age': 40, 'blocked': true },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': false }
     * ];
     *
     * _.findIndex(characters, function(chr) {
     *   return chr.age < 20;
     * });
     * // => 2
     *
     * // using "_.where" callback shorthand
     * _.findIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findIndex(characters, 'blocked');
     * // => 1
     */
    function findIndex(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0;

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        if (callback(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of a `collection` from right to left.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36, 'blocked': true },
     *   { 'name': 'fred',    'age': 40, 'blocked': false },
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }
     * ];
     *
     * _.findLastIndex(characters, function(chr) {
     *   return chr.age > 30;
     * });
     * // => 1
     *
     * // using "_.where" callback shorthand
     * _.findLastIndex(characters, { 'age': 36 });
     * // => 0
     *
     * // using "_.pluck" callback shorthand
     * _.findLastIndex(characters, 'blocked');
     * // => 2
     */
    function findLastIndex(array, callback, thisArg) {
      var length = array ? array.length : 0;
      callback = lodash.createCallback(callback, thisArg, 3);
      while (length--) {
        if (callback(array[length], length, array)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Gets the first element or first `n` elements of an array. If a callback
     * is provided elements at the beginning of the array are returned as long
     * as the callback returns truey. The callback is bound to `thisArg` and
     * invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias head, take
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the first element(s) of `array`.
     * @example
     *
     * _.first([1, 2, 3]);
     * // => 1
     *
     * _.first([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [1, 2]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false, 'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.first(characters, 'blocked');
     * // => [{ 'name': 'barney', 'blocked': true, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');
     * // => ['barney', 'fred']
     */
    function first(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = -1;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[0] : undefined;
        }
      }
      return slice(array, 0, nativeMin(nativeMax(0, n), length));
    }

    /**
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`
     * is truey, the array will only be flattened a single level. If a callback
     * is provided each element of the array is passed through the callback before
     * flattening. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to flatten.
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new flattened array.
     * @example
     *
     * _.flatten([1, [2], [3, [[4]]]]);
     * // => [1, 2, 3, 4];
     *
     * _.flatten([1, [2], [3, [[4]]]], true);
     * // => [1, 2, 3, [[4]]];
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.flatten(characters, 'pets');
     * // => ['hoppy', 'baby puss', 'dino']
     */
    function flatten(array, isShallow, callback, thisArg) {
      // juggle arguments
      if (typeof isShallow != 'boolean' && isShallow != null) {
        thisArg = callback;
        callback = (typeof isShallow != 'function' && thisArg && thisArg[isShallow] === array) ? null : isShallow;
        isShallow = false;
      }
      if (callback != null) {
        array = map(array, callback, thisArg);
      }
      return baseFlatten(array, isShallow);
    }

    /**
     * Gets the index at which the first occurrence of `value` is found using
     * strict equality for comparisons, i.e. `===`. If the array is already sorted
     * providing `true` for `fromIndex` will run a faster binary search.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`
     *  to perform a binary search on a sorted array.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 1
     *
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 4
     *
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
     * // => 2
     */
    function indexOf(array, value, fromIndex) {
      if (typeof fromIndex == 'number') {
        var length = array ? array.length : 0;
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
      } else if (fromIndex) {
        var index = sortedIndex(array, value);
        return array[index] === value ? index : -1;
      }
      return baseIndexOf(array, value, fromIndex);
    }

    /**
     * Gets all but the last element or last `n` elements of an array. If a
     * callback is provided elements at the end of the array are excluded from
     * the result as long as the callback returns truey. The callback is bound
     * to `thisArg` and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     *
     * _.initial([1, 2, 3], 2);
     * // => [1]
     *
     * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [1]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.initial(characters, 'blocked');
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]
     *
     * // using "_.where" callback shorthand
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');
     * // => ['barney', 'fred']
     */
    function initial(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : callback || n;
      }
      return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
    }

    /**
     * Creates an array of unique values present in all provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of shared values.
     * @example
     *
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2]
     */
    function intersection() {
      var args = [],
          argsIndex = -1,
          argsLength = arguments.length,
          caches = getArray(),
          indexOf = getIndexOf(),
          trustIndexOf = indexOf === baseIndexOf,
          seen = getArray();

      while (++argsIndex < argsLength) {
        var value = arguments[argsIndex];
        if (isArray(value) || isArguments(value)) {
          args.push(value);
          caches.push(trustIndexOf && value.length >= largeArraySize &&
            createCache(argsIndex ? args[argsIndex] : seen));
        }
      }
      var array = args[0],
          index = -1,
          length = array ? array.length : 0,
          result = [];

      outer:
      while (++index < length) {
        var cache = caches[0];
        value = array[index];

        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
          argsIndex = argsLength;
          (cache || seen).push(value);
          while (--argsIndex) {
            cache = caches[argsIndex];
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
              continue outer;
            }
          }
          result.push(value);
        }
      }
      while (argsLength--) {
        cache = caches[argsLength];
        if (cache) {
          releaseObject(cache);
        }
      }
      releaseArray(caches);
      releaseArray(seen);
      return result;
    }

    /**
     * Gets the last element or last `n` elements of an array. If a callback is
     * provided elements at the end of the array are returned as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback] The function called
     *  per element or the number of elements to return. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {*} Returns the last element(s) of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     *
     * _.last([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
     * // => [2, 3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': false, 'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': true,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true,  'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.last(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.last(characters, { 'employer': 'na' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function last(array, callback, thisArg) {
      var n = 0,
          length = array ? array.length : 0;

      if (typeof callback != 'number' && callback != null) {
        var index = length;
        callback = lodash.createCallback(callback, thisArg, 3);
        while (index-- && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = callback;
        if (n == null || thisArg) {
          return array ? array[length - 1] : undefined;
        }
      }
      return slice(array, nativeMax(0, length - n));
    }

    /**
     * Gets the index at which the last occurrence of `value` is found using strict
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
     * as the offset from the end of the collection.
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to search.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value or `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
     * // => 4
     *
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var index = array ? array.length : 0;
      if (typeof fromIndex == 'number') {
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
      }
      while (index--) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    /**
     * Removes all provided values from the given array using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {...*} [value] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3, 1, 2, 3];
     * _.pull(array, 2, 3);
     * console.log(array);
     * // => [1, 1]
     */
    function pull(array) {
      var args = arguments,
          argsIndex = 0,
          argsLength = args.length,
          length = array ? array.length : 0;

      while (++argsIndex < argsLength) {
        var index = -1,
            value = args[argsIndex];
        while (++index < length) {
          if (array[index] === value) {
            splice.call(array, index--, 1);
            length--;
          }
        }
      }
      return array;
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to but not including `end`. If `start` is less than `stop` a
     * zero-length range is created unless a negative `step` is specified.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns a new range array.
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    function range(start, end, step) {
      start = +start || 0;
      step = typeof step == 'number' ? step : (+step || 1);

      if (end == null) {
        end = start;
        start = 0;
      }
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s
      var index = -1,
          length = nativeMax(0, ceil((end - start) / (step || 1))),
          result = Array(length);

      while (++index < length) {
        result[index] = start;
        start += step;
      }
      return result;
    }

    /**
     * Removes all elements from an array that the callback returns truey for
     * and returns an array of removed elements. The callback is bound to `thisArg`
     * and invoked with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to modify.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4, 5, 6];
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });
     *
     * console.log(array);
     * // => [1, 3, 5]
     *
     * console.log(evens);
     * // => [2, 4, 6]
     */
    function remove(array, callback, thisArg) {
      var index = -1,
          length = array ? array.length : 0,
          result = [];

      callback = lodash.createCallback(callback, thisArg, 3);
      while (++index < length) {
        var value = array[index];
        if (callback(value, index, array)) {
          result.push(value);
          splice.call(array, index--, 1);
          length--;
        }
      }
      return result;
    }

    /**
     * The opposite of `_.initial` this method gets all but the first element or
     * first `n` elements of an array. If a callback function is provided elements
     * at the beginning of the array are excluded from the result as long as the
     * callback returns truey. The callback is bound to `thisArg` and invoked
     * with three arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias drop, tail
     * @category Arrays
     * @param {Array} array The array to query.
     * @param {Function|Object|number|string} [callback=1] The function called
     *  per element or the number of elements to exclude. If a property name or
     *  object is provided it will be used to create a "_.pluck" or "_.where"
     *  style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a slice of `array`.
     * @example
     *
     * _.rest([1, 2, 3]);
     * // => [2, 3]
     *
     * _.rest([1, 2, 3], 2);
     * // => [3]
     *
     * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
     * // => [3]
     *
     * var characters = [
     *   { 'name': 'barney',  'blocked': true,  'employer': 'slate' },
     *   { 'name': 'fred',    'blocked': false,  'employer': 'slate' },
     *   { 'name': 'pebbles', 'blocked': true, 'employer': 'na' }
     * ];
     *
     * // using "_.pluck" callback shorthand
     * _.pluck(_.rest(characters, 'blocked'), 'name');
     * // => ['fred', 'pebbles']
     *
     * // using "_.where" callback shorthand
     * _.rest(characters, { 'employer': 'slate' });
     * // => [{ 'name': 'pebbles', 'blocked': true, 'employer': 'na' }]
     */
    function rest(array, callback, thisArg) {
      if (typeof callback != 'number' && callback != null) {
        var n = 0,
            index = -1,
            length = array ? array.length : 0;

        callback = lodash.createCallback(callback, thisArg, 3);
        while (++index < length && callback(array[index], index, array)) {
          n++;
        }
      } else {
        n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
      }
      return slice(array, n);
    }

    /**
     * Uses a binary search to determine the smallest index at which a value
     * should be inserted into a given sorted array in order to maintain the sort
     * order of the array. If a callback is provided it will be executed for
     * `value` and each element of `array` to compute their sort ranking. The
     * callback is bound to `thisArg` and invoked with one argument; (value).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([20, 30, 50], 40);
     * // => 2
     *
     * // using "_.pluck" callback shorthand
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
     * // => 2
     *
     * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
     * // => 2
     *
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
     * // => 2
     */
    function sortedIndex(array, value, callback, thisArg) {
      var low = 0,
          high = array ? array.length : low;

      // explicitly reference `identity` for better inlining in Firefox
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
      value = callback(value);

      while (low < high) {
        var mid = (low + high) >>> 1;
        (callback(array[mid]) < value)
          ? low = mid + 1
          : high = mid;
      }
      return low;
    }

    /**
     * Creates an array of unique values, in order, of the provided arrays using
     * strict equality for comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of combined values.
     * @example
     *
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
     * // => [1, 2, 3, 5, 4]
     */
    function union() {
      return baseUniq(baseFlatten(arguments, true, true));
    }

    /**
     * Creates a duplicate-value-free version of an array using strict equality
     * for comparisons, i.e. `===`. If the array is sorted, providing
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided
     * each element of `array` is passed through the callback before uniqueness
     * is computed. The callback is bound to `thisArg` and invoked with three
     * arguments; (value, index, array).
     *
     * If a property name is provided for `callback` the created "_.pluck" style
     * callback will return the property value of the given element.
     *
     * If an object is provided for `callback` the created "_.where" style callback
     * will return `true` for elements that have the properties of the given object,
     * else `false`.
     *
     * @static
     * @memberOf _
     * @alias unique
     * @category Arrays
     * @param {Array} array The array to process.
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
     * @param {Function|Object|string} [callback=identity] The function called
     *  per iteration. If a property name or object is provided it will be used
     *  to create a "_.pluck" or "_.where" style callback, respectively.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns a duplicate-value-free array.
     * @example
     *
     * _.uniq([1, 2, 1, 3, 1]);
     * // => [1, 2, 3]
     *
     * _.uniq([1, 1, 2, 2, 3], true);
     * // => [1, 2, 3]
     *
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
     * // => ['A', 'b', 'C']
     *
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
     * // => [1, 2.5, 3]
     *
     * // using "_.pluck" callback shorthand
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniq(array, isSorted, callback, thisArg) {
      // juggle arguments
      if (typeof isSorted != 'boolean' && isSorted != null) {
        thisArg = callback;
        callback = (typeof isSorted != 'function' && thisArg && thisArg[isSorted] === array) ? null : isSorted;
        isSorted = false;
      }
      if (callback != null) {
        callback = lodash.createCallback(callback, thisArg, 3);
      }
      return baseUniq(array, isSorted, callback);
    }

    /**
     * Creates an array excluding all provided values using strict equality for
     * comparisons, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {Array} array The array to filter.
     * @param {...*} [value] The values to exclude.
     * @returns {Array} Returns a new array of filtered values.
     * @example
     *
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
     * // => [2, 3, 4]
     */
    function without(array) {
      return baseDifference(array, slice(arguments, 1));
    }

    /**
     * Creates an array that is the symmetric difference of the provided arrays.
     * See http://en.wikipedia.org/wiki/Symmetric_difference.
     *
     * @static
     * @memberOf _
     * @category Arrays
     * @param {...Array} [array] The arrays to inspect.
     * @returns {Array} Returns an array of values.
     * @example
     *
     * _.xor([1, 2, 3], [5, 2, 1, 4]);
     * // => [3, 5, 4]
     *
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);
     * // => [1, 4, 5]
     */
    function xor() {
      var index = -1,
          length = arguments.length;

      while (++index < length) {
        var array = arguments[index];
        if (isArray(array) || isArguments(array)) {
          var result = result
            ? baseUniq(baseDifference(result, array).concat(baseDifference(array, result)))
            : array;
        }
      }
      return result || [];
    }

    /**
     * Creates an array of grouped elements, the first of which contains the first
     * elements of the given arrays, the second of which contains the second
     * elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @alias unzip
     * @category Arrays
     * @param {...Array} [array] Arrays to process.
     * @returns {Array} Returns a new array of grouped elements.
     * @example
     *
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);
     * // => [['fred', 30, true], ['barney', 40, false]]
     */
    function zip() {
      var array = arguments.length > 1 ? arguments : arguments[0],
          index = -1,
          length = array ? max(pluck(array, 'length')) : 0,
          result = Array(length < 0 ? 0 : length);

      while (++index < length) {
        result[index] = pluck(array, index);
      }
      return result;
    }

    /**
     * Creates an object composed from arrays of `keys` and `values`. Provide
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`
     * or two arrays, one of `keys` and one of corresponding `values`.
     *
     * @static
     * @memberOf _
     * @alias object
     * @category Arrays
     * @param {Array} keys The array of keys.
     * @param {Array} [values=[]] The array of values.
     * @returns {Object} Returns an object composed of the given keys and
     *  corresponding values.
     * @example
     *
     * _.zipObject(['fred', 'barney'], [30, 40]);
     * // => { 'fred': 30, 'barney': 40 }
     */
    function zipObject(keys, values) {
      var index = -1,
          length = keys ? keys.length : 0,
          result = {};

      if (!values && length && !isArray(keys[0])) {
        values = [];
      }
      while (++index < length) {
        var key = keys[index];
        if (values) {
          result[key] = values[index];
        } else if (key) {
          result[key[0]] = key[1];
        }
      }
      return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that executes `func`, with  the `this` binding and
     * arguments of the created function, only after being called `n` times.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {number} n The number of times the function must be called before
     *  `func` is executed.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('Done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => logs 'Done saving!', after all saves have completed
     */
    function after(n, func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with the `this`
     * binding of `thisArg` and prepends any additional `bind` arguments to those
     * provided to the bound function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to bind.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
     *
     * func = _.bind(func, { 'name': 'fred' }, 'hi');
     * func();
     * // => 'hi fred'
     */
    function bind(func, thisArg) {
      return arguments.length > 2
        ? createWrapper(func, 17, slice(arguments, 2), null, thisArg)
        : createWrapper(func, 1, null, null, thisArg);
    }

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method. Method names may be specified as individual arguments or as arrays
     * of method names. If no method names are provided all the function properties
     * of `object` will be bound.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...string} [methodName] The object method names to
     *  bind, specified as individual method names or arrays of method names.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'onClick': function() { console.log('clicked ' + this.label); }
     * };
     *
     * _.bindAll(view);
     * jQuery('#docs').on('click', view.onClick);
     * // => logs 'clicked docs', when the button is clicked
     */
    function bindAll(object) {
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),
          index = -1,
          length = funcs.length;

      while (++index < length) {
        var key = funcs[index];
        object[key] = createWrapper(object[key], 1, null, null, object);
      }
      return object;
    }

    /**
     * Creates a function that, when called, invokes the method at `object[key]`
     * and prepends any additional `bindKey` arguments to those provided to the bound
     * function. This method differs from `_.bind` by allowing bound functions to
     * reference methods that will be redefined or don't yet exist.
     * See http://michaux.ca/articles/lazy-function-definition-pattern.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Object} object The object the method belongs to.
     * @param {string} key The key of the method.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'name': 'fred',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
     *
     * var func = _.bindKey(object, 'greet', 'hi');
     * func();
     * // => 'hi fred'
     *
     * object.greet = function(greeting) {
     *   return greeting + 'ya ' + this.name + '!';
     * };
     *
     * func();
     * // => 'hiya fred!'
     */
    function bindKey(object, key) {
      return arguments.length > 2
        ? createWrapper(key, 19, slice(arguments, 2), null, object)
        : createWrapper(key, 3, null, null, object);
    }

    /**
     * Creates a function that is the composition of the provided functions,
     * where each function consumes the return value of the function that follows.
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
     * Each function is executed with the `this` binding of the composed function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {...Function} [func] Functions to compose.
     * @returns {Function} Returns the new composed function.
     * @example
     *
     * var realNameMap = {
     *   'pebbles': 'penelope'
     * };
     *
     * var format = function(name) {
     *   name = realNameMap[name.toLowerCase()] || name;
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
     * };
     *
     * var greet = function(formatted) {
     *   return 'Hiya ' + formatted + '!';
     * };
     *
     * var welcome = _.compose(greet, format);
     * welcome('pebbles');
     * // => 'Hiya Penelope!'
     */
    function compose() {
      var funcs = arguments,
          length = funcs.length;

      while (length--) {
        if (!isFunction(funcs[length])) {
          throw new TypeError;
        }
      }
      return function() {
        var args = arguments,
            length = funcs.length;

        while (length--) {
          args = [funcs[length].apply(this, args)];
        }
        return args[0];
      };
    }

    /**
     * Creates a function which accepts one or more arguments of `func` that when
     * invoked either executes `func` returning its result, if all `func` arguments
     * have been provided, or returns a function that accepts one or more of the
     * remaining `func` arguments, and so on. The arity of `func` can be specified
     * if `func.length` is not sufficient.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var curried = _.curry(function(a, b, c) {
     *   console.log(a + b + c);
     * });
     *
     * curried(1)(2)(3);
     * // => 6
     *
     * curried(1, 2)(3);
     * // => 6
     *
     * curried(1, 2, 3);
     * // => 6
     */
    function curry(func, arity) {
      arity = typeof arity == 'number' ? arity : (+arity || func.length);
      return createWrapper(func, 4, null, null, null, arity);
    }

    /**
     * Creates a function that will delay the execution of `func` until after
     * `wait` milliseconds have elapsed since the last time it was invoked.
     * Provide an options object to indicate that `func` should be invoked on
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls
     * to the debounced function will return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the debounced function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to debounce.
     * @param {number} wait The number of milliseconds to delay.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // avoid costly calculations while the window size is in flux
     * var lazyLayout = _.debounce(calculateLayout, 150);
     * jQuery(window).on('resize', lazyLayout);
     *
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * });
     *
     * // ensure `batchLog` is executed once after 1 second of debounced calls
     * var source = new EventSource('/stream');
     * source.addEventListener('message', _.debounce(batchLog, 250, {
     *   'maxWait': 1000
     * }, false);
     */
    function debounce(func, wait, options) {
      var args,
          maxTimeoutId,
          result,
          stamp,
          thisArg,
          timeoutId,
          trailingCall,
          lastCalled = 0,
          maxWait = false,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      wait = nativeMax(0, wait) || 0;
      if (options === true) {
        var leading = true;
        trailing = false;
      } else if (isObject(options)) {
        leading = options.leading;
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      var delayed = function() {
        var remaining = wait - (now() - stamp);
        if (remaining <= 0) {
          if (maxTimeoutId) {
            clearTimeout(maxTimeoutId);
          }
          var isCalled = trailingCall;
          maxTimeoutId = timeoutId = trailingCall = undefined;
          if (isCalled) {
            lastCalled = now();
            result = func.apply(thisArg, args);
            if (!timeoutId && !maxTimeoutId) {
              args = thisArg = null;
            }
          }
        } else {
          timeoutId = setTimeout(delayed, remaining);
        }
      };

      var maxDelayed = function() {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        maxTimeoutId = timeoutId = trailingCall = undefined;
        if (trailing || (maxWait !== wait)) {
          lastCalled = now();
          result = func.apply(thisArg, args);
          if (!timeoutId && !maxTimeoutId) {
            args = thisArg = null;
          }
        }
      };

      return function() {
        args = arguments;
        stamp = now();
        thisArg = this;
        trailingCall = trailing && (timeoutId || !leading);

        if (maxWait === false) {
          var leadingCall = leading && !timeoutId;
        } else {
          if (!maxTimeoutId && !leading) {
            lastCalled = stamp;
          }
          var remaining = maxWait - (stamp - lastCalled),
              isCalled = remaining <= 0;

          if (isCalled) {
            if (maxTimeoutId) {
              maxTimeoutId = clearTimeout(maxTimeoutId);
            }
            lastCalled = stamp;
            result = func.apply(thisArg, args);
          }
          else if (!maxTimeoutId) {
            maxTimeoutId = setTimeout(maxDelayed, remaining);
          }
        }
        if (isCalled && timeoutId) {
          timeoutId = clearTimeout(timeoutId);
        }
        else if (!timeoutId && wait !== maxWait) {
          timeoutId = setTimeout(delayed, wait);
        }
        if (leadingCall) {
          isCalled = true;
          result = func.apply(thisArg, args);
        }
        if (isCalled && !timeoutId && !maxTimeoutId) {
          args = thisArg = null;
        }
        return result;
      };
    }

    /**
     * Defers executing the `func` function until the current call stack has cleared.
     * Additional arguments will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to defer.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) { console.log(text); }, 'deferred');
     * // logs 'deferred' after one or more milliseconds
     */
    function defer(func) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 1);
      return setTimeout(function() { func.apply(undefined, args); }, 1);
    }

    /**
     * Executes the `func` function after `wait` milliseconds. Additional arguments
     * will be provided to `func` when it is invoked.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay execution.
     * @param {...*} [arg] Arguments to invoke the function with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) { console.log(text); }, 1000, 'later');
     * // => logs 'later' after one second
     */
    function delay(func, wait) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var args = slice(arguments, 2);
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided it will be used to determine the cache key for storing the result
     * based on the arguments provided to the memoized function. By default, the
     * first argument provided to the memoized function is used as the cache key.
     * The `func` is executed with the `this` binding of the memoized function.
     * The result cache is exposed as the `cache` property on the memoized function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] A function used to resolve the cache key.
     * @returns {Function} Returns the new memoizing function.
     * @example
     *
     * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
     *
     * fibonacci(9)
     * // => 34
     *
     * var data = {
     *   'fred': { 'name': 'fred', 'age': 40 },
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }
     * };
     *
     * // modifying the result cache
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);
     * get('pebbles');
     * // => { 'name': 'pebbles', 'age': 1 }
     *
     * get.cache.pebbles.name = 'penelope';
     * get('pebbles');
     * // => { 'name': 'penelope', 'age': 1 }
     */
    function memoize(func, resolver) {
      if (!isFunction(func)) {
        throw new TypeError;
      }
      var memoized = function() {
        var cache = memoized.cache,
            key = resolver ? resolver.apply(this, arguments) : keyPrefix + arguments[0];

        return hasOwnProperty.call(cache, key)
          ? cache[key]
          : (cache[key] = func.apply(this, arguments));
      }
      memoized.cache = {};
      return memoized;
    }

    /**
     * Creates a function that is restricted to execute `func` once. Repeat calls to
     * the function will return the value of the first call. The `func` is executed
     * with the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // `initialize` executes `createApplication` once
     */
    function once(func) {
      var ran,
          result;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      return function() {
        if (ran) {
          return result;
        }
        ran = true;
        result = func.apply(this, arguments);

        // clear the `func` variable so the function may be garbage collected
        func = null;
        return result;
      };
    }

    /**
     * Creates a function that, when called, invokes `func` with any additional
     * `partial` arguments prepended to those provided to the new function. This
     * method is similar to `_.bind` except it does **not** alter the `this` binding.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var greet = function(greeting, name) { return greeting + ' ' + name; };
     * var hi = _.partial(greet, 'hi');
     * hi('fred');
     * // => 'hi fred'
     */
    function partial(func) {
      return createWrapper(func, 16, slice(arguments, 1));
    }

    /**
     * This method is like `_.partial` except that `partial` arguments are
     * appended to those provided to the new function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [arg] Arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);
     *
     * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
     *
     * defaultsDeep(options, _.templateSettings);
     *
     * options.variable
     * // => 'data'
     *
     * options.imports
     * // => { '_': _, 'jq': $ }
     */
    function partialRight(func) {
      return createWrapper(func, 32, null, slice(arguments, 1));
    }

    /**
     * Creates a function that, when executed, will only call the `func` function
     * at most once per every `wait` milliseconds. Provide an options object to
     * indicate that `func` should be invoked on the leading and/or trailing edge
     * of the `wait` timeout. Subsequent calls to the throttled function will
     * return the result of the last `func` call.
     *
     * Note: If `leading` and `trailing` options are `true` `func` will be called
     * on the trailing edge of the timeout only if the the throttled function is
     * invoked more than once during the `wait` timeout.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {Function} func The function to throttle.
     * @param {number} wait The number of milliseconds to throttle executions to.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // avoid excessively updating the position while scrolling
     * var throttled = _.throttle(updatePosition, 100);
     * jQuery(window).on('scroll', throttled);
     *
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (!isFunction(func)) {
        throw new TypeError;
      }
      if (options === false) {
        leading = false;
      } else if (isObject(options)) {
        leading = 'leading' in options ? options.leading : leading;
        trailing = 'trailing' in options ? options.trailing : trailing;
      }
      debounceOptions.leading = leading;
      debounceOptions.maxWait = wait;
      debounceOptions.trailing = trailing;

      return debounce(func, wait, debounceOptions);
    }

    /**
     * Creates a function that provides `value` to the wrapper function as its
     * first argument. Additional arguments provided to the function are appended
     * to those provided to the wrapper function. The wrapper is executed with
     * the `this` binding of the created function.
     *
     * @static
     * @memberOf _
     * @category Functions
     * @param {*} value The value to wrap.
     * @param {Function} wrapper The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('Fred, Wilma, & Pebbles');
     * // => '<p>Fred, Wilma, &amp; Pebbles</p>'
     */
    function wrap(value, wrapper) {
      return createWrapper(wrapper, 16, [value]);
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var object = { 'name': 'fred' };
     * var getter = _.constant(object);
     * getter() === object;
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Produces a callback bound to an optional `thisArg`. If `func` is a property
     * name the created callback will return the property value for a given element.
     * If `func` is an object the created callback will return `true` for elements
     * that contain the equivalent object properties, otherwise it will return `false`.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} [func=identity] The value to convert to a callback.
     * @param {*} [thisArg] The `this` binding of the created callback.
     * @param {number} [argCount] The number of arguments the callback accepts.
     * @returns {Function} Returns a callback function.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // wrap to create custom callback shorthands
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
     *
     * _.filter(characters, 'age__gt38');
     * // => [{ 'name': 'fred', 'age': 40 }]
     */
    function createCallback(func, thisArg, argCount) {
      var type = typeof func;
      if (func == null || type == 'function') {
        return baseCreateCallback(func, thisArg, argCount);
      }
      // handle "_.pluck" style callback shorthands
      if (type != 'object') {
        return property(func);
      }
      var props = keys(func),
          key = props[0],
          a = func[key];

      // handle "_.where" style callback shorthands
      if (props.length == 1 && a === a && !isObject(a)) {
        // fast path the common case of providing an object with a single
        // property containing a primitive value
        return function(object) {
          var b = object[key];
          return a === b && (a !== 0 || (1 / a == 1 / b));
        };
      }
      return function(object) {
        var length = props.length,
            result = false;

        while (length--) {
          if (!(result = baseIsEqual(object[props[length]], func[props[length]], null, true))) {
            break;
          }
        }
        return result;
      };
    }

    /**
     * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
     * corresponding HTML entities.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('Fred, Wilma, & Pebbles');
     * // => 'Fred, Wilma, &amp; Pebbles'
     */
    function escape(string) {
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
    }

    /**
     * This method returns the first argument provided to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.identity(object) === object;
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Adds function properties of a source object to the destination object.
     * If `object` is a function methods will be added to its prototype as well.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Function|Object} [object=lodash] object The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options] The options object.
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.
     * @example
     *
     * function capitalize(string) {
     *   return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     * }
     *
     * _.mixin({ 'capitalize': capitalize });
     * _.capitalize('fred');
     * // => 'Fred'
     *
     * _('fred').capitalize().value();
     * // => 'Fred'
     *
     * _.mixin({ 'capitalize': capitalize }, { 'chain': false });
     * _('fred').capitalize();
     * // => 'Fred'
     */
    function mixin(object, source, options) {
      var chain = true,
          methodNames = source && functions(source);

      if (!source || (!options && !methodNames.length)) {
        if (options == null) {
          options = source;
        }
        ctor = lodashWrapper;
        source = object;
        object = lodash;
        methodNames = functions(source);
      }
      if (options === false) {
        chain = false;
      } else if (isObject(options) && 'chain' in options) {
        chain = options.chain;
      }
      var ctor = object,
          isFunc = isFunction(ctor);

      forEach(methodNames, function(methodName) {
        var func = object[methodName] = source[methodName];
        if (isFunc) {
          ctor.prototype[methodName] = function() {
            var chainAll = this.__chain__,
                value = this.__wrapped__,
                args = [value];

            push.apply(args, arguments);
            var result = func.apply(object, args);
            if (chain || chainAll) {
              if (value === result && isObject(result)) {
                return this;
              }
              result = new ctor(result);
              result.__chain__ = chainAll;
            }
            return result;
          };
        }
      });
    }

    /**
     * Reverts the '_' variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      context._ = oldDash;
      return this;
    }

    /**
     * A no-operation function.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var object = { 'name': 'fred' };
     * _.noop(object) === undefined;
     * // => true
     */
    function noop() {
      // no operation performed
    }

    /**
     * Gets the number of milliseconds that have elapsed since the Unix epoch
     * (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @example
     *
     * var stamp = _.now();
     * _.defer(function() { console.log(_.now() - stamp); });
     * // => logs the number of milliseconds it took for the deferred function to be called
     */
    var now = isNative(now = Date.now) && now || function() {
      return new Date().getTime();
    };

    /**
     * Converts the given value into an integer of the specified radix.
     * If `radix` is `undefined` or `0` a `radix` of `10` is used unless the
     * `value` is a hexadecimal, in which case a `radix` of `16` is used.
     *
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`
     * implementations. See http://es5.github.io/#E.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} value The value to parse.
     * @param {number} [radix] The radix used to interpret the value to parse.
     * @returns {number} Returns the new integer value.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     */
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
      // Firefox < 21 and Opera < 15 follow the ES3 specified implementation of `parseInt`
      return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
    };

    /**
     * Creates a "_.pluck" style function, which returns the `key` value of a
     * given object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} key The name of the property to retrieve.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var characters = [
     *   { 'name': 'fred',   'age': 40 },
     *   { 'name': 'barney', 'age': 36 }
     * ];
     *
     * var getName = _.property('name');
     *
     * _.map(characters, getName);
     * // => ['barney', 'fred']
     *
     * _.sortBy(characters, getName);
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]
     */
    function property(key) {
      return function(object) {
        return object[key];
      };
    }

    /**
     * Produces a random number between `min` and `max` (inclusive). If only one
     * argument is provided a number between `0` and the given number will be
     * returned. If `floating` is truey or either `min` or `max` are floats a
     * floating-point number will be returned instead of an integer.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} [min=0] The minimum possible value.
     * @param {number} [max=1] The maximum possible value.
     * @param {boolean} [floating=false] Specify returning a floating-point number.
     * @returns {number} Returns a random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(min, max, floating) {
      var noMin = min == null,
          noMax = max == null;

      if (floating == null) {
        if (typeof min == 'boolean' && noMax) {
          floating = min;
          min = 1;
        }
        else if (!noMax && typeof max == 'boolean') {
          floating = max;
          noMax = true;
        }
      }
      if (noMin && noMax) {
        max = 1;
      }
      min = +min || 0;
      if (noMax) {
        max = min;
        min = 0;
      } else {
        max = +max || 0;
      }
      if (floating || min % 1 || max % 1) {
        var rand = nativeRandom();
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);
      }
      return baseRandom(min, max);
    }

    /**
     * Resolves the value of property `key` on `object`. If `key` is a function
     * it will be invoked with the `this` binding of `object` and its result returned,
     * else the property value is returned. If `object` is falsey then `undefined`
     * is returned.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} object The object to inspect.
     * @param {string} key The name of the property to resolve.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
     *
     * _.result(object, 'cheese');
     * // => 'crumpets'
     *
     * _.result(object, 'stuff');
     * // => 'nonsense'
     */
    function result(object, key) {
      if (object) {
        var value = object[key];
        return isFunction(value) ? object[key]() : value;
      }
    }

    /**
     * A micro-templating method that handles arbitrary delimiters, preserves
     * whitespace, and correctly escapes quotes within interpolated code.
     *
     * Note: In the development build, `_.template` utilizes sourceURLs for easier
     * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
     *
     * For more information on precompiling templates see:
     * http://lodash.com/custom-builds
     *
     * For more information on Chrome extension sandboxes see:
     * http://developer.chrome.com/stable/extensions/sandboxingEval.html
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} text The template text.
     * @param {Object} data The data object used to populate the text.
     * @param {Object} [options] The options object.
     * @param {RegExp} [options.escape] The "escape" delimiter.
     * @param {RegExp} [options.evaluate] The "evaluate" delimiter.
     * @param {Object} [options.imports] An object to import into the template as local variables.
     * @param {RegExp} [options.interpolate] The "interpolate" delimiter.
     * @param {string} [sourceURL] The sourceURL of the template's compiled source.
     * @param {string} [variable] The data object variable name.
     * @returns {Function|string} Returns a compiled function when no `data` object
     *  is given, else it returns the interpolated text.
     * @example
     *
     * // using the "interpolate" delimiter to create a compiled template
     * var compiled = _.template('hello <%= name %>');
     * compiled({ 'name': 'fred' });
     * // => 'hello fred'
     *
     * // using the "escape" delimiter to escape HTML in data property values
     * _.template('<b><%- value %></b>', { 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // using the "evaluate" delimiter to generate HTML
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
     * _.template('hello ${ name }', { 'name': 'pebbles' });
     * // => 'hello pebbles'
     *
     * // using the internal `print` function in "evaluate" delimiters
     * _.template('<% print("hello " + name); %>!', { 'name': 'barney' });
     * // => 'hello barney!'
     *
     * // using a custom template delimiters
     * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
     *
     * _.template('hello {{ name }}!', { 'name': 'mustache' });
     * // => 'hello mustache!'
     *
     * // using the `imports` option to import jQuery
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // using the `sourceURL` option to specify a custom sourceURL for the template
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
     *
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
     *
     * // using the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and a stack trace
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(text, data, options) {
      // based on John Resig's `tmpl` implementation
      // http://ejohn.org/blog/javascript-micro-templating/
      // and Laura Doktorova's doT.js
      // https://github.com/olado/doT
      var settings = lodash.templateSettings;
      text = String(text || '');

      // avoid missing dependencies when `iteratorTemplate` is not defined
      options = defaults({}, options, settings);

      var imports = defaults({}, options.imports, settings.imports),
          importsKeys = keys(imports),
          importsValues = values(imports);

      var isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // compile the regexp to match each delimiter
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // escape characters that cannot be included in string literals
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // replace delimiters with snippets
        if (escapeValue) {
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // the JS engine embedded in Adobe products requires returning the `match`
        // string in order to produce the correct `offset` value
        return match;
      });

      source += "';\n";

      // if `variable` is not specified, wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain
      var variable = options.variable,
          hasVariable = variable;

      if (!hasVariable) {
        variable = 'obj';
        source = 'with (' + variable + ') {\n' + source + '\n}\n';
      }
      // cleanup code by stripping empty strings
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // frame code as the function body
      source = 'function(' + variable + ') {\n' +
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
        "var __t, __p = '', __e = _.escape" +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      // Use a sourceURL for easier debugging.
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
      var sourceURL = '\n/*\n//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

      try {
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
      } catch(e) {
        e.source = source;
        throw e;
      }
      if (data) {
        return result(data);
      }
      // provide the compiled function's source by its `toString` method, in
      // supported environments, or the `source` property as a convenience for
      // inlining compiled templates during the build process
      result.source = source;
      return result;
    }

    /**
     * Executes the callback `n` times, returning an array of the results
     * of each callback execution. The callback is bound to `thisArg` and invoked
     * with one argument; (index).
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {number} n The number of times to execute the callback.
     * @param {Function} callback The function called per iteration.
     * @param {*} [thisArg] The `this` binding of `callback`.
     * @returns {Array} Returns an array of the results of each `callback` execution.
     * @example
     *
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
     * // => [3, 6, 4]
     *
     * _.times(3, function(n) { mage.castSpell(n); });
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
     *
     * _.times(3, function(n) { this.cast(n); }, mage);
     * // => also calls `mage.castSpell(n)` three times
     */
    function times(n, callback, thisArg) {
      n = (n = +n) > -1 ? n : 0;
      var index = -1,
          result = Array(n);

      callback = baseCreateCallback(callback, thisArg, 1);
      while (++index < n) {
        result[index] = callback(index);
      }
      return result;
    }

    /**
     * The inverse of `_.escape` this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
     * corresponding characters.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} string The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('Fred, Barney &amp; Pebbles');
     * // => 'Fred, Barney & Pebbles'
     */
    function unescape(string) {
      return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
    }

    /**
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {string} [prefix] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return String(prefix == null ? '' : prefix) + id;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object that wraps the given value with explicit
     * method chaining enabled.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney',  'age': 36 },
     *   { 'name': 'fred',    'age': 40 },
     *   { 'name': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _.chain(characters)
     *     .sortBy('age')
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })
     *     .first()
     *     .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      value = new lodashWrapper(value);
      value.__chain__ = true;
      return value;
    }

    /**
     * Invokes `interceptor` with the `value` as the first argument and then
     * returns `value`. The purpose of this method is to "tap into" a method
     * chain in order to perform operations on intermediate results within
     * the chain.
     *
     * @static
     * @memberOf _
     * @category Chaining
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3, 4])
     *  .tap(function(array) { array.pop(); })
     *  .reverse()
     *  .value();
     * // => [3, 2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * Enables explicit method chaining on the wrapper object.
     *
     * @name chain
     * @memberOf _
     * @category Chaining
     * @returns {*} Returns the wrapper object.
     * @example
     *
     * var characters = [
     *   { 'name': 'barney', 'age': 36 },
     *   { 'name': 'fred',   'age': 40 }
     * ];
     *
     * // without explicit chaining
     * _(characters).first();
     * // => { 'name': 'barney', 'age': 36 }
     *
     * // with explicit chaining
     * _(characters).chain()
     *   .first()
     *   .pick('age')
     *   .value();
     * // => { 'age': 36 }
     */
    function wrapperChain() {
      this.__chain__ = true;
      return this;
    }

    /**
     * Produces the `toString` result of the wrapped value.
     *
     * @name toString
     * @memberOf _
     * @category Chaining
     * @returns {string} Returns the string result.
     * @example
     *
     * _([1, 2, 3]).toString();
     * // => '1,2,3'
     */
    function wrapperToString() {
      return String(this.__wrapped__);
    }

    /**
     * Extracts the wrapped value.
     *
     * @name valueOf
     * @memberOf _
     * @alias value
     * @category Chaining
     * @returns {*} Returns the wrapped value.
     * @example
     *
     * _([1, 2, 3]).valueOf();
     * // => [1, 2, 3]
     */
    function wrapperValueOf() {
      return this.__wrapped__;
    }

    /*--------------------------------------------------------------------------*/

    // add functions that return wrapped values when chaining
    lodash.after = after;
    lodash.assign = assign;
    lodash.at = at;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.chain = chain;
    lodash.compact = compact;
    lodash.compose = compose;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.createCallback = createCallback;
    lodash.curry = curry;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.filter = filter;
    lodash.flatten = flatten;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.functions = functions;
    lodash.groupBy = groupBy;
    lodash.indexBy = indexBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.invert = invert;
    lodash.invoke = invoke;
    lodash.keys = keys;
    lodash.map = map;
    lodash.mapValues = mapValues;
    lodash.max = max;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.min = min;
    lodash.omit = omit;
    lodash.once = once;
    lodash.pairs = pairs;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.pick = pick;
    lodash.pluck = pluck;
    lodash.property = property;
    lodash.pull = pull;
    lodash.range = range;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.shuffle = shuffle;
    lodash.sortBy = sortBy;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.times = times;
    lodash.toArray = toArray;
    lodash.transform = transform;
    lodash.union = union;
    lodash.uniq = uniq;
    lodash.values = values;
    lodash.where = where;
    lodash.without = without;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.zip = zip;
    lodash.zipObject = zipObject;

    // add aliases
    lodash.collect = map;
    lodash.drop = rest;
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.extend = assign;
    lodash.methods = functions;
    lodash.object = zipObject;
    lodash.select = filter;
    lodash.tail = rest;
    lodash.unique = uniq;
    lodash.unzip = zip;

    // add functions to `lodash.prototype`
    mixin(lodash);

    /*--------------------------------------------------------------------------*/

    // add functions that return unwrapped values when chaining
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.contains = contains;
    lodash.escape = escape;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.has = has;
    lodash.identity = identity;
    lodash.indexOf = indexOf;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isBoolean = isBoolean;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isNaN = isNaN;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isString = isString;
    lodash.isUndefined = isUndefined;
    lodash.lastIndexOf = lastIndexOf;
    lodash.mixin = mixin;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.result = result;
    lodash.runInContext = runInContext;
    lodash.size = size;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.template = template;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;

    // add aliases
    lodash.all = every;
    lodash.any = some;
    lodash.detect = find;
    lodash.findWhere = find;
    lodash.foldl = reduce;
    lodash.foldr = reduceRight;
    lodash.include = contains;
    lodash.inject = reduce;

    mixin(function() {
      var source = {}
      forOwn(lodash, function(func, methodName) {
        if (!lodash.prototype[methodName]) {
          source[methodName] = func;
        }
      });
      return source;
    }(), false);

    /*--------------------------------------------------------------------------*/

    // add functions capable of returning wrapped and unwrapped values when chaining
    lodash.first = first;
    lodash.last = last;
    lodash.sample = sample;

    // add aliases
    lodash.take = first;
    lodash.head = first;

    forOwn(lodash, function(func, methodName) {
      var callbackable = methodName !== 'sample';
      if (!lodash.prototype[methodName]) {
        lodash.prototype[methodName]= function(n, guard) {
          var chainAll = this.__chain__,
              result = func(this.__wrapped__, n, guard);

          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))
            ? result
            : new lodashWrapper(result, chainAll);
        };
      }
    });

    /*--------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type string
     */
    lodash.VERSION = '2.4.1';

    // add "Chaining" functions to the wrapper
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.toString = wrapperToString;
    lodash.prototype.value = wrapperValueOf;
    lodash.prototype.valueOf = wrapperValueOf;

    // add `Array` functions that return unwrapped values
    forEach(['join', 'pop', 'shift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        var chainAll = this.__chain__,
            result = func.apply(this.__wrapped__, arguments);

        return chainAll
          ? new lodashWrapper(result, chainAll)
          : result;
      };
    });

    // add `Array` functions that return the existing wrapped value
    forEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        func.apply(this.__wrapped__, arguments);
        return this;
      };
    });

    // add `Array` functions that return new wrapped values
    forEach(['concat', 'slice', 'splice'], function(methodName) {
      var func = arrayRef[methodName];
      lodash.prototype[methodName] = function() {
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);
      };
    });

    return lodash;
  }

  /*--------------------------------------------------------------------------*/

  // expose Lo-Dash
  var _ = runInContext();

  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lo-Dash to the global object even when an AMD loader is present in
    // case Lo-Dash is loaded with a RequireJS shim config.
    // See http://requirejs.org/docs/api.html#config-shim
    root._ = _;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define(function() {
      return _;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports && freeModule) {
    // in Node.js or RingoJS
    if (moduleExports) {
      (freeModule.exports = _)._ = _;
    }
    // in Narwhal or Rhino -require
    else {
      freeExports._ = _;
    }
  }
  else {
    // in a browser or Rhino
    root._ = _;
  }
}.call(this));

},{}],37:[function(require,module,exports){
//  Underscore.string
//  (c) 2010 Esa-Matti Suuronen <esa-matti aet suuronen dot org>
//  Underscore.string is freely distributable under the terms of the MIT license.
//  Documentation: https://github.com/epeli/underscore.string
//  Some code is borrowed from MooTools and Alexandru Marasteanu.
//  Version '2.4.0'

!function(root, String){
  'use strict';

  // Defining helper functions.

  var nativeTrim = String.prototype.trim;
  var nativeTrimRight = String.prototype.trimRight;
  var nativeTrimLeft = String.prototype.trimLeft;

  var parseNumber = function(source) { return source * 1 || 0; };

  var strRepeat = function(str, qty){
    if (qty < 1) return '';
    var result = '';
    while (qty > 0) {
      if (qty & 1) result += str;
      qty >>= 1, str += str;
    }
    return result;
  };

  var slice = [].slice;

  var defaultToWhiteSpace = function(characters) {
    if (characters == null)
      return '\\s';
    else if (characters.source)
      return characters.source;
    else
      return '[' + _s.escapeRegExp(characters) + ']';
  };

  // Helper for toBoolean
  function boolMatch(s, matchers) {
    var i, matcher, down = s.toLowerCase();
    matchers = [].concat(matchers);
    for (i = 0; i < matchers.length; i += 1) {
      matcher = matchers[i];
      if (!matcher) continue;
      if (matcher.test && matcher.test(s)) return true;
      if (matcher.toLowerCase() === down) return true;
    }
  }

  var escapeChars = {
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: "'"
  };

  var reversedEscapeChars = {};
  for(var key in escapeChars) reversedEscapeChars[escapeChars[key]] = key;
  reversedEscapeChars["'"] = '#39';

  // sprintf() for JavaScript 0.7-beta1
  // http://www.diveintojavascript.com/projects/javascript-sprintf
  //
  // Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
  // All rights reserved.

  var sprintf = (function() {
    function get_type(variable) {
      return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
    }

    var str_repeat = strRepeat;

    var str_format = function() {
      if (!str_format.cache.hasOwnProperty(arguments[0])) {
        str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
      }
      return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
    };

    str_format.format = function(parse_tree, argv) {
      var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
      for (i = 0; i < tree_length; i++) {
        node_type = get_type(parse_tree[i]);
        if (node_type === 'string') {
          output.push(parse_tree[i]);
        }
        else if (node_type === 'array') {
          match = parse_tree[i]; // convenience purposes only
          if (match[2]) { // keyword argument
            arg = argv[cursor];
            for (k = 0; k < match[2].length; k++) {
              if (!arg.hasOwnProperty(match[2][k])) {
                throw new Error(sprintf('[_.sprintf] property "%s" does not exist', match[2][k]));
              }
              arg = arg[match[2][k]];
            }
          } else if (match[1]) { // positional argument (explicit)
            arg = argv[match[1]];
          }
          else { // positional argument (implicit)
            arg = argv[cursor++];
          }

          if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
            throw new Error(sprintf('[_.sprintf] expecting number but found %s', get_type(arg)));
          }
          switch (match[8]) {
            case 'b': arg = arg.toString(2); break;
            case 'c': arg = String.fromCharCode(arg); break;
            case 'd': arg = parseInt(arg, 10); break;
            case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
            case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
            case 'o': arg = arg.toString(8); break;
            case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
            case 'u': arg = Math.abs(arg); break;
            case 'x': arg = arg.toString(16); break;
            case 'X': arg = arg.toString(16).toUpperCase(); break;
          }
          arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
          pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
          pad_length = match[6] - String(arg).length;
          pad = match[6] ? str_repeat(pad_character, pad_length) : '';
          output.push(match[5] ? arg + pad : pad + arg);
        }
      }
      return output.join('');
    };

    str_format.cache = {};

    str_format.parse = function(fmt) {
      var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
      while (_fmt) {
        if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
          parse_tree.push(match[0]);
        }
        else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
          parse_tree.push('%');
        }
        else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
          if (match[2]) {
            arg_names |= 1;
            var field_list = [], replacement_field = match[2], field_match = [];
            if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
              field_list.push(field_match[1]);
              while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                  field_list.push(field_match[1]);
                }
                else {
                  throw new Error('[_.sprintf] huh?');
                }
              }
            }
            else {
              throw new Error('[_.sprintf] huh?');
            }
            match[2] = field_list;
          }
          else {
            arg_names |= 2;
          }
          if (arg_names === 3) {
            throw new Error('[_.sprintf] mixing positional and named placeholders is not (yet) supported');
          }
          parse_tree.push(match);
        }
        else {
          throw new Error('[_.sprintf] huh?');
        }
        _fmt = _fmt.substring(match[0].length);
      }
      return parse_tree;
    };

    return str_format;
  })();



  // Defining underscore.string

  var _s = {

    VERSION: '2.4.0',

    isBlank: function(str){
      if (str == null) str = '';
      return (/^\s*$/).test(str);
    },

    stripTags: function(str){
      if (str == null) return '';
      return String(str).replace(/<\/?[^>]+>/g, '');
    },

    capitalize : function(str){
      str = str == null ? '' : String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    chop: function(str, step){
      if (str == null) return [];
      str = String(str);
      step = ~~step;
      return step > 0 ? str.match(new RegExp('.{1,' + step + '}', 'g')) : [str];
    },

    clean: function(str){
      return _s.strip(str).replace(/\s+/g, ' ');
    },

    count: function(str, substr){
      if (str == null || substr == null) return 0;

      str = String(str);
      substr = String(substr);

      var count = 0,
        pos = 0,
        length = substr.length;

      while (true) {
        pos = str.indexOf(substr, pos);
        if (pos === -1) break;
        count++;
        pos += length;
      }

      return count;
    },

    chars: function(str) {
      if (str == null) return [];
      return String(str).split('');
    },

    swapCase: function(str) {
      if (str == null) return '';
      return String(str).replace(/\S/g, function(c){
        return c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase();
      });
    },

    escapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, function(m){ return '&' + reversedEscapeChars[m] + ';'; });
    },

    unescapeHTML: function(str) {
      if (str == null) return '';
      return String(str).replace(/\&([^;]+);/g, function(entity, entityCode){
        var match;

        if (entityCode in escapeChars) {
          return escapeChars[entityCode];
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
          return String.fromCharCode(parseInt(match[1], 16));
        } else if (match = entityCode.match(/^#(\d+)$/)) {
          return String.fromCharCode(~~match[1]);
        } else {
          return entity;
        }
      });
    },

    escapeRegExp: function(str){
      if (str == null) return '';
      return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    },

    splice: function(str, i, howmany, substr){
      var arr = _s.chars(str);
      arr.splice(~~i, ~~howmany, substr);
      return arr.join('');
    },

    insert: function(str, i, substr){
      return _s.splice(str, i, 0, substr);
    },

    include: function(str, needle){
      if (needle === '') return true;
      if (str == null) return false;
      return String(str).indexOf(needle) !== -1;
    },

    join: function() {
      var args = slice.call(arguments),
        separator = args.shift();

      if (separator == null) separator = '';

      return args.join(separator);
    },

    lines: function(str) {
      if (str == null) return [];
      return String(str).split("\n");
    },

    reverse: function(str){
      return _s.chars(str).reverse().join('');
    },

    startsWith: function(str, starts){
      if (starts === '') return true;
      if (str == null || starts == null) return false;
      str = String(str); starts = String(starts);
      return str.length >= starts.length && str.slice(0, starts.length) === starts;
    },

    endsWith: function(str, ends){
      if (ends === '') return true;
      if (str == null || ends == null) return false;
      str = String(str); ends = String(ends);
      return str.length >= ends.length && str.slice(str.length - ends.length) === ends;
    },

    succ: function(str){
      if (str == null) return '';
      str = String(str);
      return str.slice(0, -1) + String.fromCharCode(str.charCodeAt(str.length-1) + 1);
    },

    titleize: function(str){
      if (str == null) return '';
      str  = String(str).toLowerCase();
      return str.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase(); });
    },

    camelize: function(str){
      return _s.trim(str).replace(/[-_\s]+(.)?/g, function(match, c){ return c ? c.toUpperCase() : ""; });
    },

    underscored: function(str){
      return _s.trim(str).replace(/([a-z\d])([A-Z]+)/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
    },

    dasherize: function(str){
      return _s.trim(str).replace(/([A-Z])/g, '-$1').replace(/[-_\s]+/g, '-').toLowerCase();
    },

    classify: function(str){
      return _s.capitalize(_s.camelize(String(str).replace(/[\W_]/g, ' ')).replace(/\s/g, ''));
    },

    humanize: function(str){
      return _s.capitalize(_s.underscored(str).replace(/_id$/,'').replace(/_/g, ' '));
    },

    trim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrim) return nativeTrim.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+|' + characters + '+$', 'g'), '');
    },

    ltrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimLeft) return nativeTrimLeft.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp('^' + characters + '+'), '');
    },

    rtrim: function(str, characters){
      if (str == null) return '';
      if (!characters && nativeTrimRight) return nativeTrimRight.call(str);
      characters = defaultToWhiteSpace(characters);
      return String(str).replace(new RegExp(characters + '+$'), '');
    },

    truncate: function(str, length, truncateStr){
      if (str == null) return '';
      str = String(str); truncateStr = truncateStr || '...';
      length = ~~length;
      return str.length > length ? str.slice(0, length) + truncateStr : str;
    },

    /**
     * _s.prune: a more elegant version of truncate
     * prune extra chars, never leaving a half-chopped word.
     * @author github.com/rwz
     */
    prune: function(str, length, pruneStr){
      if (str == null) return '';

      str = String(str); length = ~~length;
      pruneStr = pruneStr != null ? String(pruneStr) : '...';

      if (str.length <= length) return str;

      var tmpl = function(c){ return c.toUpperCase() !== c.toLowerCase() ? 'A' : ' '; },
        template = str.slice(0, length+1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

      if (template.slice(template.length-2).match(/\w\w/))
        template = template.replace(/\s*\S+$/, '');
      else
        template = _s.rtrim(template.slice(0, template.length-1));

      return (template+pruneStr).length > str.length ? str : str.slice(0, template.length)+pruneStr;
    },

    words: function(str, delimiter) {
      if (_s.isBlank(str)) return [];
      return _s.trim(str, delimiter).split(delimiter || /\s+/);
    },

    pad: function(str, length, padStr, type) {
      str = str == null ? '' : String(str);
      length = ~~length;

      var padlen  = 0;

      if (!padStr)
        padStr = ' ';
      else if (padStr.length > 1)
        padStr = padStr.charAt(0);

      switch(type) {
        case 'right':
          padlen = length - str.length;
          return str + strRepeat(padStr, padlen);
        case 'both':
          padlen = length - str.length;
          return strRepeat(padStr, Math.ceil(padlen/2)) + str
                  + strRepeat(padStr, Math.floor(padlen/2));
        default: // 'left'
          padlen = length - str.length;
          return strRepeat(padStr, padlen) + str;
        }
    },

    lpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr);
    },

    rpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'right');
    },

    lrpad: function(str, length, padStr) {
      return _s.pad(str, length, padStr, 'both');
    },

    sprintf: sprintf,

    vsprintf: function(fmt, argv){
      argv.unshift(fmt);
      return sprintf.apply(null, argv);
    },

    toNumber: function(str, decimals) {
      if (!str) return 0;
      str = _s.trim(str);
      if (!str.match(/^-?\d+(?:\.\d+)?$/)) return NaN;
      return parseNumber(parseNumber(str).toFixed(~~decimals));
    },

    numberFormat : function(number, dec, dsep, tsep) {
      if (isNaN(number) || number == null) return '';

      number = number.toFixed(~~dec);
      tsep = typeof tsep == 'string' ? tsep : ',';

      var parts = number.split('.'), fnums = parts[0],
        decimals = parts[1] ? (dsep || '.') + parts[1] : '';

      return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
    },

    strRight: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strRightBack: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.lastIndexOf(sep);
      return ~pos ? str.slice(pos+sep.length, str.length) : str;
    },

    strLeft: function(str, sep){
      if (str == null) return '';
      str = String(str); sep = sep != null ? String(sep) : sep;
      var pos = !sep ? -1 : str.indexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    strLeftBack: function(str, sep){
      if (str == null) return '';
      str += ''; sep = sep != null ? ''+sep : sep;
      var pos = str.lastIndexOf(sep);
      return ~pos ? str.slice(0, pos) : str;
    },

    toSentence: function(array, separator, lastSeparator, serial) {
      separator = separator || ', ';
      lastSeparator = lastSeparator || ' and ';
      var a = array.slice(), lastMember = a.pop();

      if (array.length > 2 && serial) lastSeparator = _s.rtrim(separator) + lastSeparator;

      return a.length ? a.join(separator) + lastSeparator + lastMember : lastMember;
    },

    toSentenceSerial: function() {
      var args = slice.call(arguments);
      args[3] = true;
      return _s.toSentence.apply(_s, args);
    },

    slugify: function(str) {
      if (str == null) return '';

      var from  = "ąàáäâãåæăćęèéëêìíïîłńòóöôõøśșțùúüûñçżź",
          to    = "aaaaaaaaaceeeeeiiiilnoooooosstuuuunczz",
          regex = new RegExp(defaultToWhiteSpace(from), 'g');

      str = String(str).toLowerCase().replace(regex, function(c){
        var index = from.indexOf(c);
        return to.charAt(index) || '-';
      });

      return _s.dasherize(str.replace(/[^\w\s-]/g, ''));
    },

    surround: function(str, wrapper) {
      return [wrapper, str, wrapper].join('');
    },

    quote: function(str, quoteChar) {
      return _s.surround(str, quoteChar || '"');
    },

    unquote: function(str, quoteChar) {
      quoteChar = quoteChar || '"';
      if (str[0] === quoteChar && str[str.length-1] === quoteChar)
        return str.slice(1,str.length-1);
      else return str;
    },

    exports: function() {
      var result = {};

      for (var prop in this) {
        if (!this.hasOwnProperty(prop) || prop.match(/^(?:include|contains|reverse)$/)) continue;
        result[prop] = this[prop];
      }

      return result;
    },

    repeat: function(str, qty, separator){
      if (str == null) return '';

      qty = ~~qty;

      // using faster implementation if separator is not needed;
      if (separator == null) return strRepeat(String(str), qty);

      // this one is about 300x slower in Google Chrome
      for (var repeat = []; qty > 0; repeat[--qty] = str) {}
      return repeat.join(separator);
    },

    naturalCmp: function(str1, str2){
      if (str1 == str2) return 0;
      if (!str1) return -1;
      if (!str2) return 1;

      var cmpRegex = /(\.\d+)|(\d+)|(\D+)/g,
        tokens1 = String(str1).toLowerCase().match(cmpRegex),
        tokens2 = String(str2).toLowerCase().match(cmpRegex),
        count = Math.min(tokens1.length, tokens2.length);

      for(var i = 0; i < count; i++) {
        var a = tokens1[i], b = tokens2[i];

        if (a !== b){
          var num1 = parseInt(a, 10);
          if (!isNaN(num1)){
            var num2 = parseInt(b, 10);
            if (!isNaN(num2) && num1 - num2)
              return num1 - num2;
          }
          return a < b ? -1 : 1;
        }
      }

      if (tokens1.length === tokens2.length)
        return tokens1.length - tokens2.length;

      return str1 < str2 ? -1 : 1;
    },

    levenshtein: function(str1, str2) {
      if (str1 == null && str2 == null) return 0;
      if (str1 == null) return String(str2).length;
      if (str2 == null) return String(str1).length;

      str1 = String(str1); str2 = String(str2);

      var current = [], prev, value;

      for (var i = 0; i <= str2.length; i++)
        for (var j = 0; j <= str1.length; j++) {
          if (i && j)
            if (str1.charAt(j - 1) === str2.charAt(i - 1))
              value = prev;
            else
              value = Math.min(current[j], current[j - 1], prev) + 1;
          else
            value = i + j;

          prev = current[j];
          current[j] = value;
        }

      return current.pop();
    },

    toBoolean: function(str, trueValues, falseValues) {
      if (typeof str === "number") str = "" + str;
      if (typeof str !== "string") return !!str;
      str = _s.trim(str);
      if (boolMatch(str, trueValues || ["true", "1"])) return true;
      if (boolMatch(str, falseValues || ["false", "0"])) return false;
    }
  };

  // Aliases

  _s.strip    = _s.trim;
  _s.lstrip   = _s.ltrim;
  _s.rstrip   = _s.rtrim;
  _s.center   = _s.lrpad;
  _s.rjust    = _s.lpad;
  _s.ljust    = _s.rpad;
  _s.contains = _s.include;
  _s.q        = _s.quote;
  _s.toBool   = _s.toBoolean;

  // Exporting

  // CommonJS module is defined
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports)
      module.exports = _s;

    exports._s = _s;
  }

  // Register as a named module with AMD.
  if (typeof define === 'function' && define.amd)
    define('underscore.string', [], function(){ return _s; });


  // Integrate with Underscore.js if defined
  // or create our own underscore object.
  root._ = root._ || {};
  root._.string = root._.str = _s;
}(this, String);

},{}]},{},[24])

;
//# sourceMappingURL=framer.js.map