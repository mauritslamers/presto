/*globals Presto*/

/**
 * A rest class. It is a grob, not a symbol as rests can have dots as well
 * @extends {Presto.Grob}
 */
Presto.Rest = Presto.Grob.extend({
  /**
   * Quack like a duck
   * @type {Boolean}
   */
  isRest: true,

  /**
   * Length of the rest
   * @type {[type]}
   */
  length: null,

  /**
   * how many dots does the rest have?
   * @type {Number}
   */
  dots: null,

  /**
   * return the correct glyph for rest of a specific length
   * @return {String} character name
   */
  restGlyph: function () { // can be overridden or extended if required
    var l = this.get('length');
    switch (l) {
      case 1:
        return "rests.0"; // whole
      case 2:
        return "rests.1"; // half
      case 4:
        return "rests.2"; // quarter
      case 8:
        return "rests.3"; // eighth
      case 16:
        return "rests.4"; // sixteenth
    }
  },

  init: function () {
    var length = this.get('length'),
        numDots = this.get('dots'),
        glyph = this.get('restGlyph'),
        dotglyph, i, prevwidth;

    var symbol = Presto.Symbol.create({
      score: this.score,
      staff: this.staff,
      name: glyph,
      fontSize: this.score.get('fontSize')
    });

    if (length === 1) {
      // for some reason the whole rest needs an offset
      symbol.y = this.staff.calculateVerticalOffsetFor(-2);
    }

    this.addChildGrob(symbol);

    if (numDots) {
      prevwidth = symbol.get('width');
      for (i = 0; i < numDots; i += 1) {
        dotglyph = Presto.Symbol.create({
          name: 'dots.dot',
          x: prevwidth
        });
        this.addChildGrob(dotglyph);
        prevwidth += dotglyph.get('width');
      }
      dotglyph = null;
    }

  }

});

Presto.mixin(Presto.Rest, {

  isRestHash: function (h) {
    if (h.name === "rest" && h.length) {
      return true;
    }
    return false;
  }
});

// /*globals CanvasMusic*/

// CanvasMusic.Rest = CanvasMusic.Grob.extend({
//   isRest: true, // quack like a duck
//   length: null, // length of the rest
//   dots: null, // how many dots this rest should have
//   markup: null, // do we have markup on this note?
//   markupAlign: SC.ALIGN_CENTER, // default markup is centered
//   markupDown: false,
//   marginRight: function () {
//     var l = this.get('length');
//     if (l === 1) return 20;
//     else if (l === 2) return 0;
//     else if (l === 4) return 20;
//     else if (l === 8) return 20;
//     else if (l === 16) return 20;
//   }.property('length').cacheable(),

//   restGlyph: function () { // can be overridden or extended if required
//     var l = this.get('length');
//     switch (l) {
//       case 1:
//         return "rests.0"; // whole
//       case 2:
//         return "rests.1"; // half
//       case 4:
//         return "rests.2"; // quarter
//       case 8:
//         return "rests.3"; // eighth
//       case 16:
//         return "rests.4"; // sixteenth
//     }
//   }.property('length').cacheable(),

//   top: function () {
//     var pS = this.get('parentStaff');
//     var l = this.get('length');
//     if (l === 1) {
//       return pS.topOfStaffLineFor(4);
//     }
//     else {//if (l === 2) {
//       return pS.topOfStaffLineFor(3);
//     }

//   }.property('length').cacheable(),

//   init: function () {
//     //arguments.callee.base.apply(this, arguments);
//     this.calculateRest();
//   },

//   calculateRest: function () {

//     var top = this.get('top');
//     //var top = this.get('y'), i;
//     var i;
//     var mix = { cm: this.get('cm') };
//     var numDots = this.get('dots');
//     var restSymbol = CanvasMusic.Symbol.create(mix, {
//       name: this.get('restGlyph'),
//       y: top + 1
//     });
//     var restWidth = restSymbol.get('width');
//     this.addChildGrob(restSymbol);

//     // add dots
//     //
//     if (numDots && numDots > 0) {
//       for (i = 0; i < numDots; i += 1) {
//         this.addChildGrob(CanvasMusic.Symbol.create(mix, {
//           y: top + this.getPath('cm.size') * 0.5,
//           marginLeft: restWidth * (0.5 * (i + 1)),
//           name: "dots.dot",
//           autoAdjustOnAdd: true,
//           skipWidth: true
//         }));
//       }
//     }
//   },

//   width: function () {
//     return this.get('widthOfChildGrobs');
//   }.property()
// });