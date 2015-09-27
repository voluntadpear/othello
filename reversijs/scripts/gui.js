// ----------------------------------------------------------------------
// USER INTERFACE
// ----------------------------------------------------------------------

var estrategias = ["Humano", "Estrategia Minimax", "Estrategia Minimax con Poda Alfa Beta", "Estrategia aleatoria"];
var estrategiasUsadas = [0, 0];
function seleccionar(jugador, opcion) {
  const selector = `#estrategia${jugador}`;
  $(selector).text(estrategias[opcion]);
  if(opcion===0 || opcion===3) {
    $(`#limiteblock${jugador}`).hide();
  }
  else {
    $(`#limiteblock${jugador}`).show();
  }
  estrategiasUsadas[jugador-1] = opcion;
};

function jugar() {
  console.log(`el jugador 1 jugara con estrategia ${estrategias[estrategiasUsadas[0]]}`);
  console.log(`el jugador 2 jugara con estrategia ${estrategias[estrategiasUsadas[1]]}`);
  mainboard = new board();
  drawall(mainboard);
  jugadorActual = 2; //ponemos en 2 porque la proxima llamada juegoOpenente() va a poner en 0
  continuarJuego(mainboard);

}

// Images for the three states of a board square.
var images = ['black.gif', 'green.gif', 'white.gif'];

// Sets all the images based on the state in the "board" object.
function drawall(board) {
  $('.rsquare').each(function() {
    $(this).find('img').attr('src', images[board.state(coords(this)) + 1]);
  });
  return true;
}
