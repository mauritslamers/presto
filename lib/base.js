/*globals Presto, console*/

Presto = {};

Presto._baseMixin = function (override) {
  var args = Array.prototype.slice.call(arguments, 1),
  // copy reference to target object
      target = args[0] || {},
      idx = 1,
      length = args.length,
      options, copy, key;

  // Handle case where we have only one item... extend Presto
  if (length === 1) {
    target = this || {};
    idx = 0;
  }

  for (; idx < length; idx++) {
    if (!(options = args[idx])) continue;
    for (key in options) {
      if (!options.hasOwnProperty(key)) continue;
      copy = options[key];
      if (target === copy) continue; // prevent never-ending loop
      if (copy !== undefined && (override || (target[key] === undefined))) target[key] = copy;
    }
    // Manually copy toString() because some JS engines do not enumerate it
    // (such as IE8)
    if (options.hasOwnProperty('toString')) target.toString = options.toString;
  }

  return target;
};

Presto.mixin = function () {
  var args = Array.prototype.slice.call(arguments);
  args.unshift(true);
  return Presto._baseMixin.apply(this, args);
};


Presto.mixin({

  K: function () {},

  beget: function (obj) {
    if (obj === null || obj === undefined) return null;
    var K = Presto.K;
    K.prototype = obj;
    var ret = new K();
    K.prototype = null; // avoid leaks
    if (typeof obj.didBeget === "function") ret = obj.didBeget(ret);
    return ret;
  },

  _detect_base: function _detect_base (func, parent, name) {
    return function invoke_superclass_method() {
      var base = parent[name];

      //@if(debug)
      if (!base) {
        throw new Error("Developer Error: No '" + name + "' method was found on the superclass");
      }
      //@endif

      // NOTE: It is possible to cache the base, so that the first
      // call to sc_super will avoid doing the lookup again. However,
      // since the cost of the extra method dispatch is low and is
      // only incurred on sc_super, but also creates another possible
      // weird edge-case (when a class is enhanced after first used),
      // we'll leave it off for now unless profiling demonstrates that
      // it's a hotspot.
      //if(base && func === base) { func.base = function () {}; }
      //else { func.base = base; }

      return base.apply(this, arguments);
    };
  },

  _object_extend: function _object_extend (base, ext, proto) {
    //@if(debug)
    if (!ext) { throw new Error("Developer Error: Presto.Object.extend expects a non-null value.  Did you forget to 'sc_require' something?  Or were you passing a Protocol to extend() as if it were a mixin?"); }
    //@endif
    // set _kvo_cloned for later use
    //base._kvo_cloned = null;

    // get some common vars
    var key, cur,
      K = Presto.K;

    // setup arrays for bindings, observers, and properties.  Normally, just
    // save the arrays from the base.  If these need to be changed during
    // processing, then they will be cloned first.
    var value;

    // outlets are treated a little differently because you can manually
    // name outlets in the passed in hash. If this is the case, then clone
    // the array first.


    // now copy properties, add superclass to func.
    for (key in ext) {

      if (key === '_kvo_cloned') continue; // do not copy

      // avoid copying builtin methods
      if (!ext.hasOwnProperty(key)) continue;

      // get the value.
      value = ext[key];


      if (value && (value instanceof Function)) {

        // add super to funcs.  Be sure not to set the base of a func to
        // itself to avoid infinite loops.
        if (!value.superclass && (value !== (cur = base[key]))) {
          value.superclass = cur || K;
          value.base = proto ? Presto._detect_base(value, proto, key) : cur || K;
        }
      }
      // copy property
      base[key] = value;
    }

    // Manually set base on toString() because some JS engines (such as IE8) do
    // not enumerate it
    if (ext.hasOwnProperty('toString')) {
      key = 'toString';
      // get the value.  use concats if defined
      value = ext[key];
      if (!value.superclass && (value !== (cur = base[key]))) {
        value.superclass = value.base = cur || K;
      }
      // copy property
      base[key] = value;
    }

    return base;
  },

  _uuid: 0,

  guidKey: '_guid',

  generateGuid: function (obj, prefix) {
    var ret = (prefix + (Presto._uuid++));
    if (obj) obj[this.guidKey] = ret;
    return ret;
  },

  guidFor: function (obj) {
    if (!obj._guid) {
      return Presto.generateGuid(obj, "pr");
    }
    else return obj._guid;
  },

  fmt: function (string, args) {
    var i = 0;
    return string.replace(/%@([0-9]+)?/g, function(match, index) {
      index = index ? parseInt(index, 10) - 1 : i++;
      if(args[index]!==undefined) return args[index];
      else return "";
    });
  },

  warn: function (string) {
    console.log("WARNING: " + string);
  }

});

Presto.mixin(String, {
  fmt: function() {
    return Presto.fmt(this, arguments);
  }
});

Presto.Object = function (props) {
  this.__sc_super__ = Presto.Object.prototype;
  return this._object_init(props);
};

Presto.mixin(Presto.Object, {

  mixin: function () {
    var len = arguments.length, loc;
    for (loc = 0; loc < len; loc++) Presto.mixin(this, arguments[loc]);
    return this;
  },

  superclass: null,

  /**
    Creates a new subclass of the receiver, adding any passed properties to
    the instance definition of the new class.  You should use this method
    when you plan to create several objects based on a class with similar
    properties.

    Init:

    If you define an init() method, it will be called when you create
    instances of your new class.  Since SproutCore uses the init() method to
    do important setup, you must be sure to always call arguments.callee.base.apply(this,arguments) somewhere
    in your init() to allow the normal setup to proceed.

    @param {Hash} props the methods of properties you want to add
    @returns {Class} A new object class
  */
  extend: function () {

    // build a new constructor and copy class methods.  Do this before
    // adding any other properties so they are not overwritten by the copy.
    var prop, ret = function (props) {
      this.__sc_super__ = ret.prototype;
      return this._object_init(props);
    };
    for (prop in this) {
      if (!this.hasOwnProperty(prop)) continue;
      ret[prop] = this[prop];
    }

    // manually copy toString() because some JS engines do not enumerate it
    if (this.hasOwnProperty('toString')) ret.toString = this.toString;

    // now setup superclass, guid
    ret.superclass = this;
    ret.__sc_super__ = this.prototype;

    // setup new prototype and add properties to it
    var base = (ret.prototype = Presto.beget(this.prototype)),
        idx, len = arguments.length;

    for (idx = 0; idx < len; idx++) {
      Presto._object_extend(base, arguments[idx], ret.__sc_super__);
    }
    base.constructor = ret; // save constructor

    return ret;
  },

  create: function () {
    var C = this, ret = new C(arguments);

    return ret;
  },

  isClass: true
});

Presto.Object.prototype = {

  _object_init: function (extensions) {
    // apply any new properties
    var idx,
      len = (extensions) ? extensions.length : 0;
    for (idx = 0; idx < len; idx++) { Presto._object_extend(this, extensions[idx], this.__sc_super__); }
    this.init(); // call real init

    // Call 'initMixin' methods to automatically setup modules.
    var inits = this.initMixin;
    len = (inits) ? inits.length : 0;
    for (idx = 0; idx < len; idx++) inits[idx].call(this);

    return this; // done!
  },

  mixin: function () {
    var idx, len = arguments.length, init;
    for (idx = 0; idx < len; idx++) Presto._object_extend(this, arguments[idx]);

    // Call initMixin
    for (idx = 0; idx < len; idx++) {
      init = arguments[idx].initMixin;
      if (init) init.call(this);
    }
    return this;
  },

  init: function () {
    return this;
  },

  isObject: true,

  get: function (key) {
    var ret = this[key];
    if (ret === undefined) {
      return this.unknownProperty(key);
    }
    if (ret && ret instanceof Function) {
      return ret.call(this, key);
    }
    else return ret;
  },

  set: function (key, value) {
    var prop = this[key];
    if (prop && prop instanceof Function) {
      prop.call(this, key, value);
    }
    else this[key] = value;
  },

  unknownProperty: function (key, value) {
    if (value !== undefined) { this[key] = value; }
    return value;
  },
};

Presto.Object.prototype.constructor = Presto.Object;

/**
 * Presto.Array, an array solution which still is a real array, but has extra methods
 * and which works without having to extend the global Array prototype
 *
 * Short explanation how this works and why this works:
 * Object.create(Array.prototype) => creates a new clean object using Array.prototype. It is not a real array though
 *                                   yet, it is just an object with the Array.prototype.
 * Array.apply(ret)               => Applies the Array constructor on the freshly created Object, making it into a real
 *                                   array which supports the array subscript notation
 *
 * Result is an Object which acts like an Array, which depends on Array.prototype, but which is not the global Array
 * and consequently can be extended without having those extensions leaking into the global prototype.
 */
Presto.Array = function(opts) {
  // perhaps this should be new Object(Array.prototype) for older browsers,
  // but it seems to me to be pretty unlikely to be necessary, as we require a canvas
  // element anyway.
  var ret = Object.create(Array.prototype);

  if (opts && opts[0] && Array.isArray(opts[0])) {
    ret = Array.apply(ret); // make ret into an array
    // copy contents
    opts[0].forEach(function (o, i) {
      ret[i] = o;
    });
  }
  else { // apply normal
    ret = (Array.apply(ret, opts) || ret);
  }

  Presto.mixin(ret, Presto.Array.prototype);
  return ret;
};

Presto.Array.prototype.constructor = Presto.Array;

Presto.Reducers = {

  /**
    Call this method from your unknownProperty() handler to implement
    automatic reduced properties.  A reduced property is a property that
    collects its contents dynamically from your array contents.  Reduced
    properties always begin with "@".  Getting this property will call
    reduce() on your array with the function matching the key name as the
    processor.

    The return value of this will be either the return value from the
    reduced property or undefined, which means this key is not a reduced
    property.  You can call this at the top of your unknownProperty handler
    like so:

      unknownProperty: function (key, value) {
        var ret = this.handleReduceProperty(key, value);
        if (ret === undefined) {
          // process like normal
        }
      }

    @param {String} key the reduce property key

    @param {Object} value a value or undefined.

    @param {Boolean} generateProperty only set to false if you do not want
      an optimized computed property handler generated for this.  Not common.

    @returns {Object} the reduced property or undefined
  */
  reducedProperty: function (key, value, generateProperty) {

    if (!key || typeof key !== "string" || key.charAt(0) !== '@') return undefined; // not a reduced property

    // get the reducer key and the reducer
    var matches = key.match(/^@([^(]*)(\(([^)]*)\))?$/);
    if (!matches || matches.length < 2) return undefined; // no match

    var reducerKey = matches[1]; // = 'max' if key = '@max(balance)'
    var reducerProperty = matches[3]; // = 'balance' if key = '@max(balance)'
    reducerKey = "reduce" + reducerKey.slice(0, 1).toUpperCase() + reducerKey.slice(1);
    var reducer = this[reducerKey];

    // if there is no reduce function defined for this key, then we can't
    // build a reducer for it.
    if (typeof reducer !== "function") return undefined;

    // if we can't generate the property, just run reduce
    if (generateProperty === false) {
      return this.reduce.call(this, reducer, null, reducerProperty);
    }

    // and reduce anyway...
    return this.reduce.call(this, reducer, null, reducerProperty);
  },

  /**
    Reducer for @max reduced property.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceMax: function (previousValue, item, index, e, reducerProperty) {
    if (reducerProperty && item) {
      item = item.get ? item.get(reducerProperty) : item[reducerProperty];
    }
    if (previousValue === null) return item;
    return (item > previousValue) ? item : previousValue;
  },

  /**
    Reduces an enumerable to the max of the items in the enumerable. If
    reducerProperty is passed, it will reduce that property. Otherwise, it will
    reduce the item itself.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceMaxObject: function (previousItem, item, index, e, reducerProperty) {

    // get the value for both the previous and current item.  If no
    // reducerProperty was supplied, use the items themselves.
    var previousValue = previousItem, itemValue = item;
    if (reducerProperty) {
      if (item) {
        itemValue = item.get ? item.get(reducerProperty) : item[reducerProperty];
      }

      if (previousItem) {
        previousValue = previousItem.get ? previousItem.get(reducerProperty) : previousItem[reducerProperty];
      }
    }
    if (previousValue === null) return item;
    return (itemValue > previousValue) ? item : previousItem;
  },

  /**
    Reduces an enumerable to the min of the items in the enumerable. If
    reducerProperty is passed, it will reduce that property. Otherwise, it will
    reduce the item itself.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceMin: function (previousValue, item, index, e, reducerProperty) {
    if (reducerProperty && item) {
      item = item.get ? item.get(reducerProperty) : item[reducerProperty];
    }
    if (previousValue === null) return item;
    return (item < previousValue) ? item : previousValue;
  },

  /**
    Reduces an enumerable to the max of the items in the enumerable. If
    reducerProperty is passed, it will reduce that property. Otherwise, it will
    reduce the item itself.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceMinObject: function (previousItem, item, index, e, reducerProperty) {

    // get the value for both the previous and current item.  If no
    // reducerProperty was supplied, use the items themselves.
    var previousValue = previousItem, itemValue = item;
    if (reducerProperty) {
      if (item) {
        itemValue = item.get ? item.get(reducerProperty) : item[reducerProperty];
      }

      if (previousItem) {
        previousValue = previousItem.get ? previousItem.get(reducerProperty) : previousItem[reducerProperty];
      }
    }
    if (previousValue === null) return item;
    return (itemValue < previousValue) ? item : previousItem;
  },

  /**
    Reduces an enumerable to the average of the items in the enumerable. If
    reducerProperty is passed, it will reduce that property. Otherwise, it will
    reduce the item itself.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceAverage: function (previousValue, item, index, e, reducerProperty) {
    if (reducerProperty && item) {
      item = item.get ? item.get(reducerProperty) : item[reducerProperty];
    }
    var ret = (previousValue || 0) + item;
    var len = e.get ? e.get('length') : e.length;
    if (index >= len - 1) ret = ret / len; //avg after last item.
    return ret;
  },

  /**
    Reduces an enumerable to the sum of the items in the enumerable. If
    reducerProperty is passed, it will reduce that property. Otherwise, it will
    reduce the item itself.

    @param {Object} previousValue The previous value in the enumerable
    @param {Object} item The current value in the enumerable
    @param {Number} index The index of the current item in the enumerable
    @param {String} reducerProperty (Optional) The property in the enumerable being reduced

    @returns {Object} reduced value
  */
  reduceSum: function (previousValue, item, index, e, reducerProperty) {
    if (reducerProperty && item) {
      item = item.get ? item.get(reducerProperty) : item[reducerProperty];
    }
    return (previousValue === null) ? item : previousValue + item;
  }
};

Presto.mixin(Presto.Array.prototype, Presto.Reducers, {

  /**
    Retrieves the named value on each member object.  This is more efficient
    than using one of the wrapper methods defined here.  Objects that
    implement SC.Observable will use the get() method, otherwise the property
    will be accessed directly.

    @param {String} key the key to retrieve
    @returns {Array} extracted values
  */
  getEach: function (key) {
    var ret = this.map(function (next) {
      return next ? (next.get ? next.get(key) : next[key]) : null;
    }, this);
    return Presto.Array.create(ret);
  },

  /**
    Sets the value on the named property for each member.  This is more
    efficient than using other methods defined on this helper.  If the object
    implements SC.Observable, the value will be changed to set(), otherwise
    it will be set directly.  null objects are skipped.

    @param {String} key the key to set
    @param {Object} value the object to set
    @returns {Object} receiver
  */
  setEach: function (key, value) {
    this.forEach(function (next) {
      if (next) {
        if (next.set) next.set(key, value);
        else next[key] = value;
      }
    }, this);
    return this;
  },

  /**
    Returns an array with just the items with the matched property.  You
    can pass an optional second argument with the target value.  Otherwise
    this will match any property that evaluates to true.

    Note: null, undefined, false and the empty string all evaulate to false.

    @param {String} key the property to test
    @param {String} value optional value to test against.
    @returns {Array} filtered array
  */
  filterProperty: function (key, value) {
    var len = this.length,
        ret = Presto.Array.create(),
        idx, item, cur;
    // Although the code for value and no value are almost identical, we want to make as many decisions outside
    // the loop as possible.
    if (value === undefined) {
      for (idx = 0; idx < len; idx++) {
        item = this[idx];
        cur = item ? (item.get ? item.get(key) : item[key]) : null;
        if (!!cur) ret.push(item);
      }
    } else {
      for (idx = 0; idx < len; idx++) {
        item = this[idx];
        cur = item ? (item.get ? item.get(key) : item[key]) : null;
        if (cur === value) ret.push(item);
      }
    }
    return ret;
  },

  /**
    Returns an the first item with a property matching the passed value.  You
    can pass an optional second argument with the target value.  Otherwise
    this will match any property that evaluates to true.

    This method works much like the more generic find() method.

    @param {String} key the property to test
    @param {String} value optional value to test against.
    @returns {Object} found item or null
  */
  findProperty: function (key, value) {
    var len = this.length;
    var found = NO, ret = null, next, cur;
    for (var idx = 0; idx < len && !found; idx += 1) {
      next = this[idx];
      cur = next ? (next.get ? next.get(key) : next[key]) : null;
      found = (value === undefined) ? !!cur : cur === value;
      if (found) ret = next;
    }
    next = null;
    return ret;
  },

  /**
    Returns true if the passed property resolves to true for all items in the
    enumerable.  This method is often simpler/faster than using a callback.

    @param {String} key the property to test
    @param {String} value optional value to test against.
    @returns {Boolean} whether every property is the same
  */
  everyProperty: function (key, value) {
    var len = this.length;
    var ret  = true;
    for (var idx = 0;ret && (idx < len);idx++) {
      var next = this[idx];
      var cur = next ? (next.get ? next.get(key) : next[key]) : null;
      ret = (value === undefined) ? !!cur : cur === value;
    }
    return ret;
  },

  get: function (key) {
    var ret = this[key];
    if (ret === undefined) {
      return this.unknownProperty(key);
    }
    if (ret && ret instanceof Function) {
      return ret.call(this, key);
    }
    else return ret;
  },

  unknownProperty: function (key, value) {
    if (value !== undefined) {
      this[key] = value;
    }
    else {
      return this.reducedProperty(key, value);
    }
    return value;
  }

});

Presto.mixin(Presto.Array, {
  create: function () {
    var C = this;

    return new C(arguments);
  }
});


