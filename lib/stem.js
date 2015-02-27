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
        name: noteFlag
      }));
    }

  }
});


// /*globals CanvasMusic */

// CanvasMusic.Stem = CanvasMusic.Grob.extend({
//   isStem: true,
//   parentStaff: null,
//   noteFlag: null,

//   lineWidth: function () {
//     return this.getPath('parentStaff.size') / 6; // hardcode for now
//   }.property().cacheable(),

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     var noteFlag = this.get('noteFlag');
//     var cm = this.get('cm');
//     //if (!this.parentStaff) throw new Error("CanvasMusic.Stem#init: we need a parentStaff!");
//     // render ourselves like we would be a line, then add the flag if necessary
//     var xOffset = this.get('lineWidth') / 2;
//     if (this.get('stemIsUp')) xOffset *= -1;

//     this.addChildGrob(CanvasMusic.Line.create({
//       cm: cm,
//       x: xOffset,
//       y: 0, // set to 0, as it will take over the height of this grob
//       height: this.get('height'),
//       lineWidth: this.get('lineWidth'),
//       width: 0,
//       skipWidth: true,
//       lineIsStem: true
//     }));
//     if (noteFlag) {
//       this.addChildGrob(CanvasMusic.Symbol.create({
//         cm: cm,
//         name: noteFlag,
//         y: this.get('height'),
//         //x: 0,
//         skipWidth: true
//       }));
//     }
//   }


// });