/*jshint node: true*/

var fs = require('fs');

var files = [
  'license.js',
  "lib/base.js",
  "lib/font_info.js",
  "lib/grob.js",
  "lib/symbol.js",
  "lib/line.js",
  "lib/barline.js",
  "lib/stem.js",
  "lib/note.js",
  "lib/rest.js",
  "lib/column.js",
  "lib/time_signature.js",
  "lib/note_column.js",
  "lib/staff.js",
  "lib/score.js"
];

var ret = files.map(function (f) {
  return fs.readFileSync(f).toString();
});

fs.writeFileSync('presto.js', ret.join("\n"));