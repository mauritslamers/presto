/*globals Presto, console*/

Presto.lilypondParser = {

  /**
   * regex to match a score block
   * @type {RegExp}
   */
  _scoreRegex: /\\score.+?\{([\s\S]*)\}/g,

  /**
   * regex to match a staff block
   * @type {RegExp}
   */
  _staffRegex: /\\new Staff.+?\{([\s\S]+?)\}?(\\new Staff)/g,

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
  _noteRegex: /([a-g](?:es|is|s)?)([',]*)(1|2|4|8|16)*(\.*)?/,

  /**
   * regex to match (and parse) a relative block
   * @type {RegExp}
   */
  _relativeRegex: /\\relative[\s\S]+?([a-g](?:es|is|s)?)([',]*)?[\s\S]*?\{([\s\S]+?)\}/g,

  parseLilypond: function (code) {
    var ret = {
      staffs: []
    }, score, staffs = [], parallel, match, staff;

    this._previousNote = null;
    //debugger;
    score = this._scoreRegex.exec(code); // always lowercase
    if (!score || !score[1]) return; // nothing found
    score = score[1].trim();
    //test for << and >>
    parallel = this._parallelRegex.exec(score);
    if (parallel) { // expect multiple staffs, cannot be done by regex (or way too complex)
      parallel = parallel[0];
      match = parallel.indexOf("\\new Staff");
      while (match > -1) {
        staff = parallel.slice(match, match + 10); // length of new staff
        parallel = parallel.slice(match + 10); // rest from there
        match = parallel.indexOf("\\new Staff");
        if (match > -1) {
          staff += parallel.slice(0, match); // merge the rest until the next staff
          staffs.push(staff);
          parallel = parallel.slice(match); // cut parallel to the rest
          match = 0; // because of the slice, the match is now the start
        }
        else { // only single staff found, merge back together
          staff = staff + parallel;
          staffs.push(staff);
        }
      }
    }
    else {
      staffs = [this._staffRegex.exec(score)[1]];
    }

    staffs.forEach(function (s) {
      // search for clef and time
      var r = {};
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
      r.notes = this.parseVoice(s);
      ret.staffs.push(r);
    }, this);
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
    if (voiceContent.indexOf('\\relative') > -1) {
      while (match = this._relativeRegex.exec(voiceContent)) {
        raw.push(voiceContent.slice(0, match.index)); // everything before
        //set voiceContext to be the remainder after the match
        voiceContent = voiceContent.slice(match.index + match[0].length);
        // now parse the match
        prev = this.parseNote(match[1]+match[2]); // merge the note together again
        // now parse all notes within
        notesString = match[3];
        while (match2 = this._noteRegex.exec(notesString)) {
          note = this.parseNote(match2[0], prev);
          raw.push(note);
          notesString = notesString.slice(match2.index + match2[0].length);
          prev = note;
        }
      }
    }

    // all relative blocks have been parsed, now check whether anything else
    // has been left over
    raw.forEach(function (r) {
      if (typeof r === "string") {
        while (match2 = this._noteRegex.exec(r)) {
          ret.push(this.parseNote(match2[0]));
          r = r.slice(match2.index + match2[0].length);
        }
      }
      else ret.push(r);
    }, this);
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
      return;
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
  }

  // /**
  //  * When given an lilypond style absolute note, return a note hash
  //  * @param  {String} lilypondNote
  //  * @return {Hash}              Hash with note info
  //  */
  // parseAbsoluteNote: function (lilypondNote) {
  //   // a lilypond note contains a name, an octave and a duration
  //   var up = false;
  //   var split = lilypondNote.split(",");
  //   if (split.length === 1) {
  //     up = true;
  //     split = lilypondNote.split("'");
  //   }
  //   // this is here to be clear how it is done, could be joined in the hash below
  //   var notename = split[0];
  //   var duration = split[split.length - 1];
  //   var length = duration[0];
  //   var dots = duration.length-1;
  //   var octave = split.slice(0, split.length - 2).length;
  //   // if up is true, we have ', otherwise ,
  //   if (!up) octave *= -1; // first comma will be -1
  //   var ret = {
  //     name: notename,
  //     length: length,
  //     dots: dots,
  //     octave: octave
  //   };

  //   return ret;
  // },

  // /**
  //  * Parse a relative note into an absolute note against a reference note
  //  * @param  {String} note      note as string
  //  * @param  {Hash} reference note hash as reference
  //  * @return {Hash}           note hash of the relative note
  //  */
  // parseRelativeNote: function (note, reference) {

  // }
};