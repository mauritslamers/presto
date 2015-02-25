# Presto - A simple notation system for the web

Presto is a Canvas based music notation system for the web. It only requires an HTML5 compliant browser.

The purpose of Presto is to have an as readable as possible notation system for the web which excels at excerpts and which is able to display the notation of the given music nearly instantaneous.
It takes the LilyPond notation system as main example, trying to come as close as possible to its elegance, but never sacrificing speed in the process. Presto will therefore never be a complete notation system, but of course tries to come as close as possible.
It uses the Lilypond font as a webfont for the best possible graphical result.

As Presto is very much in active development, this document contains elements which are intended to be supported at some point but in the API description below is indicated whether a feature is implemented.

## Things to keep in mind

Presto in the current state doesn't do a lot for you, except printing the notation and try to make that look (sort of) right. It will simply print whatever you give it, but it doesn't in any way make sure that your notation is right. This means (among other things):

  * it doesn't check whether bars are full
  * it doesn't remove double accidentals in a bar, so you will get an accidental every time you put a note with a accidental
  * it doesn't check voicings (and it doesn't have a voice context), meaning that you have to manually set the stem direction on every note, and it might be that polyphony doesn't work correctly. It tries however to correctly display the polyphonic aspects of note heads and stems (see the tests for an example)
  * it doesn't properly align anything (in a bar)
  * it doesn't support beaming of eighth or sixteenth notes
  * it draws a bar as wide as the width of the canvas element

The way you currently have to enter the music is plain JavaScript object and array literals. This can be complex for an ordinary user.
This is done however in order to be fast in the processing and the notation as well as be able to retrieve the notation from a server
and display immediately. In the future a different syntax might be added as a front end (such as the Lilypond syntax).

## How to get started
Before you can notate anything, you will have to create a HTML page with a canvas element in it.
This canvas element needs to have a unique id. You then have to add a script tag referring canvas_music.js.

Then add another script tag. In this script tag you are going to define the music you want to notate, as well as
initialize Presto.

The Presto constructor has two parameters, element and options, both of which are obligatory.
The element parameter can be either the id name or the element itself as retrieved by document.getElementById();

The options parameter is a hash, and should contain at least the score context you want to create a notation of.
The easiest way to do this is to copy the example as given under the API section below.

## API

Presto borrows some concepts of Lilypond, the main one being the context layering.
The main context is the score context, which has a property called staffs.
The staffs is an array of staff contexts.

### Staff
Properties:

  - clef: options are "treble" and "bass"
  - hideClef: don't draw a clef and don't reserve space for it
  - clefIsTransparent: don't draw a clef, but reserve space for it
  - notes

Properties to be supported in the future

  - key: to automatically set all the required accendentals at the start of the bar
  - time: to set the time signature at the start of the bar

#### Notes

Every staff contains a propery called notes, which is an array with notation elements. (rename?)
The array contains a set of object literals, which can be:

  * notes
  * rests
  * barlines

##### Note

A note is an object which can have the following properties:

  * name: The name of the note. The names supported follow the dutch naming scheme (for now):
    * c, d, e, f, g, a, b
    * cis, dis, eis, fis, gis, ais, bis
    * ces, des, es, fes, ges, as, bes
    * for a doublesharp add "is" as in "cisis"
    * for a doubleflat add "es" as in "eses"
  * octave: a number, where 1 is the "central" octave, containing the central c.
  * length: a number, where
    * 1 is a whole note
    * 2 is a half note
    * 4 is a quarter
    * 8 is an eighth
    * 16 is a sixteenth
    * other types (longa / brevis) are not supported (yet)
  * dots: how many dots the note needs to have
  * markup: A markup text which can be attached to the note
  * markupAlign: how to align the markup, default is "center", but "left" and "right" are also supported
  * markupDown: by default the markup is put above the staff, if this is set to true, the markup will be put under the staff
  * noStem: if set to true, the stem will omitted, leaving only the note head

As you can see the dots are not part of the length property, but stored in a separate property called dots.
So, if you need a quarter note with two dots, you set the length to 4 and dots to 2.

You can make chords by creating an array with note objects. If you want to have multiple voices, you need to set the stem directions
yourselves.

##### Rests

A rest is an object which can have the following properties:

  * name: "rest",
  * length: a number representing the length of the rest, where:
    * 1 is a whole rest
    * 2 is a half rest
    * 4 is a quarter rest
    * 8 is an eighth rest
    * 16 is a sixteenth rest
    * other types are not supported (yet)
  * markup: A markup text which can be attached to the note
  * markupAlign: how to align the markup, default is "center", but "left" and "right" are also supported
  * markupDown: by default the markup is put above the staff, if this is set to true, the markup will be put under the staff

##### Barlines

A barline is an object with only a name property, where the name is one of:

 - bar: single barline
 - dblbar: double barline
 - endbar: end barline
 - repeat_start: start of repeat barline
 - repeat_end: end of repeat barline

### API example

```
new Presto (el, {
  drawImmediately: true, // immediately draw when inserted
  size: 35, // pt size of font
  urlPrefix: "", // where in the project canvas_music is located, in order to load the glyphs correctly
  score: {
    staffs: [
    {
      clef: "treble", // options are "treble", "bass"
      time: "4/4", // not implemented yet
      key: "c", // not implemented yet
      notes: [
        { name: 'g', octave: 1, length: 1},
        { name: 'a', octave: 1, length: 2},
        { name: 'b', octave: 1, length: 4},
        { name: 'c', octave: 2, length: 8},
        { name: 'd', octave: 2, length: 16},
        { name: 'e', octave: 2, length: 16, dots: 1 },
        { name: 'fis', octave: 2, length: 1},
        { name: 'g', octave: 2, length: 1},
        { name: 'a', octave: 2, length: 1},
        { name: "bar"}
        { name: "dblbar"},
        { name: "repeat_start"},
        { name: "repeat_end"}
      ]
    }
  }
});

```


## Technical workings
The system renders the musical notation in three phases:

  1. The first phase is parsing the input into an internal grob based representation
  2. The second phase will fine tune the positioning of the internal representation
  3. The third phase renders a new representation in absolute positioned grobs which gets rendered to the canvas element.