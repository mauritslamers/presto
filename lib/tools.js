
/**
 * 
 * @param {Number[]} ar 
 * @return {Number}
 */
export function sum (ar) {
    let ret = 0
    for (let i = 0; i < ar.length; i += 1) {
        ret += ar[i];
    }
    return ret;
}

export function warn (string) {
    console.log('WARNING: ' + string);
}

/**
 * 
 * @param {object[]} ar 
 * @param {string} propname 
 * @return { any[] }
 */
export function getEach (ar, propname) {
    const ret = [];
    for (let i = 0; i < ar.length; i += 1) {
        if (ar[i]) ret.push(ar[i][propname]);
        else ret.push(undefined);
    }
    return ret;
}

export function setEach (ar, key, value) {
    for (let i = 0; i < ar.length; i += 1) {
        ar[i][key] = value;
    }
}

/**
 * Function to calculate a size in pixels to a size in points
 * @param  {Number} val in pixels
 * @return {Number}     points
 */
export function px2pt (val) {
    return val * (16 / 3);
}

/**
 * Function to calculate a size in points to a size in pixels
 * @param  {Number} val in points
 * @return {Number}     pixels
 */
export function pt2px (val) {
    return val * (3 / 16);
}

export class PrestoBase {
    /**
     * 
     * @param  {...object} opts 
     */
    constructor (...opts) {
        // apply all opts as properties on the current object
        this.mixin(...opts);
    }

    mixin (...opts) {
        for (let o of opts) {
            // Object.assign(this, o);
            for (let k of Object.keys(o)) {
                this[k] = o[k];
            }
        }
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