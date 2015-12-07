/*globals Presto, console*/

Presto.lilypondParser = {

  /**
   * regex to match a score block
   * @type {RegExp}
   */
  _scoreRegex: /\\score.+?\{([\s\S]*)\}/,

  /**
   * regex to match a staff block
   * @type {RegExp}
   */
  _staffRegex: /\\new\sStaff\s\{([\s\S]+)\}/,

  /**
   * regex to match a voice block
   * @type {RegExp}
   */
  _voiceRegex: /\\new\sVoice\s*?=?([\s\S]*?)?\{([\s\S]+)\}/,

  /**
   * regex to match the clef command
   * @type {RegExp}
   */
  _clefRegex: /\\clef (.+)/, //match 1 will be the clef name

  /**
   * regex to match a time signature
   * @type {RegExp}
   */
  _timeRegex: /\\time ([0-9])\/([1|2|4|8|16])/,

  /**
   * regex to match a key signature
   * @type {RegExp}
   */
  _keyRegex: /\\key (.+) (\\major|\\minor)/,

  /**
   * regex to match a parallel block
   * @type {RegExp}
   */
  _parallelRegex: /<<([\s\S]*)>>/,

  /**
   * regex to match (and parse) a note
   * @type {RegExp}
   */
  _noteRegex: /\b([a-g](?:es|is|s)?)([',]*)(16|2|4|8|1)*(\.*)?/,

  /**
   * regex to match (and parse) a rest
   * @type {RegExp}
   */
  _restRegex: /\b[r|R](16|2|4|8|1)*(\.*)?/,

  /**
   * regex to match (and parse) a relative block
   * @type {RegExp}
   */
  _relativeRegex: /\\relative[\s\S]+?([a-g](?:es|is|s)?)([',]*)?[\s\S]*?\{([\s\S]+?)\}/,

  /**
   * regex to match (and parse) a chord
   * @type {RegExp}
   */
  _chordRegex: /<(.+)>([1|2|4|8|16]?)(\.*)/,

  /**
   * regex to match (and parse) a bar command
   * @type {RegExp}
   */
  _barRegex: /\\bar[\s\S]*?"(.+?)"/,

  _commentBlockRegex: /%\{(.*)%\}/,

  _markupBlockRegex: /\\markup[\s\S]*?\{(.*)?\}/,

  parseLilypond: function (code) {
    var ret = {
      staffs: []
    }, score, staffs, parallel, voices;

    this._previousNote = null;
    score = this.findBlock("score", code);
    staffs = this.findBlock("Staff", code);
    if (score.length === 0 && staffs.length === 0) { // go to simple mode
      ret.staffs[0] = {
        notes: [[this.parseVoice(code)]]
      };
    }
    else {
      if (score.length === 0 && staffs.length > 0) {
        score = "\\score { " + code + "}";
      }
      else score = score[0].trim();
      parallel = this._parallelRegex.exec(score);
      //if (parallel) { // not sure why this is important, except perhaps
      //that staffs should otherwise be processed in parallel.
      //let's leave that for now
      staffs.forEach(function (s) {
        var r = {
          notes: []
        };
        s = this._staffRegex.exec(s)[1];
        var clef = this._clefRegex.exec(s);
        if (clef) {
          r.clef = clef[1];
          // remove clef from code
          s = s.slice(0, clef.index) + s.slice(clef.index + clef[0].length);
          s = s.trim();
        }
        var time = this._timeRegex.exec(s);
        if (time) {
          r.time = time[1] + "/" + time[2]; // done to prevent having unparseable values
          s = s.slice(0, time.index) + s.slice(time.index + time[0].length);
          s = s.trim();
        }
        var key = this._keyRegex.exec(s);
        if (key) {
          r.key = key[1];
          if (key[2]) {
            r.key += " " + key[2].slice(1);
          }
          s = s.slice(0, key.index) + s.slice(key.index + key[0].length);
          s = s.trim();
        }
        // try to detect relative outside a voice context
        var voiceIndex = s.indexOf("\\new Voice");
        voiceIndex = (voiceIndex === -1)? s.indexOf("\\context Voice") : voiceIndex;
        if (voiceIndex > -1) {
          var relIndex = s.indexOf("\\relative");
          if (relIndex > -1 && relIndex < voiceIndex) {
            throw new Error("relative cannot be used outside a Voice context");
          }
        }
        // then parsing of contents, which can be either relative, absolute or a mix
        parallel = this._parallelRegex.exec(s);
        if (parallel) { // we have parallel voices
          voices = [];
          this.findBlock("Voice", s).forEach(function (v) {
            v = this._voiceRegex.exec(v)[2];
            voices.push(this.parseVoice(v));
          }, this);
          r.notes.push(voices);
        }
        else {
          // still check for voice blocks
          if (this._voiceRegex.exec(s)) { // probably only one voice to be found...
            this.findBlock("Voice", s).forEach(function (v) {
              v = this._voiceRegex.exec(v)[2];
              r.notes.push([this.parseVoice(v)]);
            }, this);
          }
          else r.notes.push([this.parseVoice(s)]);
        }
        ret.staffs.push(r);
      }, this);
    }

    return ret;
  },

  /**
   * The voice context itself is not supported yet, but the contents of a staff can be
   * regarded as a voice context anyhow
   * @param  {String} voiceContent content of voice context
   * @return {Array}              hashes of notes
   */
  parseVoice: function (voiceContent) {

    var v = voiceContent;
    var ret = [];
    var len = v.length;
    var curItem, match, cmd, chord, next, note, endOfNote, tmpPrev;
    var prev = {
      length: 4
    };
    var inRelative = false;

    var spacings = ["", " ", "\t", "\n"];

    var obj = {
      name: "voice"
    };

    var findSpacer = function (voice, fromIndex) {
      var ret = voice.length;
      var spacerPos = [" ", "\n", "\t", "~", "\\"].reduce(function (reduceVal, item) {
        var pos = voice.indexOf(item, fromIndex);
        if (pos !== -1 && pos < reduceVal) reduceVal = pos;
        return reduceVal;
      }, ret);
      var notePos = ["a", "b", "c", "d", "e", "f", "g"].reduce(function (reduceVal, item) {
        var pos = voice.indexOf(item, fromIndex + 2);
        if (pos !== -1 && pos < reduceVal) reduceVal = pos; // make sure it will not find the current note
        return reduceVal;
      }, ret);

      ret = spacerPos < notePos? spacerPos: notePos;
      // [" ", "\n", "\t", "~", "\\", .forEach(function (s) {
      // //[" ", "\n", "\t", "~", "\\"].forEach(function (s) {
      //   var pos = voice.indexOf(s, fromIndex + 1);
      //   if (pos > (fromIndex + 1)) { // prevent it from finding the current note
      //     ret = (pos < ret && pos !== -1)? pos : ret;
      //   }
      // });
      if (ret === voice.length) ret = -1; // not found any
      return ret;
    };

    for (var i = 0; i < len; i += 1) {
      curItem = v[i];
      if (spacings.indexOf(curItem) > -1) continue; // ignore all spacing
      if (curItem === "%") {
        if (v[i+1] === "{") {
          match = this._commentBlockRegex.exec(v.slice(i));
          if (!match) throw new Error("Comment block opening detected, but it doesn't seem to be closed. Did you forget something?");
          i += match[0].length - 1;
          continue;
        }
        else { // simple line comment, skip till next new line
          i += v.indexOf("\n", i) - i - 1;
          continue;
        }
      }
      if (curItem === "\\") { // command
        next = v.indexOf(" ", i);
        if (next === -1) throw new Error("Syntax error: no space after command?");
        cmd = v.slice(i, next).trim(); // till the next space and get rid of extra's such as newlines...
        switch (cmd) {
          case "\\relative":
            match = this._relativeRegex.exec(v.slice(i));
            if (!match) throw new Error("syntax error in relative");
            prev = this.parseNote(match[1] + match[2], null, 4);
            inRelative = true;
            i = v.indexOf(match[3], i); // skip to the content of the relative
            break; // set relative parsing on, and set prev
          case "\\voiceOne":
            obj.voiceNumber = 1;
            i += cmd.length;
            break;
          case "\\voiceTwo":
            obj.voiceNumber = 2;
            i += cmd.length;
            break;
          case "\\bar":
            match = this._barRegex.exec(v.slice(i));
            if (!match) throw new Error("syntax error in bar");
            i += match[0].length;
            break;
          case "\\clef":
            match = this._clefRegex.exec(v.slice(i));
            if (!match) throw new Error("syntax error in clef");
            i += match[0].length;
            break;
          case "\\markup":
            match = this._markupBlockRegex.exec(v.slice(i));
            if (!match) throw new Error("syntax error in markup block");
            i += match[0].length;
            break;
          default:
            i += cmd.length;
            break;
        }
        continue;
      }
      if (curItem === "}" && inRelative) {
        inRelative = false;
        continue;
      }
      if (curItem === "<" && v[i + 1] !== "<") { // chord
        next = v.indexOf(">", i);
        match = this._chordRegex.exec(v.slice(i));
        if (!match) {
          throw new Error("Chord syntax error");
        }
        if (inRelative) {
          chord = this.parseChord(match, prev);
          ret.push(chord);
          prev = chord[0];
        }
        else { // absolute mode, give the previous length...
          chord = this.parseChord(match, null, prev.length);
          prev = chord[0];
          ret.push(chord);
        }
        i += match[0].length;
        continue;
      }
      if (curItem === "|") { // ignore bar checks for now
        //i += 1;
        continue;
      }
      if (curItem === "(" || curItem === ")") {
        continue;
      }
      // now find the first spacing, which is one of " ", "\n", "\t", or "~"
      endOfNote = findSpacer(v, i);
      if (endOfNote === i) continue; // don't try to parse a spacer
      // // normal notes we assume
      // endOfNote = v.indexOf(" ", i);

      if (endOfNote === -1) { // only one reason it seems: end of string
        endOfNote = v.length;
      }
      note = v.slice(i, endOfNote);
      if (inRelative) {
        if (prev.length === null) prev.length = 4; // default length
        // don't overwrite the previous note when the new note actually is a rest
        tmpPrev = this.parseNote(note, prev);
      }
      else {
        tmpPrev = this.parseNote(note, null, prev.length);
      }
      ret.push(tmpPrev);
      if (tmpPrev.name !== "rest") prev = tmpPrev;
      i += note.length - 1; // create an offset for the +1 at the
    }

    obj.notes = ret;

    return obj;
  },

  _previousNote: null,

  /**
   * Parses a chord
   * @param  {String|Array} chord     Chord in either string or regex result
   * @param  {Note} reference reference tone in case of relative
   * @param {Number} reflength In case of absolute names, there is no reference, but there is a current length
   *                           because lilypond allows the length to be omitted in both relative and absolute mode
   * @return {Array}           array of notes
   */
  parseChord: function (chord, reference, reflength) {
    if (typeof chord === "string") {
      chord = this._chordRegex.exec(chord);
      if (!chord) throw new Error("Syntax error in chord");
    }
    var ret = [];
    var notes = chord[1];
    var length = parseInt(chord[2], 10) || (reference ? reference.length : null) || reflength;
    var dots = chord[3];
    var prev = reference;
    notes.split(" ").forEach(function (n) {
      if (!n) return;
      n = this.parseNote(n, prev, reflength);
      if (n) {
        if (!n.length) n.length = length;
        if (dots) n.dots = dots.length;
        if (reference) prev = n; // only provide prev when in relative mode
        ret.push(n);
      }
    }, this);
    return ret;
  },

  /**
   * Parses a note into a note hash
   * @param  {String} note      the note to parse
   * @param  {Hash} reference Optional: if given, it will take this as relative reference
   * @return {[type]}           [description]
   */
  parseNote: function (note, reference, prevLength) {
    // this regex gives us 4 groups:
    // match[1] => note name
    // match[2] => commas or apostrophes
    // match[3] => base length
    // match[4] => dots
    var noteNames = Presto.Note._noteNames;
    var noteName, octave, restMode = false, length, dots;
    var match = this._noteRegex.exec(note);

    if (!match) { // this could be a rest
      match = this._restRegex.exec(note);
      if (match) {
        noteName = "rest";
        length = match[1] ? parseInt(match[1], 10) : null;
        octave = reference? reference.octave: 0;
        restMode = true;
        if (match[2]) {
          dots = match[2].split("").length;
        }
      }
    }
    if (!match) {
      console.log('invalid note name?: ' + note);
      console.log(match);
      throw new Error("Expected note, but got something I don't understand: '" + note + "'");
    }
    if (!restMode) {
      noteName = match[1];
      if (reference && reference.name !== "rest") {
        var indexOfRef = noteNames.indexOf(reference.name[0]);
        var indexOfNote = noteNames.indexOf(noteName[0]);
        octave = reference.octave;
        //_noteNames: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],
        if (indexOfRef < indexOfNote) {
          if ((indexOfNote - indexOfRef) > 3) octave -= 1;
        }
        else if (indexOfNote < indexOfRef) {
          if (indexOfRef - indexOfNote > 3) octave += 1;
        }
      }
      else {
        if (reference && reference.name === "rest") octave = reference.octave;
        else octave = 0;
      }

      match[2].split("").forEach(function (c) {
        if (c === "'") octave += 1;
        if (c === ",") octave -= 1;
      });

      length = match[3] ? parseInt(match[3], 10) : null;
      if (match[4]) {
        dots = match[4].split("").length;
      }
    }

    if (!length) {
      if (reference) length = reference.length;
      else if (prevLength) {
        length = prevLength;
      }
    }

    var ret = {
      name: noteName,
      octave: octave,
      length: length,
      dots: dots
    };

    this._previousNote = ret;
    return ret;
  },

  // this need to be done a bit differently, as regex is only going to help us onto a certain level
  /**
   * findBlock will find a block of a certain type in string
   * @param  {String} blockType such as score, Staff etc
   * @param  {String} string    from which the block will be retrieved
   * @return {Array|null}       Array with text blocks with the content of the blockType, null if not found
   */
  findBlock: function (blockType, string) {
    // this means, we search for "\" + blockType, then take the first { and continue till we
    // find a } on the same level
    //debugger;
    var command, cmdIndex, ret = [], curBlock = "";
    if (blockType[0] !== "\\") {
      command = "\\" + blockType;
      cmdIndex = string.indexOf(command);
      if (cmdIndex === -1) {
        command = "\\new " + blockType;
        cmdIndex = string.indexOf(command);
        if (cmdIndex === -1) {
          return ret; // we cannot find anything
        }
      }
    }
    var rest = string.slice(cmdIndex);
    var level = 0, openAcc, closeAcc;
    while (rest.length > 0) {
      openAcc = rest.indexOf("{");
      closeAcc = rest.indexOf("}");
      if (openAcc > -1 && openAcc < closeAcc) {
        level += 1;
        curBlock += rest.slice(0, openAcc + 1);
        rest = rest.slice(openAcc + 1);
      }
      else if (closeAcc > -1) {
        level -= 1;
        curBlock += rest.slice(0, closeAcc + 1);
        rest = rest.slice(closeAcc + 1);
      }
      if (level === 0) {
        // end of block reached
        ret.push(curBlock);
        curBlock = "";
        cmdIndex = rest.indexOf(command);
        if (cmdIndex > -1) {
          rest = rest.slice(cmdIndex);
        }
        else rest = ""; // we're done
      }
      if (level === 0 && openAcc === -1 && closeAcc === -1) {
        // nothing left to do
        rest = "";
      }
      else if (level !== 0 && openAcc === -1 && closeAcc === -1) {
        // this has to be a syntax error
        throw new Error("Syntax error: did you omit a closing }?");
      }
    }
    return ret;
  }

};