import Mustache from 'mustache';
import html from '../views/diagram.html';
import $ from './jquery.min.js';
import './chess.js';
import './icons.js';
import './chessboard.js';
import '../css/chessboard.css';
import '../css/diagram.css';

window.jQuery = $
window.$ = $

export default function(data) {

    var words = {};
    var history = [];
    var container;
    var game;
    var board;
    var play_btn;
    var board_btn;
    var pause_btn;
    var flip_btn;
    var first_btn;
    var last_btn;
    var next_btn;
    var prev_btn;
    var lastmove;
    var clock;
    var index = -1
    var started = false
    var paused = true
    var config = window[window['YouChess-Widget']].q[0][1]||{}
    var interval = data.interval||config.interval||1000
    var speed = data.speed||config.speed||200
    var autoplay = data.autoplay||config.autoplay||false
    var lang = data.lang||config.lang||'en'
    var whitesquare = data.whitesquare||config.whitesquare||'#f0d9b5'
    var blacksquare = data.blacksquare||config.blacksquare||'#b58863'
    var pieces = data.pieces||config.pieces||'classic'
    var orientation = data.orientation||config.orientation||'white'

    const body = document.getElementsByTagName('body')[0];
    const cfg = {
      showErrors:true,
      position: 'start',
      draggable: false,
      pieceTheme:'//chessdiagram.herokuapp.com/img/chesspieces/' + pieces + '/{piece}.png',
      //pieceTheme:'http://localhost:8000/img/chesspieces/' + pieces + '/{piece}.png',
      moveSpeed: speed,
      onMoveEnd: move_end
    }

    container = document.getElementById(data.id)
    data.pgn_html = pgn_html(data.pgn) 

    // game load 
    game = new Chess();
    var pgn = data.pgn.replace(/\{(.+?)\}/g, '') // remove comments

    if(lang==='es'){
        pgn = pgn.split('C').join('N')
            .split('A').join('B')
            .split('R').join('K')
            .split('D').join('Q')
            .split('T').join('R')
    }

    game.load_pgn(pgn)

    // parse html 
    data.eco = detect_eco(pgn)

    // parse html 
    container.innerHTML = Mustache.render(html, data)
    var board_div = container.getElementsByClassName('diagram')[0]

    // game init
    history = game.history()

    board = ChessBoard('b'+data.id, cfg);
    board.orientation(orientation)

    // game reset moves
    game.reset()

    board_btn = board_div.getElementsByClassName('board')[0]
    play_btn = board_div.getElementsByClassName('play')[0]
    pause_btn = board_div.getElementsByClassName('pause')[0]
    flip_btn = board_div.getElementsByClassName('flip')[0]
    prev_btn = board_div.getElementsByClassName('prev')[0]
    next_btn = board_div.getElementsByClassName('next')[0]
    first_btn = board_div.getElementsByClassName('first')[0]
    last_btn = board_div.getElementsByClassName('last')[0]

    squares_color()

    // resize event handling
    $(window).resize(() => {
        board.resize()
        adjust_pgn_html()
        squares_color()
    })

    play_btn.addEventListener('click',() => {
        diagram_play()
    })

    board_btn.addEventListener('click',() => {
        if(!paused) {
            paused = true
            show_play()
        } else {
            diagram_play()
        }
    })

    pause_btn.addEventListener('click',() => {
        if(!paused) paused = true
        show_play()
    })

    flip_btn.addEventListener('click',() => {
        board.flip()
        squares_color()
    })

    next_btn.addEventListener('click',() => {
        if(index >= history.length) return
        if(!paused) paused = true
        show_pause()
        
        index++
        seek(index)
    })

    prev_btn.addEventListener('click',() => {
        if(index <= 0) return
        if(!paused) paused = true
        show_play()
        index--
        seek(index)
    })

    first_btn.addEventListener('click',() => {
        if(!paused) paused = true
        show_play()
        index = -1
        lastmove = null
        remove_highlight()
        remove_move_index()
        game.reset()
        board.position(game.fen())
    })

    last_btn.addEventListener('click',() => {
        if(!paused) paused = true
        show_play()
        seek(history.length-1)
    })

    board_div.querySelectorAll('.move').forEach((move) => {
        move.addEventListener('click',move_seek)
    })

    adjust_pgn_html()
    if(autoplay){
        paused = true
        setTimeout(() => {
            play_btn.click()
        },1000)        
    }

    function diagram_play(){
        if(paused) paused = false
        show_pause()
        if(index >= history.length - 1){
            first_btn.click()
            setTimeout(() => {
                play_btn.click()
            },1000)
        } else {
            if(clock){
                clearInterval(clock)
            }
            clock = setInterval(() => {
                if(!paused){
                    remove_highlight()
                    index++
                    move()            
                }
            },interval)
            index++
            move()
        }
    }

    function detect_eco(pgn) {
        var eco = require('../eco/' + lang + '.json')
        var data = {}
        var parts = game.history().slice(0,25)
        var pgn2 = []
        parts.forEach((move, i) => {
            if(i%2){
              pgn2.push(move)
            } else {
              pgn2.push([Math.ceil(i/2)+1,move].join(' '))     
            }
            var ref = pgn2.join(' ')
            eco.forEach((eco,i) => {
                if(eco.pgn === ref){
                  data.opening = eco.name
                  data.code = eco.eco
                }
            })
        })

        return data
    }

    function adjust_pgn_html() {
        container.getElementsByClassName('diagram-pgn')[0].style.height = (document.getElementById('b'+data.id).clientHeight - 16) + 'px'
    }

    function squares_color() {
        container.querySelectorAll('.white-1e1d7').forEach(square => {
            square.style.backgroundColor = whitesquare
            square.style.color = blacksquare
        })
        container.querySelectorAll('.black-3c85d').forEach(square => {
            square.style.backgroundColor = blacksquare
            square.style.color = whitesquare
        })
    }

    function show_play() {
        pause_btn.classList.add('hide')
        play_btn.classList.add('show')
        play_btn.classList.remove('hide')
        pause_btn.classList.remove('show')
    }

    function show_pause() {
        play_btn.classList.add('hide')
        pause_btn.classList.add('show')
        pause_btn.classList.remove('hide')
        play_btn.classList.remove('show')
    }

    function pgn_html(pgn) {
        var data = []
        var annotations = []
        var fixed = pgn.replace(/\{(.+?)\}/g, function(diagram, contents, offset, input_string){
            return diagram.replace(/\./g,';')
        })    
        fixed.split('.').forEach(function(turn,j){
            var data = turn.match(/\{(.+?)\}/g)
            if(data){
                data.forEach( (annotation, i) => {
                    var str = turn.substring(0,turn.indexOf(annotation))
                    var i = str.split(' ').length>3?1:0
                    const ann = annotation.split('{').join('').split('}').join('').split(';').join('.')
                    if(!annotations[j]) annotations[j] = []
                    annotations[j][i] = ann
                })
            }
        })

        var k = 0
        pgn.replace(/\{(.+?)\}/g, '').split('.').forEach(function(turn,j){
            var i = 0
            if(j) data.push('<span class="move-index">' + j + '.</span> ')
            turn.split(' ').forEach(function(movement,n){
                if(movement.length){
                    if(isNaN(movement) && movement.length > 1){
                        data.push('<span class="move move-' + k + '">' + movement + '</span>')    
                        if(annotations[j] && annotations[j][i]){
                            data.push('<span class="comment">' + annotations[j][i] + '</span>')
                        }
                        i++;k++
                    }
                }
            })
        })

        return data.join(' ')
    }

    function remove_move_index() {
        var list = container.getElementsByClassName('move')
        for (var item of list) {
            item.classList.remove('active')
        }
    }

    function remove_highlight() {
        var list = container.getElementsByClassName('square-55d63')
        for (var item of list) {
            item.classList.remove('highlight-move')
            item.classList.remove('in-check')
        }
    }

    function move_end() {
        if(lastmove){
            container.getElementsByClassName('square-' + lastmove.from)[0].classList.add('highlight-move')
            container.getElementsByClassName('square-' + lastmove.to)[0].classList.add('highlight-move')
            if (game.in_check() === true) {
                container.querySelector('img[data-piece="' + game.turn() + 'K"]').parentNode.classList.add('in-check')
            }
        }
    }

    function move() {
        var move = game.move(history[index])

        if(move){
            board.position(game.fen())
            remove_move_index()
            container.getElementsByClassName('move-' + index)[0].classList.add('active')
            lastmove = move
        } 
        if(index >= history.length - 1){
            clearInterval(clock)
            show_play()
        }
    }

    function move_seek(e) {
        if(!paused) paused = true
        show_play()
        e.target.classList.forEach((move) => {
            if(move.indexOf('move-') > -1){
                const index = parseInt(move.split('-')[1])
                seek(index)
            }
        })
    }

    function seek(pos) {
        remove_highlight()
        game.reset()
        history.forEach((move,i) => {
            if(i < pos){
              game.move(move)
            }
        })
        index = pos
        move(pos)
    }
}