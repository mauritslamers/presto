/*globals CanvasMusic */
CanvasMusic.Barline = CanvasMusic.Grob.extend({

  type: null, // one of the types

  marginLeft: function () {
    //debugger;
    //console.log('barline width: ' + this.get('width'));
    return this.getPath('cm.size') / 2;
  }.property(),

  marginRight: function () {
    //debugger;
    //console.log('barline width: ' + this.get('width'));
    return this.getPath('cm.size') / 2;
  }.property(),

  width: function () {
    return this.get('marginRight') + this.get('marginLeft');
  }.property(),

  init: function () {
    arguments.callee.base.apply(this, arguments);
    var t = this.get('type');
    var k = CanvasMusic.Barline;
    var size = this.getPath('cm.size');
    switch (t) {
      case k.T_SINGLE:
        this.addChildGrob(CanvasMusic.Line.create({
          parentGrob: this,
          parentStaff: this.get('parentStaff'),
          cm: this.get('cm'),
          lineWidth: size / 6,
          y: this.get('y'),
          skipWidth: true,
          height: this.get('height')
        }));
        break;
      case k.T_DOUBLE: break;
      case k.T_END: break;
      case k.T_REPEAT_OPEN: break;
      case k.T_REPEAT_CLOSE: break;
      default: throw new Error("CanvasMusic.Barline: undefined barline type: " + t);
    }
  },

  toString: function () {
    return "CanvasMusic.Barline %@".fmt(SC.guidFor(this));
  },

  isBarLine: true // quack like a duck...
});

SC.mixin(CanvasMusic.Barline, {
  T_SINGLE: "singlebar",
  T_DOUBLE: "doublebar",
  T_END: "endbar",
  T_REPEAT_OPEN: "repeat_open",
  T_REPEAT_CLOSE: "repeat_close",

  isBarline: function (name) {
    var k = CanvasMusic.Barline;
    if (!name) return false;
    var validNames = [ k.T_SINGLE, k.T_DOUBLE, k.T_END, k.T_REPEAT_CLOSE, k.T_REPEAT_OPEN ];
    return validNames.indexOf(name) > -1;
  }
});