# Presto - A simple notation system for the web

Presto is a Canvas based music notation system for the web. It only requires an HTML5 compliant browser.

The purpose of Presto is to have an as readable as possible notation system for the web which excels at excerpts and which is able to display the notation of the given music nearly instantaneous.
It takes the LilyPond notation system as main example, trying to come as close as possible to its elegance, but trying to never sacrifice speed in the process. Presto will therefore never be a complete notation system, but of course tries to come as close as possible.
It uses the Lilypond Emmentaler font as a webfont for the best possible graphical result.

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
You'll need to create a HTML page, where you add presto.js as a script, as well as presto.css. You can take one of the html pages in this repository as an example.
You'll then need to add a canvas element and give it an id.
Before you can notate anything, you will have to create a HTML page with a canvas element in it. This canvas element needs to have a unique id. 

You then add another script tag, in which you need to define the music and tell Presto where to put the result. A very simple example (assuming the id of the canvas elements is 'canvas'):

```
var score = {
  staffs: [
    {
      clef: "treble",
      key: "c",
      time: "4/4"
      notes: [
        {
          { name: "c", length: 4, octave: 1 }
        }
      ]
    }
  ]
}

var p = Presto.Score.from('canvas');
window.setTimeout(function () {
  p.parse(score);
  p.notate();
  p.render();
},100);

```

NOTE: you will have to call the notate() and render() functions using a time out, because the browser only starts loading the font after it is referred to the first time. When you'd get all kinds of squares instead of notation, you'll need to refresh, or re-render.

## API

Presto borrows quite a few concepts from Lilypond, the main one being the context layering. The main context is the score context, which has a property called staffs, which is an array of staff contexts.

### Staff
Properties:

  - clef: options are "treble" and "bass"
  - notes
  - time: to set the time signature at the start of the bar

Properties to be supported in the future

  - key: to automatically set all the required accendentals at the start of the bar
  - hideClef: don't draw a clef and don't reserve space for it
  - clefIsTransparent: don't draw a clef, but reserve space for it

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

As you can see the dots are not part of the length property, but stored in a separate property called dots.
So, if you need a quarter note with two dots, you set the length to 4 and dots to 2.

You can make chords by creating an array with note objects. If you want to have multiple voices, you need to set the stem directions
yourselves.

To be supported: 

  * markup: A markup text which can be attached to the note
  * markupAlign: how to align the markup, default is "center", but "left" and "right" are also supported
  * markupDown: by default the markup is put above the staff, if this is set to true, the markup will be put under the staff
  * noStem: if set to true, the stem will omitted, leaving only the note head

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

To be supported: 

  * markup: A markup text which can be attached to the note
  * markupAlign: how to align the markup, default is "center", but "left" and "right" are also supported
  * markupDown: by default the markup is put above the staff, if this is set to true, the markup will be put under the staff

##### Barlines

To be supported:

A barline is an object with only a name property, where the name is one of:

 - bar: single barline
 - dblbar: double barline
 - endbar: end barline
 - repeat_start: start of repeat barline
 - repeat_end: end of repeat barline

## Technical workings
The system renders the musical notation in three phases:

  1. The first phase is parsing the input into an internal grob based representation
  2. The second phase will fine tune the positioning of the internal representation
  3. The third phase renders a new representation in absolute positioned grobs which gets rendered to the canvas element.