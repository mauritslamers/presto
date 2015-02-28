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
    this._currentX += w + staffSpace * 3;
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


