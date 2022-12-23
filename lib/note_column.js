import { Column } from './column.js';
import { intervalBetween, isNoteHash, Note } from './note.js';
import { Rest } from './rest.js';
import { getEach } from './tools.js';


export class NoteColumn extends Column {
  
    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }

    /**
   * Where notes should be put
   * @type {Array}
   */
    notes = null;

    /**
   * The smallest length of the notes in the column
   * @type {Number}
   */
    minimumDuration = 0;

    init () {
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
            if (isNoteHash(n)) {
                obj = Note.create(mix, n);
                // retrieve root note + octave, and set proper y value
                staff.setVerticalOffsetFor(obj);
                // TODO: lilypond keeps a record of which octave the alteration took place, in order to place the right
                // accidental only when that note previously had a different alteration. This only takes into account the
                // key signature alteration, and doesn't take the accidentals properly into account
                obj.staffAlteration = this.staff.alterations[obj.rootTone];
                obj.update(); // have the note reset itself
                notelen = staff._calculateLength(n);
                if (notelen > this.minimumDuration) this.minimumDuration = notelen;
                this.addChildGrob(obj);
            }
            else if (Rest.isRestHash(n)) {
                this.addChildGrob(Rest.create(mix, n));
                notelen = staff._calculateLength(n);
                if (notelen > this.minimumDuration) this.minimumDuration = notelen;
                //debugger;
            }
            else {
                console.log('Presto.NoteColumn: other hash types are not implemented yet');
            }
        }, this);
        var noteObjs = this.childGrobs.filter(cg => cg.isNote);

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
        this.noteStartOffset = min;
        //
        //
        //     //check for accidentals
        // if (accidentals) { // should be always, but better double check
        //   // use the rootTone of the note to find the current alteration in the accidentals list
        //   // if the alteration is the same, tell the note to not display the accidental
        //   // if it is different, check whether a natural is necessary, and set the alteration of the
        //   // note to the alteration
        // }

    }


    // perhaps necessary when things have been added, to reset the stacking adjustments?
    _resetStacking () {

    }



    /**
   * private method to perform the accidental stacking
   * It takes the highest, then the lowest, starting at the outer limits, and walk in, taking octaves into account
   */
    _stackAccidentals (chord) {
    // needs adjusting for multiple accidentals...

        var sortedNotes = chord.filter(c => c.alterations);

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
                return sn.rootTone === note.rootTone;
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
        var staffSpace = this.score.size;
        accidentalOrder.forEach(function (acc) {
            if (prev && acc.rootTone !== prev.rootTone) {
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
    }



    get width () {
        const w = getEach(this.childGrobs, 'width');
        return Math.max(...w);
    }


    /**
   * Needs to be invoked in order to perform the proper stacking of notes (see explanation below)
   * @return {this} this
   */
    applyStacking () {
        var chord = this.childGrobs.filter(cg => cg.isNote);

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
                interval = Math.abs(intervalBetween(n, nextNote));
                if (interval === 2) {
                    this._stackSecond(n, nextNote);
                }
                else if (interval === 1) {
                    this._stackPrime(n, nextNote);
                }
            }
        }, this);

        return this;
    }

    _stackSecond (bottomNote, topNote) {

        var notShifted = !bottomNote.isShifted && !topNote.isShifted;

        if (topNote._automaticStem || bottomNote._automaticStem) {
            if (topNote.stemDown && bottomNote.stemUp) {
                topNote.flipStem()._automaticStem = false;
            }
        }

        if (topNote.stemUp && bottomNote.stemDown) {
            if (notShifted) {
                this._shiftNote(bottomNote, topNote._noteHeadWidth);
            }
        }
        else if (topNote.stemDown && bottomNote.stemUp) {
            //top note offset to the left (keep stems) === bottom note offset to the right
            if (notShifted) {
                this._shiftNote(bottomNote, topNote._noteHeadWidth);
            }
        }
        else if (topNote.stemDown && bottomNote.stemDown) {
            if (notShifted) {
                // topnote to the right, but buttom note loses stem
                this._shiftNote(topNote, (bottomNote._noteHeadWidth) - 1);
                bottomNote.removeStem();
            }
        }
        else if (topNote.stemUp && bottomNote.stemUp) {
            if (notShifted) {
                this._shiftNote(topNote, (bottomNote._noteHeadWidth) - 1);
                topNote.removeStem();
            }
        }
    }

    _shiftNote (noteObj, amount) {
        noteObj.x += amount;
        if (noteObj.alterations){
            noteObj.alterations.forEach(function (a) {
                a.x -= amount;
            });
        } //note.accidental.x -= amount;
        noteObj.isShifted = true;
    }


    _stackPrime (firstNote, secondNote) { // doesn't matter up/down
        const firstLength = firstNote.length,
            secondLength = secondNote.length,
            firstWidth = firstNote._noteHeadWidth,
            secondWidth = secondNote._noteHeadWidth,
            firstIsNotShifted = !firstNote.isShifted,
            secondIsNotShifted = !secondNote.isShifted;

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
                if (firstNote.stemUp && secondNote.stemUp) {
                    if (secondIsNotShifted) {
                        this._shiftNote(secondNote, firstWidth);
                        secondNote.removeStem();
                    }
                }
                else if (firstNote.stemDown && secondNote.stemDown) {
                    if (secondIsNotShifted) {
                        this._shiftNote(secondNote, firstWidth);
                        secondNote.removeStem();
                    }
                }
            }
        }
    }

}


/*
    The stacking rules

    the rules are:
    - top accidental should be nearest
    - octave related accidentals should be vertically aligned (this does not work yet)
    - after that, working from outsides inwards, bottom first



*/

