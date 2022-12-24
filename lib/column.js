import { Grob } from './grob.js';
import { getEach } from './tools.js';


/**
 * Presto.Column is a way to get vertically stacked elements which can be horizontally moved as a block
 */

export class Column extends Grob {

    constructor (...args) {
        super(...args);
        this.mixin(...args);
    }
    /**
   * don't draw anything ourselves, just the contents
   * @type {Boolean}
   */
    isContainer = true;

    /**
   * Hook where the parent staff is put
   * @type {Presto.Staff}
   */
    parentStaff = null;

    /**
   * The width of a column is distance between the left most point and the rightmost point
   * @return {Number} Width of the column
   */

    get width () {
        if (!this.childGrobs) return 0;
        const w = getEach(this.childGrobs, 'width');
        return Math.max(...w);
    }
}


