var moveCount = 0;  // Counter for number of moves

var WHITE = 0x0;
var BLACK = 0x8;

var PAWN = 0x01;
var KNIGHT = 0x02;
var KING = 0x03;
var BISHOP = 0x05;
var ROOK = 0x06;
var QUEEN = 0x07;


// White pieces have their 4th bit = 0
var WHITE_PAWN = 0x01;
var WHITE_KNIGHT = 0x02;
var WHITE_KING = 0x03;
var WHITE_BISHOP = 0x05;
var WHITE_ROOK = 0x06;
var WHITE_QUEEN = 0x07;

// Black pieces have their 4th bit = 1
var BLACK_PAWN = 0x09;
var BLACK_KNIGHT = 0x0A;
var BLACK_KING = 0x0B;
var BLACK_BISHOP = 0x0D;
var BLACK_ROOK = 0x0E;
var BLACK_QUEEN = 0x0F;

var currentPlayer = WHITE;  // whose turn is it now?

var castleRights = 0xF; // 4 bits to track castling on each side for both players

// Initial state
var board = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var user = {};

function getPieceName(pieceValue){
    switch (pieceValue) {
        case WHITE_KING: return 'WHITE_KING';
        case WHITE_QUEEN: return 'WHITE_QUEEN';
        case WHITE_ROOK: return 'WHITE_ROOK';
        case WHITE_BISHOP: return 'WHITE_BISHOP';
        case WHITE_KNIGHT: return 'WHITE_KNIGHT';
        case WHITE_PAWN: return 'WHITE_PAWN';
        
        case BLACK_KING: return 'BLACK_KING';
        case BLACK_QUEEN: return 'BLACK_QUEEN';
        case BLACK_ROOK: return 'BLACK_ROOK';
        case BLACK_BISHOP: return 'BLACK_BISHOP';
        case BLACK_KNIGHT: return 'BLACK_KNIGHT';
        case BLACK_PAWN: return 'BLACK_PAWN';
        
        default: return 'EMPTY';
    }
}

function drawBoard(board){
    var str = '';
    
    var showsDummyBoard = false; // when enabling this, set the board width to 800px in .css
    var showsSquareNumbers = false;
    console.log(user.color);
    var whichPlayer = currentPlayer;
    /*var incr = whichPlayer ? 1 : -1;
    var start = whichPlayer ? 0 : 127;
    var end = whichPlayer ? 128 : -1;
    var rowStart = whichPlayer ? 0 : 15;
    var rowEnd = whichPlayer ? 15 : 0;
    */
    
	var incr = 1;
    var start = 0;
    var end = 128;
    var rowStart = 0;
    var rowEnd =15;
	
    for( var i = start ; i !== end ; i+= incr ){
        if( i % 16 === rowStart ) {
            str += '<div class="row">';
        }
        
        if(! (i & 0x88) ) {
            str += '<div class="column ' +
            ( (i & 0x1) ^ ((i >> 4)  & 0x1) ? 'dark': 'light') +
            '" data-square="' + i + '">' +
                '<div class="' + getPieceName(board[i]) + '">' +
                (showsSquareNumbers ? i.toString(16).toUpperCase() : '') +
                '</div>' +
            '</div>';
        }
        if( i % 16 === rowEnd ) {
            str += '</div>';
        }
    }

    $('#board').html(str);
    
    $( ".column" ).droppable({
        drop: onDrop
    });
    
    $( ".column div" ).filter(function(){
        return true;   
        //return $(this).attr('class').indexOf(user.color ? 'WHITE' : 'BLACK') !== -1;
    }).draggable({ revert: 'invalid' });
    
    
    $( ".column" ).mousedown(function(){
        $('.column').removeClass('red-border');
        for (var i = 0; i < 128; i++) {
            if(validateMove($(this).data('square'), i)){
                $('.column').filter(function(){
                    return $(this).data('square') === i;
                }).addClass('red-border');
            }
        }
    });
    
    /* Show info */
    $('#info .moveCount').text('Moves elapsed: ' + Math.floor(moveCount/2));
    
}

var onDrop = function(event, ui) {

    var from = ui.draggable.parent().data('square');
    var to = $(this).data('square');
    
    if(validateMove(from, to, currentPlayer)){
		console.log("valid move");
		makeMove(from, to);
    }
	else
	{
        ui.draggable.draggable('option','revert',true);   
	}
}

function validateMove(from, to, currentPlayer){
    return isPseudoLegal(from, to);
}

function isPseudoLegal(from, to){

    var fromPiece = board[from];
    var toPiece = board[to];
	
	
    if(!fromPiece){ // Moving an empty square?
        return false;
    }
	
    if (to & 0x88){ // moving to outside valid board?
		console.log("moving to outside valid board");
        return false;
    }
	
	 if( (fromPiece & 0x8) ^ currentPlayer ) {  // not your turn?
		console.log("not your turn");
        return false;
    }

    if(toPiece && (toPiece & 0x8) === currentPlayer ) {  // cannot attack one of your own
        return false;
    }

    var pieceType = fromPiece & 0x07;
	
    if(pieceType === QUEEN){ // queen
		
        if( (Math.abs(from - to) % 15 && Math.abs(from - to) % 17) &&    // bishop move
            ((from & 0x0F) !== (to & 0x0F) && (from & 0xF0) !== (to & 0xF0))){  // rook move
            return false;
        }
    }else if(pieceType === ROOK){ // rook
        if( (from & 0x0F) !== (to & 0x0F) && (from & 0xF0) !== (to & 0xF0)  ){  // move in a file or a rank
            return false;
        }
    }else if(pieceType === BISHOP){ // bishop
        if( Math.abs(from - to) % 15 && Math.abs(from - to) % 17 ){  // bishop can only move diagonally
            return false;
        }
    }else if(pieceType === KING){ // king
        var diff = Math.abs(from - to);
        var direction = from - to > 0 ? 0x0 : 0x1;

        if( diff === 1  || diff === 16 || diff === 17 || diff === 15 ){
            // valid
        } 
    } else if(pieceType === KNIGHT){ // knight
		console.log("knight");
        var diff = Math.abs(from - to);
        if( diff !== 14  && diff !== 18 && diff !== 31 && diff !== 33 ){
            return false;
        }
    } else if(pieceType === PAWN){ // pawn
		console.log("pawn");
        var direction = from - to > 0 ? 0x0 : 0x8;
        var diff = Math.abs(from - to);
        var fromRow = from & 0x70;

        if(diff === 16 && !toPiece){  // single move forward?
            // valid
        } else if(diff === 32 &&
                  (fromRow === 0x60 || fromRow === 0x10) &&
                  !toPiece &&
                  !board[from + (direction ? 16 : -16)]){  // double move from start
            // valid
        } else if ((diff === 15 || diff === 17) && toPiece) {
            // valid
        } else {
            return false;
        }
    }
	if(fromPiece & 0x04){ // sliding piece
        var diff = to - from;
        var step;

        if(diff % 17 === 0){
            step = 17;
        }else if(diff % 15 === 0){
            step = 15;
        }else if(diff % 16 === 0){
            step = 16;
        }else{
            step = 1;
        }

        var iterations = diff/step;
        if(iterations < 0){
            step = -step;
            iterations = -iterations;
        }

        var path = from + step;
        for(var i = 1; i < iterations; i++, path+=step){
            if(board[path]){
                return false;
            }
        }
    }
    return true;
}

function makeMove(from, to){

    var capturedPiece = board[to];
    board[to] = board[from];
    board[from] = 0;

    // Hack to remember castleRights so that we don't
    // have to use a stack to keep track of it.
    var stateData = (capturedPiece << 4) + castleRights;


    if( (board[to] & 0x07) === KING ){

        // King-moves reset both castling bits per side.
        castleRights &= ~(3 << (currentPlayer/4));

        // move rook too if it is a castling move
        if( Math.abs(from - to) === 2 ){
            var rookTo = from + (from > to ? -1 : 1);
            var rookFrom = from + (from > to ? -4 : 3);

            board[rookTo] = board[rookFrom];
            board[rookFrom] = 0;
        }
    }

    // Rook-move resets castling in that side
    if( (board[to] & 0x07) === ROOK ){
        if(from === 0x0 || from === 0x70){
            var direction = 0;
            castleRights &= ~(1 << (currentPlayer/4 + direction));
        } else if (from === 0x7 || from === 0x77) {
            var direction = 1;
            castleRights &= ~(1 << (currentPlayer/4 + direction));
        }
    }

    // Capture of rook resets castling in that side
    if( (capturedPiece & 0x07) === ROOK ){
        if(to === 0x0 || to === 0x70){
            var direction = 0;
            var otherPlayer = currentPlayer ? 0 : 8;
            castleRights &= ~(1 << (otherPlayer/4 + direction));
        } else if (to === 0x7 || to === 0x77) {
            var direction = 1;
            var otherPlayer = currentPlayer ? 0 : 8;
            castleRights &= ~(1 << (otherPlayer/4 + direction));
        }
    }

    currentPlayer = currentPlayer ? 0 : 8;
	if(currentPlayer == WHITE)
	{
		$('#turn').html('Player Turn: White');
	}
	else
	{
		$('#turn').html('Player Turn: Black');
	}
	$('.column').removeClass('red-border');
    moveCount++;
	drawBoard(board);
    return stateData;
}

function resetGame()
{
	//location.reload(true);
	startGame();
}

function startGame()
{
	board =[BLACK_ROOK, BLACK_KNIGHT, BLACK_BISHOP, BLACK_QUEEN, BLACK_KING, BLACK_BISHOP, BLACK_KNIGHT, BLACK_ROOK, 0, 0, 0, 0, 0, 0, 0, 0,
             BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, BLACK_PAWN, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
             WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, WHITE_PAWN, 0, 0, 0, 0, 0, 0, 0, 0,
             WHITE_ROOK, WHITE_KNIGHT, WHITE_BISHOP, WHITE_QUEEN, WHITE_KING, WHITE_BISHOP, WHITE_KNIGHT, WHITE_ROOK, 0, 0, 0, 0, 0, 0, 0, 0];
	drawBoard(board);
}
$(function(){    
    //refreshFromServer();
	drawBoard(board);
});



