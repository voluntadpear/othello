// For debugging: log if there is a console
function log(message) {
  if (typeof console != 'undefined') { console.log(message); }
}

// Called with coordinates (x,y) when the player clicks on a square.
function doclick(c) {
  //if (mainboard.computeris == mainboard.whosemove) return;
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

var mainboard = new board();
drawall(mainboard);
