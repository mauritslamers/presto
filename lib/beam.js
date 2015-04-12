/*globals Presto*/

/*
This is an attempt to design a beaming module for Presto.

There are a few ideas how to implement a beam.

1. have the beam wrap a set of note columns and sit hierarchially above the note columns.
2. have the beam work like a subscription system, in which notes "subscribe" to a beam. When the beam is
   rendered, it looks up the coordinates of the notes, and calculates which kind of beam to be
   (depending on the note lengths).

As the intention is to be able to adjust the relative positioning and then render another absolute
set option 2 seems to be the best bet. One of the reasons being that having to go through the beam to have to
adjust positioning is rather complex. If the beaming is rendered after the notes, the positioning is known
and the beam should be a pretty lightweight addition.
Another issue is (partly) that any stem could need adjustments to attach to the beam. The note class API probably
has to be adjusted in order to support this.
There is still the issue though with notecolumns.. effectively, beams should be drawn between notecolumns,
not notes. A complex set of 8th notes will still be a single point of attachment. However, if there are
multiple voices, it is still important to check whether the beam belongs to the correct voice.
This effectively also makes the staff responsible for a correct beaming.

There is also the issue of trying to do everything in one go...
A beam is a set of lines, of which the angle needs to be adjustable. One line will be fixed, essentially, but
the second line can be partial, for example in a dotted 8th 16th pattern (among others)

The basic essence is that the main line (8th beam) should be drawn between the top or bottom of the first note
column to the top or bottom of the last note column. These values should be retrievable somehow.

The staff can actually make it pretty simple: it creates a beam object, to which it then starts registering / adding
note columns as it goes. This makes it easy to also have the position correct. When the beam is "full", it will
call beamReady, which will do any required calculations

There is another complication: effectively a note column can be part of _two_ beams. reason is that if voicing
is implemented and there are two voices having a series of eight notes, two main beams should be drawn.
One option of dealing with this is to create as many beam grobs as required.
Another option is that a single beam grob deals with the different voices, and draws the beaming required.

In both cases it is a bit of a compromise. Option 1 would be the "neatest", one beam taking care of one set of beams.
It would make keeping track of those beams a bit complicated.
In the case of option 2, the problem would be inside the beam grob, as it might turn out that some note columns
are not part of one of either beams.

Looking at the seperation of concern principle, it seems that option 1 would be the best. It just needs figuring
out how to indicate this to the staff exactly...

Everything here also screams that in order to do this correctly, we need a proper voice support...
 */

Presto.Beam = Presto.Grob.extend({

  register: function (notecolumn) {
    this._registeredNotes.push(notecolumn);
  },

  deregister: function (notecolumn) {
    var r = this._registeredNotes;
    r.removeAt(r.indexOf(notecolumn));
  },

  _registeredNotes: null,

  init: function () {
    this._registeredNotes = Presto.Array.create();
  },

  beamReady: function () {
    var r = this._registeredNotes;
    var topOfFirst = r[0];
  }



});