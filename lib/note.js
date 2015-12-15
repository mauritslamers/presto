/*globals Presto*/

//TODO: think about creating a mixin which can be used on plain objects to give them note parsing
//options without having to notate anything

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
   * the alteration of the note, -1 for flat, +1 for sharp
   * @type {Number}
   */
  alteration: null,

  /**
   * The alteration of the staff
   * @type {Number}
   */
  staffAlteration: null,

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
    return this.get('stemDirection') === Presto.STEMDIRECTION_UP;
  },

  stemDown: function () {
    return this.get('stemDirection') === Presto.STEMDIRECTION_DOWN;
  },

  /**
   * Sets a default stem direction.
   * It also sets a stem direction on a whole note, but a whole note doesn't draw its stem
   */
  setDefaultStemDirection: function () {
    if (!this.voiceNumber) {
      if (this.get('positionOnStaff') >= 0) {
        this.stemDirection = Presto.STEMDIRECTION_UP;
      }
      else this.stemDirection = Presto.STEMDIRECTION_DOWN;
    }
    else {
      this.stemDirection = (this.voiceNumber % 2) === 1? Presto.STEMDIRECTION_UP : Presto.STEMDIRECTION_DOWN;
    }
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
   * function to return the full length of a (dotted) note, where a dotted value
   * is calculated against the scale of 2, 4, 8, 16
   * A note length of 4 with dots will be smaller than 4. In order to keep the exponential scale
   * the dotted value will be expressed as a division against the original value
   * @param  {Hash} notehash the hash containing the note information
   * @return {Number}          Length value expressed as a factor on the exponential length scale
   */
  fullLength: function () {
    var l = this.length;
    if (!l) return 0;
    if (this.dots && this.dots > 0) {
      // dot 1 is half the value of the original, 1/2
      // dot 2 is half the value of the value added 1/4
      // dot 3 is half the value of the value added last time 1/8 ...etc
      var val = 1, wval = 1;
      for (var i = 0; i < this.dots; i += 1) {
        wval /= 2;
        val += wval;
      }
      l /= val; // rewrite the length as divided value of the original
    }
    return l;
  },

  /**
   * The width of a note is the width of its children
   * @return {Number} [Width in pixels]
   */
  width: function () {
    var ret = 0;
    //debugger;
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
    }, this);
    ret = Math.abs(smallest) + biggest;
    return ret;
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
   * calculates the alteration, and sets it to the note alteration propery, as well
   * as return that value
   * @return {Number} Alteration
   */
  calculateAlteration: function () {
    var name = this.get('name');
    var ret = 0; //Natural
    if (name.indexOf("is") > -1) {
      ret = (name.indexOf("sis") > -1) ? Presto.Note.ALT_DBLSHARP : Presto.Note.ALT_SHARP;
    }
    else if (name.indexOf("s") > -1 || name.indexOf("es") > -1) {
      ret = (name.indexOf("ses") > -1) ? Presto.Note.ALT_DBLFLAT : Presto.Note.ALT_FLAT;
    }
    this.alteration = ret;
    return ret;
  },

  /**
   * Calculate from the name whether this note has an accidental.
   *
   * @return {String|Boolean} false if none, otherwise it returns the character name
   */
  accidentalName: function () {
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
    var whichAcc = this.get('accidentalName'),
        acc;

    if (!whichAcc) return this;
    acc = Presto.Symbol.create({
      x: 0,
      y: 0,
      name: whichAcc,
      score: this.score,
      staff: this.staff
    });
    acc.x = -acc.get('width') * 1.5;
    this.accidental = acc;
    this.addChildGrob(acc);
    return this;
  },

  // accidentals need to be revised a bit, because there are more options than just the
  // accidental belonging to the note name, not in the least when also one or more naturals are
  // required
  // Effectively, the best would be to have a resetAccidental, which first removes the current ones, then
  // insert the new ones.
  // Technically, it would even be better to have the staffAlteration
  // setup with the creation of the note itself, problem of course is that at the moment of creation
  // the note column doesn't know yet what the rootTone of this note will be
  //
  // rules:
  // - if the alteration is the same, check whether there is an accidental involved
  //   and if yes, remove it, unless isNatural is already set, because that means to leave it
  // - else, add naturals until either 0 is reached
  addAlterations: function () {
    var staffAlt = this.get('staffAlteration') || 0; // assume zero if not set
    var alt = this.alteration || this.calculateAlteration();
    var alterations = [];
    var i;
    var accs = [];
    if (staffAlt !== alt) { // only add something when necessary
      if (staffAlt < alt && staffAlt < 0) { // lower, add till note encountered or on 0
        for (i = staffAlt; i < 0; i += 1) {
          if (alt !== i) accs.push("accidentals.natural");
        }
      }
      else if (staffAlt > alt && staffAlt > 0) {
        for (i = staffAlt; i > 0; i -= 1) {
          if (alt !== i) accs.push("accidentals.natural");
        }
      }
      // in both cases: add the normal accidental when there is one
      if (alt !== 0) accs.push(this.get('accidentalName'));
    }
    // now insert the alterations
    var x = 0;
    accs.reverse().forEach(function (a) {
      var acc = Presto.Symbol.create({
        score: this.score,
        staff: this.staff,
        name: a,
        isAccidental: true
      });
      acc.x = x - (acc.get('width') * 1.5);
      x = acc.x;
      this.addChildGrob(acc);
      alterations.push(acc);
    }, this);
    this.alterations = Presto.Array.create(alterations);
  },

  init: function () {
    // look up the name, and set values
    var lang = this.score ? this.score.get('language') : "nl"; // default lang is nl
    var name = this.get('name');
    var h = Presto.Note.noteNames[lang][name];
    if (!h) throw new Error("invalid note name, or invalid language setting");
    // we could do a mixin, but it seems a bit overkill (and possible performance issues)
    // for just two properties.
    this.alteration = h.alteration;
    if (this.alteration === undefined) this.calculateAlteration();
    this.rootTone = h.rootName;
    // assume octave is set differently
    if (this.isPlaceholder) return;

    // the init runs the adding procedure in the same order as the elements are going to appear
    //this.addAccidental();
    this.addAlterations();
    this.addHelperLines(); // helper lines first, as they need to be overwritten
    this.addNoteHead();
    this.addStem();
    this.addDots();
  },

  /**
   * This function updates the layout of the note. Required because some elements can only be done after the
   * note object exists (adding the helper lines for example)
   */
  update: function () {
    // for now, we remove the childGrobs and rerun init,
    // rewrite if it turns out to be a bottle neck performance wise
    this.childGrobs = null;
    if (!this.stemDirection) this.setDefaultStemDirection();
    this.init();
  },

  /**
   * Function to add the note head to the note, and set the _noteHeadWidth property
   */
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
   * Function to add any dots to the note if required
   */
  addDots: function () {
    var dots = this.dots;
    if (!dots) return;

    if (typeof dots !== "number") throw new Error("Dots should be a number");

    var dotObj;
    var staffSize = this.score.get('size');
    var extraOffset = this._noteHeadWidth + staffSize;
    var verticalShift = (this.positionOnStaff % 2) ? 0 : -staffSize;

    for (var i = 0; i < dots; i += 1) {
      dotObj = Presto.Symbol.create({
        staff: this.staff,
        score: this.score,
        name: "dots.dot",
        x: extraOffset,
        y: verticalShift,
        ignoreWidth: true
      });
      extraOffset += dotObj.get('width');
      this.addChildGrob(dotObj);
    }
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

    var helperLineWidth = this._noteHeadWidth / 4;

    helperLines.forEach(function (l) {
      this.addChildGrob(Presto.Line.create({
        x: -helperLineWidth,
        y: l.y,
        toX: this._noteHeadWidth + helperLineWidth,
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

    if (stemUp) pos *= -1;

    if (pos > 4) { // this implementation uses 5 staff spaces, because it looks a bit better
      stemLength = staff.calculateVerticalOffsetFor(pos + 5) - staff.calculateVerticalOffsetFor(pos);
    }
    else if (pos <= 4 && pos >= 0) {
      // not entirely happy with the outcome, as there is still a bit of a jump between the last one here
      // and the first one of the next series
      stemLength = staff.calculateVerticalOffsetFor(pos + 5) - staff.calculateVerticalOffsetFor(pos);
      stemLength += staffSpace * ((7 / 6) - ((1 / 6) * pos));
    }
    else if (pos < 0 && pos > -7) {
      stemLength = staff.calculateVerticalOffsetFor(pos + 7) - staff.calculateVerticalOffsetFor(pos);
    }
    else {
      stemLength = staff.calculateVerticalOffsetFor(0) - staff.calculateVerticalOffsetFor(pos);
    }

    // the position of the stem needs to be corrected for the linewidth, which is now hardcoded here
    var startX = stemUp ? this._noteHeadWidth - 2: this.x;
    var toY = stemUp ? stemLength * -1 : stemLength;

    this.addChildGrob(Presto.Stem.create({
      x: startX + 1, // offset to the right for stem
      y: stemUp ? -1: 1,
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
    if (this.get('length') === 1) return this; // whole notes don't have stems
    var i = this.childGrobs.indexOf(this.childGrobs.findProperty('isStem'));
    this.childGrobs.removeAt(i);
  }

});

Presto.mixin(Presto.Note, {

  /**
   * Alteration enums
   * @type {Number}
   */
  ALT_DBLFLAT: -2,
  ALT_FLAT: -1,
  ALT_NATURAL: 0,
  ALT_SHARP: 1,
  ALT_DBLSHARP: 2,

  // all kinds of calculations with notes, such as intervals etc
  // use note instances if possible (?)

  _noteNames: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],

  // intervals between notes of _noteNames, where index 0 is the distance between noteNames
  // index 0 and 1.
  _noteIntervals: ['T', 'T', 'S', 'T', 'T', 'T', 'S'],

  /**
   * Calculates the distance between two notes diatonically. Zero based.
   * @param  {Presto.Note} noteOne First note
   * @param  {Presto.Note} noteTwo Second note
   * @return {Number}         Zero-based distances between notes
   */
  //TODO: make this use the defined language
  distanceBetween: function (noteOne, noteTwo) {
    if (!noteOne.isNote || !noteTwo.isNote) {
      throw new Error("Presto.Note.distanceBetween: Please use note instances");
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
    if (dist === 0) {
      // in cases of augmented primes there is a difference, so check the alterations
      if (noteOne.get('alteration') > noteTwo.get('alteration')) dist = -1;
      else dist = 1;
    }
    return dist;
  },

  intervalTypeBetween: function (noteOne, noteTwo) {
    if (!noteOne.isNote || !noteTwo.isNote) {
      throw new Error("Presto.Note.intervalTypeBetween: Please use note instances");
    }
    var ret = 0;

    var retSchemes = {
      pures: {
        "-1": "DIM",
        0: "PURE",
        1: "AUG"
      },
      nonpures: {
        "-2": "DIM",
        "-1": "MINOR",
        1: "MAJOR",
        2: "AUG"
      }
    };

    var nn = this._noteNames;
    var ni = this._noteIntervals;

    var firstRoot = nn.indexOf(noteOne.get('rootTone'));
    var secondRoot = nn.indexOf(noteTwo.get('rootTone'));
    var firstAlt = noteOne.get('alteration');
    var secondAlt = noteTwo.get('alteration');
    var dist, isInverted = false, scheme;
    var distance = this.distanceBetween(noteOne, noteTwo);


    if (firstRoot >= secondRoot) {
      dist = ni.slice(secondRoot, firstRoot);
    }
    else {
      dist = ni.slice(firstRoot, secondRoot);
    }
    var dlen = dist.length;
    if (dlen !== Math.abs(distance)) {
      // this means that the interval crosses the octave, so while it looks like a third
      // it actually is a sixth. We first treat it like a third, then at the end
      // (just before the return statement) we inverse the solution.
      isInverted = true;
    }
    if (dlen === 0) { // prime or octave
      scheme = "pures";
    }
    else {
      ret = dist.reduce(function (prev, item) { // count the number of 'S'
        if (item === "S") prev -= 1;
        return prev;
      }, 0);
      if ([1, 2, 5, 6].indexOf(dlen) > -1) { // if distance is second, third, sixth or seventh
        scheme = "nonpures";
        if (dlen === 1 || dlen === 2) { // in case of seconds and thirds
          if (ret === 0) ret += 1;
        }
        else { // sixths, sevenths
          // major is -1, minor -2
          ret += 1;
          if (ret === 0) ret += 1;
        }
      }
      else {        // fourth, fifth
        scheme = "pures";
        ret += 1; // for pure, should always have 1 S
      }
    }

    // alterations are a bit complex, because of the difference between pures and nonpures
    if (scheme === "nonpures") {
      var isMajor = ret === 1;
      // the next line fixes problems with "simple" alterations: when the interval is cis - e, it will detect
      // the main interval being major, then reset to 0 in order to allow the alteration of the cis to
      // let ret becoming -1, and the result is a minor interval
      // this also works when the interval is c - es, because the -1 will also cause the interval to be
      // minor.
      // However, when the interval is c - dis, this causes issues.
      if (firstAlt !== 0 || secondAlt !== 0) ret = 0;
      if (firstRoot > secondRoot) { // noteOne is higher than noteTwo
        ret += firstAlt;
        ret -= secondAlt;
      }
      else {
        ret -= firstAlt;
        ret += secondAlt;
      }
      // the next line fixes issues when the interval was major, and the result of the alteration
      // turns out to be major. This means the interval is actually augmented
      if ((firstAlt !== 0 || secondAlt !== 0) && isMajor && ret > 0) {
        ret += 1;
      }
    }
    else { // pures
      if (firstRoot > secondRoot) {
        ret += firstAlt;
        ret -= secondAlt;
      }
      else {
        ret -= firstAlt;
        ret += secondAlt;
      }
    }

    if (isInverted) ret *= -1; // invert if necessary
    return retSchemes[scheme][ret];
  },

  /**
   * Allows checking whether the given note name is a valid name for a note
   * @param  {String}  name note name
   * @return {Boolean}      Whether the note name fits anything recognized as a note
   */
  isValidNoteName: function (name) {
    var notenames = Presto.Note._noteNames;
    var exts = ['is', 'es', 's'], ext;
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


