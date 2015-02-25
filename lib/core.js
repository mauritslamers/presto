/*global Presto*/

// This is going to be done differently
// A score is the basic element




// /*global CanvasMusic*/

// CanvasMusic = SC.Object.extend({

//   element: null, // the canvas element

//   width: null, // width of the element (autodetected)

//   height: null, // height of the element (autodetected)

//   fontSize: null, // size in points

//   size: null, // size in pixels

//   drawImmediately: false, // whether to draw immediately on launch

//   init: function () {
//     SC.RunLoop.begin();
//     arguments.callee.base.apply(this, arguments);
//     var element;
//     var defaultFontSize = 32;

//     if (!this.element) throw new Error('No canvas element given for CanvasMusic');
//     if (SC.typeOf(this.element) === SC.T_STRING) {
//       var elementId = this.element;
//       this.element = document.getElementById(elementId);
//       if (!this.element) throw new Error("Cannot find the canvas element with id " + elementId);
//     }
//     element = this.element;
//     if (!this.size && !this.fontSize) {
//       this.set('fontSize', defaultFontSize);
//       this.set('size', this._pt2px(defaultFontSize));
//     }

//     this._ctx = element.getContext('2d');
//     this.width = element.width;
//     this.height = element.height;
//     if (this.size && !this.fontSize) {
//       this.sizeDidChange();
//     }
//     else if (!this.size && this.fontSize) {
//       this.fontSizeDidChange();
//     }
//     else if (!this.size && !this.fontSize) {
//       this.size = 24;
//       this.sizeDidChange(); // don't rely on the observer to work by itself at this moment
//     }

//     this.initFontInfo();

//     SC.RunLoop.end();

//     // Score initialization... needs Score class first :)
//     // we also need to take care of (perhaps) setting up a hidden div automatically
//     // in order for the font to be loaded on time
//     if (this.score) {
//       SC.RunLoop.begin();
//       this._score = CanvasMusic.Score.create({ // we need to set the score explicitly
//         parent: this,
//         width: element.width,
//         height: element.height,
//         x: 0,
//         y: 0,
//         horizontalAlign: SC.ALIGN_LEFT,
//         verticalAlign: SC.ALIGN_TOP,
//         positioningMode: CanvasMusic.Grob.PMODE_ABSOLUTE
//       }, this.score);
//       SC.RunLoop.end();
//       if (this.get('drawImmediately')) {
//         //debugger;
//         SC.RunLoop.begin();
//         this._score.render(this._ctx);
//         SC.RunLoop.end();
//       }
//     }


//     //   if(this.score){
//     //     this.score.size = this.score.size || this.size;
//     //     this.score.canvas = this._ctx;
//     //     this._score = new Score(this.score,this);
//     //   }
//     //   var me = this;
//     //   if(!this._imagesLoaded){
//     //     this._preloadImages(function(){
//     //       me._imagesLoaded = true;
//     //       if(me.drawImmediately) me.draw();
//     //     });
//     //   }
//     // if (this.drawImmediately) {
//     //   this.draw();
//     // }

//   },

//   initFontInfo: function () {
//     // render the font info into characters...
//     var fI = CanvasMusic.fetaFontInfo;
//     var fM = CanvasMusic.fetaFontMetrics;
//     var ctx = this._ctx;
//     ctx.font = this.get('fontSize') + "pt Emmentaler26";
//     Object.keys(fI).forEach(function (k) {
//       var val = String.fromCharCode(fI[k]);
//       fI[k] = val;
//       fM[k] = ctx.measureText(val);
//     });

//   },

//   // PRIVATE
//   _ctx: null, // the 2d canvas rendering context

//   _px2pt: function (val) {
//     return val * (8/3);
//   },

//   _pt2px: function (val) {
//     return val * (3/8);
//   },

//   // these changes should also cause a redraw!
//   sizeDidChange: function () {
//     this.fontSize = this._px2pt(this.get('size'));
//   }.observes('size'),

//   fontSizeDidChange: function () {
//     this.size = this._pt2px(this.get('fontSize'));
//   }.observes('fontSize'),

// });


// /*

//   The rendering of CanvasMusic will occur in two stages:
//   - a calculating stage: all positions will be precalculated
//   - a rendering stage: all grobs will be "rendered".
//     Every Grob should implement a render function, which will be passed a render context (canvas element)
//     and should put itself and its dimensions on the canvas



//  */

// // CanvasMusic = function(opts) {
// //   if (!element)
// //   if (typeof element === "string") {
// //
// //   }
// //   this._el = element;
// //   this._ctx = element.getContext('2d');
// //   this.width = element.width;
// //   this.height = element.height;
// //   this.size = opts.size || 35;
// //   this.score = opts.score;
// //   this.drawImmediately = opts.drawImmediately;
// //   this.urlPrefix = opts.urlPrefix;
// //   this.init();
// //   return this;
// // };


// // // ======

// // CanvasMusic.prototype.init = function(){
// //   if(this.score){
// //     this.score.size = this.score.size || this.size;
// //     this.score.canvas = this._ctx;
// //     this._score = new Score(this.score,this);
// //   }
// //   var me = this;
// //   if(!this._imagesLoaded){
// //     this._preloadImages(function(){
// //       me._imagesLoaded = true;
// //       if(me.drawImmediately) me.draw();
// //     });
// //   }
// // };

// // CanvasMusic.prototype._preloadImages = function(callback){
// //   var me = this;
// //   var glyphs = [
// //     'acc_dblsharp',
// //     'acc_flat',
// //     'acc_sharp',
// //     'acc_natural',
// //     'clef_f',
// //     'clef_f_change',
// //     'clef_g',
// //     'clef_g_change',
// //     'flags_eight_up',
// //     'flags_eight_down',
// //     'flags_sixteen_up',
// //     'flags_sixteen_down',
// //     'notes_whole',
// //     'notes_half',
// //     'notes_quart',
// //     'rests_whole',
// //     'rests_whole_line',
// //     'rests_half',
// //     'rests_half_line',
// //     'rests_quart',
// //     'rests_eight',
// //     'rests_sixteen'
// //   ];
// //   var count = 0;
// //   var cb = function(){
// //     count += 1;
// //     if(count >= glyphs.length){
// //       callback();
// //     }
// //   };
// //   glyphs.forEach(function(name){
// //       me.loadImage.call(me,name,cb);
// //   });
// //   //
// //   // acc_dblsharp.png        clef_g.png              flags_sixteen_up.png    rests_half.png          rests_whole_line.png
// //   // acc_flat.png            clef_g_change.png       notes_half.png          rests_half_line.png
// //   // acc_sharp.png           flag_eight_up.png       notes_quart.png         rests_quart.png
// //   // clef_f.png              flags_eight_down.png    notes_whole.png         rests_sixteen.png
// //   // clef_f_change.png       flags_sixteen_down.png  rests_eight.png         rests_whole.png
// // };

// // CanvasMusic.prototype.draw = function(){
// //   // this._currentPosition = 0;
// //   this.init();
// //   this._ctx.clearRect(0,0,this.width,this.height);
// //   if(this._score) this._score.draw();
// // };

// // CanvasMusic.prototype.glyphOffsets = { // symbolname: { x: val, y: val }
// //   "notes_quart": { x: 0, y: function(){ // some weird rounding error forces us to change the scaling dynamically
// //       var scale = this.scaleFactor();
// //       if(scale < 0.5) return 2*scale;
// //       if(scale >= 0.5 && scale < 1) return scale;
// //       if(scale >= 1 && scale < 1.5) return 1;
// //       if(scale >= 1.5) return -1 * scale;
// //     }
// //   }, // in 35pt it is fine, in higher quarter is a fraction too low
// //   "notes_half": {x: 0, y: function(){
// //     var scale = this.scaleFactor();
// //     if(scale < 0.5) return 2*scale;
// //     if(scale >= 0.5 && scale < 1) return scale;
// //     if(scale >= 1 && scale < 1.5) return 1;
// //     if(scale >= 1.5) return -1 * scale;
// //   }},
// //   "notes_whole": { x: 0, y: 1 },
// //   "clef_g": { x: 0, y: -8 },
// //   "clef_f": { x: 4, y: 10 },
// //   "acc_sharp": {x: 0, y: -8},
// //   "acc_natural": {x: 0, y: -8},
// //   "acc_flat": {x: 5, y: -20},
// //   "acc_dblsharp": { x: 2, y: -2 },
// //   "rests_whole": { x: 0, y: -11 },
// //   "rests_half": { x: -5, y: -3 },
// //   "rests_quart": { x: 5, y: -9 },
// //   "rests_eight": { x: 0, y: -7 },
// //   "rests_sixteen": { x: 0, y: -2 }
// // };

// // CanvasMusic.prototype.drawLine = function(line){
// //   var c = this._ctx;
// //   var curLineWidth = c.lineWidth; // temporarily save
// //   c.beginPath();
// //   if(line.lineWidth) c.lineWidth = line.lineWidth;
// //   c.moveTo(line.from_x,line.from_y);
// //   c.lineTo(line.to_x,line.to_y);
// //   c.stroke();
// //   c.lineWidth = curLineWidth; // restore;
// // };

// // CanvasMusic.prototype.drawBarLine = function(x,top,bottom,lineWidth){
// //   var canvas = this._ctx;
// //   canvas.beginPath();
// //   canvas.lineWidth = lineWidth;
// //   canvas.moveTo(x,top);
// //   canvas.lineTo(x,bottom);
// //   canvas.stroke();
// // };

// // CanvasMusic.prototype.drawBar = function(bar){
// //   var scale = this.scaleFactor();
// //   var x;
// //   switch(bar.bartype){
// //     case "bar":
// //       // a single line
// //       this.drawLine({
// //         lineWidth: 2.5 * scale,
// //         from_x: bar.x, from_y: bar.top,
// //         to_x: bar.x, to_y: bar.bottom });
// //       // this.drawBarLine(x,top,bottom,3*scale);
// //       break;
// //     case "dblbar":  // double lines
// //       this.drawLine({
// //         lineWidth: 2.5 * scale,
// //         from_x: bar.x, from_y: bar.top,
// //         to_x: bar.x, to_y: bar.bottom });
// //       x = bar.x + (7*scale);
// //       this.drawLine({
// //         lineWidth: 2.5 * scale,
// //         from_x: x, from_y: bar.top,
// //         to_x: x, to_y: bar.bottom });
// //       break;
// //     case "endbar":
// //       this.drawLine({
// //         lineWidth: 2*scale,
// //         from_x: bar.x, from_y: bar.top,
// //         to_x: bar.x, to_y: bar.bottom
// //       });
// //       x = bar.x + (8*scale);
// //       this.drawLine({
// //         lineWidth: 6*scale,
// //         from_x: x, from_y: bar.top,
// //         to_x: x, to_y: bar.bottom
// //       });
// //       // this.drawBarLine(x,top,bottom,2*scale);
// //       // this.drawBarLine(x+(8*scale),top,bottom,6*scale);
// //       break;
// //     case "repeat_start":  // same as reverse endbar
// //       this.drawLine({
// //         lineWidth: 6*scale,
// //         from_x: bar.x, from_y: bar.top,
// //         to_x: bar.x, to_y: bar.bottom
// //       });
// //       x = bar.x + (8*scale);
// //       this.drawLine({
// //         lineWidth: 2*scale,
// //         from_x: x, from_y: bar.top,
// //         to_x: x, to_y: bar.bottom
// //       });
// //       // now add the small circles
// //       var canvas = this._ctx;
// //       //debugger;
// //       var middle = bar.bottom - (bar.bottom - bar.top)/2;
// //       var offset = scale * 6;
// //       this._ctx.beginPath();
// //       this._ctx.arc(x + scale * 8, middle - offset , 3, 0, 2*Math.PI);
// //       this._ctx.arc(x + scale * 8, middle + offset , 3, 0, 2*Math.PI);
// //       this._ctx.fill();
// //       break;
// //     case "repeat_end":
// //       this.drawLine({
// //         lineWidth: 2*scale,
// //         from_x: bar.x, from_y: bar.top,
// //         to_x: bar.x, to_y: bar.bottom
// //       });
// //       x = bar.x + (8*scale);
// //       this.drawLine({
// //         lineWidth: 6*scale,
// //         from_x: x, from_y: bar.top,
// //         to_x: x, to_y: bar.bottom
// //       });
// //       // now add the small circles
// //       var canvas = this._ctx;
// //       //debugger;
// //       var middle = bar.bottom - (bar.bottom - bar.top)/2;
// //       var offset = scale * 6;
// //       this._ctx.beginPath();
// //       this._ctx.arc(bar.x - scale * 8, middle - offset , 3, 0, 2*Math.PI);
// //       this._ctx.arc(bar.x - scale * 8, middle + offset , 3, 0, 2*Math.PI);
// //       this._ctx.fill();
// //       break;
// //     default: break;
// //   }
// // };

// // // function to draw a dot (for a dotted note)
// // CanvasMusic.prototype.drawDot = function (dot) {
// //   this._ctx.beginPath();
// //   this._ctx.arc(dot.x, dot.y, 3, 0, 2*Math.PI);
// //   this._ctx.fill();
// // };

// // // checks whether a markup object collides with something and solves the
// // // collision by adjusting the positioning
// // CanvasMusic.prototype.solveMarkupCollision = function (markup) {
// //   if (!this._markupCache){
// //     this._markupCache = [markup];
// //     return;
// //   }
// //   // when there is a collision?
// //   // when markup .left is somehow between m.left and m.right or markup.right
// //   // and when markup.top is
// //   this._markupCache.forEach(function (m) {
// //     //debugger;
// //     var leftCollides = markup.left >= m.left && markup.left <= m.right;
// //     var rightCollides = markup.right >= m.left && markup.right <= m.right;
// //     var topCollides = markup.top >= m.top && markup.top <= m.bottom;
// //     var bottomCollides = markup.bottom >= m.top && markup.bottom <= m.bottom;
// //     // for a real collision we should always have a combination of left/right and top/bottom
// //     //
// //     // we adjust the position of markup depending on whether markupDown is true
// //     if (leftCollides && topCollides) { // markup left under m
// //       if (markup.markupDown) { // under staff
// //         markup.top = m.bottom + 20; // some hardcoded extra offset
// //         markup.bottom = markup.top + markup.height; // adjust other properties
// //       }
// //       else { // above staff
// //         markup.top = m.top - 20;
// //         markup.bottom = markup.top + markup.height;
// //       }
// //     }
// //     else if (rightCollides && topCollides) { // markup right under m
// //       // for now this is the same as leftCollides && topCollides, but exists in case it needs adjustment
// //       if (markup.markupDown) { // under staff
// //         markup.top = m.bottom + 20; // some hardcoded extra offset
// //         markup.bottom = markup.top + markup.height; // adjust other properties
// //       }
// //       else { // above staff
// //         markup.top = m.top - 20;
// //         markup.bottom = markup.top + markup.height;
// //       }
// //     }
// //     else if (leftCollides && bottomCollides) { // markup right above m
// //       if (markup.markupDown) { // under staff
// //         markup.top = m.bottom + 20; // some hardcoded extra offset
// //         markup.bottom = markup.top + markup.height; // adjust other properties
// //       }
// //       else { // above staff
// //         markup.top = m.top - 20;
// //         markup.bottom = markup.top + markup.height;
// //       }
// //     }
// //     else if (rightCollides && bottomCollides) { // markup right under m
// //       if (markup.markupDown) { // under staff
// //         markup.top = m.bottom + 20; // some hardcoded extra offset
// //         markup.bottom = markup.top + markup.height; // adjust other properties
// //       }
// //       else { // above staff
// //         markup.top = m.top - 20;
// //         markup.bottom = markup.top + markup.height;
// //       }
// //     }
// //   });

// //   this._markupCache.push(markup);

// //   // if (this._previousMarkup.layout.right >= layout.left) { // lift the current to above the previous
// //   //   layout.top = this._previousMarkup.layout.top - 15; // replace with dynamic value later
// //   //   layout.bottom = this._previousMarkup.layout.bottom - 15;
// //   // }
// // };


// // CanvasMusic.prototype.drawMarkup = function (textObj) {
// //   var x, y, text;
// //   var ctx = this._ctx;
// //   ctx.font = "15pt Arial";
// //   //debugger;
// //   // TODO: add override for font type and size, and other things
// //   var align = textObj.align || "center";
// //   var textSize = ctx.measureText(textObj.markup);
// //   var layout = textObj.layout = {
// //     left: textObj.x,
// //     top: textObj.y,
// //     right: textObj.x + textSize.width,
// //     bottom: textObj.y + 15,
// //     height: 15,
// //     width: textSize.width
// //   };
// //   var offset;
// //   if (align === "center" || align === "right") {
// //     offset = (align === "center")? layout.width / 2: layout.width;
// //     layout.left -= offset;
// //     layout.right -= offset;
// //   }

// //   this.solveMarkupCollision(layout); //side-effect, adjusts markup to avoid collisions

// //   ctx.beginPath();
// //   ctx.fillText(textObj.markup, layout.left, layout.top);

// //     // letter_size = ctx.measureText(letter);
// //     // ctx.fillText(letter,text_x-(letter_size.width/2),text_y-3);
// // };

// // // function to draw a glyph on the current position
// // CanvasMusic.prototype.drawGlyph = function (glyphname, x, y, isTransparent) {
// //   //debugger;
// //   if(glyphname instanceof Object){
// //     var l = glyphname;
// //     glyphname = l.type;
// //     x = l.x;
// //     y = l.y;
// //     isTransparent = l.isTransparent;
// //   }
// //   if (!x || !y || !glyphname) {
// //     console.log("cannot draw a glyph because vital information is missing!!");
// //     console.log(arguments);
// //     return;
// //   }
// //   var factor = this.scaleFactor();
// //   var glyph = this.loadImage(glyphname);
// //   var size_w, size_h, pos_x, pos_y;
// //   x = (x !== undefined)? x: this.cursorpos.x;
// //   y = (y !== undefined)? y: this.cursorpos.y;
// //   //console.log('x: ' + x);
// //   if(!glyph) return;

// //   var offsets = this.glyphOffsets[glyphname];
// //   pos_x = offsets? ( (typeof offsets.x === "function")? x + offsets.x.call(this): x + (offsets.x * factor) ): x;
// //   pos_y = offsets? ( (typeof offsets.y === "function")? y + offsets.y.call(this): y + (offsets.y * factor) ): y;

// //   size_w = glyph.width * factor;
// //   size_h = glyph.height * factor;

// //   // for debugging
// //   // console.log('drawing image: glyph: '+ glyphname + " on: ");
// //   // console.log("pos_x: " + pos_x + " x: " + x + " factor: " + factor);
// //   // console.log("pos_y: " + pos_y + " y: " + y);
// //   // if(offsets){
// //   //   if(offsets.y instanceof Function) console.log("offsets.y * factor: " + (offsets.y.call(this) * factor));
// //   //   else console.log("offsets.y * factor: " + (offsets.y * factor));
// //   // }
// //   if (!isTransparent) this._ctx.drawImage(glyph,pos_x,pos_y,size_w,size_h);
// //   if (pos_x > this.width) {
// //     console.log("Cannot draw glyph " + glyphname + " as the width of the canvas element is not big enough.");
// //   }
// //   //return { x: pos_x, y: pos_y, width: size_w, height: size_h }; // return the drawn position, so additional elements can be drawn
// // };

// // CanvasMusic.prototype.scaleFactor = function(){
// //   if(!this._scaleFactor) this._scaleFactor = this.size/35;
// //   return this._scaleFactor;
// // };

// // CanvasMusic.prototype.loadImage = function(name,cb){
// //   var src = 'glyphs/' + name + '.png';
// //   //console.log('src is ' + src);
// //   if (this.urlPrefix) {
// //     var p = this.urlPrefix;
// //     src = (p[p.length-1] === "/")? p + src : p + "/" + src;
// //   }
// //   if(!this._imageCache){
// //     this._imageCache = {};
// //   }
// //   if(!this._imageCache[src]){
// //     this._imageCache[src] = new Image();
// //     this._imageCache[src].src = src;
// //   }
// //   if(cb) this._imageCache[src].onload = cb;
// //   return this._imageCache[src];
// // };




