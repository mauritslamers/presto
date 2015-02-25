// we have to think a bit about this one, as the clef decides the positions of
// notes on a staff, so in essence, it seems to be better to let it be a mixin
// as it has its own settings, and should be part of the drawing process of a staff

// however, the clef itself is a grob
// so, essentially we should have a Clef grob and a clef mixin, which adds the stuff to Staff

// this is the clef grob, the cleff scopes are mixins
CanvasMusic.Clef = CanvasMusic.Grob.extend({
  type: null, // one of CanvasMusic.Clef.T_TREBLE etc

  init: function () {
    arguments.callee.base.apply(this, arguments);

    var type = this.get('type');
    switch (type) {
      case CanvasMusic.Clef.T_TREBLE:
        this.addChildGrob(CanvasMusic.Symbol.create());
    }

  }
});


SC.mixin(CanvasMusic.Clef, {
  // clef types, are the names of the
  T_TREBLE: "treble",
  T_BASS: "bass"
});