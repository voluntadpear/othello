// For debugging: log if there is a console
var jugadorActual = 1;
function log(message) {
  if (typeof console != 'undefined') { console.log(message); }
}

// Attach the "doclick" event to each reversi board square.
$('.rsquare').mousedown(function() { colocarFicha(coords(this)); return false; });
function coords(cell) {
  return [parseInt(cell.id.substr(1,1)), parseInt(cell.id.substr(2,1))];
}

// Called with coordinates (x,y) when the player clicks on a square.
function colocarFicha(c) {
  //if (mainboard.computeris == mainboard.whosemove) return;
  var saved = new board(mainboard);
  if (mainboard.domove(c)) {
    drawall(mainboard);
    jugadorActual = jugadorActual === 1 ? 2 : 1;
    console.log(`Jugador ${jugadorActual}`);
    $("#labeljugador").text(`Jugador ${jugadorActual}`);
    console.log(mainboard.state_vector);
    $("#puntaje1").text(cantFichas(1));
    $("#puntaje2").text(cantFichas(2));
    console.log("Total: " + cantFichas());
  }
}

function cantFichas(jugador) {
  if(jugador) {
      var actual = jugador === 1 ? -1 : 1;
      var filtrados = mainboard.state_vector.filter(function(e) { return e === actual});
      return filtrados.length;
  }
  var filtrados = mainboard.state_vector.filter(function(e) { return e === 0 });
  return mainboard.state_vector.length - filtrados.length;
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
