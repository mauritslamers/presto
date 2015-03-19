/*globals Presto, console*/

Presto.Symbol = Presto.Grob.extend({
  init: function () {
    if (!this.fontSize) {
      //Presto.warn("Presto.Symbol initialized without fontSize property!");
      this.fontSize = this.score.get('fontSize');
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
    if (!this.name) {
      throw new Error("cannot print an undefined symbol!");
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

  // toString: function () {
  //   return "CanvasMusic.Symbol %@, name: %@".fmt(SC.guidFor(this), this.get('name'));
  // }
});
