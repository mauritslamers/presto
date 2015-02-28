/*globals Presto */

Presto.mixin({
  STEMDIRECTION_UP: "up",
  STEMDIRECTION_DOWN: "down"
});

/**
 * Presto.Stem is very much a Line, but as it also needs to be able to draw a
 * flag, it is a wrapper around Line.
 * @extends {Presto.Grob}
 */
Presto.Stem = Presto.Grob.extend({
  /**
   * Quack like a duck
   * @type {Boolean}
   */
  isStem: true,

  /**
   * Which flag should be attached to the stem
   * @type {String | null}
   */
  noteFlag: null,

  /**
   * To which horizontal coordinate the line should be drawn
   * @type {Number}
   */
  toX: null,

  /**
   * to which vertical coordinate the line should be drawn
   * @type {Number}
   */
  toY: null,

  /**
   * automatic calculation of the linewidth to use
   * @return {Number} staffsize / 3
   */
  lineWidth: function () {
    return this.score.get('size') / 3;
  },

  /**
   * The note will attach which direction the stem goes, which is important for where to insert the
   * note flag
   * @type {String}
   */
  stemDirection: null,

  init: function () {
    var noteFlag = this.noteFlag;
    var stemDirection = this.stemDirection;
    this.addChildGrob(Presto.Line.create({
      x: 0,
      y: -1,
      toX: 0,
      toY: this.toY,
      lineWidth: this.get('lineWidth')
    }));
    if (noteFlag) {
      this.addChildGrob(Presto.Symbol.create({
        x: 0,
        y: this.toY,
        name: noteFlag,
        score: this.score,
        staff: this.staff
      }));
    }

  }
});
