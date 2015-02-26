/*globals Presto*/


/**
 * Presto.Column is a way to get vertically stacked elements which can be horizontally moved as a block
 * @extends {Presto.Grob}
 */
Presto.Column = Presto.Grob.extend({
  /**
   * don't draw anything ourselves, just the contents
   * @type {Boolean}
   */
  isContainer: true,

  /**
   * Hook where the parent staff is put
   * @type {Presto.Staff}
   */
  parentStaff: null,

  /**
   * The width of a column is distance between the left most point and the rightmost point
   * @return {Number} Width of the column
   */
  width: function () {
    var w = this.childGrobs.getEach('width')
    return w.get('@max');
  }

});


