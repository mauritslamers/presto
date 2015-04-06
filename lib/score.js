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

  /**
   * The language recognized for note names, currently "nl" and "en" are supported
   * @type {String}
   */
  language: "nl",

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
      isContainer: true,
      score: this
    });
  },

  /**
   * Function which parses the given array containing the musical information
   * @param  {Array} notation The notation which is a collection of staffs
   * @return {Presto.Score}          current instance
   */
  parse: function (notation) {
    this.initFontInfo();
    if (this._rootGrob) { // we are asked to parse again, remove rootgrob
      this._rootGrob.childGrobs = null;
    }
    var size = this.get('size');
    if (!size) throw new Error("No size set on Presto.Score");
    var staffDistance = this.staffDistance;
    if (!staffDistance) this.staffDistance = staffDistance = 16 * size;
    var vOffset = 4 * size;
    var s = this._staffs = Presto.Array.create(notation.staffs.map(function (s, i) {
      return Presto.Staff.create(s, {
        x: 0,
        y: vOffset + (i * staffDistance),
        width: this.get('width'),
        score: this
      });
    }, this));
    this._rootGrob.addChildGrobs(s);
    this._notate();
  },

  /**
   * This function will start the actual notation process. It walks through the notation in the smallest
   * rhythmical steps and aligns everything where necessary
   */
  _notate: function () {
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
        s.y -= diff - (2 * staffSpace);
      } // headroom
      if (nextStaff) { // check whether the center of the next staff is far enough away to
        diff = nextStaff.y - s.y - maxBottom; // maxBottom is positive by default
        if (diff < 0) {
          nextStaff.y += maxBottom + (2 * staffSpace);
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

    var absPos = this._rootGrob.render(0, 0);
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
    // canvas.style.fontFamily = 'Emmentaler26';
    // canvas.style.fontSize = this.fontSize + "pt";
    canvas.style.font = this.get('fontSize') + "pt Emmentaler26";
    this._ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this._ctx.measureText("0"); // force the font to load?
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
    return val * (16 / 3);
  },

  /**
   * Function to calculate a size in points to a size in pixels
   * @param  {Number} val in points
   * @return {Number}     pixels
   */
  _pt2px: function (val) {
    return val * (3 / 16);
  },

  /**
   * Initializes and caches all font information. Needs to be rerun after fontSize changes
   */
  initFontInfo: function () {
    if (Presto.fetaFontInfoBackup) { // we are re-initing, use the backup instead
      Presto.fetaFontInfo = Presto.fetaFontInfoBackup;
    }
    var fIB = Presto.fetaFontInfoBackup = {}; // make a backup
    var fI = Presto.fetaFontInfo;
    var fM = Presto.fetaFontMetrics;
    var ctx = this._ctx;
    ctx.font = this.get('fontSize') + "pt Emmentaler26";
    Object.keys(fI).forEach(function (k) {
      var code = fI[k];
      var val = String.fromCharCode(code);
      fIB[k] = code; // create backup
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

// we have to perform a trick in order to force the webfont to load correctly
// we use the webfontloader.js from the webfontloader folder (which is taken from https://github.com/typekit/webfontloader)
WebFont.load({
  custom: {
    families: ['Emmentaler26']
  },
  fontloading: Presto.Score.fontLoading,
  fontactive: Presto.Score.fontActive,
  fontinactive: Presto.Score.fontInactive
});
