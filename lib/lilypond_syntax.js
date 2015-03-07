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
  _voiceRegex: /\\new\sVoice\s\{([\s\S]+)\}/,

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
   * regex to match a parallel block
   * @type {RegExp}
   */
  _parallelRegex: /<<([\s\S]*)>>/,

  /**
   * regex to match (and parse) a note
   * @type {RegExp}
   */
  _noteRegex: /\b([a-g](?:es|is|s)?)([',]*)(1|2|4|8|16)*(\.*)?/,

  /**
   * regex to match (and parse) a relative block
   * @type {RegExp}
   */
  _relativeRegex: /\\relative[\s\S]+?([a-g](?:es|is|s)?)([',]*)?[\s\S]*?\{([\s\S]+?)\}/g,

  parseLilypond: function (code) {
    var ret = {
      staffs: []
    }, score, staffs, parallel, staff;

    this._previousNote = null;
    score = this.findBlock("score", code);
    staffs = this.findBlock("Staff", code);
    if (score.length === 0 && staff.length === 0) { // go to simple mode
      this.parseVoice(code);
    }
    else {
      score = score[0].trim();
      parallel = this._parallelRegex.exec(score);
      if (parallel) { //
        staffs.forEach(function (s) {
          var r = {};
          s = this._staffRegex.exec(s)[1];
          var clef = this._clefRegex.exec(s);
          if (clef){
            r.clef = clef[1];
            // remove clef from code
            s = s.slice(0,clef.index) + s.slice(clef.index+clef[0].length);
            s = s.trim();
          }
          var time = this._timeRegex.exec(s);
          if (time) {
            r.time = time[1] + "/" + time[2]; // done to prevent having unparseable values
            s = s.slice(0,time.index) + s.slice(time.index+time[0].length);
            s = s.trim();
          }
          // then parsing of contents, which can be either relative, absolute or a mix
          parallel = this._parallelRegex.exec(s);
          debugger;
          if (parallel) { // we have parallel voices
            // we need to parse the separate notes, and then
            // based on the rhytmical spacing join them in an array
            this.findBlock("Voice", s).forEach(function (v, i) {
              v = this._voiceRegex.exec(v)[1];
              var notes = this.parseVoice(v).map(function (n, i2) {
                n.voice = i;
              });
            }, this);
          }
          else {
            r.notes = this.parseVoice(s);
          }
          ret.staffs.push(r);
        }, this);
      }
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
    //easiest is to create an array
    this._previousNote = null;
    var raw = [], ret = [], match, match2, prev, note, notesString;
    // first parse all relative blocks
    debugger;
    var relatives = this.findBlock("relative", voiceContent);
    var rest = voiceContent, tmp, rIndex;

    if (relatives.length > 0) { // go into mixed mode
      // we can have a block of notes before the first relative, inbetween every relative
      // and after the last relative, meaning relatives.length + 1
      for (var i = 0; i < relatives.length + 1; i += 1) {
        rIndex = rest.indexOf('relative') - 1;
        if (rIndex === -2) { // nothing to be found, just do the absolute block
          tmp = rest.slice(0);
        }
        else tmp = rest.slice(0, rIndex);
        tmp = rest.slice(0, rIndex);
        tmp.split(" ").forEach(function (n) {
          if (!n) return;
          n = n.trim();
          if (!n) return;
          n = this.parseNote(n);
          if (n) ret.push(n);
        }, this);
        rest = rest.slice(rIndex);
        // now into the relative, if it exists
        if (rIndex !== -2) {
          match = this._relativeRegex.exec(relatives[i]);
          debugger;
          prev = this.parseNote(match[1] + match[2]); // merge the note together again
          match[4].split(" ").forEach(function (n) {
            if (!n) return;
            n = n.trim();
            if (!n) return;
            n = this.parseNote(n, prev);
            if (n){
              prev = n;
              n.push(n);
            }
          }, this);
          // now remove the relative
          rest = rest.splice(rIndex + relatives[i].length);
        }
      }


    }

    // //debugger;
    // if (voiceContent.indexOf('\\relative') > -1) {
    //   while (match = this._relativeRegex.exec(voiceContent)) {
    //     raw.push(voiceContent.slice(0, match.index)); // everything before
    //     //set voiceContext to be the remainder after the match
    //     voiceContent = voiceContent.slice(match.index + match[0].length);
    //     // now parse the match
    //     prev = this.parseNote(match[1]+match[2]); // merge the note together again
    //     // now parse all notes within
    //     notesString = match[3];
    //     while (match2 = this._noteRegex.exec(notesString)) {
    //       note = this.parseNote(match2[0], prev);
    //       raw.push(note);
    //       notesString = notesString.slice(match2.index + match2[0].length);
    //       prev = note;
    //     }
    //   }
    // }

    // // all relative blocks have been parsed, now check whether anything else
    // // has been left over
    // raw.forEach(function (r) {
    //   if (typeof r === "string") {
    //     while (match2 = this._noteRegex.exec(r)) {
    //       ret.push(this.parseNote(match2[0]));
    //       r = r.slice(match2.index + match2[0].length);
    //     }
    //   }
    //   else ret.push(r);
    // }, this);
    return ret;
  },

  _previousNote: null,

  /**
   * Parses a note into a note hash
   * @param  {String} note      the note to parse
   * @param  {Hash} reference Optional: if given, it will take this as relative reference
   * @return {[type]}           [description]
   */
  parseNote: function (note, reference) {
    // this regex gives us 4 groups:
    // match[1] => note name
    // match[2] => commas or apostrophes
    // match[3] => base length
    // match[4] => dots
    var noteNames = Presto.Note._noteNames;
    var octave;
    var match = this._noteRegex.exec(note);
    if (!match) {
      console.log('invalid note name?: ' + note);
      console.log(match);
      throw new Error("WHoops?");
    }
    var noteName = match[1];
    if (reference) {
      var indexOfRef = noteNames.indexOf(reference.name[0]);
      var indexOfNote = noteNames.indexOf(noteName[0]);
      octave = reference.octave;
      //_noteNames: ['c', 'd', 'e', 'f', 'g', 'a', 'b'],
      if (indexOfRef < indexOfNote) {
        if ((indexOfNote - indexOfRef) > 4) octave -= 1;
      }
      else if (indexOfNote < indexOfRef) {
        if (indexOfRef - indexOfNote > 3) octave += 1;
      }
    }
    else octave = 0;

    match[2].split("").forEach(function (c) {
      if (c === "'") octave += 1;
      if (c === ",") octave -= 1;
    });

    var length = 4;
    if (reference) {
      length = match[3]? parseInt(match[3], 10) : reference.length;
    }
    else {
      if (this._previousNote) length = this._previousNote.length;
    }

    var ret = {
      name: noteName,
      octave: octave,
      length: length
    };
    if (match[4]) {
      ret.dots = match[4].split("").length;
    }
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
    }
    return ret;
  }

};