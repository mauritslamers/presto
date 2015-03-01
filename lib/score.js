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
