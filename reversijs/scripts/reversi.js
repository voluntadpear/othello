// For debugging: log if there is a console
var jugadorActual = 1;

var mainboard = new board();
drawall(mainboard);
//JUGADOR 1: Negras. JUGADOR 2: Blancas.
function log(message) {
  if (typeof console != 'undefined') { console.log(message); }
}

var ponderaciones = [
  100,  -25,  25, 5,  5,  25, -25,  100,
  -25,  -30,  -5, -5, -5, -5, -30,  -25,
  25,    -5,   7,  3,  3,  7,  -5,   25,
   5,    -5,  3,  3,  3,  3,  -5,     5,
   5,    -5,  3,  3,  3,  3,  -5,     5,
   25,   -5,  7,  3,  3,  7,   -5,   25,
   -25, -30,  -5, -5, -5, -5, -30,  -25,
   100, -25,  25, 5,  5,  25, -25,  100
 ];
// Attach the "doclick" event to each reversi board square.
$('.rsquare').mousedown(function() {
  if(estrategiasUsadas[jugadorActual-1] !== 0) return false;
  var result = colocarFicha(mainboard, coords(this));
  if(result) {
    drawall(mainboard);
    $("#puntaje1").text(cantFichas(mainboard, 1));
    $("#puntaje2").text(cantFichas(mainboard, 2));
    console.log(`Jugador ${jugadorActual}: [${coords(this)[0]},${coords(this)[1]}]`)
    juegoOponente(mainboard);
  }
  return false;
});
function coords(cell) {
  return [parseInt(cell.id.substr(1,1)), parseInt(cell.id.substr(2,1))];
}

function minimax(tablero, profundidad, esJugadorIA, jugadorIA) {
  var cantCeros = tablero.state_vector.filter(function(e) { return e === 0 });
  if(profundidad === 0 || cantCeros === 0) {
    return evaluar(tablero, jugadorIA);
  }
  var movimientos = posiblesMovimientos(tablero, jugadorIA);
  if(esJugadorIA) {
    var mejorValor = Number.NEGATIVE_INFINITY;
    for(var i=0; i < movimientos.length; i++) {
      var hijo = new board(tablero);
      colocarFicha(hijo, movimientos[i]);
      var val = minimax(hijo, profundidad - 1, false, jugadorIA);
      mejorValor = Math.max(mejorValor, val);
    }
    return mejorValor;
  } else {
    var mejorValor = Number.POSITIVE_INFINITY;
    for(var i=0; i < movimientos.length; i++) {
      var hijo = new board(tablero);
      colocarFicha(hijo, movimientos[i]);
      var val = minimax(hijo, profundidad - 1, true, jugadorIA);
      mejorValor = Math.min(mejorValor, val);
    }
    return mejorValor;
  }
}

function jugarMinimax(tablero, nivel, jugadorIA) {
  var movimientos = posiblesMovimientos(tablero, jugadorIA);
  var mejorValor = Number.NEGATIVE_INFINITY;
  var indiceJugada = 0;
  for(var i = 0; i<movimientos.length; i++) {
    var hijo = new board(tablero);
    colocarFicha(hijo, movimientos[i]);
    var val = minimax(hijo, nivel-1, false, jugadorIA);
    if(val > mejorValor) {
      mejorValor = val;
      indiceJugada = i;
    }
  }
  var result = colocarFicha(tablero, movimientos[indiceJugada]);
  if(result) {
    drawall(tablero);
    $("#puntaje1").text(cantFichas(tablero, 1));
    $("#puntaje2").text(cantFichas(tablero, 2));
    console.log(`Jugador ${jugadorActual}: [${movimientos[indiceJugada][0]},${movimientos[indiceJugada][1]}]`)
    juegoOponente(tablero);
  }
}
// Called with coordinates (x,y) when the player clicks on a square.
function colocarFicha(tablero, c) {
  //if (mainboard.computeris == mainboard.whosemove) return;
  var saved = new board(tablero);
  if (tablero.domove(c)) {
    return true;
  }
  return false;
}

function juegoOponente(tablero) {
  jugadorActual = jugadorActual === 1 ? 2 : 1;
  $("#labeljugador").text(`Jugador ${jugadorActual}`);
  console.log(`Jugador ${jugadorActual}`);
  switch(estrategiasUsadas[jugadorActual-1]) {
    case 1: //Minimax
      var nivel = parseInt($(`#limite${jugadorActual}`).text());
      jugarMinimax(tablero, nivel, jugadorActual);
      break;
  }
}
//devuelve un array con las coordenadas [x, y] de los movimientos Posibles
//para el jugador dado:
//Ej.: de la respuesta: [4, 5], [3, 2], [5, 6]
function posiblesMovimientos(tablero, jugador) {
  var respuesta = [];
  var jugActual = jugador === 1 ? -1 : 1;

  for(var i=0; i<8; i++) {
    for(var j=0; j<8; j++) {
      var casillaActual = tablero.state_vector[i + 8 * j];
      if(casillaActual != 0) continue;
      var fichasComidas = tablero.allflips([i, j], jugActual);
      if(fichasComidas.length === 0 ) {
        continue;
      }
      respuesta.push([i, j]);
    }
  }
  return respuesta;
}


function evaluar(tablero, jugadorIA) {
  var totalJugContrario = 0;
  var totalJugIA = 0;
  var jugIA = jugadorIA === 1 ? -1 : 1;
  var jugContrario = (-1)*jugIA;

  for(var i=0; i<8; i++) {
    for(var j=0; j<8; j++) {
      var casillaActual = tablero.state_vector[i + 8 * j];
      if(casillaActual === jugIA) {
        totalJugIA += ponderaciones[i + 8 * j];
      } else if(casillaActual === jugContrario) {
        totalJugContrario += ponderaciones[i + 8 *j];
      }
    }
  }

  return totalJugIA - totalJugContrario;
}

function cantFichas(tablero, jugador) {
  if(jugador) {
      var actual = jugador === 1 ? -1 : 1;
      var filtrados = tablero.state_vector.filter(function(e) { return e === actual});
      return filtrados.length;
  }
  var filtrados = tablero.state_vector.filter(function(e) { return e === 0 });
  return tablero.state_vector.length - filtrados.length;
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
