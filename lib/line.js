
import { Grob, RenderDelegate } from './grob.js';


export class LineRenderDelegate extends RenderDelegate {

    constructor (...opts) {
        super(...opts);
        this.mixin(...opts);
    }


    lineWidth = 0;
    color = 'black';


    render (context) {
        const { lineWidth, color } = this;

        context.beginPath();
        if (lineWidth) context.lineWidth = lineWidth;
        if (color) context.strokeStyle = color;
        context.moveTo(this.x, this.y);
        var diffX = this.x - this.relX;
        var diffY = this.y - this.relY;
        context.lineTo(this.toX + diffX, this.toY + diffY);
        context.stroke();
        return this;
    }
}

export class Line extends Grob {

    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }

    color = 'black';

    /**
   * Thickness of the line
   * @type {Number| null}
   */
    lineWidth = null;

    toString () {
        return 'Presto.Line %@';
    }
 
    toX = null;
    toY = null;

    ignoreWidth = true;

    renderProperties = ['toX', 'toY', 'lineWidth', 'color'];

    renderDelegate = LineRenderDelegate;
    
}
