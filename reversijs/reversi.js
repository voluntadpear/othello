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
  if (undo.length) {
    $('#undo').removeAttr('disabled');
  } else {
    $('#undo').attr('disabled', true);
  }
  if (redo.length) {
    $('#pass').attr('value', 'Redo');
    $('#pass').removeAttr('disabled');
  } else if (counts[0] == 0 || counts[1] == 0 || counts[2] == 0) {
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

// Called when the user chooses to switch to player p.
// p=1 for white and p=-1 for black.
function pickplayer(p) {
  if (mainboard.computeris == -p) return;
  undo.push(new board(mainboard));
  redo.length = 0;
  mainboard.computeris = -p;
  drawtext(mainboard);
  startai(mainboard);
}

// Called with coordinates (x,y) when the player clicks on a square.
function doclick(c) {
  if (mainboard.computeris == mainboard.whosemove) return;
  var saved = new board(mainboard);
  if (mainboard.domove(c)) {
    undo.push(saved);
    redo.length = 0;
    drawall(mainboard);
    startai(mainboard);
  }
}

// When the player clicks the "pass" button.  If there is a redo stack,
// this button does a redo.  If the game is over, this button starts a
// new game.  The button only allows a pass when a pass is legal.
function dopass() {
  var counts = mainboard.countsquares();
  if (redo.length) {
    doredo();
  } else if (counts[0] == 0 || counts[1] == 0 || counts[2] == 0) {
    var saved = new board(mainboard);
    undo.push(saved);
    redo.length = 0;
    mainboard = new board();
    drawall(mainboard);
    startai(mainboard);
    log('Starting new game');
  } else {
    doclick([]);
  }
}

// When the user clicks "redo"
function doredo() {
  if (redo.length) {
    undo.push(new board(mainboard));
    mainboard = redo.pop();
    log('redo to ' + undo.length);
  }
  drawall(mainboard);
  startai(mainboard);
}

// When the user clicks "undo"
function doundo() {
  if (undo.length) {
    redo.push(mainboard);
    mainboard = undo.pop();
    log('undo to ' + undo.length);
  }
  drawall(mainboard);
  startai(mainboard);
}


// ----------------------------------------------------------------------
// Background Processing AI Driver
// ----------------------------------------------------------------------

movetimer = null;   // After this fires, the computer moves immediately
earlytimer = null;  // The computer will wait for this to fire before moving
cycletimer = null;  // Each tick of this timer allows the AI to run a bit

// Stops all background processing timers
function stoptimers() {
  clearTimeout(movetimer);
  clearTimeout(earlytimer);
  clearTimeout(cycletimer);
  movetimer = null;
  earlytimer = null;
  cycletimer = null;
}

// Starts the ai working on the given board.  If it's the computer's move,
// the movetimer and earlytimer are set, so that the search ends when
// the right amount of time has elapsed.
function startai(board) {
  stoptimers();
  ai.setboard(board);
  if (board.whosemove == board.computeris) {
    var remaining = mainboard.countsquares()[2];
    var ms = 500 + (64 - remaining) * 150;
    movetimer = setTimeout(finishai, ms);
    earlytimer = setTimeout(earlyai, 1000);
  }
  cycletimer = setTimeout(advanceai, 1);
}

// Does one chunk of AI processing (twenty steps)
function advanceai() {
  if (!ai.advance(20)) {
    if (earlytimer == null) {
      finishai();
    } else {
      clearTimeout(movetimer);
      movetimer = null;
    }
    return;
  }
  clearTimeout(cycletimer);
  cycletimer = setTimeout(advanceai, 1);
}

// Called when the early (500ms) timer goes off.  If the AI is done,
// then it triggers the move.
function earlyai() {
  if (movetimer == null) {
    finishai();
  } else {
    clearTimeout(earlytimer);
    earlytimer = null;
  }
}

// Called when time is up and the computer needs to make a move.
// Asks the ai what it thinks the best move so far is.
function finishai() {
  stoptimers();
  if (mainboard.computeris != mainboard.whosemove) return;
  if (!mainboard.domove(ai.bestmove())) {
    log('Problem move: ' + ai.bestmove());
    return;
  }
  log('Depth ' + ai.bestdepth() + ': ' + ai.bestmove());
  drawall(mainboard);
  startai(mainboard);
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

// ----------------------------------------------------------------------
// AI SEARCH NODE OBJECT
//
// Represents one possible future state of the board.
// ----------------------------------------------------------------------
function node(b, d, m, a, f) {
  this.move = m;
  this.board = new board(b);
  if (m !== null) this.board.domove(m);
  this.depth = d;
  var promote = (f != null && f.length > 0) ? f.shift() : null;
  this.first = f;
  this.childmoves = (d <= 0 ? [] : b.bestmoves(promote));
  this.adverse = a;
  this.best = (d == 0 ? this.board.score() : null);
  this.bestseq = null;
}

// Called at the root of the search tree when the tree has been fully
// explored, to continue the search with a new tree one level deeper.
node.prototype.advancedepth = function advancedepth() {
  this.depth += 1;
  this.first = this.bestseq;
  this.childmoves = this.board.bestmoves(this.first.shift());
  this.best = null;
}

// Returns the next unprocessed child of the current node.
node.prototype.nextchild = function nextchild() {
  if (0 == this.childmoves.length) return null;
  return new node(
    this.board,
    this.depth - 1,
    this.childmoves.shift(),
    this.best,
    this.first);
  this.first = null;
}

// True if the first score is better for the player whose move it is.
node.prototype.better = function better(s1, s2) {
  if (s1 === null) return false;
  if (s2 === null) return true;
  if (this.board.whosemove == 1) {
    return s1 > s2;
  } else {
    return s1 < s2;
  }
}

// When a child is done processing, the parent updates its knowledge
// of the best-scored move.  If there is an adversarial move already
// known that can force a lower score than our best score, then we
// stop the search, because we can assume the adversary would have
// already forced that move.
node.prototype.finishchild = function finishchild(move, score, seq) {
  if (this.better(score, this.best)) {
    this.best = score;
    this.bestseq = [move];
    if (seq !== null) {
      this.bestseq = this.bestseq.concat(seq);
    }
    if (this.adverse !== null && !this.better(this.adverse, score)) {
      this.childmoves.length = 0;
    }
  }
}

// Returns true if the best moves discovered lead to stalemate.
node.prototype.stalemate = function stalemate() {
  if (this.bestseq == null || this.bestseq.length < 2) return false;
  return this.bestseq[this.bestseq.length - 1].length == 0 &&
         this.bestseq[this.bestseq.length - 2].length == 0;
}

// ----------------------------------------------------------------------
// AI SEARCH STACK OBJECT
//
// Represents a whole search stack.
// ----------------------------------------------------------------------
function searchstack(board, choice) {
  this.stack = [new node(board, 2, choice, null, null)];
  this.bestmove = this.stack[0].childmoves[0];
  this.bestdepth = 1;
}

// Advances the search by one step.
searchstack.prototype.advance = function advance() {
  if (this.stack.length == 0) return false;
  var n = this.stack[this.stack.length - 1];
  var c = n.nextchild();
  if (c !== null) {
    // If there is a new child to explore, push it on the stack.
    this.stack.push(c);
  } else {
    // Done with children: this branch is done being explored.
    this.stack.pop();
    if (this.stack.length > 0) {
      // Update the parent node with the best path from the children.
      this.stack[this.stack.length - 1].finishchild(n.move, n.best, n.bestseq);
    } else {
      // Search is done at the root; record the result and increase depth.
      this.bestmove = n.bestseq[0];
      this.bestdepth = n.depth;
      if (!n.stalemate() && n.best < 1000 && n.best > -1000) {
        // If there is no winner yet, increase the depth and continue.
        n.advancedepth();
        this.stack.push(n);
      } else {
        // Otherwise, our search is done.
        this.stack.push(n);
        return false;
      }
    }
  }
  return true;
}

searchstack.prototype.getbestmove = function getbestmove() {
  if (this.stack.length > 0 && this.stack[0].bestmove) {
    return this.stack[0].bestmove;
  } else {
    return this.bestmove;
  }
}

searchstack.prototype.sameas = function sameas(b) {
  if (this.stack.length == 0) return false;
  return this.stack[0].board.sameas(b);
}

// ----------------------------------------------------------------------
// SEARCHSPACE OBJECT
//
// Can manage more than one search stack: used when the human player
// is moving, to anticipate all possible responses.
// ----------------------------------------------------------------------
function searchspace() {
  this.stacks = []
  this.currentstack = 0;
}

// Loads a new board into the AI.  If the board matches the root of
// an existing search, then the search is continued.
searchspace.prototype.setboard = function setboard(board) {
  if (board.whosemove == board.computeris) {
    var newstack = null;
    for (var j = 0; j < this.stacks.length; ++j) {
      if (this.stacks[j].sameas(board)) {
        newstack = this.stacks[j];
        log('Starting at depth ' + newstack.bestdepth);
        break;
      }
    }
    if (newstack == null) {
      newstack = new searchstack(board, null);
    }
    this.stacks = [ newstack ];
  } else {
    this.stacks = [ ];
    var choices = board.bestmoves();
    for (var j = 0; j < choices.length; ++j) {
      this.stacks.push(new searchstack(board, choices[j]));
    }
  }
  this.currentstack = 0;
}

searchspace.prototype.advance = function advance(iterations) {
  if (this.stacks.length == 0) return false;
  var finished = 0;
  while (iterations > 0) {
    var searchstack = this.stacks[this.currentstack++];
    if (this.currentstack >= this.stacks.length) this.currentstack= 0;
    while (iterations > 0) {
      if (!searchstack.advance()) {
        finished += 1;
        break;
      }
      iterations -= 1;
    }
    if (finished >= this.stacks.length) return false;
  }
  return true;
}

searchspace.prototype.bestmove = function bestmove() {
  if (this.stacks.length == 0) return [];
  return this.stacks[0].getbestmove();
}

searchspace.prototype.bestdepth = function bestdepth() {
  if (this.stacks.length == 0) return 0;
  return this.stacks[0].bestdepth;
}


var undo = [];
var redo = [];
var mainboard = new board();
var ai = new searchspace();

drawall(mainboard);
startai(mainboard);
if (easy) log('Playing easy mode');
if (playwhite) pickplayer(1);
if (notext) $('.text').css('display', 'none');

var browser = /Chrome|Safari|Opera|Firefox|MSIE/.exec(navigator.userAgent);
if (browser == 'MSIE') browser = 'Internet Explorer';
if (browser != null) document.getElementById('browsername').innerHTML = browser;
