/*globals Presto*/

/*
Presto.Grob is the basic GRaphical OBject. It provides the basic relative positioning functionality,
as well as the support for containing other grobs.

Relative positioning is done against the parent, where in the end the top grob must have an absolute position.
In order for this to work, every grob has a x and y property, which indicate its relative position to the parent grob.

This system allows for a basic first round of creating a basic layout, which can then be finetuned.
The difficulty of such a system is that the aligning doesn't necessarily can be done through x and y, as that would mean
that everything would be left aligned. The system of music notation only needs horizontal aligning as the vertical position can
In order to deal with this, a grob can contain a align property, which

Because this system is also intended to be edited graphically and filled incrementally, the render phase of the system will create a
new representation in absolutely positioned elements. In order to do this, every grob needs to define its absolute version on the
renderDelegate property. While it is technically not really a render delegate, it is the closest approximation.

The advantage of doing the rendering this way is that grobs don't have to be aware of grobs directly around them.

*/
Presto.mixin({
  /**
   * Positioning modes
   */
  PMODE_RELATIVE: 'relative',
  PMODE_ABSOLUTE: 'absolute',

  _isValidCoordinate: function (c) {
    return (c !== undefined && c !== null);
  }
});


// base class for render delegates
/**
 * Base class for render delegates
 * @extends { Presto.Object }
 */
Presto.GrobRenderDelegate = Presto.Object.extend({
  /**
   * The Renderer gets 4 times a position, being x and y and absX and absY.
   * x and y represent the absolute position the parent thinks this grob should have.
   * relX and relY represent the position relative to the parent.
   * x and y are calculated as the absX + relX and absY + relY.
   * Reason that both are given is that sometimes there are more coordinates which needs moving
   * than just x and y. In normal use you can rely on x and y having the right position, and
   * in specific use, you can use the difference to check out how the rest needs to be moved as well
   * @type {Number}
   */
  x: null,
  y: null,
  relX: null,
  relY: null,

  positioningMode: Presto.PMODE_ABSOLUTE,

  render: function (context) {
    return this;
  }

});

/**
 * Grob, base class for all Graphical Objects
 * @extends {Presto.Object}
 */
Presto.Grob = Presto.Object.extend({
  /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
  x: null,

  /**
   * The horizontal position relative to the parent
   * @type {Number}
   */
  y: null,

  /**
   * The parentGrob of this grob, currently unused
   * @type {Presto.Grob}
   */
  parentGrob: null,

  /**
   * childGrobs
   * @type {Presto.Array}
   */
  childGrobs: null,

  positioningMode: Presto.PMODE_RELATIVE,

  /**
   * If true, this will cause the rendering process will ignore the width of this grob
   * @type {Boolean}
   */
  ignoreWidth: null, // set to true if width has to be ignored

  /**
   * If true, the rendering process will not render this object, but only its childGrobs if present
   * @type {Boolean}
   */
  isContainer: false, // set to true when the grob should not render anything itself

  /**
   * Properties which need to be copied onto the render delegate
   * @type {Array}
   */
  renderProperties: null,

  /**
   * The default width of a grob is the total of the childgrobs
   * @return {Number} width of the child grobs in pixels, or 0 if none
   */
  width: function () {
    if (!this.childGrobs) return 0;
    var w = this.childGrobs.getEach('width');
    return w.get('@sum');
  },

  /**
   * render on a grob does two things: it will create a render delegate instance of itself (when needed)
   * and it will check whether it has childGrobs and render those as well
   * @param  {Number} refX Parents absX plus the internal xOffset
   * @param  {Number} refY Parents absY
   * @return {Array}       Array containing all the render delegate instances
   */
  render: function (refX, refY) {
    var ret = [];
    if (!Presto._isValidCoordinate(refX) || !Presto._isValidCoordinate(refY)) {
      throw new Error("Presto.Grob#render: invalid parent coordinates detected");
    }
    var curX = this.get('x');
    var curY = this.get('y');
    var absX = curX + refX;
    var absY = curY + refY;

    var xOffset = 0;
    if (this.renderDelegate && !this.isContainer) {
      var baseObj = {
        x: absX,
        y: absY,
        relX: curX,
        relY: curY
      };
      if (this.renderProperties && this.renderProperties instanceof Array) {
        this.renderProperties.forEach(function (rp) {
          baseObj[rp] = this.get(rp);
        }, this);
      }
      ret.push(this.renderDelegate.create(baseObj));
    }
    if (this.childGrobs && this.childGrobs.length > 0) {
      // TODO: it might be necessary to add something to xOffset in case or margins/padding
      //
      // this renders the child grobs, make sure that we adjust the positions properly
      this.childGrobs.forEach(function (cg) {
        ret = ret.concat(cg.render(absX + xOffset, absY));
        // not sure if the line below is a good idea...
        //if (!cg.ignoreWidth) xOffset += cg.get('width');
      });
    }
    return ret;
  },


  renderDelegate: Presto.GrobRenderDelegate,

  /**
   * Adds a childgrob to the current grob
   * @param {Presto.Grob} grob The grob required to be added
   */
  addChildGrob: function (grob) {
    if (!this.childGrobs) this.childGrobs = Presto.Array.create();
    if (!grob.parentGrob) grob.set('parentGrob', this);
    if (grob.x === null) grob.x = 0;
    if (!grob.score) grob.score = this.score;
    if (!grob.staff && this.staff) grob.staff = this.staff;
    this.childGrobs.push(grob);
    return this;
  },

  addChildGrobs: function (grobs) {
    if (grobs && grobs instanceof Array) {
      grobs.forEach(this.addChildGrob, this);
    }
    return this;
  }

});



// A GRaphical OBject: basic element which represents a simple layer of abstraction
// for positioning. It resembles the SproutCore layout hash, but then as an SC.Object
// and with auto-updating functionality
//
// In discussion with publickeating, this design needs to be reviewed.
// Reason is that it is not required to have all properties set at all times.
// - left has no meaning when right + width + right aligned
// - top + right aligned => right, top, width and height are required
//
// so, in the end it seems to be best to have a function called frame which returns the correct
// frame, and have everything (if required) depend on that.
//
// It is important to realize that some issues will remain, as the canvas element (for which
// this grob is intended to work) only has x and y as positioning system.
// What needs to be realized here as well is that this x and y do not necessarily represent the top and left
// of the Grob. For a note specifically, the x and y is the left / middle of the character.
//
// Actually, having observers on the properties is not going to work _ AT ALL _
// The problem being that the observers will only be triggered at the end of the runloop
// which is WAY too late for what we need here... ie something immediate
// So, computed properties would be _MUCH_ better, as they should be direct...
// there is another advantage with computed properties, as we can call them directly internally
// with extra arguments... however, when creating the grob, we cannot do left: 1, right: 1 as that would
// overwrite the computed property...
//
//
// no, much better is a separate function called adjust(prop, value) which we control
// saves all observers...
//
///*global Presto, console*/
// Presto.Grob = Presto.Object.extend({
//   x: null,
//   y: null,
//   height: null,
//   //width: null,
//   marginLeft: 0,
//   marginRight: 0,
//   marginTop: 0,
//   marginBottom: 0,
//   paddingLeft: null,
//   paddingRight: null,
//   paddingTop: null,
//   paddingBottom: null,

//   debugGrob: false, // draw a box with the outer limits of the grob, as well as a box with the margins

//   // the following property values define how the grob
//   // will deal with height and width adjustments.
//   // The default for both is ALIGN_CENTER, which means that:
//   // - when the height is reduced or enlarged, both the top and bottom will be adjusted equally (half of the change value)
//   // - when the width is reduced or enlarged, both left and right will be adjusted equally (half of the change value)
//   // Other supported values are
//   // - SC.ALIGN_LEFT and SC.ALIGN_RIGHT for horizontalAlign
//   //   - When set to SC.ALIGN_LEFT: if width is adjusted, the left value is not touched
//   //   - When set to SC.ALIGN_RIGHT: if width is adjusted, the right value is not touched
//   // - SC.ALIGN_TOP and SC.ALIGN_BOTTOM for verticalAlign
//   //   - When set to SC.ALIGN_TOP: if height is adjusted, the top value is not touched
//   //   - When set to SC.ALIGN_BOTTOM: if height is adjusted, the bottom value is not touched
//   horizontalAlign: SC.ALIGN_CENTER,
//   verticalAlign: SC.ALIGN_CENTER,

//   move: function (key, value) {
//     // function to move the object in a specific direction
//     // if (this._absoluteDisplayProperties.indexOf(key) === -1) {
//     //   console.log("WARNING: using CanvasMusic.Grob#move with margin or padding... Please use set...");
//     //   return this;
//     // }
//     //
//     var v = this.get(key) || 0;
//     return this.set(key, v + value);
//   },

//   positioningMode: null,

//   parentGrob: null, // attach to a parent object

//   init: function () {
//     arguments.callee.base.apply(this, arguments);
//     if (!this.positioningMode) this.set('positioningMode', CanvasMusic.Grob.PMODE_RELATIVE);
//   },

//   _absoluteDisplayProperties: ['x', 'y', 'height', 'width'],

//   _marginDisplayProperties: ['marginLeft', 'marginRight', 'marginTop', 'marginBottom' ],

//   _paddingDisplayProperties: [ 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'],

//   // this is a way to get the marginRight we have to take into account
//   previousMarginRight: function () {
//     var ret = 0;
//     var prevGrob = this.get('previousGrob');
//     if (prevGrob) ret = prevGrob.get('marginRight');
//     return ret;
//   }.property(),

//   previousGrob: function () {
//     var ret;
//     var parentChildGrobs = this.getPath('parentGrob.childGrobs');
//     if (parentChildGrobs) {
//       var prevIndex = parentChildGrobs.indexOf(this) - 1;
//       if (prevIndex >= 0) {
//         ret = parentChildGrobs.objectAt(prevIndex);
//       }
//     }
//     return ret;
//   }.property(),

//   previousFrame: function () {
//     //var ret = { x: 0, y: 0 };
//     var ret;
//     var prevGrob = this.get('previousGrob');
//     if (prevGrob) ret = prevGrob.get('frame');
//     return ret;
//   }.property(),

//   // frame will always return an absolute positioning
//   // which means a hash with x, y, height, width
//   // consequency also means coercing everything into this pattern
//   //
//   // What possibly goes wrong here is that the frame inside a column depends on all the widths and margins of all previous
//   // items set against the frame of the column.
//   frame: function () {
//     var absProps = this._absoluteDisplayProperties,
//         posMode = this.get('positioningMode'),
//         parentFrame, marginLeft, //prevMarginRight,
//         previousGrob, xOffset, ret = {};

//     //debugger;
//     // the pattern is to take the absolute properties first
//     if (posMode === CanvasMusic.Grob.PMODE_ABSOLUTE) {
//       absProps.forEach(function (p) {
//         ret[p] = this.get(p);
//       }, this);
//     }
//     else { // in relative mode...
//       // meaning that we have to adjust the absolute positions we get from the parent
//       // using the relative properties
//       // add the marginRight of the previous item to the current x position, as well as
//       // our marginLeft
//       //prevMarginRight = this.get('previousMarginRight');
//       marginLeft = this.get('marginLeft') || 0;
//       parentFrame = this.getPath('parentGrob.frame');
//       previousGrob = this.get('previousGrob');
//       var prevFrame;
//       //SC.Logger.log("parent of %@ is a %@, with frame %@".fmt(this, this.get('parentGrob'), SC.inspect(parentFrame)));

//       if (previousGrob) {
//         prevFrame = previousGrob.get('frame');
//         //SC.Logger.log("previousGrob of %@ is a %@ (skipwidth: %@), with frame %@".fmt(this, previousGrob, previousGrob.get('skipWidth'), SC.inspect(prevFrame)));
//       }
//       if (previousGrob && !previousGrob.get('skipWidth')) {
//         // this looks a bit weird, but the problem is that width already contains the previous margin left
//         // as well as the right one, so we need to take it out to prevent it from being counted twice
//         xOffset = prevFrame.x + prevFrame.width - prevFrame.marginLeft; // marginRight is already in the prevFrame.width
//       }
//       else {
//         xOffset = parentFrame.x || 0;
//       }
//       ret.x = xOffset + this.get('x') + marginLeft;
//       ret.y = parentFrame.y + this.get('y');
//       ret.height = this.get('height');
//       ret.width = this.get('width');
//       ret.marginLeft = this.get('marginLeft');
//       ret.marginRight = this.get('marginRight');
//       //ret.widthOfChildGrobs = this.get('widthOfChildGrobs')
//     }
//     if (this.debugGrob) SC.Logger.log("frame of %@ is %@".fmt(this, SC.inspect(ret)));
//     return ret;
//   }.property().cacheable(),

//   // for debugging purposes
//   relativeFrame: function () {
//     var props = this._displayProperties;
//     var ret = {};
//     props.forEach(function (p) {
//       ret[p] = this.get(p);
//     }, this);
//     return ret;
//   }.property(),

//   childGrobs: null,

//   widthOfChildGrobs: function () {
//     if (!this.childGrobs) return 0;
//     var ret = 0;
//     this.childGrobs.forEach(function (g) {
//       var w;
//       if (g.get('skipWidth')) {
//         w = 0;
//       }
//       else if (g.get('childGrobs')) {
//         w = g.get('widthOfChildGrobs');
//       }
//       else w = g.get('width');

//       ret += w + g.get('marginLeft') + g.get('marginRight');
//     });
//     return ret;
//   }.property('numberOfChildGrobs', 'skipWidth').cacheable(),

//   width: function () {
//     // the width of a grob is the width of the contents, and the marginLeft and marginRight
//     if (!this.get('skipWidth')) {
//       return this.get('widthOfChildGrobs') + this.get('marginLeft') + this.get('marginRight');
//     }
//     else return 0;
//   }.property('numberOfChildGrobs', 'marginLeft', 'marginRight', 'skipWidth').cacheable(),

//   autoAdjustOnAdd: false, //

//   addChildGrob: function (g) {
//     if (!this.childGrobs) this.childGrobs = [];
//     if (!g){
//       //SC.warn("CanvasMusic.Grob#addChildGrob: trying to add ")
//       return; // ignore undefined / null / false
//     }

//     if (!g.get('parentGrob')) {
//       g.set('parentGrob', this);
//     }

//     if (!g.get('cm')) {
//       g.set('cm', this.get('cm'));
//     }

//     // we assume that all childgrobs will be in horizontal alignment, unless it is specified
//     if (g.get('x') === null) {
//       if (this.childGrobs.length === 0) {
//         g.set('x', 0);
//         if (g.get('y') === null) g.set('y', 0);
//       }

//       // let's not do this automatically, it goes horribly wrong for vertically stacked things (such as staffs)
//       // because it starts adding up the widths of the staff lines...
//       // perhaps in a configurable way, but not like this...
//       //
//       // else if (this.childGrobs.length > 0 && relativeMode && g.autoAdjustOnAdd) {
//       //   //debugger;
//       //   // there are items in the child grobs, only adjust in relative mode!
//       //   var lastObj = this.childGrobs.lastObject();
//       //   // adjust left to the width + the margin of the last object
//       //   var diff = lastObj.get('width') + lastObj.get('marginLeft') + lastObj.get('marginRight');
//       //   g.move('x', diff);
//       // }
//       //
//     }

//     // if (g.get('width') && relativeMode && !g.skipWidth) {
//     //   this.set('width', this.get('width') + g.get('width'));
//     // }

//     var l = this.childGrobs.push(g);
//     this.set('numberOfChildGrobs', l);
//     return this;
//   },

//   // removeChildGrob: function (g) {
//   //   if (!this.childGrobs) return this;
//   //   // what functionality to provide here exactly?
//   //   // we usually would not have a reference, so a type would be rather more useful...
//   // },

//   // this should be implemented on a grob basis
//   render: function (context) {
//     var cG = this.get('childGrobs');
//     if (cG) {
//       cG.forEach(function (g) {
//         if (!g || !g.render) console.log(g);
//         g.render(context);
//       });
//     }
//     if (this.debugGrob) this._drawDebugFrame(context);
//     return this;
//   },

//   _drawDebugFrame: function (ctx) {
//     //debugger;
//     var origLineWidth = ctx.lineWidth;
//     var origStrokeStyle = ctx.strokeStyle;
//     var frame = this.get('frame');
//     var h = frame.height || 70; // default height
//     //ctx.beginPath();
//     ctx.lineWidth = 1;
//     ctx.strokeStyle = "blue";
//     ctx.strokeRect(frame.x, frame.y, frame.width, h);
//     ctx.strokeStyle = "red";
//     ctx.strokeRect(frame.x + frame.marginLeft, frame.y, frame.width - frame.marginRight, h);
//     ctx.lineWidth = origLineWidth;
//     ctx.strokeStyle = origStrokeStyle;
//     ctx.font = "9pt Arial";
//     var dbgtext = SC.guidFor(this);
//     var w = frame.x + (frame.width - ctx.measureText(dbgtext).width) / 2;
//     ctx.fillText(dbgtext, w, frame.y);
//   },

//   toString: function () {
//     return "Presto.Grob %@".fmt(SC.guidFor(this));
//   }

// });

