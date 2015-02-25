/*globals CanvasMusic */

CanvasMusic.Stem = CanvasMusic.Grob.extend({
  isStem: true,
  parentStaff: null,
  noteFlag: null,

  lineWidth: function () {
    return this.getPath('parentStaff.size') / 6; // hardcode for now
  }.property().cacheable(),

  init: function () {
    arguments.callee.base.apply(this, arguments);
    var noteFlag = this.get('noteFlag');
    var cm = this.get('cm');
    //if (!this.parentStaff) throw new Error("CanvasMusic.Stem#init: we need a parentStaff!");
    // render ourselves like we would be a line, then add the flag if necessary
    var xOffset = this.get('lineWidth') / 2;
    if (this.get('stemIsUp')) xOffset *= -1;

    this.addChildGrob(CanvasMusic.Line.create({
      cm: cm,
      x: xOffset,
      y: 0, // set to 0, as it will take over the height of this grob
      height: this.get('height'),
      lineWidth: this.get('lineWidth'),
      width: 0,
      skipWidth: true,
      lineIsStem: true
    }));
    if (noteFlag) {
      this.addChildGrob(CanvasMusic.Symbol.create({
        cm: cm,
        name: noteFlag,
        y: this.get('height'),
        //x: 0,
        skipWidth: true
      }));
    }
  }


});