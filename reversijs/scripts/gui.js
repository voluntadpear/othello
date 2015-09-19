// ----------------------------------------------------------------------
// USER INTERFACE
// ----------------------------------------------------------------------

var estrategias = ["Humano", "Estrategia Minimax", "Estrategia Minimax con Poda Alfa Beta", "Estrategia aleatoria"];
function seleccion(jugador, opcion) {
  const selector = `#estrategia${jugador}`;
  $(selector).text(estrategias[opcion]);
  if(opcion==0) {
    $(`#limiteblock${jugador}`).hide();
  }
  else {
    $(`#limiteblock${jugador}`).show();
  }
}
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
