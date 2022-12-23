import { fetaFontInfo, fetaFontMetrics } from './font_info.js';
import { Staff } from './staff.js';
import { getEach, PrestoBase, setEach, warn } from './tools.js';

let fetaFontInfoBackup;

export class Score extends PrestoBase {
  
    /**
   * The canvas element on which the score will be drawn
   * @type {string}
   */
    canvas = null;

    /**
   * The default fontSize in points
   * @type {number}
   */
    fontSize = 32;

    /**
   * The default staff space in pixels
   * @type {Number}
   */
    get size () {
        return this._pt2px(this.fontSize);
    }

    /**
   * Width of the canvas element
   * @type {Number}
   */
    width = null;

    /**
   * Height of the canvas element
   * @type {Number}
   */
    height = null;


    /**
   * cursorSize is the smallest rhythmical size allowed. It is also the step size with which the
   * notation will be parsed
   * @type {Number}
   */
    cursorSize = 16;

    /**
     * The language recognized for note names, currently "nl" and "en" are supported
     * @type {String}
     */
    language = 'nl';

    autoAdjustCanvasSize = true;

    init () {
        var canvas = this.canvas;
        if (!canvas) {
            warn('Presto.Score: no canvas element set on init');
        }
        else {
            this._initCanvas();
        }
  
        this._rootGrob = Grob.create({
            x: 0,
            y: 0,
            isContainer: true,
            score: this
        });
  
        if (Score._fontIsActive) {
            this.fontIsReady();
        }
    }



    /**
   * Function which parses the given array containing the musical information.
   * it will not start the parsing however before the font is loaded because of the size measurements.
   * If the font is not ready yet, it will set the notation hash to _parseArguments, which will indicate
   * the fontActive callback to parse that notation again.
   * @param  {Array} notation The notation which is a collection of staffs
   * @return {Presto.Score}          current instance
   */
    parse (notation) {
        if (!this.fontReady) {
            this._parseArguments = notation;
            return;
        }
        if (this._rootGrob) { // we are asked to parse again, remove rootgrob
            this._rootGrob.childGrobs = null;
        }
        var size = this.size;
        if (!size) throw new Error('No size set on Presto.Score');
        var staffDistance = this.staffDistance;
        if (!staffDistance) this.staffDistance = staffDistance = 16 * size;
        var vOffset = 4 * size;
        var s = this._staffs = notation.staffs.map( (s, i) => {
            return Staff.create(s, {
                x: 0,
                y: vOffset + (i * staffDistance),
                width: this.width,
                score: this
            });
        });
        this._rootGrob.addChildGrobs(s);
        this._notate();
    }




    /**
   * This function will start the actual notation process. It walks through the notation in the smallest
   * rhythmical steps and aligns everything where necessary
   */
    _notate () {
        var staffs = this._staffs,
            maxEvents = 1, // default, walk through it once
            i, notatedObjects, max_x, next_x, max_noteOffset;

        var advanceStaff = function (s) {
            var ret = s.advanceCursor(1);
            if (s._numberOfEvents > maxEvents) { // TODO: document why this is necessary
                maxEvents = s._numberOfEvents;
            }
            return ret;
        };

        // var calculateMaxSpacing = function (obj) {
        //   var m;
        //   if (obj) {
        //     m = obj.get('x') + obj.get('width');
        //     max_x = (m > max_x)? m: max_x;
        //   }
        // };

        var adjustHorizontalSpacing = function (e) {
            if (e) {
                if (e.noteStartOffset && e.noteStartOffset !== max_noteOffset) {
                    e.x += Math.abs(e.noteStartOffset) - Math.abs(max_noteOffset);
                }
                if (!e.noteStartOffset) {
                    e.x = max_x + Math.abs(max_noteOffset);
                }
            }
        };

        // Stepping through all staffs at once. For every step all staffs are advanced.
        // When the staff has created a notation element, it will be returned.
        // When all staffs have been advanced, the elements will be aligned.
        // it is required to advance all staffs at least once
        for (i = 0; i < maxEvents; i += 1) {
            notatedObjects = staffs.map(advanceStaff);
            next_x = Math.max(...getEach(staffs, '_currentX'));
            max_x = Math.max(...getEach(notatedObjects, 'x'));
            max_noteOffset = Math.min(...getEach(notatedObjects, 'noteStartOffset'));
            notatedObjects.forEach(adjustHorizontalSpacing);
            setEach(staffs, '_currentX', next_x);
            if (this.autoAdjustCanvasSize) {
                if (this.canvas.width < next_x) {
                    this.canvas.width = next_x + 50;
                }
            }
            // notatedObjects.forEach(calculateMaxSpacing);
        }
        //console.log(staffs.getEach('y'));
        this._adjustStaffSpacing();
    }

    _adjustStaffSpacing () {
        // after everything has been notated, we need to check the vertical space of the staffs
        // the first staff is offset by a default value, against 0
        // The calculation checks whether the staff (assuming center 0) on y has enough space to display maxTop
        // what I need to compensate for is the relative position here and the maxTop which is calculated from 0
        var staffs = this._staffs;
        var staffSpace = this.size;
        var prevCenter = 0;
        staffs.forEach((s, i) => {
            var nextStaff = staffs[i + 1];
            var maxTop = s.get('maximumTopOffset');
            var maxBottom = s.get('maximumBottomOffset');
            var diff = s.y + maxTop - prevCenter; // maxTop is negative by default
            if (diff < 0) {
                s.y += Math.abs(diff - (2 * staffSpace));
            } // headroom
            if (nextStaff) { // check whether the center of the next staff is far enough away to
                // maxBottom is positive by default, topOffset is negative, therefore both plus
                // idea is to take nextStaff center - top margin minus the current staff center plus bottom margin
                diff = (nextStaff.y - Math.abs(nextStaff.get('maximumTopOffset'))) - (s.y + maxBottom);
                if (diff < 0) {
                    nextStaff.y += Math.abs(diff) + (2 * staffSpace);
                }
            }
            prevCenter = s.y;
        });
    }

    /**
   * This function will start the rendering on the canvas element.
   */
    render (x, y) {
        if (!this.fontReady) {
            this._suspendedRender = true;
            return;
        }
        // before rendering, blank the canvas element
        this.clear();
        x = x || 0;
        y = y || 0;
        var absPos = this._rootGrob.render(x, y);
        absPos.forEach(g => g.render(this._ctx));
    }
    /**
   * Clear the canvas element
   */
    clear () {
        var canvas = this.canvas;
        this._ctx.clearRect(0, 0, canvas.width, canvas.height);
    }



    /* PRIVATE */

    /**
   * Initializes the canvas element and sets the 2D rendering context
   */
    _initCanvas () {
        var canvasElement;
        var canvas = this.canvas;
        if (typeof canvas === 'string') { // we need to get the element
            canvasElement = document.getElementById(canvas);
            if (!canvasElement) throw new Error('Cannot find the canvas element with id ' + canvas);
            this.canvas = canvas = canvasElement;
        }
        // check whether the style of the canvas element contains the font
        // canvas.style.fontFamily = 'Emmentaler26';
        // canvas.style.fontSize = this.fontSize + "pt";
        canvas.style.font = this.fontSize + 'pt Emmentaler26';
        this._ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
    //this.initFontInfo();
    }

    /**
   * this function is called by the webfontloader callback to indicate that the font is loaded and that we are ready to render.
   *
   */
    fontIsReady () {
        this.initFontInfo();
        this.fontReady = true;
        if (this._parseArguments) {
            var notation = this._parseArguments;
            this._parseArguments = null;
            this.parse(notation);
        }
        if (this._suspendedRender) {
            this._suspendedRender = false;
            this.render();
        }
    }

    /**
   * indicator to internal functions whether the font is ready
   * @type {Boolean}
   */
    fontReady = false;

    /**
   * this property is set by #parse when it is called before the font is ready, to indicate that it should be called when
   * the font is ready, and containing its original arguments
   * @type {Boolean}
   */
    _parseArguments = false;


    /**
   * this property is set by #render when it is called before the font is ready, to indicate that it should be called when the
   * font is ready.
   * @type {Boolean}
   */
    _suspendedRender = false;

    /**
   * the rendering context
   * @type {Canvas.2DContext}
   */
    _ctx = null;


        /**
   * Convenience method to create a Score object from a canvas element
   * @param  {HTML CanvasElement} canvas the canvas element that should be used
   * @return {Presto.Score instance}        the instance of the Score object
   */
    static from (canvas) {
        var s = Presto.Score.create({
            canvas: canvas
        });
        this._scores.push(s);
        return s;
    }

    /**
   * keeping a reference to score instances. This is done in order to trigger font initialization on the score
   * when the font is loaded.
   * @type {Array}
   */
    static _scores = [];

   /**
   * this function is what we use to initialize the font cache
   */
    static fontActive () {
        Score._fontIsActive = true;
        // update every score instance and trigger the font info generation
        Score._scores.forEach(s => s.fontIsReady());
    }
        
}

var font = new FontFace("Emmentaler26", "url(fonts/emmentaler-26.woff)");
font.load().then(f => {
    Score.fontActive();
})
.catch(e => {
  console.log("Presto: trouble with loading the emmentaler webfont", e);
  throw e;
});