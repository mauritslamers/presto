/*globals Presto, console*/

Presto.mixin({
  STEMDIRECTION_UP: "up",
  STEMDIRECTION_DOWN: "down"
});


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
   * Will flip the stem.
   * @return {Presto.Note} this
   */
  flipStem: function () {
    if (this.get('stemUp')) this.stemDirection = Presto.STEMDIRECTION_DOWN;
    else this.stemDirection = Presto.STEMDIRECTION_UP;
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
    acc.x = -acc.get('width');
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
   * such as determining the width of the helper lines
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

    console.log(helperLineWidth);
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
    var positionOnStaff = this.get('positionOnStaff');
    var staff = this.staff;
    var staffSpace = this.score.get('size');
    var pos = positionOnStaff;
    var stemUp = this.get('stemUp');
    var stemLength;

    if (stemUp) pos *= -1 ;

    if (pos > 4) {
      // this implementation uses 5 staff spaces, because it looks a bit better
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

    this.addChildGrob(Presto.Line.create({
      x: startX + 1, // offset to the right for stem
      y: 0,
      toX: startX + 1,
      toY: toY,
      lineWidth: 2,
      ignoreWidth: true
    }));

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
    if (noteOne.get('noteId') === noteTwo.get('noteId')) return 1; // fast path for primes
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

