
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
// import { PrestoObject, PrestoArray } from './base.js';

import { getEach, PrestoBase, sum } from './tools.js';

export const PMODE_RELATIVE = 'relative';
export const PMODE_ABSOLUTE = 'absolute';

function _isValidCoordinate (c) {
    return (c !== undefined && c !== null);
}

export class RenderDelegate extends PrestoBase {
    x = null;
    y = null;
    relX = null;
    relY = null;

    positioningMode = PMODE_ABSOLUTE;

    render () {
        return this;
    }
}

export class Grob extends PrestoBase {
    /**
   * The horizontal position relative to the parent
   * @type {Number | null}
   */
    x = null;

    /**
   * The horizontal position relative to the parent
   * @type {Number | null}
   */
    y = null;

    /**
   * The parentGrob of this grob
   * @property {Grob | null} [parentGrob]
   */
    parentGrob = null;

    /**
   * @property {Grob[] | null} [childGrobs]
   */
    childGrobs = null;

    positioningMode = PMODE_RELATIVE;

    // score and staff to refer to later
    score = null;

    staff = null;

    /**
   * If true, this will cause the rendering process will ignore the width of this grob
   * @type {Boolean}
   */
    ignoreWidth = false; // set to true if width has to be ignored

    /**
   * If true, the rendering process will not render this object, but only its childGrobs if present
   * @type {Boolean}
   */
    isContainer = false; // set to true when the grob should not render anything itself

    /**
   * if true, the render process should render this object, otherwise it should not
   * @type {Boolean}
   */
    isVisible = true;

    /**
   * Properties which need to be copied onto the render delegate
   * @property {String[] | null} [renderProperties]
   */
    renderProperties = null;

    /**
   * The default width of a grob is the total of the childgrobs
   * @property {Number} width width of the child grobs in pixels, or 0 if none
   */
    get width () {
        if (!this.childGrobs) return 0;
        const w = getEach(this.childGrobs, 'width');
        return sum(w);
    }

    renderDelegate = RenderDelegate;

    /**
     * 
     * @param {number} refX 
     * @param {number} refY 
     * @returns 
     */
    render (refX, refY) {
        let ret = [];
        if (!_isValidCoordinate(refX) || !_isValidCoordinate(refY)) {
            throw new Error('Grob#render: invalid parent coordinates detected');
        }

        if (!this.isVisible) return ret;
        const { x: curX, y: curY, isVisible, renderProperties, renderDelegate, childGrobs } = this;
        const absX = curX + refX, absY = curY + refY;
        if (renderDelegate && !this.isContainer) {
            const base = {
                x: absX, y: absY, isVisible, relY: curY, relX: curX
            };
            if (renderProperties && Array.isArray(renderProperties)) {
                for (let p of renderProperties) {
                    base[p] = this[p];
                }
            }
            ret.push(renderDelegate.create(base));
        }
        if (childGrobs && childGrobs.length > 0) {
            // TODO: it might be necessary to add something to xOffset in case or margins/padding
            //
            // this renders the child grobs, make sure that we adjust the positions properly
            for (let cg of childGrobs) {
                ret = ret.concat(cg.render(absX, absY));
            }
        }
        return ret;
    }

    /**
     * 
     * @param {Grob} grob 
     */
    addChildGrob (grob) {
        if (!this.childGrobs) this.childGrobs = [];
        if (!grob.parentGrob) grob.parentGrob = this;
        if (grob.x === null) grob.x = 0;
        if (!grob.score && this.score) grob.score = this.score;
        if (!grob.staff && this.staff) grob.staff = this.staff;
        this.childGrobs.push(grob);
        return this;
    }

    addChildGrobs (grobs) {
        if (grobs && Array.isArray(grobs)) {
            grobs.forEach(g => this.addChildGrob(g));
        }
        return this;
    }
    
    /**
     * 
     * @param  {...object} opts 
     * @returns 
     */
    static create (...opts) {
        return new this(...opts);
    }
}




