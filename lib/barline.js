
import { Grob } from './grob.js';
import { Line } from './line.js';


export const T_SINGLE = 'singlebar';
export const T_DOUBLE = 'doublebar';
export const T_END = 'endbar';
export const T_REPEAT_OPEN = 'repeat_open';
export const T_REPEAT_CLOSE = 'repeat_close';

export class Barline extends Grob {

    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }
    /**
   * Quack like a duck
   * @type {Boolean}
   */
    isBarline = true;

    /**
   * The type of barline to draw. See below.
   * @type {String | null}
   */
    type = null;

    toX = null;

    toY = null;

    init () {
        const t = this.type;
        switch (t) {
        case T_SINGLE:
            this.addSingleBarline();
            break;
        }
    }


    addSingleBarline () {
        this.addChildGrob(Line.create({
            x: 0,
            y: 1,
            toX: 0,
            toY: Math.abs(this.y - this.toY) + (this.staff.staffLineThickness * 2),
            lineWidth: 2,
            score: this.score
        }));
    }
}
