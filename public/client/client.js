/**
 * Handle a click on a button meant to play
 * @param {int} side
 * @param {int} index
 */
function handlePlay(side, index) {
  socket.emit('movePiece', { side: side, index: index })
}

function reset() {
  UI = {
    buttons: []
  }

  Game = {
    rules: {},
    players: [],
    playerPos: [],
    map: [],
    movingPiece: {},
    goals: [],
    pieceMoved: false
  }

  swapState('stCreate')
  changeTitles('Welcome', 'Welcome to LabyIO!')
}

/**
 * Bind Socket.IO and button events
 */
function bind() {
  // -- GENERAL EVENTS -- //
  socket.on("connect", function () {
    reset()
  })
  socket.on("disconnect", function () {
    changeTitles('Connecting...', 'Connection lost.')
  })
  socket.on("error", function () {
    changeTitles('Error', 'Connection error.')
  })

  socket.on('alert', function (msg) {
    alert(msg)
  })

  socket.on('message', function (msg) {
    document.title = msg.title
    message.innerHTML = msg.text
  })

  socket.on('username', function (name) {
    inName.value = name
  })

  // -- PREPARING A GAME -- //
  socket.on('gameFound', function (rules) {
    swapState('stWaiting')
    players.innerHTML = ''
    Game.rules = rules
  })

  socket.on('playerJoin', function (name) {
    Game.players.push(name)
    players.innerHTML += '<li>' + name + '</li>'

    let waitState = (Game.rules.playerCount - Game.players.length)
      + '/' + Game.rules.playerCount
    changeTitles('Waiting ' + waitState, 'Waiting for ' + waitState + ' players...')
  })

  socket.on('playerLeave', function (index) {
    Game.players.splice(index, 1)
    players.innerHTML = ''
    for (let i = 0; i < Game.players.length; i++) {
      players.innerHTML += '<li>' + Game.players[i] + '</li>'
    }

    let waitState = (Game.rules.playerCount - Game.players.length)
      + '/' + Game.rules.playerCount
    changeTitles('Waiting ' + waitState, 'Waiting for ' + waitState + ' players...')
  })

  socket.on('gameStart', function (game) {
    Game.map = game.map
    Game.movingPiece = game.movingPiece
    Game.playerPos = game.playerPos

    swapState('stGame')

    gameInfo.innerHTML = ''
    for (let i = 0; i < Game.players.length; i++) {
      let span = '<span class="tag" style="background-color: ' + getColorForPlayer(i) + ';">'
      if (Game.players[i] === inName.value) {
        span += 'You!'
      } else {
        span += Game.players[i]
      }
      span += '</span>'
      gameInfo.innerHTML += span
    }

    addGameButtons()
    renderGame(ctx)
  })

  socket.on('returnHome', function () {
    reset()
  })

  // -- PLAYING A GAME -- //
  socket.on('playerWon', function (id) {
    swapState('stWin')
    changeTitles('You won!', 'Congratulations! You won!')
  })

  socket.on('playerLoose', function (id) {
    swapState('stWin')
    changeTitles('You lost!', 'Looks like you lost the game :(<br>'
      + '<span style="color: ' + getColorForPlayer(id) + ';">'
      + Game.players[id] + '</span> won!')
  })

  socket.on('newTurn', function (player) {
    Game.pieceMoved = false

    if (Game.players[player] === inName.value) {
      changeTitles('Your turn!', 'It\'s <span style="color: ' + getColorForPlayer(player) + ';">your</span> turn!')
    } else {
      changeTitles(Game.players[player] + ' turn',
        'It\'s ' + '<span style="color: ' + getColorForPlayer(player)
        + ';">' + Game.players[player] + '</span> turn!')
    }
  })

  socket.on('goalsUpdate', function (goals) {
    Game.goals = goals
    renderGame(ctx)
  })

  socket.on('mapUpdate', function (update) {
    Game.pieceMoved = true

    Game.map = update.map
    Game.movingPiece = update.movingPiece
    renderGame(ctx)
  })

  socket.on('movingPieceUpdate', function (movingPiece) {
    Game.movingPiece = movingPiece
    renderGame(ctx)
  })

  socket.on('playerPosUpdate', function (playerPos) {
    Game.playerPos = playerPos
    renderGame(ctx)
  })
}
