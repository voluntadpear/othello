// ----------------------------------------------------------------------
// BOARD OBJECT
//
// Represents the state of the board.
// ----------------------------------------------------------------------
function board(orig) {
  if (!orig) {
    this.computeris = 1;
    this.whosemove = -1;
    this.state_vector = [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 1,-1, 0, 0, 0,
      0, 0, 0,-1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ];
  } else {
    this.computeris = orig.computeris;
    this.whosemove = orig.whosemove;
    this.state_vector = orig.state_vector.slice();
  }
}


// The board uses these values to compute positional scores.
board.prototype.score_vector = [
  99,  -8,  8,  6,  6,  8,  -8, 99,
  -8, -24, -4, -3, -3, -4, -24, -8,
   8,  -4,  7,  4,  4,  7,  -4,  8,
   6,  -3,  4,  0,  0,  4,  -3,  6,
   6,  -3,  4,  0,  0,  4,  -3,  6,
   8,  -4,  7,  4,  4,  7,  -4,  8,
  -8, -24, -4, -3, -3, -4, -24, -8,
  99,  -8,  8,  6,  6,  8,  -8, 99
];

// ... unless in easy mode - in which case the positional score is
// just a count of pieces.
if (easy) {
  for (var j = 0; j < 64; ++j) board.prototype.score_vector[j] = 11;
}

// Reads the board at a given coordinate.
board.prototype.state = function state(c) {
  return this.state_vector[c[0] + 8 * c[1]];
}

// Scores the board at a given coordinate.
board.prototype.position_score = function position_score(c) {
  return this.score_vector[c[0] + 8 * c[1]];
}

// Sets the board at a given coordinate.
board.prototype.setstate = function setstate(c, s) {
  this.state_vector[c[0] + 8 * c[1]] = s;
}

// Compares two boards.
board.prototype.sameas = function sameas(b) {
  if (this.whosemove != b.whosemove) { return false; }
  if (this.computeris != b.computeris) { return false; }
  for (var j = 0; j < 64; ++j) {
    if (this.state_vector[j] != b.state_vector[j]) { return false; }
  }
  return true;
}

// Executes a move at the given coordinate.  The move is done on behalf
// of the player "whosemove".  If the move is illegal, false is returned.
board.prototype.domove = function domove(c) {
  if (c.length == 0) {
    this.pass();
    return true;
  }
  if (this.state(c) != 0) return false;
  var flips = this.allflips(c, this.whosemove);
  if (flips.length == 0) return false;
  this.setstate(c, this.whosemove);
  for (var j = 0; j < flips.length; ++j) {
    this.setstate(flips[j], this.whosemove);
  }
  this.whosemove = -this.whosemove;
  return true;
}

// Passes the turn to the other player without moving.
board.prototype.pass = function pass() {
  this.whosemove = -this.whosemove;
}

// Computes the list of coordinates of markers that need to flip
// in direction "dir" starting from position "c" if the player "s"
// places a move there.
board.prototype.flipline = function flipline(c, dir, s) {
  var accumulate = [];
  var scan = [c[0] + dir[0], c[1] + dir[1]];
  while (scan[0] >= 0 && scan[0] <= 7 && scan[1] >= 0 && scan[1] <= 7) {
    if (this.state(scan) != -s) {
      if (this.state(scan) == s) return accumulate;
      break;
    }
    accumulate.push([scan[0], scan[1]]);
    scan[0] += dir[0];
    scan[1] += dir[1];
  }
  return [];
}

// Sets "got" if a player has a flip in direction "dir" at position "c".
board.prototype.whocanflip = function flipline(c, dir, got) {
  var scan = [c[0] + dir[0], c[1] + dir[1]];
  if (scan[0] <= 0 || scan[0] >= 7 || scan[1] <= 0 || scan[1] >= 7) {
    return;
  }
  var opponent = this.state(scan);
  scan[0] += dir[0];
  scan[1] += dir[1];
  while (scan[0] >= 0 && scan[0] <= 7 && scan[1] >= 0 && scan[1] <= 7) {
    var who = this.state(scan);
    if (who != opponent) {
      if (who == -opponent) {
        got[(who + 2) % 3] = 1;
      }
      return;
    }
    scan[0] += dir[0];
    scan[1] += dir[1];
  }
  return;
}

// Computes the full list of coordinates of markers that need to flip
// in all directions starting from position "c" if the player "s"
// places a move there.
board.prototype.allflips = function allflips(c, s) {
  var flips = [].concat(
    this.flipline(c, [-1, -1], s),
    this.flipline(c, [0, -1], s),
    this.flipline(c, [1, -1], s),
    this.flipline(c, [-1, 0], s),
    this.flipline(c, [1, 0], s),
    this.flipline(c, [-1, 1], s),
    this.flipline(c, [0, 1], s),
    this.flipline(c, [1, 1], s)
  );
  return flips;
}
