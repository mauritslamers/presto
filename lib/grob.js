
/*
Presto.Grob is the basic GRaphical OBject. It provides the basic relative positioning functionality,
as well as the support for containing other grobs.

Relative positioning is done against the parent, where in the end the top grob must have an absolute position.
In order for this to work, every grob has a x and y property, which indicate its relative position to the parent grob.

This system allows for a basic first round of creating a basic layout, which can then be finetuned.
The difficulty of such a system is that the aligning doesn't necessarily can be done through x and y, as that would mean
that everything would be left aligned. The system of music notation only needs horizontal aligning as the vertical position can
In order to deal with this, a grob can contain a align property, which

Because this system is also intended to be edited graphically and filled incrementally, the render phase of the system will create a
new representation in absolutely positioned elements. In order to do this, every grob needs to define its absolute version on the
renderDelegate property. While it is technically not really a render delegate, it is the closest approximation.

The advantage of doing the rendering this way is that grobs don't have to be aware of grobs directly around them.

*/
import { PrestoObject, PrestoArray } from './base.js';


export const PMODE_RELATIVE = 'relative';
export const PMODE_ABSOLUTE = 'absolute';

function _isValidCoordinate (c) {
    return (c !== undefined && c !== null);
}

// base class for render delegates
/**
 * Base class for render delegates
 * @extends { PrestoObject }
 */
export const GrobRenderDelegate = PrestoObject.extend({
    /**
   * The Renderer gets 4 times a position, being x and y and absX and absY.
   * x and y represent the absolute position the parent thinks this grob should have.
   * relX and relY represent the position relative to the parent.
   * x and y are calculated as the absX + relX and absY + relY.
   * Reason that both are given is that sometimes there are more coordinates which needs moving
   * than just x and y. In normal use you can rely on x and y having the right position, and
   * in specific use, you can use the difference to check out how the rest needs to be moved as well
   * @type {Number}
   */
    x: null,
    y: null,
    relX: null,
    relY: null,

    positioningMode: PMODE_ABSOLUTE,

    /**
     * 
     * @param {*} context 
     * @returns 
     */
    render: function () {
        return this;
    }

});

/**
 * Grob, base class for all Graphical Objects
 * @extends {Presto.Object}
 */
export const PrestoGrob = PrestoObject.extend({
    /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
    x: null,

    /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
    y: null,

    /**
   * The parentGrob of this grob, currently unused
   * @type {Presto.Grob}
   */
    parentGrob: null,

    /**
   * childGrobs
   * @type {Presto.Array}
   */
    childGrobs: null,

    positioningMode: PMODE_RELATIVE,

    /**
   * If true, this will cause the rendering process will ignore the width of this grob
   * @type {Boolean}
   */
    ignoreWidth: null, // set to true if width has to be ignored

    /**
   * If true, the rendering process will not render this object, but only its childGrobs if present
   * @type {Boolean}
   */
    isContainer: false, // set to true when the grob should not render anything itself

    /**
   * if true, the render process should render this object, otherwise it should not
   * @type {Boolean}
   */
    isVisible: true,

    /**
   * Properties which need to be copied onto the render delegate
   * @type {Array}
   */
    renderProperties: null,

    /**
   * The default width of a grob is the total of the childgrobs
   * @return {Number} width of the child grobs in pixels, or 0 if none
   */
    width: function () {
        if (!this.childGrobs) return 0;
        var w = this.childGrobs.getEach('width');
        return w.get('@sum');
    },

    /**
   * render on a grob does two things: it will create a render delegate instance of itself (when needed)
   * and it will check whether it has childGrobs and render those as well
   * @param  {Number} refX Parents absX plus the internal xOffset
   * @param  {Number} refY Parents absY
   * @return {Array}       Array containing all the render delegate instances
   */
    render: function (refX, refY) {
        var ret = [];
        if (!_isValidCoordinate(refX) || !_isValidCoordinate(refY)) {
            throw new Error('PrestoGrob#render: invalid parent coordinates detected');
        }
        if (!this.isVisible) return;
        var curX = this.get('x');
        var curY = this.get('y');
        var absX = curX + refX;
        var absY = curY + refY;

        var xOffset = 0;
        if (this.renderDelegate && !this.isContainer) {
            var baseObj = {
                x: absX,
                y: absY,
                isVisible: this.isVisible,
                relX: curX,
                relY: curY
            };
            if (this.renderProperties && this.renderProperties instanceof Array) {
                this.renderProperties.forEach(function (rp) {
                    baseObj[rp] = this.get(rp);
                }, this);
            }
            ret.push(this.renderDelegate.create(baseObj));
        }
        if (this.childGrobs && this.childGrobs.length > 0) {
            // TODO: it might be necessary to add something to xOffset in case or margins/padding
            //
            // this renders the child grobs, make sure that we adjust the positions properly
            this.childGrobs.forEach(function (cg) {
                ret = ret.concat(cg.render(absX + xOffset, absY));
                // not sure if the line below is a good idea...
                //if (!cg.ignoreWidth) xOffset += cg.get('width');
            });
        }
        return ret;
    },


    renderDelegate: GrobRenderDelegate,

    /**
   * Adds a childgrob to the current grob
   * @param {Presto.Grob} grob The grob required to be added
   */
    addChildGrob: function (grob) {
        if (!this.childGrobs) this.childGrobs = PrestoArray.create();
        if (!grob.parentGrob) grob.set('parentGrob', this);
        if (grob.x === null) grob.x = 0;
        if (!grob.score && this.score) grob.score = this.score;
        if (!grob.staff && this.staff) grob.staff = this.staff;
        this.childGrobs.push(grob);
        return this;
    },

    addChildGrobs: function (grobs) {
        if (grobs && grobs instanceof Array) {
            grobs.forEach(this.addChildGrob, this);
        }
        return this;
    }

});


