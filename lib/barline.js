
import { PrestoGrob } from './grob.js';
import { mixin } from './base.js';
import { PrestoLine } from './line.js';

/**
 * Presto.Barline is as the name suggest very much like a line. It needs to be able to
 * do more though, so it is a Grob.
 */
export const PrestoBarline = PrestoGrob.extend({
    /**
   * Quack like a duck
   * @type {Boolean}
   */
    isBarline: true,

    /**
   * The type of barline to draw. See below.
   * @type {String | null}
   */
    type: null,

    toX: null,

    toY: null,

    init: function () {
        var t = this.get('type');
        switch (t) {
        case PrestoBarline.T_SINGLE:
            this.addSingleBarline();
            break;
        }
    },

    addSingleBarline: function () {
        this.addChildGrob(PrestoLine.create({
            x: 0,
            y: 1,
            toX: 0,
            toY: Math.abs(this.y - this.toY) + (this.staff.staffLineThickness * 2),
            lineWidth: 2,
            score: this.score
        }));
    }
});

mixin(PrestoBarline, {
    T_SINGLE: 'singlebar',
    T_DOUBLE: 'doublebar',
    T_END: 'endbar',
    T_REPEAT_OPEN: 'repeat_open',
    T_REPEAT_CLOSE: 'repeat_close'
});
