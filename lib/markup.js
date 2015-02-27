// /*globals CanvasMusic*/

// CanvasMusic.Markup = CanvasMusic.Grob.extend({
//   markup: null, // the text to be put
//   isMarkup: true,
//   markupAlign: SC.ALIGN_LEFT, // how to align the markup
//   cm: null, // the hook for the canvasmusic instance
//   fontFamily: "Arial",
//   skipWidth: true,
//   fontSize: function () {
//     var cm = this.get('cm');
//     if (!cm) throw new Error("CanvasMusic.Symbol#fontSize: no cm on symbol");
//     var fontSize = cm.get('fontSize') / 2;
//     if (!fontSize) throw new Error("no fontSize on cm?");
//     return fontSize;
//   }.property(),

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     var size = this.getPath('cm.size');
//     if (!this.get('skipWidth')) {
//       var metrics = this.getPath('cm._ctx').measureText(this.get('markup'));
//       if (!metrics) SC.warn("CanvasMusic.Markup: no metrics found for " + this.get('markup'));
//       else {
//         // width is being used to see how much we should be
//         switch (this.markupAlign) {
//           case SC.ALIGN_CENTER:
//             this.width = metrics.width * 0.5;
//             break;
//           case SC.ALIGN_LEFT:
//             this.width = metrics.width;
//             break;
//           case SC.ALIGN_RIGHT:
//             this.width = 0;
//             break;
//         }
//       }
//     }
//   },

//   render: function (context) {
//     var frame = this.get('frame');
//     var markup = this.get('markup');
//     //var char = CanvasMusic.fetaFontInfo[name];
//     var fontSize = this.get('fontSize');
//     //var fontSize = this.get('cm').get('fontSize');
//     if (!fontSize) {
//       //debugger;
//       //this.get('fontSize');
//     }
//     if (this.get('markupDown')) {
//       // add height + offset
//       frame.y += fontSize * 2;
//     }
//     else {
//       frame.y -= fontSize;
//     }
//     if (this.get('markupAlign') === SC.ALIGN_CENTER) {
//       frame.x -= (this.get('width') / 2);
//     }
//     //if (!char) SC.warn("CanvasMusic.Symbol: cannot render symbol with unknown name: " + name);
//     var font = fontSize + "pt " + this.get('fontFamily'); //   ctx.font = "32pt Emmentaler26";
//     //console.log("Symbol: rendering symbol " + name + " with font: " + font);
//     //console.log('Symbol: and positions x: ' + frame.x + " and y: " + frame.y);
//     context.beginPath();
//     context.font = font;
//     context.fillText(markup, frame.x, frame.y);
//     //context.endPath();
//   },

//   toString: function () {
//     return "CanvasMusic.Markup %@, markup: %@, skipWidth: %@".fmt(SC.guidFor(this), this.get('markup'), this.get('skipWidth'));
//   }
// });