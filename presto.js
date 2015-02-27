/**
 * @license
 * Presto - A canvas based music notation system
 * Copyright 2015 Maurits Lamers
 *
 * Presto is licensed under the MIT License.
 * Presto uses the Lilypond Emmentaler font, which is licensed under the SIL Open Font License
 * See http://scripts.sil.org/OFL
 *
 * Portions of Presto are from SproutCore Costello, which is also licensed under the MIT license.
 *
 * SproutCore Costello -- Property Observing Library
 * Copyright ©2006-2011, Strobe Inc. and contributors.
 * Portions copyright ©2008-2011 Apple Inc. All rights reserved.
 *
 * ==========================================================================
 * The MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * For more information about SproutCore, visit http://www.sproutcore.com
 *
 * ==========================================================================
 *
 */
/*globals Presto, console*/

/*
 * This file is the base of Presto, and borrows from the runtime framework of SproutCore.
 * SproutCore Costello -- Property Observing Library
 * Copyright ©2006-2011, Strobe Inc. and contributors.
 * Portions copyright ©2008-2011 Apple Inc. All rights reserved.
 * http://www.spoutcore.com
 * http://github.com/sproutcore
 */

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
    var found = false, ret = null, next, cur;
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
  },

  /**
   * Wrapper around splice
   * @param  {Number} index of element to be removed
   * @return {}       the object removed
   */
  removeAt: function (index) { // remove element at a certain index
    return this.splice(index, 1);
  }

});

Presto.mixin(Presto.Array, {
  create: function () {
    var C = this;

    return new C(arguments);
  }
});



/*globals Presto */

Presto.fetaFontInfo = {
  "rests.0" : 0xE100,
  "rests.1" : 0xE101,
  "rests.0o" : 0xE102,
  "rests.1o" : 0xE103,
  "rests.M3" : 0xE104,
  "rests.M2" : 0xE105,
  "rests.M1" : 0xE106,
  "rests.2" : 0xE107,
  "rests.2classical" : 0xE108,
  "rests.3" : 0xE109,
  "rests.4" : 0xE10A,
  "rests.5" : 0xE10B,
  "rests.6" : 0xE10C,
  "rests.7" : 0xE10D,
  "accidentals.sharp" : 0xE10E,
  "accidentals.sharp.arrowup" : 0xE10F,
  "accidentals.sharp.arrowdown" : 0xE110,
  "accidentals.sharp.arrowboth" : 0xE111,
  "accidentals.sharp.slashslash.stem" : 0xE112,
  "accidentals.sharp.slashslashslash.stemstem" : 0xE113,
  "accidentals.sharp.slashslashslash.stem" : 0xE114,
  "accidentals.sharp.slashslash.stemstemstem" : 0xE115,
  "accidentals.natural" : 0xE116,
  "accidentals.natural.arrowup" : 0xE117,
  "accidentals.natural.arrowdown" : 0xE118,
  "accidentals.natural.arrowboth" : 0xE119,
  "accidentals.flat" : 0xE11A,
  "accidentals.flat.arrowup" : 0xE11B,
  "accidentals.flat.arrowdown" : 0xE11C,
  "accidentals.flat.arrowboth" : 0xE11D,
  "accidentals.flat.slash" : 0xE11E,
  "accidentals.flat.slashslash" : 0xE11F,
  "accidentals.mirroredflat.flat" : 0xE120,
  "accidentals.mirroredflat" : 0xE121,
  "accidentals.mirroredflat.backslash" : 0xE122,
  "accidentals.flatflat" : 0xE123,
  "accidentals.flatflat.slash" : 0xE124,
  "accidentals.doublesharp" : 0xE125,
  "accidentals.rightparen" : 0xE126,
  "accidentals.leftparen" : 0xE127,
  "arrowheads.open.01" : 0xE128,
  "arrowheads.open.0M1" : 0xE129,
  "arrowheads.open.11" : 0xE12A,
  "arrowheads.open.1M1" : 0xE12B,
  "arrowheads.close.01" : 0xE12C,
  "arrowheads.close.0M1" : 0xE12D,
  "arrowheads.close.11" : 0xE12E,
  "arrowheads.close.1M1" : 0xE12F,
  "dots.dot" : 0xE130,
  "noteheads.uM2" : 0xE131,
  "noteheads.dM2" : 0xE132,
  "noteheads.sM1" : 0xE133,
  "noteheads.s0" : 0xE134,
  "noteheads.s1" : 0xE135,
  "noteheads.s2" : 0xE136,
  "noteheads.s0diamond" : 0xE137,
  "noteheads.s1diamond" : 0xE138,
  "noteheads.s2diamond" : 0xE139,
  "noteheads.s0triangle" : 0xE13A,
  "noteheads.d1triangle" : 0xE13B,
  "noteheads.u1triangle" : 0xE13C,
  "noteheads.u2triangle" : 0xE13D,
  "noteheads.d2triangle" : 0xE13E,
  "noteheads.s0slash" : 0xE13F,
  "noteheads.s1slash" : 0xE140,
  "noteheads.s2slash" : 0xE141,
  "noteheads.s0cross" : 0xE142,
  "noteheads.s1cross" : 0xE143,
  "noteheads.s2cross" : 0xE144,
  "noteheads.s2xcircle" : 0xE145,
  "noteheads.s0do" : 0xE146,
  "noteheads.d1do" : 0xE147,
  "noteheads.u1do" : 0xE148,
  "noteheads.d2do" : 0xE149,
  "noteheads.u2do" : 0xE14A,
  "noteheads.s0re" : 0xE14B,
  "noteheads.u1re" : 0xE14C,
  "noteheads.d1re" : 0xE14D,
  "noteheads.u2re" : 0xE14E,
  "noteheads.d2re" : 0xE14F,
  "noteheads.s0mi" : 0xE150,
  "noteheads.s1mi" : 0xE151,
  "noteheads.s2mi" : 0xE152,
  "noteheads.u0fa" : 0xE153,
  "noteheads.d0fa" : 0xE154,
  "noteheads.u1fa" : 0xE155,
  "noteheads.d1fa" : 0xE156,
  "noteheads.u2fa" : 0xE157,
  "noteheads.d2fa" : 0xE158,
  "noteheads.s0la" : 0xE159,
  "noteheads.s1la" : 0xE15A,
  "noteheads.s2la" : 0xE15B,
  "noteheads.s0ti" : 0xE15C,
  "noteheads.u1ti" : 0xE15D,
  "noteheads.d1ti" : 0xE15E,
  "noteheads.u2ti" : 0xE15F,
  "noteheads.d2ti" : 0xE160,
  "scripts.ufermata" : 0xE161,
  "scripts.dfermata" : 0xE162,
  "scripts.ushortfermata" : 0xE163,
  "scripts.dshortfermata" : 0xE164,
  "scripts.ulongfermata" : 0xE165,
  "scripts.dlongfermata" : 0xE166,
  "scripts.uverylongfermata" : 0xE167,
  "scripts.dverylongfermata" : 0xE168,
  "scripts.thumb" : 0xE169,
  "scripts.sforzato" : 0xE16A,
  "scripts.espr" : 0xE16B,
  "scripts.staccato" : 0xE16C,
  "scripts.ustaccatissimo" : 0xE16D,
  "scripts.dstaccatissimo" : 0xE16E,
  "scripts.tenuto" : 0xE16F,
  "scripts.uportato" : 0xE170,
  "scripts.dportato" : 0xE171,
  "scripts.umarcato" : 0xE172,
  "scripts.dmarcato" : 0xE173,
  "scripts.open" : 0xE174,
  "scripts.stopped" : 0xE175,
  "scripts.upbow" : 0xE176,
  "scripts.downbow" : 0xE177,
  "scripts.reverseturn" : 0xE178,
  "scripts.turn" : 0xE179,
  "scripts.trill" : 0xE17A,
  "scripts.upedalheel" : 0xE17B,
  "scripts.dpedalheel" : 0xE17C,
  "scripts.upedaltoe" : 0xE17D,
  "scripts.dpedaltoe" : 0xE17E,
  "scripts.flageolet" : 0xE17F,
  "scripts.segno" : 0xE180,
  "scripts.coda" : 0xE181,
  "scripts.varcoda" : 0xE182,
  "scripts.rcomma" : 0xE183,
  "scripts.lcomma" : 0xE184,
  "scripts.rvarcomma" : 0xE185,
  "scripts.lvarcomma" : 0xE186,
  "scripts.arpeggio" : 0xE187,
  "scripts.trill_element" : 0xE188,
  "scripts.arpeggio.arrow.M1" : 0xE189,
  "scripts.arpeggio.arrow.1" : 0xE18A,
  "scripts.trilelement" : 0xE18B,
  "scripts.prall" : 0xE18C,
  "scripts.mordent" : 0xE18D,
  "scripts.prallprall" : 0xE18E,
  "scripts.prallmordent" : 0xE18F,
  "scripts.upprall" : 0xE190,
  "scripts.upmordent" : 0xE191,
  "scripts.pralldown" : 0xE192,
  "scripts.downprall" : 0xE193,
  "scripts.downmordent" : 0xE194,
  "scripts.prallup" : 0xE195,
  "scripts.lineprall" : 0xE196,
  "scripts.caesura.curved" : 0xE197,
  "scripts.caesura.straight" : 0xE198,
  "flags.u3" : 0xE199,
  "flags.u4" : 0xE19A,
  "flags.u5" : 0xE19B,
  "flags.u6" : 0xE19C,
  "flags.u7" : 0xE19D,
  "flags.d3" : 0xE19E,
  "flags.ugrace" : 0xE19F,
  "flags.dgrace" : 0xE1A0,
  "flags.d4" : 0xE1A1,
  "flags.d5" : 0xE1A2,
  "flags.d6" : 0xE1A3,
  "flags.d7" : 0xE1A4,
  "clefs.C" : 0xE1A5,
  "clefs.C_change" : 0xE1A6,
  "clefs.F" : 0xE1A7,
  "clefs.F_change" : 0xE1A8,
  "clefs.G" : 0xE1A9,
  "clefs.G_change" : 0xE1AA,
  "clefs.percussion" : 0xE1AB,
  "clefs.percussion_change" : 0xE1AC,
  "clefs.tab" : 0xE1AD,
  "clefs.tab_change" : 0xE1AE,
  "timesig.C44" : 0xE1AF,
  "timesig.C22" : 0xE1B0,
  "pedal.*" : 0xE1B1,
  "pedal.M" : 0xE1B2,
  "pedal.." : 0xE1B3,
  "pedal.P" : 0xE1B4,
  "pedal.d" : 0xE1B5,
  "pedal.e" : 0xE1B6,
  "pedal.Ped" : 0xE1B7,
  "brackettips.up" : 0xE1B8,
  "brackettips.down" : 0xE1B9,
  "accordion.accDiscant" : 0xE1BA,
  "accordion.accDot" : 0xE1BB,
  "accordion.accFreebase" : 0xE1BC,
  "accordion.accStdbase" : 0xE1BD,
  "accordion.accBayanbase" : 0xE1BE,
  "accordion.accOldEE" : 0xE1BF,
  "rests.M3neomensural" : 0xE1C0,
  "rests.M2neomensural" : 0xE1C1,
  "rests.M1neomensural" : 0xE1C2,
  "rests.0neomensural" : 0xE1C3,
  "rests.1neomensural" : 0xE1C4,
  "rests.2neomensural" : 0xE1C5,
  "rests.3neomensural" : 0xE1C6,
  "rests.4neomensural" : 0xE1C7,
  "rests.M3mensural" : 0xE1C8,
  "rests.M2mensural" : 0xE1C9,
  "rests.M1mensural" : 0xE1CA,
  "rests.0mensural" : 0xE1CB,
  "rests.1mensural" : 0xE1CC,
  "rests.2mensural" : 0xE1CD,
  "rests.3mensural" : 0xE1CE,
  "rests.4mensural" : 0xE1CF,
  "noteheads.slneomensural" : 0xE1D0,
  "noteheads.sM3neomensural" : 0xE1D1,
  "noteheads.sM2neomensural" : 0xE1D2,
  "noteheads.sM1neomensural" : 0xE1D3,
  "noteheads.s0harmonic" : 0xE1D4,
  "noteheads.s2harmonic" : 0xE1D5,
  "noteheads.s0neomensural" : 0xE1D6,
  "noteheads.s1neomensural" : 0xE1D7,
  "noteheads.s2neomensural" : 0xE1D8,
  "noteheads.slmensural" : 0xE1D9,
  "noteheads.sM3mensural" : 0xE1DA,
  "noteheads.sM2mensural" : 0xE1DB,
  "noteheads.sM1mensural" : 0xE1DC,
  "noteheads.s0mensural" : 0xE1DD,
  "noteheads.s1mensural" : 0xE1DE,
  "noteheads.s2mensural" : 0xE1DF,
  "noteheads.s0petrucci" : 0xE1E0,
  "noteheads.s1petrucci" : 0xE1E1,
  "noteheads.s2petrucci" : 0xE1E2,
  "noteheads.svaticana.punctum" : 0xE1E3,
  "noteheads.svaticana.punctum.cavum" : 0xE1E4,
  "noteheads.svaticana.linea.punctum" : 0xE1E5,
  "noteheads.svaticana.linea.punctum.cavum" : 0xE1E6,
  "noteheads.svaticana.inclinatum" : 0xE1E7,
  "noteheads.svaticana.lpes" : 0xE1E8,
  "noteheads.svaticana.vlpes" : 0xE1E9,
  "noteheads.svaticana.upes" : 0xE1EA,
  "noteheads.svaticana.vupes" : 0xE1EB,
  "noteheads.svaticana.plica" : 0xE1EC,
  "noteheads.svaticana.vplica" : 0xE1ED,
  "noteheads.svaticana.epiphonus" : 0xE1EE,
  "noteheads.svaticana.vepiphonus" : 0xE1EF,
  "noteheads.svaticana.reverse.plica" : 0xE1F0,
  "noteheads.svaticana.reverse.vplica" : 0xE1F1,
  "noteheads.svaticana.inner.cephalicus" : 0xE1F2,
  "noteheads.svaticana.cephalicus" : 0xE1F3,
  "noteheads.svaticana.quilisma" : 0xE1F4,
  "noteheads.ssolesmes.incl.parvum" : 0xE1F5,
  "noteheads.ssolesmes.auct.asc" : 0xE1F6,
  "noteheads.ssolesmes.auct.desc" : 0xE1F7,
  "noteheads.ssolesmes.incl.auctum" : 0xE1F8,
  "noteheads.ssolesmes.stropha" : 0xE1F9,
  "noteheads.ssolesmes.stropha.aucta" : 0xE1FA,
  "noteheads.ssolesmes.oriscus" : 0xE1FB,
  "noteheads.smedicaea.inclinatum" : 0xE1FC,
  "noteheads.smedicaea.punctum" : 0xE1FD,
  "noteheads.smedicaea.rvirga" : 0xE1FE,
  "noteheads.smedicaea.virga" : 0xE1FF,
  "noteheads.shufnagel.punctum" : 0xE200,
  "noteheads.shufnagel.virga" : 0xE201,
  "noteheads.shufnagel.lpes" : 0xE202,
  "clefs.vaticana.do" : 0xE203,
  "clefs.vaticana.do_change" : 0xE204,
  "clefs.vaticana.fa" : 0xE205,
  "clefs.vaticana.fa_change" : 0xE206,
  "clefs.medicaea.do" : 0xE207,
  "clefs.medicaea.do_change" : 0xE208,
  "clefs.medicaea.fa" : 0xE209,
  "clefs.medicaea.fa_change" : 0xE20A,
  "clefs.neomensural.c" : 0xE20B,
  "clefs.neomensural.c_change" : 0xE20C,
  "clefs.petrucci.c1" : 0xE20D,
  "clefs.petrucci.c1_change" : 0xE20E,
  "clefs.petrucci.c2" : 0xE20F,
  "clefs.petrucci.c2_change" : 0xE210,
  "clefs.petrucci.c3" : 0xE211,
  "clefs.petrucci.c3_change" : 0xE212,
  "clefs.petrucci.c4" : 0xE213,
  "clefs.petrucci.c4_change" : 0xE214,
  "clefs.petrucci.c5" : 0xE215,
  "clefs.petrucci.c5_change" : 0xE216,
  "clefs.mensural.c" : 0xE217,
  "clefs.mensural.c_change" : 0xE218,
  "clefs.petrucci.f" : 0xE219,
  "clefs.petrucci.f_change" : 0xE21A,
  "clefs.mensural.f" : 0xE21B,
  "clefs.mensural.f_change" : 0xE21C,
  "clefs.petrucci.g" : 0xE21D,
  "clefs.petrucci.g_change" : 0xE21E,
  "clefs.mensural.g" : 0xE21F,
  "clefs.mensural.g_change" : 0xE220,
  "clefs.hufnagel.do" : 0xE221,
  "clefs.hufnagel.do_change" : 0xE222,
  "clefs.hufnagel.fa" : 0xE223,
  "clefs.hufnagel.fa_change" : 0xE224,
  "clefs.hufnagel.do.fa" : 0xE225,
  "clefs.hufnagel.do.fa_change" : 0xE226,
  "custodes.hufnagel.u0" : 0xE227,
  "custodes.hufnagel.u1" : 0xE228,
  "custodes.hufnagel.u2" : 0xE229,
  "custodes.hufnagel.d0" : 0xE22A,
  "custodes.hufnagel.d1" : 0xE22B,
  "custodes.hufnagel.d2" : 0xE22C,
  "custodes.medicaea.u0" : 0xE22D,
  "custodes.medicaea.u1" : 0xE22E,
  "custodes.medicaea.u2" : 0xE22F,
  "custodes.medicaea.d0" : 0xE230,
  "custodes.medicaea.d1" : 0xE231,
  "custodes.medicaea.d2" : 0xE232,
  "custodes.vaticana.u0" : 0xE233,
  "custodes.vaticana.u1" : 0xE234,
  "custodes.vaticana.u2" : 0xE235,
  "custodes.vaticana.d0" : 0xE236,
  "custodes.vaticana.d1" : 0xE237,
  "custodes.vaticana.d2" : 0xE238,
  "custodes.mensural.u0" : 0xE239,
  "custodes.mensural.u1" : 0xE23A,
  "custodes.mensural.u2" : 0xE23B,
  "custodes.mensural.d0" : 0xE23C,
  "custodes.mensural.d1" : 0xE23D,
  "custodes.mensural.d2" : 0xE23E,
  "accidentals.medicaeaM1" : 0xE23F,
  "accidentals.vaticanaM1" : 0xE240,
  "accidentals.vaticana0" : 0xE241,
  "accidentals.mensural1" : 0xE242,
  "accidentals.mensuralM1" : 0xE243,
  "accidentals.hufnagelM1" : 0xE244,
  "flags.mensuralu03" : 0xE245,
  "flags.mensuralu13" : 0xE246,
  "flags.mensuralu23" : 0xE247,
  "flags.mensurald03" : 0xE248,
  "flags.mensurald13" : 0xE249,
  "flags.mensurald23" : 0xE24A,
  "flags.mensuralu04" : 0xE24B,
  "flags.mensuralu14" : 0xE24C,
  "flags.mensuralu24" : 0xE24D,
  "flags.mensurald04" : 0xE24E,
  "flags.mensurald14" : 0xE24F,
  "flags.mensurald24" : 0xE250,
  "flags.mensuralu05" : 0xE251,
  "flags.mensuralu15" : 0xE252,
  "flags.mensuralu25" : 0xE253,
  "flags.mensurald05" : 0xE254,
  "flags.mensurald15" : 0xE255,
  "flags.mensurald25" : 0xE256,
  "flags.mensuralu06" : 0xE257,
  "flags.mensuralu16" : 0xE258,
  "flags.mensuralu26" : 0xE259,
  "flags.mensurald06" : 0xE25A,
  "flags.mensurald16" : 0xE25B,
  "flags.mensurald26" : 0xE25C,
  "timesig.mensural44" : 0xE25D,
  "timesig.mensural22" : 0xE25E,
  "timesig.mensural32" : 0xE25F,
  "timesig.mensural64" : 0xE260,
  "timesig.mensural94" : 0xE261,
  "timesig.mensural34" : 0xE262,
  "timesig.mensural68" : 0xE263,
  "timesig.mensural98" : 0xE264,
  "timesig.mensural48" : 0xE265,
  "timesig.mensural68alt" : 0xE266,
  "timesig.mensural24" : 0xE267,
  "timesig.neomensural44" : 0xE268,
  "timesig.neomensural22" : 0xE269,
  "timesig.neomensural32" : 0xE26A,
  "timesig.neomensural64" : 0xE26B,
  "timesig.neomensural94" : 0xE26C,
  "timesig.neomensural34" : 0xE26D,
  "timesig.neomensural68" : 0xE26E,
  "timesig.neomensural98" : 0xE26F,
  "timesig.neomensural48" : 0xE270,
  "timesig.neomensural68alt" : 0xE271,
  "timesig.neomensural24" : 0xE272,
  "scripts.ictus" : 0xE273,
  "scripts.uaccentus" : 0xE274,
  "scripts.daccentus" : 0xE275,
  "scripts.usemicirculus" : 0xE276,
  "scripts.dsemicirculus" : 0xE277,
  "scripts.circulus" : 0xE278,
  "scripts.augmentum" : 0xE279,
  "scripts.usignumcongruentiae" : 0xE27A,
  "scripts.dsignumcongruentiae" : 0xE27B,
  "dots.dotvaticana" : 0xE27C,
  "0": 0x030,
  "1": 0x031,
  "2": 0x032,
  "3": 0x033,
  "4": 0x034,
  "5": 0x035,
  "6": 0x036,
  "7": 0x037,
  "8": 0x038,
  "9": 0x039
};

Presto.fetaFontMetrics = {}; // will be filled on init and on resize
/*globals Presto*/

/*
Presto.Grob is the basic GRaphical OBject. It provides the basic relative positioning functionality,
as well as the support for containing other grobs.

Relative positioning is done against the parent, where in the end the top grob must have an absolute position.
In order for this to work, every grob has a x and y property, which indicate its relative position to the parent grob.

This system allows for a basic first round of creating a basic layout, which can then be finetuned.
The difficulty of such a system is that the aligning doesn't necessarily can be done through x and y, as that would mean
that everything would be left aligned. The system of music notation only needs horizontal aligning as the vertical position can
In order to deal with this, a grob can contain a align property, which

Because this system is also intended to be edited graphically and filled incrementally, the render phase of the system will create a
new representation in absolutely positioned elements. In order to do this, every grob needs to define its absolute version on the
renderDelegate property. While it is technically not really a render delegate, it is the closest approximation.

The advantage of doing the rendering this way is that grobs don't have to be aware of grobs directly around them.

*/
Presto.mixin({
  /**
   * Positioning modes
   */
  PMODE_RELATIVE: 'relative',
  PMODE_ABSOLUTE: 'absolute',

  _isValidCoordinate: function (c) {
    return (c !== undefined && c !== null);
  }
});


// base class for render delegates
/**
 * Base class for render delegates
 * @extends { Presto.Object }
 */
Presto.GrobRenderDelegate = Presto.Object.extend({
  /**
   * The Renderer gets 4 times a position, being x and y and absX and absY.
   * x and y represent the absolute position the parent thinks this grob should have.
   * relX and relY represent the position relative to the parent.
   * x and y are calculated as the absX + relX and absY + relY.
   * Reason that both are given is that sometimes there are more coordinates which needs moving
   * than just x and y. In normal use you can rely on x and y having the right position, and
   * in specific use, you can use the difference to check out how the rest needs to be moved as well
   * @type {Number}
   */
  x: null,
  y: null,
  relX: null,
  relY: null,

  positioningMode: Presto.PMODE_ABSOLUTE,

  render: function (context) {
    return this;
  }

});

/**
 * Grob, base class for all Graphical Objects
 * @extends {Presto.Object}
 */
Presto.Grob = Presto.Object.extend({
  /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
  x: null,

  /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
  y: null,

  /**
   * The parentGrob of this grob
   * @type {Presto.Grob}
   */
  parentGrob: null,

  /**
   * childGrobs
   * @type {Presto.Array}
   */
  childGrobs: null,

  positioningMode: Presto.PMODE_RELATIVE,

  /**
   * If true, this will cause the rendering process will ignore the width of this grob
   * @type {Boolean}
   */
  ignoreWidth: null, // set to true if width has to be ignored

  /**
   * If true, the rendering process will not render this object, but only its childGrobs if present
   * @type {Boolean}
   */
  isContainer: false, // set to true when the grob should not render anything itself

  /**
   * Properties which need to be copied onto the render delegate
   * @type {Array}
   */
  renderProperties: null,

  /**
   * The default width of a grob is the total of the childgrobs
   * @return {Number} width of the child grobs in pixels, or 0 if none
   */
  width: function () {
    if (!this.childGrobs) return 0;
    var w = this.childGrobs.getEach('width');
    return w.get('@sum');
  },

  /**
   * render on a grob does two things: it will create a render delegate instance of itself (when needed)
   * and it will check whether it has childGrobs and render those as well
   * @param  {Number} refX Parents absX plus the internal xOffset
   * @param  {Number} refY Parents absY
   * @return {Array}       Array containing all the render delegate instances
   */
  render: function (refX, refY) {
    var ret = [];
    if (!Presto._isValidCoordinate(refX) || !Presto._isValidCoordinate(refY)) {
      throw new Error("Presto.Grob#render: invalid parent coordinates detected");
    }
    var curX = this.get('x');
    var curY = this.get('y');
    var absX = curX + refX;
    var absY = curY + refY;

    var xOffset = 0;
    if (this.renderDelegate && !this.isContainer) {
      var baseObj = {
        x: absX,
        y: absY,
        relX: curX,
        relY: curY
      };
      if (this.renderProperties && this.renderProperties instanceof Array) {
        this.renderProperties.forEach(function (rp) {
          baseObj[rp] = this.get(rp);
        }, this);
      }
      ret.push(this.renderDelegate.create(baseObj));
    }
    if (this.childGrobs && this.childGrobs.length > 0) {
      // TODO: it might be necessary to add something to xOffset in case or margins/padding
      //
      // this renders the child grobs, make sure that we adjust the positions properly
      this.childGrobs.forEach(function (cg) {
        ret = ret.concat(cg.render(absX + xOffset, absY));
        // not sure if the line below is a good idea...
        //if (!cg.ignoreWidth) xOffset += cg.get('width');
      });
    }
    return ret;
  },


  renderDelegate: Presto.GrobRenderDelegate,

  /**
   * Adds a childgrob to the current grob
   * @param {Presto.Grob} grob The grob required to be added
   */
  addChildGrob: function (grob) {
    if (!this.childGrobs) this.childGrobs = Presto.Array.create();
    if (!grob.parentGrob) grob.set('parentGrob', this);
    if (grob.x === null) grob.x = 0;
    if (!grob.score) grob.score = this.score;
    if (!grob.staff && this.staff) grob.staff = this.staff;
    this.childGrobs.push(grob);
    return this;
  },

  addChildGrobs: function (grobs) {
    if (grobs && grobs instanceof Array) {
      grobs.forEach(this.addChildGrob, this);
    }
    return this;
  }

});



// A GRaphical OBject: basic element which represents a simple layer of abstraction
// for positioning. It resembles the SproutCore layout hash, but then as an SC.Object
// and with auto-updating functionality
//
// In discussion with publickeating, this design needs to be reviewed.
// Reason is that it is not required to have all properties set at all times.
// - left has no meaning when right + width + right aligned
// - top + right aligned => right, top, width and height are required
//
// so, in the end it seems to be best to have a function called frame which returns the correct
// frame, and have everything (if required) depend on that.
//
// It is important to realize that some issues will remain, as the canvas element (for which
// this grob is intended to work) only has x and y as positioning system.
// What needs to be realized here as well is that this x and y do not necessarily represent the top and left
// of the Grob. For a note specifically, the x and y is the left / middle of the character.
//
// Actually, having observers on the properties is not going to work _ AT ALL _
// The problem being that the observers will only be triggered at the end of the runloop
// which is WAY too late for what we need here... ie something immediate
// So, computed properties would be _MUCH_ better, as they should be direct...
// there is another advantage with computed properties, as we can call them directly internally
// with extra arguments... however, when creating the grob, we cannot do left: 1, right: 1 as that would
// overwrite the computed property...
//
//
// no, much better is a separate function called adjust(prop, value) which we control
// saves all observers...
//
///*global Presto, console*/
// Presto.Grob = Presto.Object.extend({
//   x: null,
//   y: null,
//   height: null,
//   //width: null,
//   marginLeft: 0,
//   marginRight: 0,
//   marginTop: 0,
//   marginBottom: 0,
//   paddingLeft: null,
//   paddingRight: null,
//   paddingTop: null,
//   paddingBottom: null,

//   debugGrob: false, // draw a box with the outer limits of the grob, as well as a box with the margins

//   // the following property values define how the grob
//   // will deal with height and width adjustments.
//   // The default for both is ALIGN_CENTER, which means that:
//   // - when the height is reduced or enlarged, both the top and bottom will be adjusted equally (half of the change value)
//   // - when the width is reduced or enlarged, both left and right will be adjusted equally (half of the change value)
//   // Other supported values are
//   // - SC.ALIGN_LEFT and SC.ALIGN_RIGHT for horizontalAlign
//   //   - When set to SC.ALIGN_LEFT: if width is adjusted, the left value is not touched
//   //   - When set to SC.ALIGN_RIGHT: if width is adjusted, the right value is not touched
//   // - SC.ALIGN_TOP and SC.ALIGN_BOTTOM for verticalAlign
//   //   - When set to SC.ALIGN_TOP: if height is adjusted, the top value is not touched
//   //   - When set to SC.ALIGN_BOTTOM: if height is adjusted, the bottom value is not touched
//   horizontalAlign: SC.ALIGN_CENTER,
//   verticalAlign: SC.ALIGN_CENTER,

//   move: function (key, value) {
//     // function to move the object in a specific direction
//     // if (this._absoluteDisplayProperties.indexOf(key) === -1) {
//     //   console.log("WARNING: using CanvasMusic.Grob#move with margin or padding... Please use set...");
//     //   return this;
//     // }
//     //
//     var v = this.get(key) || 0;
//     return this.set(key, v + value);
//   },

//   positioningMode: null,

//   parentGrob: null, // attach to a parent object

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     if (!this.positioningMode) this.set('positioningMode', CanvasMusic.Grob.PMODE_RELATIVE);
//   },

//   _absoluteDisplayProperties: ['x', 'y', 'height', 'width'],

//   _marginDisplayProperties: ['marginLeft', 'marginRight', 'marginTop', 'marginBottom' ],

//   _paddingDisplayProperties: [ 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'],

//   // this is a way to get the marginRight we have to take into account
//   previousMarginRight: function () {
//     var ret = 0;
//     var prevGrob = this.get('previousGrob');
//     if (prevGrob) ret = prevGrob.get('marginRight');
//     return ret;
//   }.property(),

//   previousGrob: function () {
//     var ret;
//     var parentChildGrobs = this.getPath('parentGrob.childGrobs');
//     if (parentChildGrobs) {
//       var prevIndex = parentChildGrobs.indexOf(this) - 1;
//       if (prevIndex >= 0) {
//         ret = parentChildGrobs.objectAt(prevIndex);
//       }
//     }
//     return ret;
//   }.property(),

//   previousFrame: function () {
//     //var ret = { x: 0, y: 0 };
//     var ret;
//     var prevGrob = this.get('previousGrob');
//     if (prevGrob) ret = prevGrob.get('frame');
//     return ret;
//   }.property(),

//   // frame will always return an absolute positioning
//   // which means a hash with x, y, height, width
//   // consequency also means coercing everything into this pattern
//   //
//   // What possibly goes wrong here is that the frame inside a column depends on all the widths and margins of all previous
//   // items set against the frame of the column.
//   frame: function () {
//     var absProps = this._absoluteDisplayProperties,
//         posMode = this.get('positioningMode'),
//         parentFrame, marginLeft, //prevMarginRight,
//         previousGrob, xOffset, ret = {};

//     //debugger;
//     // the pattern is to take the absolute properties first
//     if (posMode === CanvasMusic.Grob.PMODE_ABSOLUTE) {
//       absProps.forEach(function (p) {
//         ret[p] = this.get(p);
//       }, this);
//     }
//     else { // in relative mode...
//       // meaning that we have to adjust the absolute positions we get from the parent
//       // using the relative properties
//       // add the marginRight of the previous item to the current x position, as well as
//       // our marginLeft
//       //prevMarginRight = this.get('previousMarginRight');
//       marginLeft = this.get('marginLeft') || 0;
//       parentFrame = this.getPath('parentGrob.frame');
//       previousGrob = this.get('previousGrob');
//       var prevFrame;
//       //SC.Logger.log("parent of %@ is a %@, with frame %@".fmt(this, this.get('parentGrob'), SC.inspect(parentFrame)));

//       if (previousGrob) {
//         prevFrame = previousGrob.get('frame');
//         //SC.Logger.log("previousGrob of %@ is a %@ (skipwidth: %@), with frame %@".fmt(this, previousGrob, previousGrob.get('skipWidth'), SC.inspect(prevFrame)));
//       }
//       if (previousGrob && !previousGrob.get('skipWidth')) {
//         // this looks a bit weird, but the problem is that width already contains the previous margin left
//         // as well as the right one, so we need to take it out to prevent it from being counted twice
//         xOffset = prevFrame.x + prevFrame.width - prevFrame.marginLeft; // marginRight is already in the prevFrame.width
//       }
//       else {
//         xOffset = parentFrame.x || 0;
//       }
//       ret.x = xOffset + this.get('x') + marginLeft;
//       ret.y = parentFrame.y + this.get('y');
//       ret.height = this.get('height');
//       ret.width = this.get('width');
//       ret.marginLeft = this.get('marginLeft');
//       ret.marginRight = this.get('marginRight');
//       //ret.widthOfChildGrobs = this.get('widthOfChildGrobs')
//     }
//     if (this.debugGrob) SC.Logger.log("frame of %@ is %@".fmt(this, SC.inspect(ret)));
//     return ret;
//   }.property().cacheable(),

//   // for debugging purposes
//   relativeFrame: function () {
//     var props = this._displayProperties;
//     var ret = {};
//     props.forEach(function (p) {
//       ret[p] = this.get(p);
//     }, this);
//     return ret;
//   }.property(),

//   childGrobs: null,

//   widthOfChildGrobs: function () {
//     if (!this.childGrobs) return 0;
//     var ret = 0;
//     this.childGrobs.forEach(function (g) {
//       var w;
//       if (g.get('skipWidth')) {
//         w = 0;
//       }
//       else if (g.get('childGrobs')) {
//         w = g.get('widthOfChildGrobs');
//       }
//       else w = g.get('width');

//       ret += w + g.get('marginLeft') + g.get('marginRight');
//     });
//     return ret;
//   }.property('numberOfChildGrobs', 'skipWidth').cacheable(),

//   width: function () {
//     // the width of a grob is the width of the contents, and the marginLeft and marginRight
//     if (!this.get('skipWidth')) {
//       return this.get('widthOfChildGrobs') + this.get('marginLeft') + this.get('marginRight');
//     }
//     else return 0;
//   }.property('numberOfChildGrobs', 'marginLeft', 'marginRight', 'skipWidth').cacheable(),

//   autoAdjustOnAdd: false, //

//   addChildGrob: function (g) {
//     if (!this.childGrobs) this.childGrobs = [];
//     if (!g){
//       //SC.warn("CanvasMusic.Grob#addChildGrob: trying to add ")
//       return; // ignore undefined / null / false
//     }

//     if (!g.get('parentGrob')) {
//       g.set('parentGrob', this);
//     }

//     if (!g.get('cm')) {
//       g.set('cm', this.get('cm'));
//     }

//     // we assume that all childgrobs will be in horizontal alignment, unless it is specified
//     if (g.get('x') === null) {
//       if (this.childGrobs.length === 0) {
//         g.set('x', 0);
//         if (g.get('y') === null) g.set('y', 0);
//       }

//       // let's not do this automatically, it goes horribly wrong for vertically stacked things (such as staffs)
//       // because it starts adding up the widths of the staff lines...
//       // perhaps in a configurable way, but not like this...
//       //
//       // else if (this.childGrobs.length > 0 && relativeMode && g.autoAdjustOnAdd) {
//       //   //debugger;
//       //   // there are items in the child grobs, only adjust in relative mode!
//       //   var lastObj = this.childGrobs.lastObject();
//       //   // adjust left to the width + the margin of the last object
//       //   var diff = lastObj.get('width') + lastObj.get('marginLeft') + lastObj.get('marginRight');
//       //   g.move('x', diff);
//       // }
//       //
//     }

//     // if (g.get('width') && relativeMode && !g.skipWidth) {
//     //   this.set('width', this.get('width') + g.get('width'));
//     // }

//     var l = this.childGrobs.push(g);
//     this.set('numberOfChildGrobs', l);
//     return this;
//   },

//   // removeChildGrob: function (g) {
//   //   if (!this.childGrobs) return this;
//   //   // what functionality to provide here exactly?
//   //   // we usually would not have a reference, so a type would be rather more useful...
//   // },

//   // this should be implemented on a grob basis
//   render: function (context) {
//     var cG = this.get('childGrobs');
//     if (cG) {
//       cG.forEach(function (g) {
//         if (!g || !g.render) console.log(g);
//         g.render(context);
//       });
//     }
//     if (this.debugGrob) this._drawDebugFrame(context);
//     return this;
//   },

//   _drawDebugFrame: function (ctx) {
//     //debugger;
//     var origLineWidth = ctx.lineWidth;
//     var origStrokeStyle = ctx.strokeStyle;
//     var frame = this.get('frame');
//     var h = frame.height || 70; // default height
//     //ctx.beginPath();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "blue";
//     ctx.strokeRect(frame.x, frame.y, frame.width, h);
//     ctx.strokeStyle = "red";
//     ctx.strokeRect(frame.x + frame.marginLeft, frame.y, frame.width - frame.marginRight, h);
//     ctx.lineWidth = origLineWidth;
//     ctx.strokeStyle = origStrokeStyle;
//     ctx.font = "9pt Arial";
//     var dbgtext = SC.guidFor(this);
//     var w = frame.x + (frame.width - ctx.measureText(dbgtext).width) / 2;
//     ctx.fillText(dbgtext, w, frame.y);
//   },

//   toString: function () {
//     return "Presto.Grob %@".fmt(SC.guidFor(this));
//   }

// });


/*globals Presto, console*/

Presto.Symbol = Presto.Grob.extend({
  init: function () {
    if (!this.fontSize) {
      //Presto.warn("Presto.Symbol initialized without fontSize property!");
      this.fontSize = this.score.get('fontSize');
    }
    if (this.ignoreWidth) {
      this.width = 0;
    }
    else {
      var metrics = Presto.fetaFontMetrics[this.get('name')];
      if (!metrics) {
        Presto.warn("Presto.Symbol: no metrics found for " + this.name);
        this.width = 0;
      }
      else {
        this.width = metrics.width;
      }
    }
  },

  renderProperties: ['name', 'fontSize'],

  renderDelegate: Presto.GrobRenderDelegate.extend({
    render: function (context) {
      var fontSize = this.get('fontSize');
      var char = Presto.fetaFontInfo[this.get('name')];
      if (!char) Presto.warn("Presto.Symbol: cannot render symbol with unknown name: " + name);
      var font = fontSize + "pt Emmentaler26"; //   ctx.font = "32pt Emmentaler26";
      context.beginPath();
      context.font = font;
      context.fillText(char, this.x, this.y);
    }
  }),

  toString: function () {
    return "CanvasMusic.Symbol %@, name: %@".fmt(SC.guidFor(this), this.get('name'));
  }
});

/*globals Presto*/
Presto.Line = Presto.Grob.extend({
  color: 'black',

  /**
   * Thickness of the line
   * @type {Number}
   */
  lineWidth: null,

  toString: function () {
    return "Presto.Line %@";
  },

  /**
   * toX and toY are the coordinates to be used as end point of the line
   * @type {Number}
   */
  toX: null,
  toY: null,

  /**
   * a line should usually be ignored width wise
   * @type {Boolean}
   */
  ignoreWidth: true,

  renderProperties: ['toX', 'toY', 'lineWidth', 'color'],

  renderDelegate: Presto.GrobRenderDelegate.extend({
    render: function (context) {
      var lw    = this.get('lineWidth'),
          color = this.get('color');

      context.beginPath();
      if (lw) context.lineWidth = lw;
      if (color) context.color = color;
      context.moveTo(this.x, this.y);
      var diffX = this.x - this.relX;
      var diffY = this.y - this.relY;
      context.lineTo(this.toX + diffX, this.toY + diffY);
      context.stroke();
    }
  })
});

// CanvasMusic.Line = CanvasMusic.Grob.extend({
//   // height === thickness
//   //
//   color: 'black',

//   lineWidth: null,

//   toString: function () {
//     return "CanvasMusic.Line %@".fmt(SC.guidFor(this));
//   },

//   render: function (context) {
//     if (this.get('parentGrob').isBarline) debugger;
//     var frame = this.get('frame');
//     var lw = this.get('lineWidth');
//     context.beginPath();
//     if (lw) context.lineWidth = lw;
//     //context.color = this.get('color');

//     var x1 = frame.x, x2 = frame.x + frame.width;
//     var y1 = frame.y, y2 = frame.y + frame.height;

//     context.moveTo(frame.x, frame.y);
//     context.lineTo(frame.x + frame.width, frame.y + frame.height);
//     context.stroke();
//     //console.log("drawning line: " + SC.inspect(frame));
//     //console.log('drawing line from x1: %@, y1: %@, to x2: %@, y2: %@'.fmt(x1, y1, x2, y2));
//     //console.log('lineWidth: ' + lw);
//   }
// });
/*globals Presto */

Presto.mixin({
  STEMDIRECTION_UP: "up",
  STEMDIRECTION_DOWN: "down"
});

/**
 * Presto.Stem is very much a Line, but as it also needs to be able to draw a
 * flag, it is a wrapper around Line.
 * @extends {Presto.Grob}
 */
Presto.Stem = Presto.Grob.extend({
  /**
   * Quack like a duck
   * @type {Boolean}
   */
  isStem: true,

  /**
   * Which flag should be attached to the stem
   * @type {String | null}
   */
  noteFlag: null,

  /**
   * To which horizontal coordinate the line should be drawn
   * @type {Number}
   */
  toX: null,

  /**
   * to which vertical coordinate the line should be drawn
   * @type {Number}
   */
  toY: null,

  /**
   * automatic calculation of the linewidth to use
   * @return {Number} staffsize / 3
   */
  lineWidth: function () {
    return this.score.get('size') / 3;
  },

  /**
   * The note will attach which direction the stem goes, which is important for where to insert the
   * note flag
   * @type {String}
   */
  stemDirection: null,

  init: function () {
    var noteFlag = this.noteFlag;
    var stemDirection = this.stemDirection;
    this.addChildGrob(Presto.Line.create({
      x: 0,
      y: -1,
      toX: 0,
      toY: this.toY,
      lineWidth: this.get('lineWidth')
    }));
    if (noteFlag) {
      this.addChildGrob(Presto.Symbol.create({
        x: 0,
        y: this.toY,
        name: noteFlag
      }));
    }

  }
});

/*globals Presto, console*/


/**
 * Presto.Note is the base class for a note. It contains everything related to a note,
 * including the note head, stem, accidental if necessary and dots
 * @extends { Presto.Grob }
 */
Presto.Note = Presto.Grob.extend({
  /**
   * Quack like a duck
   * @type {Boolean}
   */
  isNote: true,

  /**
   * Name of the note
   * @type {String}
   */
  name: null,

  /**
   * Octave of this note, 1 is first octave after central c
   * @type {Number}
   */
  octave: null,

  /**
   * Basic length of the note, either 1, 2, 4, 8, 16
   * @type {Number}
   */
  length: null,

  /**
   * Amount of dots this note should have
   * @type {Number}
   */
  dots: null,

  /**
   * Should we display a natural?
   * @type {[type]}
   */
  natural: null,

  /**
   * Whether the stem direction should be up or down
   * @type {String}
   */
  stemDirection: null,

  /**
   * default line width for the stem
   * @type {Number}
   */
  stemLineWidth: 2,

  stemUp: function () {
    var stemDirection = this.get('stemDirection');
    if (!stemDirection) this.setDefaultStemDirection();
    return this.stemDirection === Presto.STEMDIRECTION_UP;
  },

  stemDown: function () {
    var stemDirection = this.get('stemDirection');
    if (!stemDirection) this.setDefaultStemDirection();
    return this.stemDirection === Presto.STEMDIRECTION_DOWN;
  },

  /**
   * Sets a default stem direction. Not very intelligent for now.
   * It also sets a stem direction on a whole note, but a whole note doesn't draw its stem
   */
  setDefaultStemDirection: function () {
    if (this.get('positionOnStaff') <= 0 ) {
      this.stemDirection = Presto.STEMDIRECTION_UP;
    }
    else this.stemDirection = Presto.STEMDIRECTION_DOWN;
    this._automaticStem = true; // flag to indicate that the stem was set to a default value
  },

  /**
   * Will flip the stem, will automatically remove the stem and re add it
   * @return {Presto.Note} this
   */
  flipStem: function () {
    if (this.get('stemUp')) this.stemDirection = Presto.STEMDIRECTION_DOWN;
    else this.stemDirection = Presto.STEMDIRECTION_UP;
    this.removeStem();
    this.addStem();
    return this;
  },

  /**
   * Hide the stem, false by default
   * @type {Boolean}
   */
  hideStem: false,

  /**
   * The staff to which this note belongs should be here
   * @type {Presto.Staff}
   */
  parentStaff: null,

  /**
   * When the staff sets the vertical offset, it will also set the position here
   * The position is 0 for middle, positive for lower, negative for higher.
   * The number is set in staffSpace units (which is half the distance between two staff lines)
   * @type {Number}
   */
  positionOnStaff: null,

  /**
   * Returns the root of the tone, name without accidentals
   * @return {String} root name of the tone
   */
  rootTone: function () {
    return this.get('name')[0];
  },

  /**
   * The width of a note is the width of its children
   * @return {Number} [Width in pixels]
   */
  width: function () {
    var ret = 0;
    // this is not as easy as it looks
    // the width of a note is
    // the smallest x value (which can either be negative, zero or positive)
    // until the biggest x value...
    var smallest = 0, biggest = 0;
    this.childGrobs.forEach(function (cg) {
      if (!cg.ignoreWidth) {
        var w = cg.get('width');
        var x = cg.get('x');
        if (x < smallest) smallest = x;
        var sum = x + w;
        if (sum > biggest) biggest = sum;
      }
    });
    ret = Math.abs(smallest) + biggest;
    return ret;
    // // the width of a grob is the width of the contents, and the marginLeft and marginRight
    // var ret = this.get('marginLeft') + this.get('marginRight');
    // if (!this.get('skipWidth')) {
    //   ret += this.get('widthOfChildGrobs');
    // }
    // return ret;
  },

  /**
   * Returns the note head type for this note
   * @return {String} character name for the note head
   */
  noteHead: function () { // can be overridden or extended if required
    var l = this.get('length');
    switch (l) {
      case 1:
        return "noteheads.s0"; // whole,
      case 2:
        return "noteheads.s1"; // half
      case 4:
        return "noteheads.s2"; // quarter
      case 8:
        return "noteheads.s2"; // quarter
      case 16:
        return "noteheads.s2"; // quarter
      default:
        throw new Error("Presto.Note#noteHead: Invalide length value");
    }
  },

  /**
   * Returns the type of note flag this note requires
   * @return {String | Boolean} character name of note flag, or false if none needed
   */
  noteFlag: function () {
    var l = this.get('length');
    var stemDirection = this.get('stemDirection');
    if (l < 8) return false;
    else {
      if (stemDirection === Presto.STEMDIRECTION_UP) {
        if (l === 8) return "flags.u3";
        if (l === 16) return "flags.u4";
      }
      if (stemDirection === Presto.STEMDIRECTION_DOWN) {
        if (l === 8) return "flags.d3";
        if (l === 16) return "flags.d4";
      }
    }
  },

  /**
   * Calculate from the name whether this note has an accidental.
   *
   * @return {String|Boolean} false if none, otherwise it returns the character name
   */
  accidentalName: function (){
    // we need a system to look up which accidentals can be left out, because they either appear already
    // in the bar, or they are part of the key.
    // there also needs to be a forced natural / forced accidental
    // For now, simple deduction from the name
    var name = this.get('name'),
        glyphName = false;
    if (name.indexOf("is") > -1) { // something with sharp
      glyphName = (name.indexOf("sis") > -1) ? 'accidentals.doublesharp' : 'accidentals.sharp';
    }
    else if (name.indexOf("s") > -1 || name.indexOf("es") > -1) { // we have flat
      glyphName = (name.indexOf("ses") > -1 || name.indexOf("sas") > -1) ? 'accidentals.flatflat' : 'accidentals.flat';
    }
    return glyphName;
  },

  /**
   * If a note has an accidental, the grob containing the accidental is put here in order for the note column
   * to make adjustments
   * @type {Presto.Symbol}
   */
  accidental: null,

  /**
   * Adds the accidental to the current note, if required
   */
  addAccidental: function () {
    var name = this.get('name'),
        size = this.get('size'),
        whichAcc = this.get('accidentalName'),
        acc;

    if (!whichAcc) return this;
    acc = Presto.Symbol.create({
      x: 0,
      y: 0,
      name: whichAcc,
      score: this.score,
      staff: this.staff
    });
    acc.x = -acc.get('width') / 2;
    this.accidental = acc;
    this.addChildGrob(acc);
    return this;
  },

  init: function () {
    if (this.isPlaceholder) return;
    // the init runs the adding procedure in the same order as the elements are going to appear
    this.addAccidental();
    this.addHelperLines(); // helper lines first, as they need to be overwritten
    this.addNoteHead();
    this.addStem();
  },

  /**
   * This function updates the layout of the note. Required because some elements can only be done after the
   * note object exists (adding the helper lines for example)
   */
  update: function () {
    // for now, we remove the childGrobs and rerun init,
    // rewrite if it turns out to be a bottle neck performance wise
    this.childGrobs = null;
    this.init();
  },

  addNoteHead: function () {
    var noteHead = this.get('noteHead');
    // y is set to zero, as the note object itself is already at the right vertical offset
    var symbol = Presto.Symbol.create({
      staff: this.staff,
      score: this.score,
      name: noteHead,
      fontSize: this.score.get('fontSize'),
      x: 0,
      y: 0
    });
    this._noteHeadWidth = symbol.get('width');
    this.addChildGrob(symbol);
  },

  /**
   * private variable which is set by addNoteHead. The width of the notehead is used in a few calculations
   * such as determining the width of the helper lines (also note column uses it)
   * @type {Number}
   */
  _noteHeadWidth: null,

  /**
   * Function to add the helper lines to the note
   * The data on the helper lines has already been added by the noteColumn
   */
  addHelperLines: function () {
    var helperLines = this.helperLines;
    if (!helperLines) return; // nothing to do

    var helperLineWidth = this._noteHeadWidth / 8;

    helperLines.forEach(function (l) {
      this.addChildGrob(Presto.Line.create({
        x: -helperLineWidth,
        y: l.y,
        toX: (this._noteHeadWidth / 2) + helperLineWidth,
        toY: l.y,
        lineWidth: 2
      }));
    }, this);
  },

  /**
   * Function to add a stem to the current note
   * This is very naive, assumes 5 lines:
   * below the five lines and positions
   *             --  -6
   * --------------- -4
   * --------------- -2
   * ---------------  0
   * ---------------  2
   * ---------------  4
   *
   *
   * Rules are:
   *   - the line starts at (0, 0), being the starting point of the note head
   *   - the length depends on the position on the staff:
   *   - with the stem down:
   *     - notehead is at pos > 4: length is 2 staff spaces
   *     - notehead is at (pos <= 4 && pos >= 0): interpolation (?)
   *     - notehead is at (pos < 0 && pos >= -7): 3 staff spaces
   *     - notehead is at pos < -7: length is pos(0) - notehead position
   *   - with the stem up: reversed (horizontal mirror)
   */
  addStem: function () {
    if (this.get('hideStem')) return; // nothing to do
    if (this.get('length') < 2) return; // longer than a half note, no stem
    var pos = this.get('positionOnStaff');
    var staff = this.staff;
    var staffSpace = this.score.get('size');
    var stemUp = this.get('stemUp');
    var stemLength;

    if (stemUp) pos *= -1 ;

    if (pos > 4) { // this implementation uses 5 staff spaces, because it looks a bit better
      stemLength = staff.calculateVerticalOffsetFor(pos + 5) - staff.calculateVerticalOffsetFor(pos);
    }
    else if (pos <= 4 && pos >= 0) {
      // not entirely happy with the outcome, as there is still a bit of a jump between the last one here
      // and the first one of the next series
      stemLength = staff.calculateVerticalOffsetFor(pos + 5) - staff.calculateVerticalOffsetFor(pos);
      stemLength += staffSpace * (7/6 - (1/6 * pos));
    }
    else if (pos < 0 && pos > -7) {
      stemLength = staff.calculateVerticalOffsetFor(pos + 7) - staff.calculateVerticalOffsetFor(pos);
    }
    else {
      stemLength = staff.calculateVerticalOffsetFor(0) - staff.calculateVerticalOffsetFor(pos);
    }

    // the x position of the stem upwards doesn't nicely fit with noteheadwith / 2, and needs
    // a correction, which is now half a staff space, but it is not sure this will hold up
    // when scaling.
    var startX = stemUp ? (this._noteHeadWidth / 2) - (staffSpace / 2): this.x;
    var toY = stemUp ? stemLength * -1 : stemLength;

    this.addChildGrob(Presto.Stem.create({
      x: startX + 1, // offset to the right for stem
      y: stemUp? -1: 1,
      toX: startX + 1,
      toY: toY, // perhaps here -1 to offset the -1 or +1 at y?
      score: this.score,
      staff: this.staff,
      stemDirection: this.get('stemDirection'),
      noteFlag: this.get('noteFlag')
    }));

  },

  /**
   * To remove the stem from the note object. This can happen when notes are combined in a note column
   * in case this is a bottleneck, it can be simplyfied
   */
  removeStem: function () {
    var i = this.childGrobs.indexOf(this.childGrobs.findProperty('isStem'));
    this.childGrobs.removeAt(i);
  }

});

Presto.mixin(Presto.Note, {

  // all kinds of calculations with notes, such as intervals etc
  // use note instances if possible (?)

  _noteNames: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],

  /**
   * Calculates the distance between two notes diatonically. Zero based.
   * @param  {Presto.Note} noteOne First note
   * @param  {Presto.Note} noteTwo Second note
   * @return {Number}         Zero-based distances between notes
   */
  distanceBetween: function (noteOne, noteTwo) {
    if (!noteOne.isNote || !noteTwo.isNote) {
      throw new Error ("Presto.Note.distanceBetween: Please use note instances");
    }
    var nn = this._noteNames;
    var firstNote = noteOne.get('rootTone');
    var secondNote = noteTwo.get('rootTone');

    var noteDist = nn.indexOf(firstNote) - nn.indexOf(secondNote);
    var octDist = noteOne.get('octave') - noteTwo.get('octave');
    // for some reason I have to reverse the solution to be correct
    return (noteDist + (nn.length * octDist)) * -1;
  },

  /**
   * Returns the interval between two notes, name based. This means that a prime is 1 and an octave is 8
   * @param  {Presto.Note} noteOne first note
   * @param  {Presto.Note} noteTwo second note
   * @return {Number}         Number describing the interval
   */
  intervalBetween: function (noteOne, noteTwo) {
    //if (noteOne.get('noteId') === noteTwo.get('noteId')) return 1; // fast path for primes
    var dist = this.distanceBetween(noteOne, noteTwo); // solve the off by one for intervals
    if (dist > 0) dist += 1;
    if (dist < 0) dist -= 1;
    return dist;
  },

  /**
   * Allows checking whether the given note name is a valid name for a note
   * @param  {String}  name note name
   * @return {Boolean}      Whether the note name fits anything recognized as a note
   */
  isValidNoteName: function (name) {
    var notenames = Presto.Note._noteNames;
    var exts = ['is','es','s'], ext;
    if (name) {
      if (notenames.indexOf(name[0]) > -1) {
        ext = name.slice(1);
        if (ext.length === 0) return true; // single note name
        if (exts.indexOf(name.slice(1)) > -1) return true;
      }
    }
    return false;
  },

  /**
   * validates the hash to be a note hash
   * @param  {Hash}  h hash to be tested
   * @return {Boolean}   does the hash describe a note?
   */
  isNoteHash: function (h) {
    if (h.name && h.octave !== undefined && h.length) {
      if (Presto.Note.isValidNoteName(h.name)) {
        return true;
      }
    }
    return false;
  }
});


// /*globals CanvasMusic, console */

// // A note consists of a few elements
// // - (possibly) an accidental
// // - a noteShape with:
// //   - stem (possibly)
// //   - helper lines (possibly)
// //   - note head

// CanvasMusic.Note = CanvasMusic.Grob.extend({
//   isNote: true, // quack like a duck

//   name: null, // note name (c-b, cis - bis, ces - bes etc)
//   octave: null, // in which octave this note exists
//   length: null, // which length? 1, 2, 4, 8, 16 (we could perhaps support brevis as 1/2 and longa as 1/4)?
//   dots: null, // how many dots this note should have
//   natural: null, // should the note display a natural accidental?
//   stemUp: null, // does this note have the stem up?
//   stemDown: null, // does this note have the stem down?
//   hideStem: null, // should this note hide its stem?
//   markup: null, // do we have markup on this note?
//   markupAlign: SC.ALIGN_CENTER, // default markup is centered
//   markupDown: false,
//   marginLeft: null,
//   marginRight: null,

//   _debugNote: false,
//   //debugGrob: true,

//   // if the note is not to be drawn but used as a container for note information, isPlaceholder
//   // should be set to true
//   isPlaceholder: false,

//   // what is the parent staff of this note... Pretty important as we will need to look up things
//   // such as what height we are related to the staff, as we need to lengthen the stem accordingly
//   parentStaff: null,

//   cm: null, // hook for the canvas music instance

//   init: function () {
//     // should determine a few things, such as stem length
//     // essentially sets up the basic list of childGrobs
//     arguments.callee.base.apply(this, arguments);
//     this._defaultMargin = this.getPath('cm.size') / 2;
//     this.marginLeft = this.marginRight = this._defaultMargin;
//     // we first calculate which direction the stem needs to be as it determines what comes first
//     // the notehead or the stem
//     if (!this.isPlaceholder) { // only calculate when actually used for display
//       this.calculateNote(); // will also do the stem
//     }
//     if (this._debugNote) {
//       //window.NOTE = this;
//     }
//   },

//   width: function () {
//     // the width of a grob is the width of the contents, and the marginLeft and marginRight
//     var ret = this.get('marginLeft') + this.get('marginRight');
//     if (!this.get('skipWidth')) {
//       ret += this.get('widthOfChildGrobs');
//     }
//     return ret;
//   }.property(),

//   noteHeadLeft: null, // set by the note rendering process, for aligning purposes...

//   // API stuff
//   noteId: function () {
//     var n = this.get('name'), o = this.get('octave');
//     if (!n) throw new Error("CanvasMusic.Note: a note without a name??" + SC.inspect(this));
//     //return n[0] + o;
//     return n + o;
//   }.property('name', 'octave').cacheable(),

//   // give back the root tone, without any accidentals
//   rootTone: function () {
//     return this.get('name')[0];
//   }.property('name').cacheable(),

//   noteHead: function () { // can be overridden or extended if required
//     var l = this.get('length');
//     if (l === 1) {
//       return "noteheads.s0"; // whole
//     }
//     else if (l === 2) {
//       return "noteheads.s1"; // half
//     }
//     else {
//       return "noteheads.s2"; // quarter
//     }
//   }.property('length').cacheable(),

//   noteFlag: function () {
//     var l = this.get('length');
//     var stemUp = this.get('stemUp');
//     var stemDown = this.get('stemDown');
//     if (l < 8) return false;
//     else {
//       if (stemUp) {
//         if (l === 8) return "flags.u3";
//         if (l === 16) return "flags.u4";
//       }
//       if (stemDown) {
//         if (l === 8) return "flags.d3";
//         if (l === 16) return "flags.d4";
//       }
//     }
//   }.property('length').cacheable(),

//   flipStem: function () {
//     if (this.get('stemUp')) {
//       this.set('stemUp', false);
//       this.set('stemDown', true);
//     }
//     else {
//       this.set('stemDown', false);
//       this.set('stemUp', true);
//     }
//     // recalculation of the note creates problem if the stem is flipped mid-column stack...
//     // so, instead of recalculation, we better simply reverse the order, and recalculate the stem
//     // here...
//     // or should we recalculate after all, save the offsets first, then reapply?

//     var marginLeft = this.marginLeft;
//     // var nS = this.get('noteShape');
//     var noteShapeMarginLeft = this.getPath('noteShape.marginLeft');
//     var isShifted = this.get('isShifted');
//     this.childGrobs.forEach(function (cg) { cg.destroy(); });
//     this.set('childGrobs', []); // should also reset noteShape computed property
//     var noteHeadLeft = this.noteHeadLeft; // save as calculateNote resets it
//     this.calculateNote();
//     // now reapply
//     this.set('noteHeadLeft', noteHeadLeft);
//     this.set('marginLeft', marginLeft);
//     var newNS = this.get('noteShape');
//     // if (newNS === nS) SC.Logger.log("WARNING: noteShape property did not refresh properly? %@, %@".fmt(SC.guidFor(nS), SC.guidFor(newNS)));
//     this.set('isShifted', isShifted);
//     newNS.set('marginLeft', noteShapeMarginLeft);
//     //

//     //
//     //
//     // // in both cases, recalculate the note
//     // this.childGrobs.forEach(function (cg) { cg.destroy(); });
//     // this.childGrobs = [];
//     // var noteHeadLeft = this.noteHeadLeft; // save as calculateNote resets it
//     // this.calculateNote();
//     // this.noteHeadLeft = noteHeadLeft; // replace for now... perhaps some intelligent replacement later...
//     return this;
//   },

//   // function which both
//   removeStem: function () {
//     this.noStem = true;
//     //console.log('removeStem!');
//     var cg = this.get('childGrobs').findProperty('isNoteShape').get('childGrobs');
//     cg.removeObject(cg.findProperty('isStem', true));
//     return this;
//   },

//   calculateAccidental: function(){
//     var name = this.get('name');
//     var size = this.getPath('cm.size');
//     var noteTop = this.get('parentStaff').verticalOffsetFor(this);
//     var acc;
//     var mix = { cm: this.get('cm'), y: noteTop, parentGrob: this };
//     var glyphName;

//     if(name.indexOf("is") > -1){ // something with sharp
//       glyphName = (name.indexOf("sis") > -1) ? 'accidentals.doublesharp' : 'accidentals.sharp';
//     }
//     else if(name.indexOf("s") > -1 || name.indexOf("es") > -1) { // we have flat
//       glyphName = (name.indexOf("ses") > -1 || name.indexOf("sas") > -1) ? 'accidentals.flatflat' : 'accidentals.flat';
//     }
//     if (this.get('natural')) { //add natural first
//       acc = CanvasMusic.Symbol.create(mix, {
//         name: 'accidentals.natural',
//         marginLeft: 0,
//         marginRight: 4,
//         isAccidental: true,
//         //debugGrob: true
//       });
//       this.addChildGrob(acc);
//       this.noteHeadLeft += acc.get('width');
//       if (!this.hasAccidental) this.hasAccidental = true;
//     }
//     if (glyphName) {
//       acc = CanvasMusic.Symbol.create(mix, {
//         name: glyphName,
//         marginLeft: 0,
//         marginRight: 4,
//         isAccidental: true,
//         //debugGrob: true
//       });
//       this.addChildGrob(acc);
//       this.noteHeadLeft += acc.get('width');
//       if (!this.hasAccidental) this.hasAccidental = true;
//     }
//   },

//   calculateStemDirection: function(){
//     var index;
//     // stem direction already defined, nothing to do, except make sure that they are both set.
//     if (this.get('stemUp') || this.get('stemDown')) {
//       if (this.get('stemUp')) this.set('stemDown', false);
//       if (this.get('stemDown')) this.set('stemUp', false);
//       return;
//     }
//     index = this.get('parentStaff').indexFor(this);
//     // yes this will also set a stem on a whole note, but it is ignored
//     //if (index <= CanvasMusic.Staff.MIDDLENOTE_INDEX) { // indexes above the middle note are negative
//     if (index <= this.getPath('parentStaff.middleNoteIndex')) {
//       this.set('stemUp', true).set('stemDown', false);
//     }
//     else {
//       this.set('stemDown', true).set('stemUp', false);
//     }
//     this._automaticStem = true;
//   },

//   noteShape: function () {
//     return this.get('childGrobs').findProperty('isNoteShape');
//   }.property('childGrobs').cacheable(),

//   stemLength: function () {
//     //debugger;
//     var pS = this.get('parentStaff');
//     var size = pS.get('size');
//     var absNotePos = pS.absoluteStaffPositionFor(this);
//     var staffTopPosition = pS.get('staffTopPosition');
//     var staffBottomPosition = pS.get('staffBottomPosition');
//     var stemUp = this.get('stemUp');
//     var stemDown = this.get('stemDown');
//     var firstLine = staffBottomPosition + 1;
//     var thirdLine = staffBottomPosition + 5;
//     var noteTop = pS.verticalOffsetFor(this);

//     var stemIsShort = (stemDown && absNotePos < firstLine) || (stemUp && absNotePos > staffTopPosition);
//     var stemIsFixed = (stemDown && absNotePos > (staffTopPosition + 2)) || (stemUp && (absNotePos < staffBottomPosition - 2));
//     var stemIsIncreasing = !stemIsShort && ((stemDown && absNotePos <= thirdLine) || (stemUp && absNotePos >= thirdLine));
//     // is steady is anything else
//     var stemLength;

//     if (stemIsShort) stemLength = 2.2 * size;
//     else if (stemIsFixed) { // top is the 3rd line, the height is the difference between the current note y
//       stemLength = Math.abs(noteTop - pS.topOfStaffLineFor(pS.get('numberOfLines') - 2));
//     }
//     else if (stemIsIncreasing) stemLength = (2.2 + (1/5*absNotePos)) * size;
//     else {
//       stemLength = 3.2 * size;
//     }
//     return stemLength;
//   }.property('stemUp','stemDown').cacheable(),

//   calculateNote: function () {
//     // the rules for the stem:
//     // - when the stem is down
//     //    - when the note is lower than the first line, it is two long
//     //    - until the note reaches the third line, the length is interpolated between two and three
//     //    - until the note is one step above the first helper line, the length is three staff lines
//     //    - when the note is more than one step above the first helper line (which is staffTop + 2), the bottom is always the
//     //      second line from above (numberOfLines - 2)
//     // - when the stem is up
//     //   exactly the same as when the stem is down, but then in reverse (horizontal mirror)
//     // So: four groups:
//     // - short
//     // - increasing
//     // - steady
//     // - fixedToStaff
//     //

//     this.noteHeadLeft = 0; //we should not reset noteHeadLeft
//     this.calculateAccidental();
//     this.calculateStemDirection();

//     var pS = this.get('parentStaff'),
//         size = pS.get('size'),
//         stemDown = this.get('stemDown'),
//         noteTop = pS.verticalOffsetFor(this),
//         noteFlag = this.get('noteFlag'),
//         // numberOfHelperLine returns -1 for one line under the staff, 1 for one line above the staff
//         numberOfHelperLines = pS.numberOfHelperLinesFor(this),
//         numDots = this.get('dots'),
//         stemLength = this.get('stemLength'),
//         staffTopPosition = pS.topOfStaffLineFor(pS.get('numberOfLines')),
//         staffBottomPosition = pS.topOfStaffLineFor(1),
//         mix = { cm: this.get('cm') },
//         i, noteHeadSymbol, noteHeadWidth, helperLineWidth, helperLineOffset = 0;

//     var noteShape = CanvasMusic.Grob.create(mix, {
//       isNoteShape: true,
//       parentGrob: this,
//       //debugGrob: true,
//       marginLeft: 0,
//       toString: function () {
//         return "CanvasMusic.NoteShape %@, id: %@".fmt(SC.guidFor(this), this.parentGrob.get('noteId'));
//       }
//     });

//     noteHeadSymbol = CanvasMusic.Symbol.create(mix, {
//       name: this.get('noteHead'),
//       parentGrob: noteShape,
//       isNoteHead: true,
//       y: noteTop
//     });
//     noteHeadWidth = noteHeadSymbol.get('width');

//     if (numberOfHelperLines !== 0) { // there are helper lines
//       // we need to extend the staff lines, so we take the parentStaff line values and add size
//       helperLineWidth = noteHeadWidth * 1.85;
//       helperLineOffset = (helperLineWidth - noteHeadWidth) / 2;
//       this._helperLineOffset = helperLineOffset;
//       if (numberOfHelperLines > 0) { // above the staff
//         for (i = 0; i < numberOfHelperLines; i += 1) {
//           noteShape.addChildGrob(CanvasMusic.Line.create(mix, {
//             parentGrob: noteShape,
//             marginLeft: -helperLineOffset,
//             marginRight: helperLineOffset,
//             y: staffTopPosition - (size * (i + 1)) + ((i+1) * pS.get('staffLineThickness')),
//             width: helperLineWidth,
//             skipWidth: true,
//             isHelperLine: true
//           }));
//         }
//       }
//       else { // under the staff
//         for (i = 0; i > numberOfHelperLines; i -= 1) {
//           noteShape.addChildGrob(CanvasMusic.Line.create(mix, {
//             parentGrob: noteShape,
//             y: staffBottomPosition + (size * (Math.abs(i) + 1)) + ((i-1) * pS.get('staffLineThickness')),
//             marginLeft: -helperLineOffset,
//             marginRight: helperLineOffset,
//             width: helperLineWidth,
//             lineWidth: pS.get('staffLineThickness'),
//             skipWidth: true,
//             isHelperLine: true
//           }));
//         }
//       }
//       //noteHeadSymbol.move('marginLeft', helperLineOffset);
//     }

//     if (stemDown) { // stem comes first
//       if (this.get('length') > 1 && !this.get('noStem')) {
//         noteShape.addChildGrob(CanvasMusic.Stem.create(mix, {
//           parentGrob: noteShape,
//           y: noteTop + size * 0.2,
//           height: stemLength,
//           noteFlag: noteFlag,
//           parentStaff: pS,
//           stemIsDown: true,
//           skipWidth: true,
//         }));
//         noteShape.height = stemLength;
//       }
//       noteShape.addChildGrob(noteHeadSymbol);
//     }
//     else { // stem up, notehead first
//       noteShape.addChildGrob(noteHeadSymbol);
//       if (this.get('length') > 1 && !this.get('noStem')) {
//         noteShape.addChildGrob(CanvasMusic.Stem.create(mix, {
//           y: noteTop - 1,
//           stemIsUp: true,
//           height: -stemLength,
//           noteFlag: noteFlag,
//           parentStaff: pS,
//           skipWidth: true
//         }));
//         noteShape.height = stemLength;
//       }
//     }

//     if (numDots && numDots > 0) {
//       for (i = 0; i < numDots; i += 1) {
//         noteShape.addChildGrob(CanvasMusic.Symbol.create(mix, {
//           parentGrob: noteShape,
//           y: noteTop,
//           marginLeft: (noteHeadWidth * (0.3 * (i + 1))),
//           name: "dots.dot",
//           autoAdjustOnAdd: true
//         }));
//       }
//     }
//     this.addChildGrob(noteShape);
//   },

//   moveNote: function (amount) {
//     var a = amount || 0;
//     this.get('noteShape').move('marginLeft', a);
//     this.noteHeadLeft += a;
//     return this;
//   },

//   // shift note exists for the column to move the note shape inside a chord.
//   //
//   //in some cases the column needs to be able to tell the note how much to move, for example
//   //if the note in front has an accidental, this note should move more than its own length
//   shiftNote: function (amount) {
//     var noteShape = this.get('noteShape');

//     amount = amount || noteShape.get('width');
//     noteShape.move('marginLeft', amount);
//     this.noteHeadLeft += amount;
//     this.isShifted = true;
//     return this;
//   },

//   unshiftAccidentals: function () {
//     var accidentals = this.childGrobs.filterProperty('isAccidental');
//     accidentals.forEach(function (a) {
//       var w = a.get('width') / 2;
//       a.move('marginLeft', -w);
//       a.move('marginRight', w);
//     }, this);
//   },

//   toString: function () {
//     return "CanvasMusic.Note %@, id: %@".fmt(SC.guidFor(this), this.get('noteId'));
//   }

//   // calculateStem: function () {
//   //   if(note.length > 1 && !note.noStem){ // only draw stem if required
//   //     if(note.stemUp){
//   //       switch(note.length){
//   //         case 2:
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.66, from_y: note.y + 10*scaleSize,
//   //             to_x: note.x + this.size * 0.66, to_y: note.y - 31*scaleSize
//   //           });
//   //           break;
//   //         case 8:
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.6, from_y: note.y + 10*scaleSize,
//   //             to_x: note.x + this.size * 0.6, to_y: note.y - 35*scaleSize
//   //           });
//   //           ret.push({
//   //             type: "flags_eight_up",
//   //             x: note.x + this.size * 0.4,
//   //             y: note.y-35
//   //           });
//   //           break;
//   //         case 16:
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.6, from_y: note.y + 10*scaleSize,
//   //             to_x: note.x + this.size * 0.6, to_y: note.y - 35*scaleSize
//   //           });
//   //           ret.push({
//   //             type: "flags_sixteen_up",
//   //             x: note.x + this.size * 0.45, y: note.y - 35
//   //           });
//   //           break;
//   //         default:  // other cases
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.6, from_y: note.y + 10*scaleSize,
//   //             to_x: note.x + this.size * 0.6, to_y: note.y - 31*scaleSize
//   //           });
//   //           break;
//   //       }
//   //     }
//   //     else if(note.stemDown){
//   //       switch(note.length){
//   //         case 8:
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.2, from_y: note.y + 13*scaleSize,
//   //             to_x: note.x + this.size * 0.2, to_y: note.y + 58*scaleSize
//   //           });
//   //           ret.push({
//   //             type: "flags_eight_down",
//   //             x: note.x + this.size * 0.09, y: note.y + 15
//   //           });
//   //           break;
//   //         case 16:
//   //           ret.push({
//   //             type: "line",
//   //             lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.2, from_y: note.y + 13*scaleSize,
//   //             to_x: note.x + this.size * 0.2, to_y: note.y + 58*scaleSize
//   //           });
//   //           ret.push({
//   //             type: "flags_sixteen_down",
//   //             x: note.x + this.size * 0.09, y: note.y +15
//   //           });
//   //           break;
//   //         default:
//   //           ret.push({
//   //             type: "line", lineWidth: 1.8 * scaleSize,
//   //             from_x: note.x + this.size * 0.2, from_y: note.y + 13*scaleSize,
//   //             to_x: note.x + this.size * 0.2, to_y: note.y + 52*scaleSize
//   //           });
//   //           break;
//   //       }
//   //     }
//   //   }
//   // }

// });

// SC.mixin(CanvasMusic.Note, {
//   // all kinds of calculations with notes, such as intervals etc
//   // use note instances if possible (?)

//   _noteNames: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],

//   distanceBetween: function (noteOne, noteTwo) {
//     if (!SC.instanceOf(noteOne, CanvasMusic.Note) || !SC.instanceOf(noteTwo, CanvasMusic.Note)) {
//       throw new Error ("CanvasMusic.Note.distanceBetwee: Please use note instances instead");
//     }
//     var nn = this._noteNames;
//     var firstNote = noteOne.get('rootTone');
//     var secondNote = noteTwo.get('rootTone');

//     var noteDist = nn.indexOf(firstNote) - nn.indexOf(secondNote);
//     var octDist = noteOne.get('octave') - noteTwo.get('octave');
//     // for some reason I have to reverse the solution to be correct
//     return (noteDist + (nn.length * octDist)) * -1;
//   },

//   intervalBetween: function (noteOne, noteTwo) {
//     if (noteOne.get('noteId') === noteTwo.get('noteId')) return 1; // fast path for primes
//     var dist = this.distanceBetween(noteOne, noteTwo); // solve the off by one for intervals
//     if (dist > 0) dist += 1;
//     if (dist < 0) dist -= 1;
//     return dist;
//   }
// });


/*globals Presto*/

/**
 * A rest class. It is a grob, not a symbol as rests can have dots as well
 * @extends {Presto.Grob}
 */
Presto.Rest = Presto.Grob.extend({
  /**
   * Quack like a duck
   * @type {Boolean}
   */
  isRest: true,

  /**
   * Length of the rest
   * @type {[type]}
   */
  length: null,

  /**
   * how many dots does the rest have?
   * @type {Number}
   */
  dots: null,

  /**
   * return the correct glyph for rest of a specific length
   * @return {String} character name
   */
  restGlyph: function () { // can be overridden or extended if required
    var l = this.get('length');
    switch (l) {
      case 1:
        return "rests.0"; // whole
      case 2:
        return "rests.1"; // half
      case 4:
        return "rests.2"; // quarter
      case 8:
        return "rests.3"; // eighth
      case 16:
        return "rests.4"; // sixteenth
    }
  },

  init: function () {
    var length = this.get('length'),
        numDots = this.get('dots'),
        glyph = this.get('restGlyph'),
        dotglyph, i, prevwidth;

    var symbol = Presto.Symbol.create({
      score: this.score,
      staff: this.staff,
      name: glyph,
      fontSize: this.score.get('fontSize')
    });

    if (length === 1) {
      // for some reason the whole rest needs an offset
      symbol.y = this.staff.calculateVerticalOffsetFor(-2);
    }

    this.addChildGrob(symbol);

    if (numDots) {
      prevwidth = symbol.get('width');
      for (i = 0; i < numDots; i += 1) {
        dotglyph = Presto.Symbol.create({
          name: 'dots.dot',
          x: prevwidth
        });
        this.addChildGrob(dotglyph);
        prevwidth += dotglyph.get('width');
      }
      dotglyph = null;
    }

  }

});

Presto.mixin(Presto.Rest, {

  isRestHash: function (h) {
    if (h.name === "rest" && h.length) {
      return true;
    }
    return false;
  }
});

// /*globals CanvasMusic*/

// CanvasMusic.Rest = CanvasMusic.Grob.extend({
//   isRest: true, // quack like a duck
//   length: null, // length of the rest
//   dots: null, // how many dots this rest should have
//   markup: null, // do we have markup on this note?
//   markupAlign: SC.ALIGN_CENTER, // default markup is centered
//   markupDown: false,
//   marginRight: function () {
//     var l = this.get('length');
//     if (l === 1) return 20;
//     else if (l === 2) return 0;
//     else if (l === 4) return 20;
//     else if (l === 8) return 20;
//     else if (l === 16) return 20;
//   }.property('length').cacheable(),

//   restGlyph: function () { // can be overridden or extended if required
//     var l = this.get('length');
//     switch (l) {
//       case 1:
//         return "rests.0"; // whole
//       case 2:
//         return "rests.1"; // half
//       case 4:
//         return "rests.2"; // quarter
//       case 8:
//         return "rests.3"; // eighth
//       case 16:
//         return "rests.4"; // sixteenth
//     }
//   }.property('length').cacheable(),

//   top: function () {
//     var pS = this.get('parentStaff');
//     var l = this.get('length');
//     if (l === 1) {
//       return pS.topOfStaffLineFor(4);
//     }
//     else {//if (l === 2) {
//       return pS.topOfStaffLineFor(3);
//     }

//   }.property('length').cacheable(),

//   init: function () {
//     //arguments.callee.base.apply(this, arguments);
//     this.calculateRest();
//   },

//   calculateRest: function () {

//     var top = this.get('top');
//     //var top = this.get('y'), i;
//     var i;
//     var mix = { cm: this.get('cm') };
//     var numDots = this.get('dots');
//     var restSymbol = CanvasMusic.Symbol.create(mix, {
//       name: this.get('restGlyph'),
//       y: top + 1
//     });
//     var restWidth = restSymbol.get('width');
//     this.addChildGrob(restSymbol);

//     // add dots
//     //
//     if (numDots && numDots > 0) {
//       for (i = 0; i < numDots; i += 1) {
//         this.addChildGrob(CanvasMusic.Symbol.create(mix, {
//           y: top + this.getPath('cm.size') * 0.5,
//           marginLeft: restWidth * (0.5 * (i + 1)),
//           name: "dots.dot",
//           autoAdjustOnAdd: true,
//           skipWidth: true
//         }));
//       }
//     }
//   },

//   width: function () {
//     return this.get('widthOfChildGrobs');
//   }.property()
// });
/*globals Presto*/


/**
 * Presto.Column is a way to get vertically stacked elements which can be horizontally moved as a block
 * @extends {Presto.Grob}
 */
Presto.Column = Presto.Grob.extend({
  /**
   * don't draw anything ourselves, just the contents
   * @type {Boolean}
   */
  isContainer: true,

  /**
   * Hook where the parent staff is put
   * @type {Presto.Staff}
   */
  parentStaff: null,

  /**
   * The width of a column is distance between the left most point and the rightmost point
   * @return {Number} Width of the column
   */
  width: function () {
    var w = this.childGrobs.getEach('width')
    return w.get('@max');
  }

});



/*globals Presto, console*/

/**
 * A note column is a wrapper around one or more notes or rests, which also applies stacking
 */

Presto.NoteColumn = Presto.Column.extend({

  /**
   * Where notes should be put
   * @type {Array}
   */
  notes: null,

  // IMPORTANT: the staff will decide the vertical position of the note head!
  //

  init: function () {
    var notes = this.notes;
    var staff = this.staff;
    // we assume notes have been set
    if (!notes) return;
    var mix = {
      staff: staff,
      score: this.score,
      parentGrob: this,
      x: 0,
      y: 0
    };
    notes.forEach(function (n) {
      var obj;
      if (Presto.Note.isNoteHash(n)) {
        obj = Presto.Note.create(mix, n);
        // retrieve root note + octave, and set proper y value
        staff.setVerticalOffsetFor(obj);
        obj.update(); // have the note reset itself
        this.addChildGrob(obj);
      }
      else if (Presto.Rest.isRestHash(n)) {
        this.addChildGrob(Presto.Rest.create(mix, n));
      }
      else {
        console.log("Presto.NoteColumn: other hash types are not implemented yet");
      }
    }, this);
    var noteObjs = this.childGrobs.filterProperty('isNote');
    var min = noteObjs.getEach('accidental').getEach('x').get('@min');
    noteObjs.forEach(function (n) {
      n.x += Math.abs(min);
    });

    if (notes.length > 1) {
      this.applyStacking();
    }
  },

  // perhaps necessary when things have been added, to reset the stacking adjustments?
  _resetStacking: function () {

  },

  /**
   * private method to perform the accidental stacking
   * It takes the highest, then the lowest, starting at the outer limits, and walk in, taking octaves into account
   */
  _stackAccidentals: function (chord) {
    var sortedNotes = chord.filterProperty('accidental');

    // first sort by note height, heighest note first
    // var sortedNotes = notesWithAccidentals.sort(function (n1, n2) {
    //   if (n1.positionOnStaff > n2.positionOnStaff) return 1;
    //   else if (n1.positionOnStaff < n2.positionOnStaff) return -1;
    //   else return 0;
    // });

    var accidentalOrder = [];
    // now we sort it by taking the highest one, checking whether any octaves exist
    // function to search for octaves and add them to the accidentalOrder
    function addOctave (note) {
      sortedNotes.filter(function (sn) {
        return sn.get('rootTone') === note.get('rootTone');
      }).forEach(function (oct) {
        if (accidentalOrder.indexOf(oct) === -1) {
          accidentalOrder.push(oct);
        }
      });
    }

    sortedNotes.forEach(function (n, i) {
      // first the top
      if (accidentalOrder.indexOf(n) === -1) {
        accidentalOrder.push(n);
        addOctave(n);//now check whether any octaves exist, and add
      }
      // now the bottom
      var last = sortedNotes[sortedNotes.length - 1 - i]; // walk backward from the end
      if (accidentalOrder.indexOf(last) === -1) {
        accidentalOrder.push(last);
        addOctave(last);// also check for octaves here
      }
    });

    // in accidentalOrder we have the sorted list, where the top accidental is first
    // and any octaves are consecutive, start setting the offsets
    var offsetIndex = 0, offset = 0, prevRootTone;
    var staffSpace = this.score.get('size');
    accidentalOrder.forEach(function (acc) {
      offset = offsetIndex * (staffSpace * 2.5);
      acc.accidental.x -= offset;
      if (acc.get('rootTone') !== prevRootTone) {
        offsetIndex += 1;
      }
    });
    this.x += offset; // create the extra space required by moving the note column
  },


  /**
   * Needs to be invoked in order to perform the proper stacking of notes (see explanation below)
   * @return {this} this
   */
  applyStacking: function () {
    var chord = this.childGrobs.filterProperty('isNote');

    // for all tasks we will need them sorted, top note first
    var sortedChord = chord.sort(function (n1, n2) {
      if (n1.positionOnStaff > n2.positionOnStaff) return 1;
      else if (n1.positionOnStaff < n2.positionOnStaff) return -1;
      else return 0;
    });
    //
    // three different tasks
    // first: accidentals,
    // second: primes,
    // third: seconds
    this._stackAccidentals(sortedChord);

    sortedChord.reverse().forEach(function (n, i) { // for the stacking we need a reverse order than for the accidentals
      var interval;
      var nextNote = chord[i + 1];
      if (nextNote) {
        interval = Math.abs(Presto.Note.intervalBetween(n, nextNote));
        if (interval === 2) {
          this._stackSecond(n, nextNote);
        }
        else if (interval === 1) {
          this._stackPrime(n, nextNote);
        }
      }
    }, this);

    //     chord.forEach(function (n, i) {
    //       var nextNote = chord.objectAt(i+1);
    //       n.set('skipWidth', true); // column, so don't count the width
    //       var interval;
    //       if (nextNote) {
    //         nextNote.set('skipWidth', true);
    //         interval = CanvasMusic.Note.intervalBetween(n, nextNote);
    //         if (interval === 2 || interval === -2) {
    //           this._stackSecond(n, nextNote);
    //         }
    //         else if (interval === 1) {
    //           this._stackPrime(n, nextNote);
    //         }
    //         else {
    //           if (n.get('stemDown')) {
    //             n.set('skipWidth', true);
    //             //nextNote.move('marginLeft', 1);
    //           }
    //           else {
    //             n.set('skipWidth', true);
    //             n.move('marginLeft', n.get('marginLeft'));
    //           }
    //         }
    //       }
    //     }, this);

    return this;
  },

  _stackSecond: function (bottomNote, topNote) {

    var notShifted = !bottomNote.get('isShifted') && !topNote.get('isShifted');

    if (topNote._automaticStem || bottomNote._automaticStem) {
      if (topNote.get('stemDown') && bottomNote.get('stemUp')) {
        topNote.flipStem().set('_automaticStem', false);
      }
    }

    if (topNote.get('stemUp') && bottomNote.get('stemDown')) {
      if (notShifted) {
        this._shiftNote(bottomNote, topNote.get('_noteHeadWidth'));
      }
    }
    else if (topNote.get('stemDown') && bottomNote.get('stemUp')) {
      //top note offset to the left (keep stems) === bottom note offset to the right
      if (notShifted) {
        this._shiftNote(bottomNote, topNote.get('_noteHeadWidth'));
      }
    }
    else if (topNote.get('stemDown') && bottomNote.get('stemDown')) {
      if (notShifted) {
        // topnote to the right, but buttom note loses stem
        this._shiftNote(topNote, (bottomNote.get('_noteHeadWidth') / 2) - 1);
        bottomNote.removeStem();
      }
    }
    else if (topNote.get('stemUp') && bottomNote.get('stemUp')) {
      if (notShifted) {
        this._shiftNote(topNote, (bottomNote.get('_noteHeadWidth') / 2) - 1);
        topNote.removeStem();
      }
    }
  },

  //   _stackSecond: function (bottomNote, topNote) {
  //     var offset;

  //     //debugger;
  //     var topNoteWidth = topNote.get('widthOfChildGrobs');
  //     var bottomNoteWidth = bottomNote.get('widthOfChildGrobs');

  //     if (topNote.get('stemUp') && bottomNote.get('stemDown')) {
  //       if (!bottomNote.get('isShifted') && !topNote.get('isShifted')) {
  //         bottomNote.moveNote(topNoteWidth);
  //         //bottomNote.move('marginLeft', topNoteWidth);
  //         bottomNote.set('isShifted', true);
  //         // this.move('marginRight', topNoteWidth);
  //       }
  //     }
  //     else if (topNote.get('stemDown') && bottomNote.get('stemUp')) {
  //       //top note offset to the left (keep stems) === bottom note offset to the right
  //       if (!topNote.get('isShifted') && !bottomNote.get('isShifted')) {
  //         bottomNote.moveNote(topNoteWidth);
  //         //bottomNote.move('marginLeft', topNoteWidth);
  //         bottomNote.set('isShifted', true);
  //       }
  //     }
  //     else if (topNote.get('stemDown') && bottomNote.get('stemDown')) {
  //       if (!bottomNote.get('isShifted') && !topNote.get('isShifted')) {
  //         // topnote to the right, but buttom note loses stem
  //         //topNote.move('marginLeft', bottomNoteWidth);
  //         //topNote.moveNote(bottomNoteWidth);
  //         //topNote.set('isShifted', true);
  //         offset = bottomNote.getPath('noteShape.widthOfChildGrobs');
  //         //topNote.shiftNote(bottomNoteWidth);
  //         topNote.shiftNote(offset);
  //         bottomNote.removeStem();
  //         //if (topNote.hasAccidental) topNote.unshiftAccidentals();
  //       }
  //     }
  //     else if (topNote.get('stemUp') && bottomNote.get('stemUp')) {
  //       if (!topNote.get('isShifted') && !bottomNote.get('isShifted')) {
  //         //topNote.moveNote(bottomNoteWidth);
  //         //topNote.move('marginLeft', bottomNoteWidth);
  //         //topNote.set('isShifted', true);
  //         //offset = topNoteWidth + bottomNote.get('marginLeft');
  //         //offset = bottomNote.get('widthOfChildGrobs') + bottomNote.get('noteHeadLeft');// + bottomNote.get('marginLeft');
  //         //this.move('marginRight', offset / 2);
  //         //debugger;
  //         //bottomNote.getPath('noteShape.width');
  //         offset = bottomNote.getPath('noteShape.widthOfChildGrobs');
  //         topNote.shiftNote(offset);

  //         topNote.removeStem();

  //         //topNote.shiftNote(bottomNote.get('noteHeadLeft') + );
  //         //debugger;

  //       }
  //     }
  //
  //   },
  //
  _shiftNote: function (note, amount) {
    note.x += amount;
    if (note.accidental) note.accidental.x -= amount;
    note.isShifted = true;
  },

  _stackPrime: function (firstNote, secondNote) { // doesn't matter up/down
    var firstLength = firstNote.get('length'),
        secondLength = secondNote.get('length'),
        firstWidth = firstNote._noteHeadWidth,
        secondWidth = secondNote._noteHeadWidth,
        firstIsNotShifted = !firstNote.get('isShifted'),
        secondIsNotShifted = !secondNote.get('isShifted');

    if (firstLength === 1 && secondLength === 1) { // two whole notes
      if (firstIsNotShifted && secondIsNotShifted) {
        this._shiftNote(secondNote, firstWidth);
      }
    }
    else if (firstLength === 1 || secondLength === 1) {
      if (firstLength === 1) { // first is a whole note
        if (secondIsNotShifted) {
          this._shiftNote(secondNote, firstWidth);
        }
      }
      else { // second is a whole note
        if (firstIsNotShifted) {
          this._shiftNote(firstNote, -secondWidth);
        }
      }
    }
    else {
      if (firstLength > 1 && secondLength > 1) { // both have stems
        if (firstNote.get('stemUp') && secondNote.get('stemUp')) {
          if (secondIsNotShifted) {
            this._shiftNote(secondNote, firstWidth);
            secondNote.removeStem();
          }
        }
        else if (firstNote.get('stemDown') && secondNote.get('stemDown')) {
          if (secondIsNotShifted) {
            this._shiftNote(secondNote, firstWidth);
            secondNote.removeStem();
          }
        }
      }
    }
  }

//       if (firstLength > 1 && secondLength > 1) { // both have stems
//         if (firstNote.get('stemUp') && secondNote.get('stemUp')) {
//           if (!secondNote.get('isShifted')) {
//             secondNote.move('marginLeft', firstNoteWidth);
//             firstNote.set('skipWidth', true);
//             secondNote.removeStem();
//             secondNote.set('isShifted', true);
//           }
//         }
//         else if (firstNote.get('stemDown') && secondNote.get('stemDown')) {
//           if (!secondNote.get('isShifted')) {
//             //secondNote.set('marginLeft', 0).set('marginRight', 0);
//             //secondNote.move('marginLeft', -firstNoteWidth);
//             firstNote.set('skipWidth', true);
//             secondNote.move('marginLeft', firstNoteWidth);
//             secondNote.removeStem();
//             secondNote.set('isShifted', true);
//           }
//         }
//         else {
//           firstNote.set('skipWidth', true);
//         }

  //   _stackPrime: function (firstNote, secondNote) {
  //     //var firstNote = p[0], secondNote = p[1];
  //     var firstLength = firstNote.get('length'),
  //         secondLength = secondNote.get('length'),
  //         firstNoteWidth = firstNote.get('widthOfChildGrobs'),
  //         secondNoteWidth = secondNote.get('widthOfChildGrobs');

  //     if (firstLength === 1 && secondLength === 1) { // two whole notes
  //       if (!firstNote.get('isShifted') && !secondNote.get('isShifted')) { // if none of these two is shifted, shift
  //         firstNote.set('skipWidth', true);
  //         secondNote.move('marginLeft', firstNoteWidth);
  //         secondNote.set('isShifted', true);
  //       }
  //     }
  //     else if (firstLength === 1 || secondLength === 1) { // if one of two is a whole note
  //       if (firstLength === 1) { // if the first is a whole, second is offset to the right
  //         if (!secondNote.get('isShifted')) {
  //           firstNote.set('skipWidth', true);
  //           secondNote.move('marginLeft', firstNoteWidth);
  //           secondNote.set('isShifted', true);
  //         }
  //       }
  //       else { // second is a whole
  //         if (!firstNote.get('isShifted')) {
  //           firstNote.set('skipWidth', true);
  //           firstNote.move('marginLeft', -secondNoteWidth);
  //           firstNote.set('isShifted', true);
  //         }
  //       }
  //     }
  //     else {
  //       if (firstLength > 1 && secondLength > 1) { // both have stems
  //         if (firstNote.get('stemUp') && secondNote.get('stemUp')) {
  //           if (!secondNote.get('isShifted')) {
  //             secondNote.move('marginLeft', firstNoteWidth);
  //             firstNote.set('skipWidth', true);
  //             secondNote.removeStem();
  //             secondNote.set('isShifted', true);
  //           }
  //         }
  //         else if (firstNote.get('stemDown') && secondNote.get('stemDown')) {
  //           if (!secondNote.get('isShifted')) {
  //             //secondNote.set('marginLeft', 0).set('marginRight', 0);
  //             //secondNote.move('marginLeft', -firstNoteWidth);
  //             firstNote.set('skipWidth', true);
  //             secondNote.move('marginLeft', firstNoteWidth);
  //             secondNote.removeStem();
  //             secondNote.set('isShifted', true);
  //           }
  //         }
  //         else {
  //           firstNote.set('skipWidth', true);
  //         }
  //       }
  //     }
  //   }

});


/*
    The stacking rules

    the rules are:
    - top accidental should be nearest
    - octave related accidentals should be vertically aligned (this does not work yet)
    - after that, working from outsides inwards, bottom first



*/



// /*globals CanvasMusic*/

// /*
// The purpose of this class is to have an abstraction for the stacking
// which takes place within a staff, as well as allowing to synchronize
// different staves. Every staff will make one of this objects for every
// group of objects which belong together both optically as well as
// musically.
//  */

// CanvasMusic.Column = CanvasMusic.Grob.extend({

//   // we need some kind of automatic system for adding notes
//   // in order to stack them properly
//   // we also need some external interface to
//   //
//   parentStaff: null, // hook where to put on the parentStaff

//   isColumn: true,

//   //debugGrob: true,

//   alignFrame: function () {
//     // search for a note which is in "normal" position
//     // and return the frame of that note ...
//     // we search for the note with the leftmost position,
//   },

//   firstNoteLeft: function () {
//     // return the marginLeft of the leftmost note we have
//     var notes = this.get('childGrobs').filterProperty('isNote');
//     if (notes.length === 0) return;
//     else return notes.getEach('noteHeadLeft').get("@max");
//   }.property(),

//   addChildGrob: function () {
//     arguments.callee.base.apply(this, arguments);
//     // the element has already been added, we just apply rules to the stacking
//     // of notes
//     //
//     // in case of a markup we need to do a trick. The width of the markup should count to the
//     // width of the column, but should be ignored by the previousGrob technique

//     //this._applyStackingRules();
//     //debugger;
//     this.invokeLast('_applyStackingRules');
//   },

//   widthOfChildGrobs: function () {
//     // the width of a column is different from a normal grob, as in a normal grob
//     // the elements are stacked horizontally, and in here vertically.
//     // so we search for the left most element and the rightmost element

//     // first search the left most element, then look for the right most element
//     // as all the x values will be 0, the only thing we have to look for is the width of the
//     //
//     var maxX;
//     //var id = SC.guidFor(this);
//     this.childGrobs.forEach(function (cg, i) {
//       var w;
//       var mL = cg.get('marginLeft');
//       if (cg.get('childGrobs')) {
//         w = cg.get('widthOfChildGrobs');
//       }
//       else {
//         w = cg.get('width');
//       }
//       var mR = cg.get('marginRight');
//       var cgMaxX = mL + w + mR;
//       if (i === 0) { // take the value
//         maxX = cgMaxX;
//       }
//       else {
//         if (cgMaxX > maxX) maxX = cgMaxX;
//       }
//     });
//     return maxX;
//   }.property(),

//   // the margin left and right should be in the width
//   // marginLeft: function () {
//   //   // calculate the margin left, which is the left margin of the most left element
//   //   // if x > 0 subtract the x value from marginLeft, else add it
//   //   var leftMost, x;
//   //   this.childGrobs.forEach(function (cg) {
//   //     var cgX = cg.get('x');
//   //     if (x === undefined){
//   //       x = cgX;
//   //       leftMost = cg;
//   //     }
//   //     else {
//   //       if (cgX < x) {
//   //         x = cgX;
//   //         leftMost = cg;
//   //       }
//   //     }
//   //   });
//   //   return cg.get('marginLeft') + (cgX * -1);
//   // }.property(),
//   //
//   // render: function () {
//   //   this._applyStackingRules();
//   //   arguments.callee.base.apply(this, arguments);
//   // },
//   //
//   toString: function () {
//     return "CanvasMusic.Column %@".fmt(SC.guidFor(this));
//   },

//   _applyStackingRules: function () {
//     //debugger;
//     var chord = this.childGrobs.filterProperty('isNote');
//     // we call it chord, while essentially it isn't, but the same rules apply

//     // what about the following process:
//     // - figuring out which notes have accidentals
//     // - check whether they collide (everything under an octave most likely collides)
//     // - offset the accidentals
//     // - then check the stacking of the notes
//     // - compensate for any extra movement by the accidentals

//     // first put everything in a straigh vertical alignment



//     var notesWithAccidentals = chord.filterProperty('hasAccidental').reverse();
//     // the rules are:
//     // - top accidental should be nearest
//     // - octave related accidentals should be vertically aligned (this does not work yet)
//     var offset = 0;
//     notesWithAccidentals.forEach(function (n) {
//       // for now add the width of the accidental to the leftmargin of the note shape
//       var nhl = n.get('noteHeadLeft');
//       n._previousNoteHeadLeft = nhl;
//       n.moveNote(offset);
//       offset += nhl;
//     });

//     var max = chord.getEach('noteHeadLeft').get('@max');
//     chord.forEach(function (n) {
//       var nhl = n.get('noteHeadLeft');
//       if (nhl < max) {
//         var diff = max - nhl;
//         n.moveNote(diff);
//       }
//     });

//     // now everything is offset at the max distance, so the note heads are in the right position
//     // and all accidentals are at the max left now we need to run through all the accidentals again to arrange the
//     // accidentals
//     // the procedures above have set the marginLeft of the note shape, we have to reduce it to 0 again for the
//     // first accidental, then from there
//     offset = 0;
//     notesWithAccidentals.forEach(function (n) {
//       // the first offset is "normal", then we start increasing the offset
//       var nhl = n._previousNoteHeadLeft + offset;
//       var noteShape = n.get('noteShape');
//       var curNhl = n.get('noteHeadLeft');
//       //var curNhl = noteShape.get('marginLeft');
//       //
//       // we need to take the margins into account, which we seem to have subtracted here
//       var diff = nhl - curNhl + 4; // create the negative, so the value will correct
//       //console.log("n._previousNoteHeadLeft: %@, offset: %@, curNhl: %@, nhl: %@, diff: %@".fmt(n._previousNoteHeadLeft, offset, curNhl, nhl, diff));
//       n.moveNote(diff);
//       //console.log("new noteHeadLeft: %@".fmt(n.get('noteHeadLeft')));
//       // now we need to also add the remainder of the offset to the note itself
//       n.move('marginLeft', diff * -1);
//       offset += n._previousNoteHeadLeft;
//     });

//     //stacking
//     chord.forEach(function (n, i) {
//       var nextNote = chord.objectAt(i+1);
//       n.set('skipWidth', true); // column, so don't count the width
//       var interval;
//       if (nextNote) {
//         nextNote.set('skipWidth', true);
//         interval = CanvasMusic.Note.intervalBetween(n, nextNote);
//         if (interval === 2 || interval === -2) {
//           this._stackSecond(n, nextNote);
//         }
//         else if (interval === 1) {
//           this._stackPrime(n, nextNote);
//         }
//         else {
//           if (n.get('stemDown')) {
//             n.set('skipWidth', true);
//             //nextNote.move('marginLeft', 1);
//           }
//           else {
//             n.set('skipWidth', true);
//             n.move('marginLeft', n.get('marginLeft'));
//           }
//         }
//       }
//     }, this);

//     // notesWithAccidentals.forEach(function (n) {
//     //   // ...
//     //   //
//     // }, this);

//     // fixing movement of accidentals...
//     // if (topNote.hasAccidental) { // in this case the accidental needs to be in front of the bottom note

//     //   //topNote.moveNote(bottomNoteWidth);
//     //   // we do want to move the note, but it should be possible to shift it afterwards
//     //   bottomNote.moveNote(topNote.get('noteHeadLeft')); // offset bottom note to match top note head
//     //   // we should take the width of the stem into account
//     //   topNote.shiftNote(bottomNoteWidth - bottomNote.get('marginRight') + this.getPath('parentStaff.size') / 6);
//     //   topNote.unshiftAccidentals();
//     //   this.move('marginLeft', bottomNoteWidth / 2);
//     // }
//     // else {
//     //   topNote.shiftNote(bottomNoteWidth);
//     //   this.move('marginRight', topNoteWidth / 2);
//     // }


//     //
//     //
//     //
//     //
//     //
//     //
//     //
//     // var numNotes = chord.length;
//     // if (numNotes < 2) return; // we don't need to do anything for anything less than 2 notes simultaneous

//     // //var pS = this.get('parentStaff');
//     // //var cm = this.get('cm');
//     // var interval, curNote, nextNote;
//     // var primes = [];
//     // var seconds = [];

//     // for (var i = 0; i < numNotes; i += 1) {
//     //   curNote = chord[i];
//     //   nextNote = chord[i + 1];
//     //   if (nextNote) { // don't take the last item, we are interested in intervals
//     //     interval = CanvasMusic.Note.intervalBetween(curNote, nextNote);
//     //     if (interval === 2 || interval === -2) {
//     //       // immediately get bottom note first
//     //       if (interval === -2) seconds.push([nextNote, curNote]);
//     //       else seconds.push([curNote, nextNote]); // yes should be an array
//     //     }
//     //     else if (interval === 1) {
//     //       primes.push([curNote, nextNote]);
//     //     }
//     //     else { // for all other stacking, only one note should count, so we set skipWidth on everything but the first
//     //       // check the stem direction
//     //       if (curNote.get('stemDown')) {
//     //         curNote.set('skipWidth', true);
//     //         nextNote.move('marginLeft', 1);
//     //       }
//     //       else {
//     //         curNote.set('skipWidth', true);
//     //         curNote.move('marginLeft', curNote.get('marginLeft'));
//     //       }

//     //     }
//     //   }
//     // }

//     // the rules are:
//     // - for seconds:
//     //   - when both notes are notes with a stem (anything length > 1)
//     //     - when the top note has the stem up and the bottom one the stem down => bottom note offset to the right (keep stems)
//     //     - when the top note has the stem down and the bottom one the stem up => top note offset to the left (keep stems)
//     //     (this is perhaps the original, the implementation flips it around because of spacing issues)
//     //     - when both notes have the stem down => bottom note offset to the left and loses stem, unless it is already offset
//     //     - when both notes have the stem up => top note offset to the right and loses stem, unless it is already offset
//     //   - when both notes are notes without a stem (length === 1)
//     //     - when only two notes are present => bottom note goes left, unless it is already offset
//     //     - when more than two notes are present => the middle one goes left, unless it is already offset
//     //   - when one of the notes is a note without a stem => the top note is offset to the left (regardless of stem)
//     // - for primes:
//     //   - when both notes are notes with a stem (anything length > 1)
//     //     - when both notes have opposite stems => no offset
//     //     - when both notes have the stem up => one of them is offset to the right, and loses stem
//     //     - when both notes have the stem down => one of them is offset to the left and loses stem
//     //   - when both notes are notes without a stem (length === 1)
//     //     - first note goes left unless it is already offset (max two, Lilypond also only prints two, even with three voices!)
//     //   - when one of the note has a stem (length > 1), it depends on the voice the note is in, but as there is no
//     //     Voice context in this implementation (yet), we cannot really know. The note with stem has Voice 1, goes left, rest goes right
//     //     so, what we do here, is assume that the first note in a chord in that sense will be voice 1.
//     //
//     //  In these rules is not taken care of the fact that we can have accidentals.
//     //  In case of accidentals the accidental needs to be put in front of the entire stack, and the entire stack
//     //  needs to be shifted an certain amount of space to make room for the accidental
//     //  When an accidental is on one of the shifted notes, the accidental needs to be moved (marginRight)
//     //  in order to be in front of the stack
//     //
//     //  In some cases the accidentals could overlap, so we also need to detect that somehow.
//     //
//     //  For some reasons I am doing something fundamentally wrong here...
//     // perhaps one of the reasons is that the code for the primes and seconds was written for a continuous addition
//     // but this is no longer necessary now, as the runloop of SC takes care that this procedure is ran only once after
//     // its creation.

//     // most likely it is easier to apply the rules in one go...




//     // this._stackSeconds(seconds);
//     // this._stackPrimes(primes);
//     // // after stacking has taken place, we need to check whether all notes are properly aligned
//     // // we look for the right most notehead, which is not shifted
//     // var notes = this.childGrobs.filterProperty('isNote');
//     // var shiftedNotes = notes.filterProperty('isShifted', true);
//     // var unshiftedNotes = notes.filter(function (cg) {
//     //   return shiftedNotes.indexOf(cg) === -1;
//     // });

//     // var maxUnshifted = unshiftedNotes.getEach('noteHeadLeft').get('@max');
//     // var maxShifted = shiftedNotes.getEach('noteHeadLeft').get('@max'); // offset for stem

//     // var stemOffset = this.getPath('parentStaff.size') / 6;
//     // notes.forEach(function (n) {
//     //   var nhl = n.get('noteHeadLeft');
//     //   var max = n.isShifted ? maxShifted: maxUnshifted;
//     //   var diff;

//     //   //topNote.shiftNote(bottomNoteWidth - bottomNote.get('marginRight') + this.getPath('parentStaff.size') / 6);
//     //   if (nhl < max) {
//     //     diff = max - nhl;
//     //     // not entirely sure why I need to add the stemOffset twice here...
//     //     if (n.isShifted) diff += stemOffset * 2; // only add if we actually need to move it...
//     //     n.moveNote(diff);
//     //   }

//     //   // if (n.hasAccidental && n.isShifted) {
//     //   //   n.unshiftAccidentals();
//     //   // }
//     // });


//     // (function (cg) {
//     //   return cg.isNote && !cg.isShifted;
//     // });
//     // var shiftedNotes = this.childGrobs.filter(function (cg))

//     // var max = notes.getEach('noteHeadLeft').get('@max');
//     // //debugger;
//     // this.childGrobs.filterProperty('isNote').forEach(function (cg) {
//     //   var nhl = cg.get('noteHeadLeft'), diff;
//     //   if (nhl < max) {
//     //     diff = max - nhl;
//     //     cg.moveNote(diff);
//     //   }
//     //   else {

//     //   }
//     // });
//     // // notes.forEach(function (n) {
//     // //   var nhl = n.get('noteHeadLeft');
//     // //   if (nhl < max) {
//     // //     var diff = max - nhl;
//     // //     n.moveNote(diff);
//     // //     //n.isMoved = true;
//     // //   }
//     // // });

//   },

//   _stackSecond: function (bottomNote, topNote) {
//     var offset;

//     if (topNote._automaticStem || bottomNote._automaticStem) {
//       if (topNote.get('stemDown') && bottomNote.get('stemUp')) {
//         // fix the topNote to agree with bottomNote
//         // interesting to see how the rules in lilypond are.. we here adhere to the lowest note essentially
//         //topNote.set('stemUp', true).set('stemDown', false).set('_automaticStem', false);
//         topNote.flipStem().set('_automaticStem', false);
//       }
//     }

//     // whenever we have to stack, we should ignore the width of the previous element
//     // as it would otherwise be added to the topNotes x position when calculating the frame
//     // The previous grob in this case is the bottom note because of the sorting
//     bottomNote.set('skipWidth', true);
//     topNote.set('skipWidth', true);


//     //debugger;
//     var topNoteWidth = topNote.get('widthOfChildGrobs');
//     var bottomNoteWidth = bottomNote.get('widthOfChildGrobs');

//     if (topNote.get('stemUp') && bottomNote.get('stemDown')) {
//       if (!bottomNote.get('isShifted') && !topNote.get('isShifted')) {
//         bottomNote.moveNote(topNoteWidth);
//         //bottomNote.move('marginLeft', topNoteWidth);
//         bottomNote.set('isShifted', true);
//         // this.move('marginRight', topNoteWidth);
//       }
//     }
//     else if (topNote.get('stemDown') && bottomNote.get('stemUp')) {
//       //top note offset to the left (keep stems) === bottom note offset to the right
//       if (!topNote.get('isShifted') && !bottomNote.get('isShifted')) {
//         bottomNote.moveNote(topNoteWidth);
//         //bottomNote.move('marginLeft', topNoteWidth);
//         bottomNote.set('isShifted', true);
//       }
//     }
//     else if (topNote.get('stemDown') && bottomNote.get('stemDown')) {
//       if (!bottomNote.get('isShifted') && !topNote.get('isShifted')) {
//         // topnote to the right, but buttom note loses stem
//         //topNote.move('marginLeft', bottomNoteWidth);
//         //topNote.moveNote(bottomNoteWidth);
//         //topNote.set('isShifted', true);
//         offset = bottomNote.getPath('noteShape.widthOfChildGrobs');
//         //topNote.shiftNote(bottomNoteWidth);
//         topNote.shiftNote(offset);
//         bottomNote.removeStem();
//         //if (topNote.hasAccidental) topNote.unshiftAccidentals();
//       }
//     }
//     else if (topNote.get('stemUp') && bottomNote.get('stemUp')) {
//       if (!topNote.get('isShifted') && !bottomNote.get('isShifted')) {
//         //topNote.moveNote(bottomNoteWidth);
//         //topNote.move('marginLeft', bottomNoteWidth);
//         //topNote.set('isShifted', true);
//         //offset = topNoteWidth + bottomNote.get('marginLeft');
//         //offset = bottomNote.get('widthOfChildGrobs') + bottomNote.get('noteHeadLeft');// + bottomNote.get('marginLeft');
//         //this.move('marginRight', offset / 2);
//         //debugger;
//         //bottomNote.getPath('noteShape.width');
//         offset = bottomNote.getPath('noteShape.widthOfChildGrobs');
//         topNote.shiftNote(offset);

//         topNote.removeStem();

//         //topNote.shiftNote(bottomNote.get('noteHeadLeft') + );
//         //debugger;

//       }
//     }
//   },

//   _stackPrime: function (firstNote, secondNote) {
//     //var firstNote = p[0], secondNote = p[1];
//     var firstLength = firstNote.get('length'),
//         secondLength = secondNote.get('length'),
//         firstNoteWidth = firstNote.get('widthOfChildGrobs'),
//         secondNoteWidth = secondNote.get('widthOfChildGrobs');

//     if (firstLength === 1 && secondLength === 1) { // two whole notes
//       if (!firstNote.get('isShifted') && !secondNote.get('isShifted')) { // if none of these two is shifted, shift
//         firstNote.set('skipWidth', true);
//         secondNote.move('marginLeft', firstNoteWidth);
//         secondNote.set('isShifted', true);
//       }
//     }
//     else if (firstLength === 1 || secondLength === 1) { // if one of two is a whole note
//       if (firstLength === 1) { // if the first is a whole, second is offset to the right
//         if (!secondNote.get('isShifted')) {
//           firstNote.set('skipWidth', true);
//           secondNote.move('marginLeft', firstNoteWidth);
//           secondNote.set('isShifted', true);
//         }
//       }
//       else { // second is a whole
//         if (!firstNote.get('isShifted')) {
//           firstNote.set('skipWidth', true);
//           firstNote.move('marginLeft', -secondNoteWidth);
//           firstNote.set('isShifted', true);
//         }
//       }
//     }
//     else {
//       if (firstLength > 1 && secondLength > 1) { // both have stems
//         if (firstNote.get('stemUp') && secondNote.get('stemUp')) {
//           if (!secondNote.get('isShifted')) {
//             secondNote.move('marginLeft', firstNoteWidth);
//             firstNote.set('skipWidth', true);
//             secondNote.removeStem();
//             secondNote.set('isShifted', true);
//           }
//         }
//         else if (firstNote.get('stemDown') && secondNote.get('stemDown')) {
//           if (!secondNote.get('isShifted')) {
//             //secondNote.set('marginLeft', 0).set('marginRight', 0);
//             //secondNote.move('marginLeft', -firstNoteWidth);
//             firstNote.set('skipWidth', true);
//             secondNote.move('marginLeft', firstNoteWidth);
//             secondNote.removeStem();
//             secondNote.set('isShifted', true);
//           }
//         }
//         else {
//           firstNote.set('skipWidth', true);
//         }
//       }
//     }
//   }
// });
/*globals Presto, console */
Presto.Staff = Presto.Grob.extend({
  /**
   * Which key signature to display, defaults to "c"
   * This property can be changed during the notation process
   * @type {String}
   */
  key: "c",

  /**
   * Time signature, defaults to 4/4
   * This property can be changed during the notation process
   * @type {String}
   */
  time: "4/4",

  /**
   * Clef to use, default is treble clef
   * This property can be changed during the notation process
   * @type {String}
   */
  clef: "treble",

  /**
   * Whether to omit the clef, default is to show
   * @type {Boolean}
   */
  omitClef: false,

  /**
   * Line thickness of staff lines
   * @type {Number}
   */
  staffLineThickness: 1,

  /**
   * the default positions of staff lines
   * @type {Array}
   */
  defaultLinePositions: [4,2,0,-2,-4],

  /**
   * in case you want to override the default line positions, set something here
   * @type {Array}
   */
  linePositions: null,

  /**
   * The information to put on this staff
   * @type {Array}
   */
  notes: null,

  init: function () {
    this._currentX = 0;
    this.addStaffLines();
    this.addClef();
    this.addTimeSignature();
  },

  /**
   * Function to add the staff lines
   * @returns { this }
   */
  addStaffLines: function () {
    var linePos = this.linePositions || this.defaultLinePositions;
    var lineWidth = this.staffLineThickness;
    var score = this.score;
    var staffSpace = this.score.get('size');
    linePos.forEach(function (l, i) {
      var y = staffSpace * l + lineWidth*i;
      this.addChildGrob(Presto.Line.create({
        x: 0,
        y: y,
        lineWidth: lineWidth,
        toX: score.width, // for now
        toY: y,
        ignoreWidth: true,
        isStaffLine: true,
        lineIndex: y
      }));
    }, this);
    return this;
  },

  addClef: function () {
    var clefName = this.get('clefName'),
        //mix = { score: this.score },
        staffSpace = this.score.get('size');

    var symbol = Presto.Symbol.create({
      score: this.score,
      fontSize: this.score.fontSize,
      name: clefName,
      x: staffSpace,
      y: this.get('clefPosition') * staffSpace + this.staffLineThickness
    });


    this.addChildGrob(symbol);
    this._currentX += symbol.get('width') + 2*staffSpace;
  },

  /**
   * Convenience method to retrieve the note the clef represents
   * @return {String} notename of clefNote
   */
  clefNote: function () {
    return Presto.Staff.clefs[this.get('clef')].clefNote;
  },

  /**
   * Convenience method to retrieve the staff position of the clef
   * @return {Number} distance from center of staff (which is 0) in staff spaces
   */
  clefPosition: function () {
    return Presto.Staff.clefs[this.get('clef')].clefPosition;
  },

  /**
   * Convenience method to retrieve the character name of the clef symbol
   * @return {String} character name of the clef symbol
   */
  clefName: function () {
    return Presto.Staff.clefs[this.get('clef')].clefName;
  },

  /**
   * private function to calculate the vertical offset for a specific position
   * and then cache it, so it can be looked up
   * @param  {Number} pos position on the staff, 0 is middle, negative is up, positive is down
   * @return {Number}     vertical offset in pixels, suitable for setting as y value
   */
  calculateVerticalOffsetFor: function (pos) {
    var cache = this._verticalOffsetCache;
    var size = this.score.get('size');
    var lineThickness = this.get('staffLineThickness');
    if (!cache) this._verticalOffsetCache = cache = {};
    if (cache[pos] === undefined) {
      cache[pos] = pos * size;
      cache[pos] -= Math.floor(pos/2) * lineThickness;
    }
    return cache[pos];
  },

  _verticalOffsetCache: null,

  /**
   * Calculate/lookup the vertical offset for a note object and set it on the note object.
   * This also sets the number of helper lines on the note.
   * @param  {Presto.Note} note the note for which the vertical offset needs to be calculcated and set
   * @return {Presto.Note}      The adjusted note
   */
  setVerticalOffsetFor: function (note) {
    var cnote = this.get('clefNote');
    var cpos = this.get('clefPosition');
    var dist = Presto.Note.distanceBetween(note, cnote);
    var notePos = cpos + dist;
    // from the notePos we can calculate the helperlines. We are going to do this very naively, by assuming
    // there will always be 5 lines, and the lines are at -4, -2, 0, 2, and 4
    note.y = this.calculateVerticalOffsetFor(notePos);
    note.positionOnStaff = notePos;
    var i;
    var helperLines = Presto.Array.create();
    if (notePos > 5) {
      for (i = 6; i <= notePos; i += 2) {
        helperLines.push({ y: this.calculateVerticalOffsetFor(i) - note.y });
      }
      note.helperLines = helperLines;
    }
    else if (notePos < -5) {
      for (i = -6; i >= notePos; i -= 2) {
        helperLines.push({ y: this.calculateVerticalOffsetFor(i) - note.y });
      }
      note.helperLines = helperLines;
    }
    if (note.y < this.maximumTopOffset) this.maximumTopOffset = note.y;
    if (note.y > this.maximumBottomOffset) this.maximumBottomOffset = note.y;
    return note;
  },

  /**
   * the maximum offset above the staff
   * @type {Number} size in pixels from the center
   */
  maximumTopOffset: 0,

  /**
   * the maximum offset below the staff
   * @type {Number} size in pixels from the center
   */
  maximumBottomOffset: 0,

  /**
   * Check validity of timeSignature as given by time, and split it into its components
   * @return {Hash} Hash with numberOfBeats and beatType properties
   */
  timeSignature: function () {
    var validBeatTypes = [1, 2, 4, 8, 16];
    var time = this.get('time');
    if (!time || (time.indexOf("/") === -1)) {
      throw new Error("Presto.Staff: Invalid time signature");
    }
    var sign = time.split("/");
    var numBeats = parseInt(sign[0], 10);
    var beatType = parseInt(sign[1], 10);
    if (validBeatTypes.indexOf(beatType) === -1) {
      throw new Error("Presto.Staff: Invalid beat type: " + beatType);
    }
    return {
      numberOfBeats: numBeats,
      beatType: beatType
    };
  },

  /**
   * Convenience method to return the number of beats per bar from the timeSignature
   * @return {Number} Number of beats
   */
  numberOfBeatsPerBar: function () {
    return this.get('timeSignature').numberOfBeats;
  },

  /**
   * Convenience method to return the beatType from the time signature
   * @return {Number} beat type
   */
  beatType: function () {
    return this.get('timeSignature').beatType;
  },

  //   keySignature: function () {
  //     return CanvasMusic.Staff.clefs[this.get('clef')].keySignatures[this.get('key')];
  //   }.property('key').cacheable(),

  /**
   * add the current time signature, numbers only for the moment
   */
  addTimeSignature: function () {
    var staffSpace = this.score.get('size');

    var c = Presto.Column.create({
      x: this._currentX,
      score: this.score,
      parentStaff: this
    });
    c.addChildGrob(Presto.Symbol.create({
      name: this.get('numberOfBeatsPerBar').toString(),
      y: 0 + this.staffLineThickness,
      fontSize: this.score.fontSize,
      ignoreWidth: true,
    }));
    c.addChildGrob(Presto.Symbol.create({
      name: this.get('beatType').toString(),
      y: staffSpace * 4 - this.staffLineThickness,
      fontSize: this.score.fontSize
    }));
    this.addChildGrob(c);
    this._currentX += c.get('width') + (2*staffSpace);
    return this;
  },

  /**
   * private variable in which is kept the x value of the next element to be added
   * @type {[type]}
   */
  _currentX: null,

  /**
   * private variable to keep the current position of the cursors when notating
   * @type {Number}
   */
  _currentCursorAt: null,

  /**
   * When advanceCursor runs for the first time, it will generate a notation cache, which is a
   * sparse array with all events spaced out in the step size
   * @type {Presto.Array}
   */
  _notationCache: null,

  /**
   * function to calculate the dotted value against the scale of 2, 4, 8, 16
   * A note length of 4 with dots will be smaller than 4. In order to keep the exponential scale
   * the dotted value will be expressed as a division against the original value
   * @param  {Hash} notehash the hash containing the note information
   * @return {Number}          Length value expressed as a factor on the exponential length scale
   */
  _calculateDottedLength: function (notehash) {
    var l = notehash.length;
    if (!l) return 0;
    if (notehash.dots && notehash.dots > 0) {
      // dot 1 is half the value of the original, 1/2
      // dot 2 is half the value of the value added 1/4
      // dot 3 is half the value of the value added last time 1/8 ...etc
      var val = 1, wval = 1;
      for (var i = 0; i < notehash.dots; i += 1) {
        wval /= 2;
        val += wval;
      }
      l /= val; // rewrite the length as divided value of the original
    }
    return l;
  },

  /**
   * Function to generate the notation cache. This generates a sparse Presto.Array, where all events are spaced
   * with regard to the stepSize / cursorSize. Only rhythmical events are included
   * @return {Object} this
   */
  _generateNotationCache: function () {
    var cache = this._notationCache = Presto.Array.create();
    var cursorSize = this.score.cursorSize;
    var n = this.get('notes');
    var curLength;
    n.forEach(function (noteEvent) {
      if (Array.isArray(noteEvent)) {
        noteEvent = Presto.Array.create(noteEvent);
        curLength = Presto.Array.create(noteEvent.map(this._calculateDottedLength)).get('@max'); // the smallest note has the biggest number
      }
      else curLength = this._calculateDottedLength(noteEvent);
      if (curLength) { // ignore no-length events
        cache.push(noteEvent);
        cache.length += (cursorSize / curLength) - 1;
      }
    }, this);
    this._numberOfEvents = cache.length;
    this._currentCursorAt = 0;
    return this;
  },

  /**
   * Function to advance the current notation cursor. The staff will check whether it has something to notate for this
   * specific event, and if yes, it will return the notated object (often a Presto.NoteColumn, sometimes a simple Presto.Note)
   * @param  {Number} stepSize The stepsize with which the cursor should advance, usually omitted
   * @return {Object | null}  null when nothing notated, otherwise the object notated
   */
  advanceCursor: function (stepSize) {
    if (!this._notationCache) this._generateNotationCache();
    var cache = this._notationCache,
        cursorAt = this._currentCursorAt,
        staffSpace = this.score.get('size'),
        currentEvent;

    if (cursorAt >= cache.length) {
      this.notationReady = true;
      return;
    }

    currentEvent = cache[cursorAt];
    if (!currentEvent) {
      this._currentCursorAt += 1;
      return;
    }

    // depending on the kind of event we get, we want to have a note column or a column
    // in what cases do we want a (normal) column?
    // - barline
    // - breathe mark
    // we need to detect whether the event is one or more notes, and if yes, create a note column with them
    //
    var ret = Presto.NoteColumn.create({
      notes: Array.isArray(currentEvent) ? currentEvent : [currentEvent],
      staff: this,
      score: this.score,
      x: this._currentX,
      y: this.staffLineThickness * 2 // this causes the y=0 value to be the middle of the staff
    });
    this.addChildGrob(ret);
    var w = ret.get('width');
    if (w === undefined) {
      window.RET = ret;
      console.log(ret);
      throw new Error("Object " + ret + " is returning undefined for width??");
    }
    this._currentX += w;
    // add
    this._currentCursorAt += 1;
    return ret;
  },

  //   // parseEvent: parses an event, returns a grob with all elements parsed
  //   parseEvent: function (event) {
  //     if (!event) return; // undefined when no event, so skip.
  //     var ret = CanvasMusic.Column.create({ cm: this.get('cm'), parentStaff: this, parentGrob: this });
  //     var adder = function (p) {
  //       if (SC.typeOf(p) === SC.T_ARRAY) p.forEach(ret.addChildGrob, ret);
  //       else ret.addChildGrob(p);
  //     };

  //     if (SC.typeOf(event) === SC.T_ARRAY) { // we have a block with multiple events
  //       event.map(function (e) {
  //         return this.parseHash(e, ret);
  //       }, this).forEach(adder, ret);
  //     }
  //     else if (SC.typeOf(event) === SC.T_HASH) {
  //       adder(this.parseHash(event, ret));
  //     }
  //     else {
  //       throw new Error("CanvasMusic.Staff#parseEvent: invalid event type found: " + SC.inspect(event));
  //     }
  //     return ret;
  //   },


  //   parseHash: function (hash, column) {
  //     if (!hash) return; // don't parse anything invalid
  //     var name = hash.name;
  //     var staffBottomPosition = this.topOfStaffLineFor(1);
  //     var staffTopPosition = this.topOfStaffLineFor(this.get('numberOfLines'));

  //     if (!name) {
  //       console.log(this._notationCache);
  //       throw new Error("something fishy....");
  //     }
  //     var ret;
  //     var mix = {
  //       parentGrob: column,
  //       parentStaff: this,
  //       cm: this.get('cm'),
  //     };
  //     if (CanvasMusic.Barline.isBarline(name)) {
  //       ret = CanvasMusic.Barline.create(mix, {
  //         type: name,
  //         y: staffTopPosition,
  //         height: staffBottomPosition
  //       });
  //     }
  //     else if (name === "rest") { // hardcoded for now
  //       ret = CanvasMusic.Rest.create(mix, hash);
  //     }
  //     else { // assume a note for now
  //       ret = CanvasMusic.Note.create(mix, hash);
  //     }
  //     if (hash.markup) {
  //       ret = [ret]; // make it into an array
  //       var markupHash = {
  //         y: hash.markupDown ? staffBottomPosition: staffTopPosition,
  //         markup: hash.markup
  //       };
  //       if (hash.markupDown !== undefined) markupHash.markupDown = hash.markupDown;
  //       if (hash.markupAlign !== undefined) markupHash.markupAlign = hash.markupAlign;
  //       // the skipWidth functionality on markups sadly doesn't work correctly
  //       // so disabled for now. It needs looking up the previous column in order to detect
  //       // a markup collision
  //       //if (hash.markupSkipWidth !== undefined) markupHash.skipWidth = hash.markupSkipWidth;
  //       ret.push(CanvasMusic.Markup.create(mix, markupHash));
  //     }
  //     return ret;
  //   },






});


Presto.mixin(Presto.Staff, {

  // information about clefs
  // we also define the key signatures here, in order not to have to calculate the octaves etc
  clefs: {
    treble: {
      clefNote: Presto.Note.create({
        name: "g",
        octave: 1,
        isPlaceholder: true
      }),
      clefPosition: 2, // one line under central line
      //clefLine: 2,
      clefName: "clefs.G",
      keySignatures: {
        ces: ['bes1', 'es2', 'as1', 'des2', 'ges1', 'ces2', 'fes1'],
        ges: ['bes1', 'es2', 'as1', 'des2', 'ges1', 'ces2'],
        des: ['bes1', 'es2', 'as1', 'des2', 'ges1'],
        as:  ['bes1', 'es2', 'as1', 'des2'],
        es:  ['bes1', 'es2', 'as1' ],
        bes: ['bes1', 'es2'],
        f:   ['bes1'],
        c:   [],
        g:   ['fis2'],
        d:   ['fis2', 'cis2'],
        a:   ['fis2', 'cis2', 'gis1'],
        e:   ['fis2', 'cis2', 'gis1', 'dis2'],
        b:   ['fis2', 'cis2', 'gis2', 'dis2', 'ais1'],
        fis: ['fis2', 'cis2', 'gis2', 'dis2', 'ais1', 'eis2'],
        cis: ['fis2', 'cis2', 'gis2', 'dis2', 'ais1', 'eis2', 'bis1']
      }
    },
    bass: {
      clefNote: Presto.Note.create({
        name: "f",
        octave: 0,
        isPlaceholder: true
      }),
      clefPosition: -2,
      clefName: "clefs.F",
      keySignatures: {
        ces: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1', 'ces0', 'fes0'],
        ges: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1', 'ces0'],
        des: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1'],
        as:  ['bes-1', 'es0', 'as-1', 'des0'],
        es:  ['bes-1', 'es0', 'as-1'],
        bes: ['bes-1', 'es0'],
        f:   ['bes-1'],
        c:   [],
        g:   ['fis0'],
        d:   ['fis0', 'cis0'],
        a:   ['fis0', 'cis0', 'gis0'],
        e:   ['fis0', 'cis0', 'gis0', 'dis0'],
        b:   ['fis0', 'cis0', 'gis0', 'dis0', 'ais0'],
        fis: ['fis0', 'cis0', 'gis0', 'dis0', 'ais0', 'eis0'],
        cis: ['fis0', 'cis0', 'gis0', 'dis0', 'ais0', 'eis0', 'bis-1']
      }
    }
  }

});


// /*globals CanvasMusic, console*/

// // idea: what if we do the layout objects that are part of the staff relative to the
// // staff positions? That would make it easier to dynamically adjust the staffs vertical position
// // without having to recalculate all vertical positions of all elements...
// // the horizontal calculation can still be absolute...
// //
// // The idea is interesting, because it goes completely down to the Grob level.
// // Meaning: a grob can have childGrobs. If the

// CanvasMusic.Staff = CanvasMusic.Grob.extend({

//   // a staff will always need to be left aligned
//   horizontalAlign: SC.ALIGN_LEFT,

//   key: "c", // by default no accidentals at the clef (not implemented yet)

//   time: "4/4", // by default 4/4 (not implemented yet)

//   clef: "treble", // by default a treble clef (this should not be used, because of mixins... left in for now)

//   hideClef: false, // set to true to remove the clef (no space reserved)

//   clefIsTransparent: false, // set to true to remove the clef (space reserved),

//   parent: null, // what object is the parent? (DEPRECATE?)

//   cm: null, // parent instance of CanvasMusic

//   hasBarLine: false, // should we draw the barline ourselves?

//   numberOfLines: 5, // default number of lines in the staff

//   staffLineThickness: 1, // default setting for thickness of staff lines

//   notes: null, // array where the notes / barlines to create should be put

//   // default value of the cursorSize. the cursor size is the smallest note value
//   // by which the notation cursor will progress. see score.js
//   cursorSize: function () {
//     return this.getPath('parentGrob.cursorSize');
//   }.property().cacheable(),

//   automaticBarLines: false, // yes we can do automatic barlines, because of the sync

//   // by default: take over the settings from Score (the parent)
//   size: function () {
//     return this.getPath('parentGrob.size');
//   }.property('parentScore').cacheable(),

//   fontSize: function () {
//     return this.getPath('parentGrob.fontSize');
//   }.property('parentScore').cacheable(),

//   skipWidth: true, // vital, otherwise staffs are not drawn in parallel

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     // figure out a way to check the validity of this.cursorSize
//     // it needs to be a power of 2.
//     // set up the staff lines
//     this.createStaffLines();
//     this.createClef();
//     this.createKeySignature();
//     this.createTimeSignature();
//     this._generateNotationCache();
//   },

//   clefNote: function () {
//     return CanvasMusic.Staff.clefs[this.get('clef')].clefNote;
//   }.property('clef'),

//   clefLine: function () {
//     return CanvasMusic.Staff.clefs[this.get('clef')].clefLine;
//   }.property('clef'),

//   clefName: function () {
//     return CanvasMusic.Staff.clefs[this.get('clef')].clefName;
//   }.property('clef'),

//   timeSignature: function () {
//     var validBeatTypes = [1, 2, 4, 8, 16];
//     var time = this.get('time');
//     if (!time || (time.indexOf("/") === -1)) {
//       throw new Error("CanvasMusic.Staff: Invalid time signature");
//     }
//     var sign = time.split("/");
//     var numBeats = parseInt(sign[0], 10);
//     var beatType = parseInt(sign[1], 10);
//     if (validBeatTypes.indexOf(beatType) === -1) {
//       throw new Error("CanvasMusic.Staff: Invalid beat type: " + beatType);
//     }
//     return {
//       numberOfBeats: numBeats,
//       beatType: beatType
//     };
//   }.property('time').cacheable(),

//   numberOfBeatsPerBar: function () {
//     return this.get('timeSignature').numberOfBeats;
//   }.property('time').cacheable(),

//   beatType: function () {
//     return this.get('timeSignature').beatType;
//   }.property('time').cacheable(),

//   keySignature: function () {
//     return CanvasMusic.Staff.clefs[this.get('clef')].keySignatures[this.get('key')];
//   }.property('key').cacheable(),

//   createStaffLines: function () {
//     // staff lines are drawn based on the fontSize and size
//     // we start at top : 0 and take width for now as the width of the staff...
//     var y = 0;
//     var lineThickness = this.get('staffLineThickness');
//     var numLines = this.get('numberOfLines');
//     var lineIndex = numLines;
//     var size = this.get('size');
//     for(var i = 0; i < numLines; i += 1) {
//       this.addChildGrob(CanvasMusic.Line.create({
//         y: y,
//         x: 0,
//         lineWidth: lineThickness,
//         width: this.get('width'),
//         skipWidth: true,
//         height: lineThickness,
//         isStaffLine: true, // add a flag, so we can easily find it later
//         lineIndex: lineIndex // top line is heighest number, ending with 1 for the bottom line
//       }));
//       y += size - lineThickness; // only take the distance itself, and correct for the line thickness
//       lineIndex -= 1;
//     }
//     //this.set('bottom', y);
//   },

//   createClef: function () {
//     var clefName = this.get('clefName');
//     var mix = {
//       cm: this.get('cm'),
//       parentStaff: this
//     };
//     var c = CanvasMusic.Column.create(mix, {
//       parentGrob: this,
//       marginLeft: this.getPath('cm.size') * 0.5,
//       marginRight: this.getPath('cm.size') * 0.5,
//     });
//     c.addChildGrob(CanvasMusic.Symbol.create({
//       cm: this.get('cm'),
//       parentStaff: this,
//       parentGrob: c,
//       name: clefName,
//       y: this.topOfStaffLineFor(this.get('clefLine'))
//     }));
//     this.addChildGrob(c);
//   },

//   createTimeSignature: function () {
//     //var ts = this.get('timeSignature');
//     var mix = { cm: this.get('cm'), parentStaff: this };
//     var c = CanvasMusic.Column.create(mix, {
//       parentGrob: this,
//       //marginLeft: this.getPath('cm.size') * 0.25,
//       marginRight: this.getPath('cm.size') * 0.5
//     });
//     var top = CanvasMusic.Symbol.create(mix, {
//       name: this.get('numberOfBeatsPerBar').toString(),
//       y: this.topOfStaffLineFor(3),
//       parentGrob: c,
//       skipWidth: true
//     });
//     var bottom = CanvasMusic.Symbol.create(mix, {
//       name: this.get('beatType').toString(),
//       y: this.topOfStaffLineFor(1),
//       parentGrob: c,
//       //skipWidth: true
//     });
//     c.addChildGrob(top);
//     c.addChildGrob(bottom);
//     this.addChildGrob(c);
//   },

//   createKeySignature: function () {
//     var ks = this.get('keySignature');
//     var c = CanvasMusic.Grob.create({
//       isKeySignature: true,
//       cm: this.get('cm'),
//       parentGrob: this,
//       parentStaff: this,
//       marginRight: 10
//     });
//     // ks is an array with all note names where we have to put a
//     ks.forEach(function (k) {
//       // let's make a noteGrob and remove the noteshape grob
//       var l = k.length;
//       var o = k.indexOf("-");
//       var name, octave;
//       if (o > -1) {
//         name = k.substr(0, o);
//         octave = parseInt(k.substr(o), 10);
//       }
//       else {
//         name = k.substr(0, l - 1);
//         octave = parseInt(k.substr(l - 1), 10);
//       }

//       var n = CanvasMusic.Note.create({
//         name: name,
//         octave: octave,
//         length: 4,
//         parentStaff: this,
//         parentGrob: this,
//         cm: this.get('cm')
//       });
//       var a = n.childGrobs.findProperty('isAccidental').set('parentGrob', c).set('marginLeft', 0).set('marginRight', 0);
//       c.addChildGrob(a);
//       n.destroy();
//     }, this);
//     this.addChildGrob(c);
//   },

//   topOfStaffLineFor: function (staffLineNumber) {
//     var staffLine = this.childGrobs.findProperty('lineIndex', staffLineNumber);
//     if (staffLine) return staffLine.y;
//     else throw new Error("CanvasMusic.Staff#topOfStaffLineFor: unknown staffLineNumber: " + staffLineNumber);
//   },

//   _noteIndexes: null,

//   // to calculate the index for the middle note
//   middleNoteIndex: function () {
//     var numStaffLines = this.get('numberOfLines');
//     var clefLine = this.get('clefLine');
//     // we need the middle of the staff lines, which is 3 for 5 lines, 2.5 for 4 lines (between line 2 and 3)
//     // so...
//     var diffWithMiddleStaff = (((numStaffLines + 1) / 2) - clefLine) * 2;
//     return diffWithMiddleStaff;
//   }.property('clef'),

//   indexFor: function (note) {
//     var clefNote = this.get('clefNote');
//     return CanvasMusic.Note.distanceBetween(clefNote, note);
//   },

//   numberOfHelperLinesFor: function (note) {
//     // calculate how many helper lines we are going to need
//     // returns -1 for one line under the staff, 1 for one line above the staff
//     var absPos =  this.absoluteStaffPositionFor(note);
//     var staffTop = this.get('staffTopPosition');
//     var staffBottom = this.get('staffBottomPosition');
//     var diff;
//     if (absPos >= staffBottom && absPos <= staffTop) {
//       return 0;
//     }
//     else if (absPos > staffTop) {
//       diff = absPos - staffTop;
//     }
//     else diff = absPos - 1;

//     return Math.trunc(diff/2);
//   },

//   // returns the absolute position in the staff vertically
//   // index 0 is the lowest note under the first line
//   absoluteStaffPositionFor: function (note) {
//     var noteIndex = this.indexFor(note);
//     //noteIndex is calculated from the clef line
//     return noteIndex + (this.get('clefLine') * 2) - 1;
//   },

//   staffTopPosition: function () {
//     // first line is 1, second is 3, third is 5, fourth is 7, fifth is 9
//     return (this.get('numberOfLines') * 2) - 1;
//   }.property('numberOfLines'),

//   staffBottomPosition: 0,

//   // calculates the y position in the current staff
//   // was getNoteTop in the original plain JS implementation
//   // what it does is take the top value of the clef line,
//   // computes the difference in steps between the clef note and the current one
//   // adds it to the startTop, and corrects for the lineWidth
//   verticalOffsetFor: function (note) {
//     // we have to invert because index is higher with higher notes, but top works the other way around

//     var noteIndex = this.indexFor(note) * -1;
//     var vDistance = this.get('size') / 2;
//     var clefLine = this.get('clefLine');
//     var startTop = this.childGrobs.findProperty('lineIndex', clefLine).y;
//     // we know clefLine === note index 0

//     var lineCorrection = noteIndex * (this.get('staffLineThickness') / 2);
//     return startTop + (noteIndex * vDistance) - lineCorrection;

//   },

//   // PreCalculation: the part of the notation process which processes and layouts everything
//   // before the actual rendering round

//   // parses a hash into a CanvasMusic object...

//   parseHash: function (hash, column) {
//     if (!hash) return; // don't parse anything invalid
//     var name = hash.name;
//     var staffBottomPosition = this.topOfStaffLineFor(1);
//     var staffTopPosition = this.topOfStaffLineFor(this.get('numberOfLines'));

//     if (!name) {
//       console.log(this._notationCache);
//       throw new Error("something fishy....");
//     }
//     var ret;
//     var mix = {
//       parentGrob: column,
//       parentStaff: this,
//       cm: this.get('cm'),
//     };
//     if (CanvasMusic.Barline.isBarline(name)) {
//       ret = CanvasMusic.Barline.create(mix, {
//         type: name,
//         y: staffTopPosition,
//         height: staffBottomPosition
//       });
//     }
//     else if (name === "rest") { // hardcoded for now
//       ret = CanvasMusic.Rest.create(mix, hash);
//     }
//     else { // assume a note for now
//       ret = CanvasMusic.Note.create(mix, hash);
//     }
//     if (hash.markup) {
//       ret = [ret]; // make it into an array
//       var markupHash = {
//         y: hash.markupDown ? staffBottomPosition: staffTopPosition,
//         markup: hash.markup
//       };
//       if (hash.markupDown !== undefined) markupHash.markupDown = hash.markupDown;
//       if (hash.markupAlign !== undefined) markupHash.markupAlign = hash.markupAlign;
//       // the skipWidth functionality on markups sadly doesn't work correctly
//       // so disabled for now. It needs looking up the previous column in order to detect
//       // a markup collision
//       //if (hash.markupSkipWidth !== undefined) markupHash.skipWidth = hash.markupSkipWidth;
//       ret.push(CanvasMusic.Markup.create(mix, markupHash));
//     }
//     return ret;
//   },

//   // parseEvent: parses an event, returns a grob with all elements parsed
//   parseEvent: function (event) {
//     if (!event) return; // undefined when no event, so skip.
//     var ret = CanvasMusic.Column.create({ cm: this.get('cm'), parentStaff: this, parentGrob: this });
//     var adder = function (p) {
//       if (SC.typeOf(p) === SC.T_ARRAY) p.forEach(ret.addChildGrob, ret);
//       else ret.addChildGrob(p);
//     };

//     if (SC.typeOf(event) === SC.T_ARRAY) { // we have a block with multiple events
//       event.map(function (e) {
//         return this.parseHash(e, ret);
//       }, this).forEach(adder, ret);
//     }
//     else if (SC.typeOf(event) === SC.T_HASH) {
//       adder(this.parseHash(event, ret));
//     }
//     else {
//       throw new Error("CanvasMusic.Staff#parseEvent: invalid event type found: " + SC.inspect(event));
//     }
//     return ret;
//   },


//   // advanceCursor:
//   // What it does is to advance the cursor by a certain note length (usually minimum).
//   // length is currently ignored, and might be for future use...
//   // when it advances it parses the event, and adds the grob to the childGrobs
//   advanceCursor: function (length) {
//     //var curEvent;
//     if (!this._notationCache) throw new Error("CanvasMusic.Staff#advanceCursor: Something is wrong, no _notationCache?");
//     if (this._currentCursorAt >= this._notationCache.length) {
//       this.set('doneParsing', true); // some indicator... (statecharts !!!)
//       return;
//     }
//     this._currentCursorAt += 1;
//     var grob = this.parseEvent(this._notationCache[this._currentCursorAt]);
//     if (grob) this.addChildGrob(grob); // don't add undefined stuff
//     return grob;
//   },

//   addBarline: function (barlinetype) {
//     SC.Logger.log("adding barline type ", barlinetype);
//     var barline = this.parseEvent( { name: barlinetype });
//     if (barline) this.addChildGrob(barline);
//     return barline;
//   },

//   toString: function () {
//     return "CanvasMusic.Staff %@".fmt(SC.guidFor(this));
//   },

//   _currentCursorAt: null, // for caching the current cursor index

//   _notationCache: null,

//   // _generateNotationCache
//   _generateNotationCache: function () {
//     // what this does is generate an array based on the cursorSize. The array is a sparse array,
//     // containing only events at the marker where the events take place

//     //
//     var ret = [];
//     var cursorSize = this.get('cursorSize');
//     var n = this.get('notes');
//     // where to put the barlines... the problem is that the barline does not have a length as such
//     // the best seems to be to put it on the note coming after... Let's do that for now...

//     // we need to take into account, that an array could be exist in notes
//     // but how to deal with an array (chord) having notes with different lengths...
//     // it is easy, actually, because you just take the shortest one, because there should be a
//     // note next to it in the end (this is most likely why you'd want voices :) )
//     var numNotes = n.length;
//     var curNote, curLength, block;
//     for (var i = 0; i < numNotes; i += 1) {
//       curNote = n[i];
//       if (SC.typeOf(curNote) === SC.T_ARRAY) {
//         curLength = curNote.getEach('length').get('@max'); // smallest note value is largest number
//       }
//       else curLength = curNote.length; // this catches both an array as well as a hash... (is this clever?)
//       if (!curLength) { // not a note or rest, assume that it is something that needs to be attached to the next note
//         //isBarLine = CanvasMusic.Barline.isBarLine(curNote);
//         if (!block) block = [];
//         block.push(curNote);
//         continue; // skip to the next round
//       }
//       if (curLength) { // is a note or rest, or a
//         if (block) {
//           if (SC.typeOf(curNote) === SC.T_ARRAY) {
//             block = block.concat(curNote);
//           }
//           else block.push(curNote);
//           ret.push(block);
//           block = null; // reset block
//         }
//         else ret.push(curNote);
//         // adds 15 when curNote.length === 1
//         // adds 7 when curNote.length === 2
//         // we need to take into account any dots
//         ret.length += (cursorSize / curLength) - 1;
//       }
//     }
//     //
//     //console.log(ret);
//     this._notationCache = ret;
//     this._numberOfEvents = ret.length; // used by the score to know how many times to call the advanceCursor function
//     //always reset counter (what to do with the perhaps already existing content of childGrobs?)
//     this._currentCursorAt = -1;
//   }
// });


// SC.mixin(CanvasMusic.Staff, {

//   // information about clefs
//   // we also define the key signatures here, in order not to have to calculate the octaves etc
//   clefs: {
//     treble: {
//       clefNote: CanvasMusic.Note.create({
//         name: "g",
//         octave: 1,
//         isPlaceholder: true
//       }),
//       clefLine: 2,
//       clefName: "clefs.G",
//       keySignatures: {
//         ces: ['bes1', 'es2', 'as1', 'des2', 'ges1', 'ces2', 'fes1'],
//         ges: ['bes1', 'es2', 'as1', 'des2', 'ges1', 'ces2'],
//         des: ['bes1', 'es2', 'as1', 'des2', 'ges1'],
//         as:  ['bes1', 'es2', 'as1', 'des2'],
//         es:  ['bes1', 'es2', 'as1' ],
//         bes: ['bes1', 'es2'],
//         f:   ['bes1'],
//         c:   [],
//         g:   ['fis2'],
//         d:   ['fis2', 'cis2'],
//         a:   ['fis2', 'cis2', 'gis1'],
//         e:   ['fis2', 'cis2', 'gis1', 'dis2'],
//         b:   ['fis2', 'cis2', 'gis2', 'dis2', 'ais1'],
//         fis: ['fis2', 'cis2', 'gis2', 'dis2', 'ais1', 'eis2'],
//         cis: ['fis2', 'cis2', 'gis2', 'dis2', 'ais1', 'eis2', 'bis1']
//       }
//     },
//     bass: {
//       clefNote: CanvasMusic.Note.create({
//         name: "f",
//         octave: 0,
//         isPlaceholder: true
//       }),
//       clefLine: 4,
//       clefName: "clefs.F",
//       keySignatures: {
//         ces: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1', 'ces0', 'fes0'],
//         ges: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1', 'ces0'],
//         des: ['bes-1', 'es0', 'as-1', 'des0', 'ges-1'],
//         as:  ['bes-1', 'es0', 'as-1', 'des0'],
//         es:  ['bes-1', 'es0', 'as-1'],
//         bes: ['bes-1', 'es0'],
//         f:   ['bes-1'],
//         c:   [],
//         g:   ['fis0'],
//         d:   ['fis0', 'cis0'],
//         a:   ['fis0', 'cis0', 'gis0'],
//         e:   ['fis0', 'cis0', 'gis0', 'dis0'],
//         b:   ['fis0', 'cis0', 'gis0', 'dis0', 'ais0'],
//         fis: ['fis0', 'cis0', 'gis0', 'dis0', 'ais0', 'eis0'],
//         cis: ['fis0', 'cis0', 'gis0', 'dis0', 'ais0', 'eis0', 'bis-1']
//       }
//     }
//   }

// });



/*globals Presto*/

/*
  A score wraps a piece of notation and displays it onto a canvas element.
 */

Presto.Score = Presto.Object.extend({

  /**
   * The canvas element on which the score will be drawn
   * @type {[type]}
   */
  canvas: null,

  /**
   * The default fontSize in points
   * @type {[type]}
   */
  fontSize: 32,

  /**
   * The default staff space in pixels
   * @type {Number}
   */
  //size: 6,
  size: function () {
    return this._pt2px(this.get('fontSize'));
  },

  /**
   * Width of the canvas element
   * @type {Number}
   */
  width: null,

  /**
   * Height of the canvas element
   * @type {Number}
   */
  height: null,

  /**
   * cursorSize is the smallest rhythmical size allowed. It is also the step size with which the
   * notation will be parsed
   * @type {Number}
   */
  cursorSize: 16,

  init: function () {
    var canvas = this.canvas;
    if (!canvas) {
      Presto.warn("Presto.Score: no canvas element set on init");
    }
    else {
      this._initCanvas();
    }

    this._rootGrob = Presto.Grob.create({
      x: 0,
      y: 0,
      isContainer: true
    });
  },

  /**
   * Function which parses the given array containing the musical information
   * @param  {Array} notation The notation which is a collection of staffs
   * @return {Presto.Score}          current instance
   */
  parse: function (notation) {
    if (this._rootGrob) { // we are asked to parse again, remove rootgrob
      this._rootGrob.childGrobs = null;
    }
    var size = this.get('size');
    if (!size) throw new Error("No size set on Presto.Score");
    var staffDistance = this.staffDistance;
    if (!staffDistance) this.staffDistance = staffDistance = 16 * size;
    var vOffset = 4 * size;
    var s = this._staffs = Presto.Array.create(notation.staffs.map(function (s, i) {
      var obj = Presto.mixin(s, {
        x: 0,
        y: vOffset + (i * staffDistance),
        width: this.get('width'),
        parentGrob: this._rootGrob,
        score: this
      });
      return Presto.Staff.create(obj);
    }, this));
    this._rootGrob.addChildGrobs(s);
  },

  /**
   * This function will start the actual notation process. It walks through the notation in the smallest
   * rhythmical steps and aligns everything where necessary
   */
  notate: function () {
    var staffs = this._staffs,
        stepSize = this.get('cursorSize'),
        maxEvents = 1, // default, walk through it once
        i, notatedObjects;

    var advanceStaff = function (s) {
      var ret = s.advanceCursor(1);
      if (s._numberOfEvents > maxEvents) {
        maxEvents = s._numberOfEvents;
      }
      return ret;
    };

    // Stepping through all staffs at once. For every step all staffs are advanced.
    // When the staff has created a notation element, it will be returned.
    // When all staffs have been advanced, the elements will be aligned.
    // it is required to advance all staffs at least once
    for (i = 0; i < maxEvents; i += 1) {
      notatedObjects = staffs.map(advanceStaff);
    }
    //console.log(staffs.getEach('y'));
    this._adjustStaffSpacing();
  },

  _adjustStaffSpacing: function () {
    // after everything has been notated, we need to check the vertical space of the staffs
    // the first staff is offset by a default value, against 0
    // The calculation checks whether the staff (assuming center 0) on y has enough space to display maxTop
    // what I need to compensate for is the relative position here and the maxTop which is calculated from 0
    var staffs = this._staffs;
    var staffSpace = this.get('size');
    var prevCenter = 0;
    staffs.forEach(function (s, i) {
      var nextStaff = staffs[i + 1];
      var maxTop = s.get('maximumTopOffset');
      var maxBottom = s.get('maximumBottomOffset');
      var diff = s.y + maxTop - prevCenter; // maxTop is negative by default
      if (diff < 0) {
        s.y -= diff - (2*staffSpace);
      } // headroom
      if (nextStaff) { // check whether the center of the next staff is far enough away to
        diff = nextStaff.y - s.y - maxBottom; // maxBottom is positive by default
        if (diff < 0) {
          nextStaff.y += maxBottom + (2*staffSpace);
        }
      }
      prevCenter = s.y;
    });
  },

  /**
   * This function will start the rendering on the canvas element
   */
  render: function () {
    // before rendering, blank the canvas element
    this.clear();
    var absPos = this._rootGrob.render(0,0);
    absPos.forEach(function (g) {
      g.render(this._ctx);
    }, this);
  },

  /**
   * Clear the canvas element
   */
  clear: function () {
    var canvas = this.canvas;
    this._ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  /* PRIVATE */

  /**
   * Initializes the canvas element and sets the 2D rendering context
   */
  _initCanvas: function () {
    var canvasElement;
    var canvas = this.canvas;
    if (typeof canvas === "string") { // we need to get the element
      canvasElement = document.getElementById(canvas);
      if (!canvasElement) throw new Error("Cannot find the canvas element with id " + canvas);
      this.canvas = canvas = canvasElement;
    }
    // check whether the style of the canvas element contains the font
    canvas.style.fontFamily = 'Emmentaler26';
    canvas.style.fontSize = this.fontSize + "pt";
    this._ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.initFontInfo();
  },

  /**
   * the rendering context
   * @type {Canvas.2DContext}
   */
  _ctx: null,

  /**
   * Function to calculate a size in pixels to a size in points
   * @param  {Number} val in pixels
   * @return {Number}     points
   */
  _px2pt: function (val) {
    return val * (16/3);
  },

  /**
   * Function to calculate a size in points to a size in pixels
   * @param  {Number} val in points
   * @return {Number}     pixels
   */
  _pt2px: function (val){
    return val * (3/16);
  },

  /**
   * Initializes and caches all font information. Needs to be rerun after fontSize changes
   */
  initFontInfo: function () {
    var fI = Presto.fetaFontInfo;
    var fM = Presto.fetaFontMetrics;
    var ctx = this._ctx;
    ctx.font = this.get('fontSize') + "pt Emmentaler26";
    Object.keys(fI).forEach(function (k) {
      var val = String.fromCharCode(fI[k]);
      fI[k] = val;
      fM[k] = ctx.measureText(val);
    });
  }

});


Presto.Score.mixin({
  /**
   * Convenience method to create a Score object from a canvas element
   * @param  {HTML CanvasElement} canvas the canvas element that should be used
   * @return {Presto.Score instance}        the instance of the Score object
   */
  from: function (canvas) {
    return Presto.Score.create({
      canvas: canvas
    });
  }
});

///*globals CanvasMusic */





// the difficulty in music notation is that things need to be aligned vertically, while only having
// horizontal significance. So, elements need to be added horizontally, and then somehow aligned vertically.
// I am not entire sure how Lilypond achieves this, except that it has to do with the Bar Engraver, and that it will
// synchronize relative to the "beat".
// Normally, Lilypond will force everything to be in the same meter, and set things accordingly. When using a polymetric
// approach (say 3/4 and 4/4), certain engravers have to be moved from the score context to the staff context.
// In way, in case of a 3/4 and 4/4, the quarter notes that should come together should be vertically aligned.
// If we would copy the Lilypond behaviour to the letter, the best API way to achieve this would be to use mixins
// where the processing part is done with a mixin.
//
// All this writing is because I needed to figure out a way to have one calculation round and then one process /
// render round. This would make it easy to have everything calculated and then just start the render at
// the top, and everything underneath got called. It saves having to move something that is already rendered
// onto the canvas.
//
// The original implementation of CanvasMusic was simply to have each staff write out its notes without looking
// at the other staffs. If a synchronization between staffs needs to be done, the only way to make that work is
// to walk through the staffs on a basis of note values. As the lowest value supported (at the moment) is a 16th
// we can move every staff forward one 16th, which is the so called cursorSize.
// Every staff will generate a notationCache from the notes it is given, which is an array of notation events.
// This array is essentially a sparse array, because it is en event list where the 16th is the index.
// If there isn't anything to do the advanceCursor(length) function will return false, otherwise it will return
// ...
// The easiest would be to have advanceCursor return a Grob (relative to the staff) containing the elements notated
// (reason is that sometimes more than just a note gets created. Think of barlines, lyrics, dynamics etc... (markup can
// be ignored for that matter)).
//
// This Grob could be automatically added to the staff childGrobs, but it would allow the score context (which oversees
// the notation process) to adjust the position of that grob forward or backward, moving all elements of that
// block in the process...

// If there is nothing to process for that staff, we continue with the next one.
//


// CanvasMusic.Score = CanvasMusic.Grob.extend({

//   staffs: null,

//   staffDistance: null,

//   cursorSize: 16, // the smallest note size we allow

//   parent: null, // hook where the CanvasMusic instance will be

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     var staffs = this.get('staffs');
//     if (staffs) {
//       // create staffs out of the data
//       this.parse(staffs);
//     }
//   },

//   toString: function () {
//     return "CanvasMusic.Score x: %@, y: %@".fmt(this.get('x'), this.get('y'));
//   },

//   size: function () {
//     return this.getPath('parent.size');
//   }.property('parent').cacheable(),

//   fontSize: function () {
//     return this.getPath('parent.fontSize');
//   }.property('parent').cacheable(),

//   parse: function (staffs) { // start the parsing of all the content
//     var size = this.getPath('parent.size');
//     if (!size) throw new Error("No size set on parent");
//     if (!this.staffDistance) this.staffDistance = 10 * size;
//     var vOffset = 4 * size;
//     var staffDistance = this.staffDistance;
//     var s = this._staffs = staffs.map(function (s, i) {
//       return CanvasMusic.Staff.create({
//         x: 0,
//         y: vOffset + (i * staffDistance),
//         width: this.get('width'),
//         notes: s.notes,
//         parentGrob: this,
//         cm: this.get('parent'),
//         clef: s.clef,
//         time: s.time,
//         key: s.key
//       });
//     }, this);

//     // now start the advancing...
//     // we take the max length:
//     var numEventsPerStaff = s.getEach('_numberOfEvents');
//     var numStaffs = s.get('length');
//     var max = numEventsPerStaff.get('@max'); // I love SC :)
//     var g, i, j, tmp;
//     var cursorSize = this.get('cursorSize');
//     var alignCache = [];

//     for (i = 0; i < max; i += 1) { // num events
//       if (i % cursorSize === 0 && i !== 0) { // time for a barline
//         //tmp = [];
//         for (j = 0; j < numStaffs; j += 1) {
//           if (i < numEventsPerStaff[j]) {
//             // write barline
//             g = s[j].addBarline(CanvasMusic.Barline.T_SINGLE);
//           }
//           //tmp.push(g);
//         }
//         //alignCache.push(tmp);
//       }
//       tmp = [];
//       for (j = 0; j < numStaffs; j += 1) { // yes a forEach could have worked...
//         if (i < numEventsPerStaff[j]) {
//           g = s[j].advanceCursor(); // returns a column if something was added
//           if (g) tmp[j] = g;
//         }
//       }
//       alignCache.push(tmp);
//     }

//     if (s.length > 1) {
//       var lastStaff = s.get('lastObject');
//       var staffHeight = lastStaff.y - (lastStaff.get('numberOfLines') * lastStaff.get('staffLineThickness'));
//       this.addChildGrob(CanvasMusic.Line.create({
//         y: vOffset,
//         height: staffHeight,
//         lineWidth: 4
//       }));
//     }
//     s.forEach(this.addChildGrob, this);
//     this._alignCache = alignCache;
//     this.invokeNext('performStaffAligning');
//      //console.log("Score: " + this.childGrobs.getEach('y'));
//   },

//   performStaffAligning: function () {

//     // this alignment is done as last stage before the actual process of rendering.
//     // This is because the first stage is the processing of the events into objects,
//     // then the columns and stacking is done
//     // and then comes the aligning between the staves...
//     // So... essentially, we need to walk through the same procedure as the processing,
//     // as in that we walk through the staves based on the rhythmical grid,
//     // and stretch anything based on the alignment in th rhythmical grid. This means that
//     // staves where nothing exists at that moment, should still add the width of the current processed grobs
//     //

//     // now the alignment
//     // the alignment consists of a few elements:
//     // - the note head alignment: aligning all the vertical columns to the right most
//     //   note head (marginLeft adjustment)
//     // - the width alignment: if one column is wider than the others, the other columns must
//     //   be moved in order for the note head alignment to make sense
//     //
//     // we also need to align the key signatures
//     //debugger;
//     var kS = this._staffs.getEach('childGrobs').flatten().filterProperty('isKeySignature');
//     var ksMax = kS.getEach('width').get('@max');
//     kS.forEach(function (k) {
//       var diff = ksMax - k.get('width');
//       k.move('marginRight', diff);
//     });



//     // we have to step through the staves one event at a time, the issue is that we cannot know
//     // which events are to be aligned, unless we keep some record from the parsing process
//     // That record is build up in this._alignCache, which contains per insertion moment everything that needs to be
//     // aligned.

//     // the align cache either contains barlines or columns (barlines are now ignored first, because they
//     // should be aligned automatically if the rest is... (?))

//     // what should happen is that we check when the different staves will have another element simultaneously...?
//     // Or we should indeed walk through
//     //
//     this._alignCache.forEach(function (cache) {
//       //cache is an array
//       var maxWidth = cache.getEach('width').get('@max');
//       cache.forEach(function (col) {
//         var diff = maxWidth - col.get('widthOfChildGrobs') + this.get('size');
//         col.move('marginLeft', diff);
//       }, this);
//     }, this);


//     // var noteLefts, maxNoteLeft, columnWidths, maxColumnWidth;
//     // var adjustMargins = function (c, i) {
//     //   if (c.get('isColumn')) { // don't try to align anything else
//     //     var diff = maxNoteLeft - noteLefts[i];
//     //     c.set('marginLeft', diff);
//     //   }
//     // };



//     //noteLefts = tmp.getEach('firstNoteLeft').without(undefined); // calculating once is enough



//     // if (noteLefts.length > 1) {
//     //   //debugger;
//     //   //maxNoteLeft = noteLefts.get('@max');
//     //   //tmp.forEach(adjustMargins);
//     //   // columnWidths = tmp.getEach('width'); // take into account the changes performed in the aligning
//     //   // maxColumnWidth = columnWidths.get('@max');

//     // }
//   }

// });
