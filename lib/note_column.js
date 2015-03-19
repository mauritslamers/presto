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

  /**
   * The smallest length of the notes in the column
   * @type {Number}
   */
  minimumDuration: 0,

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
      var obj, notelen;
      if (Presto.Note.isNoteHash(n)) {
        obj = Presto.Note.create(mix, n);
        // retrieve root note + octave, and set proper y value
        staff.setVerticalOffsetFor(obj);
        // TODO: lilypond keeps a record of which octave the alteration took place, in order to place the right
        // accidental only when that note previously had a different alteration. This only takes into account the
        // key signature alteration, and doesn't take the accidentals properly into account
        obj.staffAlteration = this.staff.alterations[obj.get('rootTone')];
        obj.update(); // have the note reset itself
        notelen = staff._calculateLength(n);
        if (notelen > this.minimumDuration) this.minimumDuration = notelen;
        this.addChildGrob(obj);
      }
      else if (Presto.Rest.isRestHash(n)) {
        this.addChildGrob(Presto.Rest.create(mix, n));
        notelen = staff._calculateLength(n);
        if (notelen > this.minimumDuration) this.minimumDuration = notelen;
        //debugger;
      }
      else {
        console.log("Presto.NoteColumn: other hash types are not implemented yet");
      }
    }, this);
    var noteObjs = this.childGrobs.filterProperty('isNote');

    if (notes.length > 1) {
      this.applyStacking();
    }

    var min = 0;
    noteObjs.forEach(function (n) {
      var acc = n.get('alterations');
      if (acc) {
        var m = acc.getEach('x').get('@min');
        if (m < min) min = m;
      }
    });
    noteObjs.forEach(function (n) {
      n.x += Math.abs(min);
    });
    //
    //
    //     //check for accidentals
    // if (accidentals) { // should be always, but better double check
    //   // use the rootTone of the note to find the current alteration in the accidentals list
    //   // if the alteration is the same, tell the note to not display the accidental
    //   // if it is different, check whether a natural is necessary, and set the alteration of the
    //   // note to the alteration
    // }

  },

  // perhaps necessary when things have been added, to reset the stacking adjustments?
  _resetStacking: function () {

  },

  /**
   * private method to perform the accidental stacking
   * It takes the highest, then the lowest, starting at the outer limits, and walk in, taking octaves into account
   */
  _stackAccidentals: function (chord) {
    // needs adjusting for multiple accidentals...

    var sortedNotes = chord.filterProperty('alterations');

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
    // what lilypond seems to do is to check the vertical distance between the
    // notes, and when the distance is > 4, no extra indentation is made
    //
    // TODO: This will have to be done differently: using the width and a possible extra
    // offset when the accidentals are too close
    var offsetIndex = 0, offset = 0, prev;
    var staffSpace = this.score.get('size');
    accidentalOrder.forEach(function (acc) {
      if (prev && acc.get('rootTone') !== prev.get('rootTone')) {
        offsetIndex += 1;
      }
      offset = offsetIndex * (staffSpace * 2);
      acc.alterations.forEach(function (a) {
        a.x -= offset;
      });
      prev = acc;
    });
    this.x += offset / 2; // create the extra space required by moving the note column
    this._offset = offset;
  },

  width: function () {
    // width of a note column is the minimum value of the accidental
    // var smallest = 0, biggest = 0;
    // this.childGrobs.forEach(function (cg) {
    //   var rightmost;
    //   if (cg.accidental) {
    //     if (cg.accidental.x < smallest) smallest = cg.accidental.x;
    //     rightmost = cg.get('width') + cg.accidental.x; //
    //     if (rightmost > biggest) biggest = rightmost;
    //   }
    //   else if (cg.get('width') > biggest) biggest = cg.get('width');
    // });
    // // now, the trick is that the width should count from 0, not from the
    // this.x += Math.abs(smallest);
    // return biggest + smallest;
    var w = this.childGrobs.getEach('width');
    //return w.get('@max') - (this._offset || 0); // correct for already performed offset
    return w.get('@max');
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
        this._shiftNote(topNote, (bottomNote.get('_noteHeadWidth')) - 1);
        bottomNote.removeStem();
      }
    }
    else if (topNote.get('stemUp') && bottomNote.get('stemUp')) {
      if (notShifted) {
        this._shiftNote(topNote, (bottomNote.get('_noteHeadWidth')) - 1);
        topNote.removeStem();
      }
    }
  },

  _shiftNote: function (note, amount) {
    note.x += amount;
    if (note.alterations){
      note.alterations.forEach(function (a) {
        a.x -= amount;
      });
    } //note.accidental.x -= amount;
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

});


/*
    The stacking rules

    the rules are:
    - top accidental should be nearest
    - octave related accidentals should be vertically aligned (this does not work yet)
    - after that, working from outsides inwards, bottom first



*/

