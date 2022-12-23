import { fetaFontInfo, fetaFontMetrics } from './font_info.js';
import { Grob, RenderDelegate } from './grob.js';
import { warn } from './tools.js';


export class PrestoSymbolRenderDelegate extends RenderDelegate {

    fontSize = 12;

    name = '';

    render (context) {
        var fontSize = this.fontSize;
        var char = fetaFontInfo[this.name];
        if (!char) warn('PrestoSymbol: cannot render symbol with unknown name: ' + this.name);
        var font = fontSize + 'pt Emmentaler26'; //   ctx.font = "32pt Emmentaler26";
        context.beginPath();
        context.font = font;
        context.fillText(char, this.x, this.y);
        return this;
    }
}

export class PrestoSymbol extends Grob {
    constructor (...opts) {
        super(...opts);
        if (!this.fontSize) this.fontSize = this.score.fontSize;
        if (!this.ignoreWidth) {
            const metrics = fetaFontMetrics[this.name];
            if (!metrics) {
                warn('PrestoSymbol: no metrics found for ' + this.name);
                this.__width = 0; // will cause width 0
            }
            else {
                this.__width = metrics.width;
            }
        }
        if (!this.name) {
            throw new Error('PrestoSymbol: cannot print an undefined symbol!');
        }
    }



    get width () {
        if (this.ignoreWidth) return 0;
        if (this.__width !== undefined) return this.__width;
        return super.width;
    }

    renderProperties = ['name', 'fontSize'];

    renderDelegate = PrestoSymbolRenderDelegate;
}

