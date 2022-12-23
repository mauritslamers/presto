import { Grob } from './grob.js';
import { Line } from './line.js';
import { PrestoSymbol } from './symbol.js';


export const STEMDIRECTION_UP = 'up';
export const STEMDIRECTION_DOWN = 'down';

/**
 * Presto.Stem is very much a Line, but as it also needs to be able to draw a
 * flag, it is a wrapper around Line.
 * @extends {Presto.Grob}
 */
export class Stem extends Grob {
    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }

    /**
     * 
   * Quack like a duck
   * @type {Boolean}
   */
    isStem = true;

    /**
    * Which flag should be attached to the stem
    * @type {String | null}
    */
    noteFlag = null;
 
    /**
    * To which horizontal coordinate the line should be drawn
    * @type {Number}
    */
    toX = null;
 
    /**
    * to which vertical coordinate the line should be drawn
    * @type {Number}
    */
    toY =null;
 
    /**
    * automatic calculation of the linewidth to use
    * @return {Number} staffsize / 3
    */
    get lineWidth () {
        return this.score.size / 3;
    }
 
    /**
    * The note will attach which direction the stem goes, which is important for where to insert the
    * note flag
    * @type {String}
    */
    stemDirection = null;
 
    init () {
        const noteFlag = this.noteFlag;
        this.addChildGrob(Line.create({
            x: 0,
            y: -1,
            toX: 0,
            toY: this.toY,
            lineWidth: this.lineWidth
        }));
        if (noteFlag) {
            this.addChildGrob(PrestoSymbol.create({
                x: 0,
                y: this.toY,
                name: noteFlag,
                score: this.score,
                staff: this.staff
            }));
        }
 
    }
}
