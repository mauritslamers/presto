/*globals Presto, console*/

Presto.Symbol = Presto.Grob.extend({
  init: function () {
    if (!this.fontSize) {
      Presto.warn("Presto.Symbol initialized without fontSize property!");
    }
    if (this.ignoreWidth) {
      this.width = 0;
    }
    else {
      var metrics = Presto.fetaFontMetrics[this.get('name')];
      if (!metrics) {
        Presto.warn("Presto.Symbol: no metrics found for " + this.name);
        this.width = 0;
      }
      else {
        this.width = metrics.width;
      }

    }

  },

  renderProperties: ['name', 'fontSize'],

  renderDelegate: Presto.GrobRenderDelegate.extend({
    render: function (context) {
      var fontSize = this.get('fontSize');
      var char = Presto.fetaFontInfo[this.get('name')];
      if (!char) Presto.warn("Presto.Symbol: cannot render symbol with unknown name: " + name);
      var font = fontSize + "pt Emmentaler26"; //   ctx.font = "32pt Emmentaler26";
      context.beginPath();
      context.font = font;
      context.fillText(char, this.x, this.y);
    }
  }),

  toString: function () {
    return "CanvasMusic.Symbol %@, name: %@".fmt(SC.guidFor(this), this.get('name'));
  }
});

// /*globals CanvasMusic, console*/

// // the basic class for a font symbol

// CanvasMusic.Symbol = CanvasMusic.Grob.extend({
//   name: null, // the name of the symbol to print, see fontInfo.js
//   //fontSize: 64, // 64 is default, should be set different by the parent
//   fontSize: function () {
//     var cm = this.get('cm');
//     if (!cm) throw new Error("CanvasMusic.Symbol#fontSize: no cm on symbol");
//     var fontSize = cm.get('fontSize');
//     if (!fontSize) throw new Error("no fontSize on cm?");
//     return fontSize;
//   }.property(),

//   skipWidth: false,

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     if (!this.skipWidth) {
//       var metrics = CanvasMusic.fetaFontMetrics[this.get('name')];
//       if (!metrics) SC.warn("CanvasMusic.Symbol: no metrics found for " + this.name);
//       else {
//         this._width = metrics.width;
//       }
//     }
//   },

//   width: function () {
//     var w = this._width || 0;
//     return w + this.get('marginLeft') + this.get('marginRight');
//   }.property('marginLeft', 'marginRight').cacheable(),

//   render: function (context) {
//     var frame = this.get('frame');
//     var name = this.get('name');
//     var char = CanvasMusic.fetaFontInfo[name];
//     var fontSize = this.get('fontSize');
//     //var fontSize = this.get('cm').get('fontSize');
//     if (!fontSize) {
//       //debugger;
//       //this.get('fontSize');
//     }
//     if (!char) SC.warn("CanvasMusic.Symbol: cannot render symbol with unknown name: " + name);
//     var font = fontSize + "pt Emmentaler26"; //   ctx.font = "32pt Emmentaler26";
//     //console.log("Symbol: rendering symbol " + name + " with font: " + font);
//     //console.log('Symbol: and positions x: ' + frame.x + " and y: " + frame.y);
//     context.beginPath();
//     context.font = font;
//     context.fillText(char, frame.x, frame.y);
//     //context.endPath();
//   },

//   toString: function () {
//     return "CanvasMusic.Symbol %@, name: %@".fmt(SC.guidFor(this), this.get('name'));
//   }
// });