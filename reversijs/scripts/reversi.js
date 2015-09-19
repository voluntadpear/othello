// For debugging: log if there is a console
function log(message) {
  if (typeof console != 'undefined') { console.log(message); }
}

// ----------------------------------------------------------------------
// USER INTERFACE
// ----------------------------------------------------------------------

// Attach the "doclick" event to each reversi board square.
$('.rsquare').mousedown(function() { doclick(coords(this)); return false; });
function coords(cell) {
  return [parseInt(cell.id.substr(1,1)), parseInt(cell.id.substr(2,1))];
}

// Images for the three states of a board square.
var images = ['black.gif', 'green.gif', 'white.gif'];

// Sets all the images based on the state in the "board" object.
function drawall(board) {
  $('.rsquare').each(function() {
    $(this).find('img').attr('src', images[board.state(coords(this)) + 1]);
  });
  drawtext(board);
}

// Sets all the text (e.g., whose turn it is) based on the "board" object.
function drawtext(board) {
  function color(n) { return n == -1 ? 'black' : 'white'; }
  var counts = board.countsquares();
  $('#whitenum').html((counts[0] < 10 ? '&nbsp;' : '') + counts[0]);
  $('#blacknum').html((counts[1] < 10 ? '&nbsp;' : '') + counts[1]);
  $('#' + color(board.whosemove) + 'pointer').css({visibility: 'visible'})
    .attr('title', color(board.whosemove) + ' to move');
  $('#' + color(-board.whosemove) + 'pointer').css({visibility: 'hidden'})
    .removeAttr('title');
  $('#' + color(-board.computeris) + 'line')
    .attr('title', 'you are ' + color(-board.computeris));
  $('#' + color(board.computeris) + 'line')
    .attr('title', 'click to play as ' + color(board.computeris));
  $('#' + color(-board.computeris) + 'computer').css({visibility: 'hidden'});
  $('#' + color(board.computeris) + 'computer').css({visibility: 'visible'});
  if (counts[0] == 0 || counts[1] == 0 || counts[2] == 0) {
    $('#pass').attr('value', 'Start');
    $('#pass').removeAttr('disabled');
  } else {
    $('#pass').attr('value', 'Pass');
    if (board.whosemove != board.computeris &&
        counts[2] != 0 &&
        board.bestmoves()[0].length == 0) {
      $('#pass').removeAttr('disabled');
    } else {
      $('#pass').attr('disabled', true);
    }
  }
}

// Called with coordinates (x,y) when the player clicks on a square.
function doclick(c) {
  if (mainboard.computeris == mainboard.whosemove) return;
  var saved = new board(mainboard);
  if (mainboard.domove(c)) {
    drawall(mainboard);
  }
}

// When the player clicks the "pass" button.  If there is a redo stack,
// this button does a redo.  If the game is over, this button starts a
// new game.  The button only allows a pass when a pass is legal.
function dopass() {
  var counts = mainboard.countsquares();
  if (counts[0] == 0 || counts[1] == 0 || counts[2] == 0) {
    var saved = new board(mainboard);
    mainboard = new board();
    drawall(mainboard);
    startai(mainboard);
    log('Starting new game');
  } else {
    doclick([]);
  }
}

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

// Adds one to lib[0] if player 1 can move and one to lib[1] if player -1
// can move.
board.prototype.addliberties = function addliberties(lib, c) {
  var got = [0, 0];
  this.whocanflip(c, [-1, -1], got);
  this.whocanflip(c, [0, -1], got);
  this.whocanflip(c, [1, -1], got);
  this.whocanflip(c, [-1, 0], got);
  this.whocanflip(c, [1, 0], got);
  this.whocanflip(c, [-1, 1], got);
  this.whocanflip(c, [0, 1], got);
  this.whocanflip(c, [1, 1], got);
  lib[0] += got[0];
  lib[1] += got[1];
}

// Totals the positional value at the given coordinates.
// Double this value to evalute the change in score after a
// set of markers are flipped.
board.prototype.flipscore = function flipscore(flips) {
  var score = 0;
  for (var j = 0; j < flips.length; ++j) {
    score += this.position_score(flips[j]);
  }
  return score;
}

// Computes the number of liberties for each player
board.prototype.liberties = function liberties() {
  var lib = [0, 0];
  for (var x = 0; x < 8; ++x) {
    for (var y = 0; y < 8; ++y) {
      this.addliberties(lib, [x, y]);
    }
  }
  return lib;
}

// ----------------------------------------------------------------------
// BOARD SCORING FUNCTION
//
// Produces a score for the whole board - positive to favor player +1
// and negative to favor player -1.
// ----------------------------------------------------------------------
board.prototype.score = function score() {
  var cs = this.countsquares();
  if (cs[0] == 0) return -1000;
  if (cs[1] == 0) return 1000;
  if (cs[2] == 0) return 1000 * (cs[0] - cs[1]);
  var lib = this.liberties();
  var poscount = (321 / (lib[1] + 2 + this.whosemove)
                - 321 / (lib[0] + 2 - this.whosemove));
  if (cs[2] < 53 && cs[2] > 14) {
    poscount += (cs[1] - cs[0]) * 3;
  } else if (cs[2] < 9) {
    poscount += (cs[0] - cs[1]) * 20;
  }
  for (var j = 0; j < 64; ++j) {
    poscount += this.state_vector[j] * this.score_vector[j];
  }
  return poscount < 0 ? Math.floor(poscount + 0.4) : Math.ceil(poscount - 0.4);
}

// Computes the set of valid moves, ordered from the most
// advantageous to the least.
board.prototype.bestmoves = function bestmoves(promote) {
  var choices = [];
  var dopromote = false;
  for (var x = 0; x < 8; ++x) {
    for (var y = 0; y < 8; ++y) {
      var pos = [x, y];
      if (this.state(pos) != 0) continue;
      var flips = this.allflips(pos, this.whosemove);
      if (flips.length == 0) continue;
      if (promote && pos[0] == promote[0] && pos[1] == promote[1]) {
        dopromote = true;
        continue;
      }
      var score = 2 * this.flipscore(flips) +
                  this.position_score(pos) + 15 * Math.random();
      choices.push([score, pos]);
    }
  }
  choices.sort(function(s, t) { return t[0] - s[0]; });
  var result = [];
  if (dopromote) result.push(promote);
  for (var j = 0; j < choices.length; ++j) result.push(choices[j][1]);
  if (result.length == 0) result.push([]);
  return result;
}

// Counts the occupied squares on the board:
// counts[0] = +1 marker count
// counts[1] = -1 marker count
// counts[2] = empty square count
board.prototype.countsquares = function countsquares() {
  var counts = [0, 0, 0];
  for (var j = 0; j < 64; ++j) {
    var s = this.state_vector[j];
    counts[(s + 2) % 3] += 1;
  }
  return counts;
}

var mainboard = new board();
drawall(mainboard);
doclick([5, 4]);
