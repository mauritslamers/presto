import { Grob } from './grob.js';
import { PrestoSymbol } from './symbol.js';


export class Rest extends Grob {
    constructor (...args) {
        super(...args);
        this.mixin(...args);
        if (this.init) this.init();
    }

    static isRestHash (h) {
        if (h.name === 'rest' && h.length) {
            return true;
        }
        return false;
    } 


    voiceNumber = null;

    /**
   * Quack like a duck
   * @type {Boolean}
   */
    isRest = true;

    /**
   * Length of the rest
   * @type {number}
   */
    length = null;

    /**
   * how many dots does the rest have?
   * @type {Number}
   */
    dots = null;

    /**
   * return the correct glyph for rest of a specific length
   * @return {String | boolean} character name
   */
    get restGlyph () { // can be overridden or extended if required
        var l = this.length;
        switch (l) {
        case 1:
            return 'rests.0'; // whole
        case 2:
            return 'rests.1'; // half
        case 4:
            return 'rests.2'; // quarter
        case 8:
            return 'rests.3'; // eighth
        case 16:
            return 'rests.4'; // sixteenth
        }
        return false;
    }

    /**
   * function to return the full length of a (dotted) rest, where a dotted value
   * is calculated against the scale of 2, 4, 8, 16
   * A rest length of 4 with dots will be smaller than 4. In order to keep the exponential scale
   * the dotted value will be expressed as a division against the original value
   * @property {Number}          Length value expressed as a factor on the exponential length scale
   */
    get fullLength () {
        let l = this.length;
        if (!l) return 0;
        if (this.dots && this.dots > 0) {
            // dot 1 is half the value of the original, 1/2
            // dot 2 is half the value of the value added 1/4
            // dot 3 is half the value of the value added last time 1/8 ...etc
            let val = 1, wval = 1;
            for (let i = 0; i < this.dots; i += 1) {
                wval /= 2;
                val += wval;
            }
            l /= val; // rewrite the length as divided value of the original
        }
        return l;
    }

    init () {
        const length = this.length,
            numDots = this.dots,
            glyph = this.restGlyph;
        let dotglyph, i, prevwidth;

        if (this.isPlaceholder) return;

        var symbol = PrestoSymbol.create({
            score: this.score,
            staff: this.staff,
            name: glyph,
            fontSize: this.score.get('fontSize')
        });

        if (length === 1) {
            // for some reason the whole rest needs an offset
            symbol.y = this.staff.calculateVerticalOffsetFor(-2);
        }

        if (this.voiceNumber === 1) {
            symbol.y = this.staff.calculateVerticalOffsetFor(-2);
        }
        else if (this.voiceNumber === 2) {
            symbol.y = this.staff.calculateVerticalOffsetFor(5);
        }

        this.addChildGrob(symbol);

        if (numDots) {
            prevwidth = symbol.width;
            for (i = 0; i < numDots; i += 1) {
                dotglyph = PrestoSymbol.create({
                    name: 'dots.dot',
                    x: prevwidth,
                    score: this.score,
                    staff: this.staff
                });
                this.addChildGrob(dotglyph);
                prevwidth += dotglyph.width;
            }
            dotglyph = null;
        }

    }

}