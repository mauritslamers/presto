
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

/**
 * 
 * @param {object[]} ar 
 * @param {string} propname 
 * @return { any[] }
 */
export function getEach (ar, propname) {
    const ret = [];
    for (let i = 0; i < ar.length; i += 1) {
        ret.push(ar[i][propname]);
    }
    return ret;
}



export class PrestoBase {
    /**
     * 
     * @param  {...object} opts 
     */
    constructor (...opts) {
        // apply all opts as properties on the current object
        for (let o of opts) {
            Object.assign(this, o);
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