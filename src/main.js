import diagram from './js/diagram'
import spinner from './views/spinner.html';

const supportedAPI = ['init', 'diagram']

function app(window) {
    //console.log('YouChess-Widget starting...')

    // set default configurations
    let configurations = {
        someDefaultConfiguration: false
    };

    // all methods that were called till now and stored in queue
    // needs to be called now 
    let globalObject = window[window['YouChess-Widget']];
    let queue = globalObject.q;
    if (queue) {
        for (var i = 0; i < queue.length; i++) {
            if (queue[i][0].toLowerCase() == 'init') {
                configurations = extendObject(configurations, queue[i][1]);
                //console.log('JS-Widget started', configurations);
            }
            else
                apiHandler(queue[i][0], queue[i][1]);
        }
    }

    // override temporary (until the app loaded) handler
    // for widget's API calls
    globalObject = apiHandler;
    globalObject.configurations = configurations;

    lookForBoards()
}

/**
    Method that handles all API calls
    */


function apiHandler(api, params) {
    if (!api) throw Error('API method required');
    api = api.toLowerCase();

    if (supportedAPI.indexOf(api) === -1) throw Error(`Method ${api} is not supported`);

    //console.log(`Handling API call ${api}`, params);

    switch (api) {
        // TODO: add API implementation
        case 'diagram':
            diagram(params);
            break;
        default:
            console.warn(`No handler defined for ${api}`);
    }
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function lookForBoards() {
    document.querySelectorAll('.board-container').forEach((board,i) => {
        const id = uuidv4()
        board.setAttribute('id',id)
        board.innerHTML = spinner
        setTimeout(() => {
            const b = diagram({
                id: id,
                event: board.getAttribute('diagram-event'),
                site: board.getAttribute('diagram-site'),
                date: board.getAttribute('diagram-date'),
                white: board.getAttribute('diagram-white'),
                black: board.getAttribute('diagram-black'),
                whiteelo: board.getAttribute('diagram-whiteelo'),
                blackelo: board.getAttribute('diagram-blackelo'),
                pgn: board.getAttribute('diagram-pgn'),
                result: board.getAttribute('diagram-result'),
                orientation: board.getAttribute('diagram-orientation'),
                whitesquare: board.getAttribute('diagram-whitesquare'),
                blacksquare: board.getAttribute('diagram-blacksquare'),
                pieces: board.getAttribute('diagram-pieces'),
                interval: board.getAttribute('diagram-interval'),
                speed: board.getAttribute('diagram-speed'),
                pieces: board.getAttribute('diagram-pieces'),
                lang: board.getAttribute('diagram-lang')
            })
        },i*1000 + 1000)
    })
}

function extendObject(a, b) {
    for (var key in b)
        if (b.hasOwnProperty(key))
            a[key] = b[key];
    return a;
}

app(window);