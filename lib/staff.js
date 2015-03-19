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
    this.addKeySignature();
    this.addTimeSignature();
    this.setTopAndBottomOffsets();
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
      //y: this.get('clefPosition') * staffSpace + this.staffLineThickness
      y: this.calculateVerticalOffsetFor(this.get('clefPosition')) + this.staffLineThickness*3
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

  /**
   * used by the key signature and setVerticalOffsetFor to figure out at what position a specific note
   * name should be put
   * @param  {String|Presto.Note} notename or note instance
   * @param {Number} octave optional: octave, when not called with a note instance
   * @return {Number}          Position in staff
   */
  calculateVerticalPositionFor: function (notename, octave) {
    var note;
    if (typeof notename === "string") {
      note = Presto.Note.create({ isPlaceholder: true, name: notename, octave: octave, length: 4 });
    }
    else note = notename;
    var cnote = this.get('clefNote');
    var cpos = this.get('clefPosition');
    var dist = Presto.Note.distanceBetween(note, cnote);
    var notePos = cpos + dist;
    return notePos;
  },

  _verticalOffsetCache: null,

  /**
   * Calculate/lookup the vertical offset for a note object and set it on the note object.
   * This also sets the number of helper lines on the note.
   * @param  {Presto.Note} note the note for which the vertical offset needs to be calculcated and set
   * @return {Presto.Note}      The adjusted note
   */
  setVerticalOffsetFor: function (note) {
    var notePos = this.calculateVerticalPositionFor(note);
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
    if (note.y < this.maximumTopOffset) this.maximumTopOffset = this.calculateVerticalOffsetFor(notePos-4);
    if (note.y > this.maximumBottomOffset) this.maximumBottomOffset = this.calculateVerticalOffsetFor(notePos+4);
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
   * Set the default maximum top and bottom offsets, as calculated by two spots above the staff and two below
   */
  setTopAndBottomOffsets: function () {
    this.maximumBottomOffset = this.calculateVerticalOffsetFor(8);
    this.maximumTopOffset = this.calculateVerticalOffsetFor(-8);
  },

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

  /**
   * addKeySignature will put up here the current keySignature, which is an array of
   * note names. This is being used by setVerticalOffsetFor to add required naturals or accidentals
   * @type {Array}
   */
  keySignature: null,

  /**
   * add the current time signature, numbers only for the moment
   */
  addTimeSignature: function () {
    var staffSpace = this.score.get('size');
    var c = Presto.TimeSignature.create({
      x: this._currentX,
      numberOfBeatsPerBar: this.get('numberOfBeatsPerBar'),
      beatType: this.get('beatType'),
      score: this.score,
      staff: this.staff
    });
    this.addChildGrob(c);
    this._currentX += c.get('width') + (4*staffSpace);
    return this;
  },

  /**
   * function to add the current key signature
   * there is no key cancellation yet
   */
  addKeySignature: function () {
    var staffSpace = this.score.get('size');
    var key = this.get('key');
    var baseNote, keySig;
    if (key) {
      key = key.trim().split(" ");
      baseNote = key[0];
      if (key.indexOf("minor") > -1) { // not supported yet
        keySig = Presto.Staff.clefs[this.get('clef')].keySignatures[baseNote];
      }
      else {
        keySig = Presto.Staff.clefs[this.get('clef')].keySignatures[baseNote];
      }
      keySig.forEach(function (k) {
        var name = k.slice(0, k.length - 1);
        var oct = parseInt(k.slice(k.length - 1), 10);
        // look up the alteration
        var noteDef = Presto.Note.noteNames.nl[name];
        var alt = noteDef.alteration;
        var pos = this.calculateVerticalPositionFor(name, oct);
        var accname;
        if (alt === 1) accname = "accidentals.sharp";
        else if (alt === -1) accname = "accidentals.flat";
        var symbol = Presto.Symbol.create({
          name: accname,
          score: this.score,
          staff: this,
          x: this._currentX,
          y: this.calculateVerticalOffsetFor(pos) + 2 // unclear why exactly the offset is 2 pixels off
        });
        this.addChildGrob(symbol);
        this._currentX += symbol.get('width');
      }, this);
      this.keySignature = keySig;
    }
    else {
      this.keySignature = Presto.Staff.clefs[this.get('clef')].keySignatures.c;
    }
    // always add a bit of space
    this._currentX += staffSpace * 2;
    this.resetAlterations(); // set the list with current accidentals
  },

  /**
   * This function resets the list with accidentals. This list is required in order to know which
   * notes are going to have accidentals or on which the accidental has to be omitted as they are
   * already part of the key signature. This function is run at the start of every bar as well
   * as when the key signature is added / set (alteration is a better term :) )
   */
  resetAlterations: function () {
    var names = Presto.Note.noteNames.nl.rootNotes;
    var keySig = this.get('keySignature');
    var l = {};
    names.forEach( function (rootName) {
      var acc;
      keySig.forEach(function (a) {
        if (a[0] === rootName) {
          acc = a;
        }
      });
      if (acc) {
        var n = Presto.Note.create({ isPlaceholder: true, name: acc.slice(0, acc.length - 1) });
        l[rootName] = n.get('alteration');
      }
      else {
        l[rootName] = 0;
      }
    });
    this.alterations = l;
  },

  /**
   * The list of current accidentals. It is set by resetAccidentals when a key signature is added as well
   * as at the start of a bar. The list is a hash with the root tones as keys and a number to indicate
   * the offset, where +0.5 is a single sharp, and -0.5 is a single flat.
   * This hash can be adjusted by a note column to indicate that a certain accidental has taken place, which
   * prevents other notes in the same bar to get accidentals
   * @type {Hash}
   */
  alterations: null,

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
   * function to calculate the length of a (dotted) note, where a dotted value
   * is calculated against the scale of 2, 4, 8, 16
   * A note length of 4 with dots will be smaller than 4. In order to keep the exponential scale
   * the dotted value will be expressed as a division against the original value
   * @param  {Hash} notehash the hash containing the note information
   * @return {Number}          Length value expressed as a factor on the exponential length scale
   */
  _calculateLength: function (notehash) {
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

  // voices need to be unfolded and zipped, meaning that where in the voice definitions the
  // rhythmical streams are seperate, they have to be joined in order to notate them properly
  //
  _unfoldVoices: function (arrayOfVoices) {
    // we expect hashes in the form of { name: "voice", voiceNumber: 1, notes: [] }
    // where voiceNumber is optional
    var cursorSize = this.score.cursorSize;
    var voices = Presto.Array.create(arrayOfVoices);
    var numVoices = voices.length;
    // first make sparse arrays, while this is very similar to the generation of the
    // notation cache itself, I don't see atm how I can prevent code duplication
    var voiceNotes = Presto.Array.create();
    voices.forEach(function (v, i) {
      voiceNotes[i] = Presto.Array.create();
      v.notes.forEach(function (n) {
        var l;
        if (Array.isArray(n)) {
          l = Presto.Array.create(n.map(this._calculateLength)).get('@max');
        }
        else l = this._calculateLength(n);
        if (v.voiceNumber) {
          // the stem direction can be done by the note itself based on this
          n.voiceNumber = v.voiceNumber;
        }
        voiceNotes[i].push(n);
        voiceNotes[i].length += (cursorSize / l) - 1;
      }, this);
    }, this);

    // now all notes in rhythmical "order" in voiceNotes, now zip where
    // necessary and add to the cache
    var cursor = 0;
    var max = voiceNotes.getEach('length').get('@max');
    var w;
    for (var i = 0; i < max; i += 1) {
      w = [];
      for (var j = 0; j < numVoices; j += 1) {
        if (voiceNotes[j][i]) {
          w.push(voiceNotes[j][i]);
        }
      }
      if (w.length > 1) {
        this._addNoteEventToNotationCache(w);
      }
      else if (w.length === 1) {
        this._addNoteEventToNotationCache(w[0]); // only one note
      }
    }
  },

  /**
   * Add a note event to the notation cache. Needs to be separate, because if
   * voices are detected, it needs to be able to call itself in order to add
   * the unfolded voices to the cache
   * @param {Hash|Array} noteEvent note event or note events
   */
  _addNoteEventToNotationCache: function (noteEvent) {
    var curLength,
        cache = this._notationCache,
        cursorSize = this.score.cursorSize;

    if (Array.isArray(noteEvent)) {
      //check whether we have voices
      if (Presto.Array.prototype.someProperty.call(noteEvent, 'name', 'voice')) {
        this._unfoldVoices(noteEvent);
      }
      else {
        noteEvent = Presto.Array.create(noteEvent);
        // the smallest note has the biggest number
        curLength = Presto.Array.create(noteEvent.map(this._calculateLength)).get('@max');
      }
    }
    else curLength = this._calculateLength(noteEvent);
    if (curLength) { // ignore no-length events
      cache.push(noteEvent);
      cache.length += (cursorSize / curLength) - 1;
    }
  },

  /**
   * Function to generate the notation cache. This generates a sparse Presto.Array, where all events are spaced
   * with regard to the stepSize / cursorSize. Only rhythmical events are included.
   *
   * @return {Object} this
   */
  _generateNotationCache: function () {
    this._notationCache = Presto.Array.create();
    var cursorSize = this.score.cursorSize;
    var n = this.get('notes');
    n.forEach(this._addNoteEventToNotationCache, this);
    this._numberOfEvents = this._notationCache.length;
    this._currentCursorAt = 0;
    return this;
  },

  /**
   * This function checks whether this staff should draw barlines and if yes, whether
   * the cursor passed a point at which a barline should be drawn. If also yes,
   * it will insert the barline
   */
  checkAndDrawBarline: function () {
    var numBeats = this.get('numberOfBeatsPerBar'),
        beatType = this.get('beatType'),
        cursorSize = this.score.get('cursorSize'),
        prevBarAt = this.get('_previousBarlineAt'),
        cursor = this._currentCursorAt;

    // 4 * (16/4) => 16, 2*(16/2) => 16, 6 * (16/8) => 12
    var numCursorsPerBar = numBeats * (cursorSize / beatType);
    if (cursor - prevBarAt === numCursorsPerBar) {
      //this._currentX -= this.score.get('size');
      this.addChildGrob(Presto.Barline.create({
        x: this._currentX,
        y: this.calculateVerticalOffsetFor(-4),
        toX: this._currentX,
        toY: this.calculateVerticalOffsetFor(4),
        score: this.score,
        staff: this,
        type: Presto.Barline.T_SINGLE
      }));
      this._currentX += this.score.get('size') * 2;
      this._previousBarlineAt = cursor;
    }
  },

  _previousBarlineAt: 0,

  /**
   * The minimum amount in staff spaces to add when a note has been added
   * @type {Number}
   */
  minimumDurationSpace: 0,

  /**
   * Fixed amount of space in staff spaces to add when the duration doubles
   * @type {Number}
   */
  durationSpaceIncrement: 1.5,

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

    // first thing to do: check whether a barline should be drawn
    this.checkAndDrawBarline();

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
    if (w === undefined) { // debugging
      window.RET = ret;
      console.log(ret);
      throw new Error("Object " + ret + " is returning undefined for width??");
    }
    //this._currentX += w + staffSpace * 3;
    this._currentX += w + (this.minimumDurationSpace * staffSpace);
    //debugger;
    var additionalSpace = (this.score.cursorSize / ret.minimumDuration) * this.durationSpaceIncrement;
    additionalSpace *= staffSpace / 2;
    this._currentX += additionalSpace;
    //this._currentX += (this.score.cursorSize / ret.minimumDuration) * this.durationSpaceIncrement * staffSpace;
    // add
    this._currentCursorAt += 1;
    return ret;
  }

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

