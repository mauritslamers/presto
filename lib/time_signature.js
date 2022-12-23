import { Column } from './column.js';
import { PrestoSymbol } from './symbol.js';

export class TimeSignature extends Column {
    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }

    /**
   * Number of beats per bar
   * @type {Number}
   */
    numberOfBeatsPerBar = null;

    /**
   * What note represents one beat?
   * @type {Number}
   */
    beatType = null;

    /**
   * Force the use of numbers for certain types of time signature,
   * such as 2/2 and 4/4
   * @type {Boolean}
   */
    forceNumeric = false;


    init () {
        var forceNumeric = this.forceNumeric;
        var numBeats = this.numberOfBeatsPerBar;
        var beatType = this.beatType;
        var symbolicOption = (numBeats === 4 && beatType === 4) || (numBeats === 2 && beatType === 2);

        if (symbolicOption && !forceNumeric) {
            this.addSymbolic();
        }
        else this.addNumeric();

    }

    /**
   * add a numerical time signature
   */
    addNumeric () {
        var staffSpace = this.score.size;
        this.addChildGrob(PrestoSymbol.create({
            name: this.numberOfBeatsPerBar.toString(),
            y: 0 + this.staff.staffLineThickness,
            ignoreWidth: true,
            staff: this.staff,
            score: this.score
        }));
        this.addChildGrob(PrestoSymbol.create({
            name: this.beatType.toString(),
            y: staffSpace * 4 - this.staff.staffLineThickness,
            staff: this.staff,
            score: this.score
        }));
    }

    /**
   * add a symbolic time signature
   */
    addSymbolic () {
        var numBeats = this.numberOfBeatsPerBar;
        var beatType = this.beatType;

        var symbol = (numBeats === 2 && beatType === 2)? 'timesig.C22' : 'timesig.C44';

        this.addChildGrob(PrestoSymbol.create({
            name: symbol,
            staff: this.staff,
            score: this.score,
            x: 0,
            y: 2
        }));
    }
}
