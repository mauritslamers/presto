/*globals QUnit, Presto*/

// automated testing of the proper interval detection
QUnit.module("Interval detection", {

  setup: function() {

  }

});

QUnit.test("Pure prime without alterations", function (assert) {
  var noteOne = Presto.Note.create({
    name: "c", octave: 1, isPlaceholder: true, length: 4
  });
  assert.equal(Presto.Note.intervalBetween(noteOne, noteOne), 1);
  assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteOne), "PURE");
});

QUnit.test("major second without alterations", function (assert) {

  [
    ["c","d"],
    ["d", "e"],
    ["f", "g"],
    ["a", "b"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

});

QUnit.test("minor second without alterations", function (assert) {
  var noteOne = Presto.Note.create({
    name: "e", octave: 1, isPlaceholder: true, length: 4
  });
  var noteTwo = Presto.Note.create({
    name: "f", octave: 1, isPlaceholder: true, length: 4
  });
  assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
  assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
  assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
  assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");

  noteOne = Presto.Note.create({
    name: "b", octave: 1, isPlaceholder: true, length: 4
  });
  noteTwo = Presto.Note.create({
    name: "c", octave: 2, isPlaceholder: true, length: 4
  });
  assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
  assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
  assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
  assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
});

QUnit.test("major third without alterations", function (assert) {

  [
    ["c","e"],
    ["f", "a"],
    ["g", "b"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

});

QUnit.test("minor third without alterations", function (assert) {
  [
    ["d","f"],
    ["e", "g"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
  });

  [
    ["a","c"],
    ["b", "d"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
  });
});

QUnit.test("pure fourth without alterations", function (assert) {
  [
    ["c","f"],
    ["d", "g"],
    ["e", "a"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
  });

  [
    ["g","c"],
    ["a", "d"],
    ["b", "e"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
  });
});

QUnit.test("augmented fourth without alterations", function (assert) {
  [
    ["f","b"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "AUG");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "AUG");
  });
});

QUnit.test("pure fifth without alterations", function (assert) {
  [
    ["c","g"],
    ["d", "a"],
    ["e", "b"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
  });

  [
    ["f","c"],
    ["g", "d"],
    ["a", "e"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
  });
});

QUnit.test("diminished fifth without alterations", function (assert) {
  [
    ["b","f"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "DIM");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "DIM");
  });
});

QUnit.test("major sixth without alterations", function (assert) {
  [
    ["c","a"],
    ["d","b"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

  [
    ["f","d"],
    ["g","e"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });
});

QUnit.test("minor sixth without alterations", function (assert) {
  [
    ["e","c"],
    ["a","f"],
    ["b","g"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
  });
});

QUnit.test("major seventh without alterations", function (assert) {
  [
    ["c","b"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

  [
    ["f","e"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });
});

QUnit.test("minor seventh without alterations", function (assert) {
  [
    ["d","c"],
    ["e","d"],
    ["g","f"],
    ["a","g"],
    ["b","a"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
  });
});

// with alterations
//

QUnit.test("major second through one-sided alterations", function (assert) {

  [
    ["e","fis"],
    ["es", "f"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

  [
    ["b","cis"],
    ["bes", "c"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

});

QUnit.test("minor second through one-sided alterations", function (assert) {

  [
    ["cis","d"],
    ["c", "des"],
    ["dis","e"],
    ["d", "es"],
    ["fis","g"],
    ["f", "ges"],
    ["gis","a"],
    ["g", "as"],
    ["ais", "b"],
    ["a", "bes"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 2);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -2);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
  });

});

QUnit.test("major third through one-sided alterations", function (assert) {
  [
    ["d","fis"],
    ["des", "f"],
    ["e", "gis"],
    ["es", "g"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });

  [
    ["a","cis"],
    ["as", "c"],
    ["b", "dis"],
    ["bes", "d"]
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 2, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
  });
});

// QUnit.test("minor third with alterations", function (assert) {
//   [
//     ["d","f"],
//     ["e", "g"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
//   });

//   [
//     ["a","c"],
//     ["b", "d"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 3);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -3);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
//   });
// });

// QUnit.test("pure fourth with alterations", function (assert) {
//   [
//     ["c","f"],
//     ["d", "g"],
//     ["e", "a"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
//   });

//   [
//     ["g","c"],
//     ["a", "d"],
//     ["b", "e"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
//   });
// });

// QUnit.test("augmented fourth with alterations", function (assert) {
//   [
//     ["f","b"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "AUG");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -4);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "AUG");
//   });
// });

// QUnit.test("pure fifth with alterations", function (assert) {
//   [
//     ["c","g"],
//     ["d", "a"],
//     ["e", "b"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
//   });

//   [
//     ["f","c"],
//     ["g", "d"],
//     ["a", "e"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "PURE");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "PURE");
//   });
// });

// QUnit.test("diminished fifth with alterations", function (assert) {
//   [
//     ["b","f"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "DIM");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -5);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "DIM");
//   });
// });

// QUnit.test("major sixth with alterations", function (assert) {
//   [
//     ["c","a"],
//     ["d","b"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
//   });

//   [
//     ["f","d"],
//     ["g","e"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
//   });
// });

// QUnit.test("minor sixth with alterations", function (assert) {
//   [
//     ["e","c"],
//     ["a","f"],
//     ["b","g"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -6);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
//   });
// });

// QUnit.test("major seventh with alterations", function (assert) {
//   [
//     ["c","b"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 1, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
//   });

//   [
//     ["f","e"],
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MAJOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MAJOR");
//   });
// });

// QUnit.test("minor seventh with alterations", function (assert) {
//   [
//     ["d","c"],
//     ["e","d"],
//     ["g","f"],
//     ["a","g"],
//     ["b","a"]
//   ].forEach(function (v) {
//     var noteOne = Presto.Note.create({
//       name: v[0], octave: 1, isPlaceholder: true, length: 4
//     });
//     var noteTwo = Presto.Note.create({
//       name: v[1], octave: 2, isPlaceholder: true, length: 4
//     });
//     assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "MINOR");
//     assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -7);
//     assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "MINOR");
//   });
// });




// the edge cases
//
QUnit.test("augmented prime", function (assert) {

  [
    ["c","cis"],
    ["d", "dis"],
    ["e", "eis"],
    ["f", "fis"],
    ["g","gis"],
    ["a", "ais"],
    ["b", "bis"],
  ].forEach(function (v) {
    var noteOne = Presto.Note.create({
      name: v[0], octave: 1, isPlaceholder: true, length: 4
    });
    var noteTwo = Presto.Note.create({
      name: v[1], octave: 1, isPlaceholder: true, length: 4
    });
    assert.equal(Presto.Note.intervalBetween(noteOne, noteTwo), 1);
    assert.equal(Presto.Note.intervalTypeBetween(noteOne, noteTwo), "AUG");
    assert.equal(Presto.Note.intervalBetween(noteTwo, noteOne), -1);
    assert.equal(Presto.Note.intervalTypeBetween(noteTwo, noteOne), "DIM");
  });

});