
import { PrestoGrob, PrestoGrobRenderDelegate } from './grob.js';

export const PrestoLine = PrestoGrob.extend({
    color: 'black',

    /**
   * Thickness of the line
   * @type {Number}
   */
    lineWidth: null,

    toString: function () {
        return 'Presto.Line %@';
    },

    /**
   * toX and toY are the coordinates to be used as end point of the line
   * @type {Number}
   */
    toX: null,
    toY: null,

    /**
   * a line should usually be ignored width wise
   * @type {Boolean}
   */
    ignoreWidth: true,

    renderProperties: ['toX', 'toY', 'lineWidth', 'color'],

    renderDelegate: PrestoGrobRenderDelegate.extend({
        render: function (context) {
            var lw    = this.get('lineWidth'),
                color = this.get('color');

            context.beginPath();
            if (lw) context.lineWidth = lw;
            if (color) context.color = color;
            context.moveTo(this.x, this.y);
            var diffX = this.x - this.relX;
            var diffY = this.y - this.relY;
            context.lineTo(this.toX + diffX, this.toY + diffY);
            context.stroke();
        }
    })
});
