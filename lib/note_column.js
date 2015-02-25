/*globals Presto*/

/**
 * A note column is a wrapper around one or more notes or rests, which also applies stacking
 */

Presto.NoteColumn = Presto.Column.extend({

  /**
   * Where notes should be put
   * @type {Array}
   */
  notes: null,

  init: function () {
    var notes = this.notes;
    // we assume notes have been set
    if (!notes) return;
    notes.forEach(function (n) {
      if (Presto.Note.isNoteHash(n)) {
        this.addChildGrob(Presto.Note.create(n));
      }
      else if (Presto.Rest.isRestHash(n)) {
        this.addChildGrob(Presto.Rest.create(n));
      }
      else {

      }
    }, this);
  },

  // perhaps necessary when things have been added, to reset the stacking adjustments?
  _resetStacking: function () {

  },

  /**
   * Needs to be invoked in order to perform the proper stacking of notes
   * @return {this} this
   */
  applyStacking: function () {

  }
})


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