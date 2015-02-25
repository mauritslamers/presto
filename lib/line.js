/*globals Presto*/
Presto.Line = Presto.Grob.extend({
  color: 'black',

  /**
   * Thickness of the line
   * @type {Number}
   */
  lineWidth: null,

  toString: function () {
    return "Presto.Line %@";
  },

  /**
   * toX and toY are the coordinates to be used as end point of the line
   * @type {Number}
   */
  toX: null,
  toY: null,

  renderProperties: ['toX', 'toY', 'lineWidth', 'color'],

  renderDelegate: Presto.GrobRenderDelegate.extend({
    render: function (context) {
      var lw    = this.get('lineWidth'),
          color = this.get('color');

      context.beginPath();
      if (lw) context.lineWidth = lw;
      if (color) context.color = color;
      context.moveTo(this.x, this.y);
      var diffX = this.x - this.relX;
      var diffY = this.y - this.relY;
      context.lineTo(this.toX + diffX, this.toY + diffY);
      context.stroke();
    }
  })
});

// CanvasMusic.Line = CanvasMusic.Grob.extend({
//   // height === thickness
//   //
//   color: 'black',

//   lineWidth: null,

//   toString: function () {
//     return "CanvasMusic.Line %@".fmt(SC.guidFor(this));
//   },

//   render: function (context) {
//     if (this.get('parentGrob').isBarline) debugger;
//     var frame = this.get('frame');
//     var lw = this.get('lineWidth');
//     context.beginPath();
//     if (lw) context.lineWidth = lw;
//     //context.color = this.get('color');

//     var x1 = frame.x, x2 = frame.x + frame.width;
//     var y1 = frame.y, y2 = frame.y + frame.height;

//     context.moveTo(frame.x, frame.y);
//     context.lineTo(frame.x + frame.width, frame.y + frame.height);
//     context.stroke();
//     //console.log("drawning line: " + SC.inspect(frame));
//     //console.log('drawing line from x1: %@, y1: %@, to x2: %@, y2: %@'.fmt(x1, y1, x2, y2));
//     //console.log('lineWidth: ' + lw);
//   }
// });