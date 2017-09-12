/**
 * Generate Map
 * @param {Object} rules
 */
let generateMap = function (rules) {
  let mSize = rules.size
  let stocks = JSON.parse(JSON.stringify(rules.pieces))
  let map = []

  for (let i = 0; i < mSize; i++) { // Columns
    map[i] = []
    for (let j = 0; j < mSize; j++) { // Lines
      if((i == 0 || i == mSize - 1) && (j == 0 || j == mSize - 1)) { continue }

      let pieceID = Math.floor(Math.random() * stocks.length)
      while(stocks[pieceID].count == 0) {
        stocks.splice(pieceID, 1)
        pieceID = Math.floor(Math.random() * stocks.length)
      }

      stocks[pieceID].count--
      map[i][j] = {
        type: stocks[pieceID].type,
        rotation: Math.floor(Math.random() * 4),
        treasure: -1
      }
    }
  }

  let playerPos = []
  map[0][0] = { type: SPAWN, rotation: 0, treasure: -1, players: [0] }
  map[mSize - 1][0] = { type: SPAWN, rotation: 1, treasure: -1, players: [1] }
  playerPos.push({ x: 0, y: 0 })
  playerPos.push({ x: mSize - 1, y: 0 })
  if (rules.playerCount >= 3) {
    map[mSize - 1][mSize - 1] = { type: SPAWN, rotation: 2, treasure: -1, players: [2] }
    playerPos.push({ x: mSize - 1, y: mSize - 1 })

    if (rules.playerCount === 4) {
      map[0][mSize - 1] = { type: SPAWN, rotation: 3, treasure: -1, players: [3] }
      playerPos.push({ x: 0, y: mSize - 1 })
    } else {
      map[0][mSize - 1] = { type: CORNER, rotation: 3, treasure: -1 }
    }
  } else {
    map[mSize - 1][mSize - 1] = { type: CORNER, rotation: 2, treasure: -1 }
    map[0][mSize - 1] = { type: CORNER, rotation: 3, treasure: -1 }
  }


  let treasureCount = 4 * rules.goalsCount
  let treasures = []
  while (treasureCount > 0) {
    let i = Math.floor(Math.random() * mSize),
        j = Math.floor(Math.random() * mSize)

    if(map[i][j].type != SPAWN && map[i][j].treasure < 0) {
      treasureCount--
      map[i][j].treasure = treasureCount
      treasures.push(treasureCount)
    }
  }

  let playerGoals = []
  for (let i = 0; i < rules.playerCount; i++) {
    playerGoals[i] = []
    for (let j = 0; j < rules.goalsCount; j++) {
      let tId = Math.floor(Math.random() * treasures.length)
      playerGoals[i].push({
        id: treasures[tId],
        found: false
      })
      treasures.splice(tId, 1)
    }
  }

  let movingPiece = { type: stocks[0].type, rotation: 0, treasure: -1 }
  return {
    map: map,
    movingPiece: movingPiece,
    playerPos: playerPos,
    playerGoals: playerGoals
  }
}

// -- USERS -- //

/**
 * User session class
 * @param {Socket} socket
 */
function User(socket) {
  this.name = "Guest" + socket.id.substr(0, 4)
	this.socket = socket
  this.game = null
}

// -- GAMES -- //

let activeGames = []
let pendingGames = []

/**
 * Game class
 * @param {Rules} rules
 * @param {User} user
 */
function Game(rules, user) {
  this.rules = rules
  this.players = [user]
  this.map = null
}

/**
 * Emit something to all players
 * @param {string} channel
 * @param {object} payload
 */
Game.prototype.emit = function (channel, payload) {
  for (let i = 0; i < this.players.length; i++) {
    this.players[i].socket.emit(channel, payload)
  }
}

/**
 * Start new game
 */
Game.prototype.start = function () {
  pendingGames.splice(pendingGames.indexOf(this), 1)
  activeGames.push(this)

  let result = generateMap(this.rules)
  this.map = result.map
  this.movingPiece = result.movingPiece
  this.playerPos = result.playerPos
  this.playerGoals = result.playerGoals
  this.pieceMoved = false
  this.currentPlayer = -1
  this.lastMove = null

  this.emit('gameStart', {
    map: this.map,
    movingPiece: this.movingPiece,
    playerPos: this.playerPos
  })

  for (let i = 0; i < this.players.length; i++) {
    this.players[i].socket.emit('goalsUpdate', this.playerGoals[i])
  }
  this.newTurn()
}

/**
 * Send message to players to tell who have to play
 */
Game.prototype.newTurn = function () {
  this.currentPlayer++
  if (this.currentPlayer >= this.rules.playerCount) {
    this.currentPlayer = 0
  }

  this.pieceMoved = false
  this.emit('newTurn', this.currentPlayer)
}

/**
 * Play a move if the user playing is the one who should
 * @param {User} user
 * @param {object} move
 */
Game.prototype.movePiece = function (user, move) {
  if (this.players[this.currentPlayer] !== user || this.pieceMoved || move.index % 2 == 0) {
    return
  }

  if (this.lastMove !== null
    && move.side % 2 === this.lastMove.side % 2
    && move.side !== this.lastMove.side
    && move.index === this.lastMove.index) {
    user.socket.emit('alert', 'You can\'t reverse the last player\'s move!')
    return
  }

  this.lastMove = move
  let newMovingPiece = {}

  switch (move.side) {
    case TOP:
      newMovingPiece = this.map[move.index][this.rules.size - 1]
      for (let i = this.rules.size - 1; i > 0; i--) {
        this.map[move.index][i] = this.map[move.index][i-1]
      }
      this.map[move.index][0] = this.movingPiece
      this.movingPiece = newMovingPiece

      for (let i = 0; i < this.players.length; i++) {
        if (this.playerPos[i].x === move.index) {
          this.playerPos[i].y++
          if (this.playerPos[i].y >= this.rules.size) {
            this.playerPos[i].y = 0
          }
        }
      }
      break
    case LEFT:
      newMovingPiece = this.map[this.rules.size - 1][move.index]
      for (let i = this.rules.size - 1; i > 0; i--) {
        this.map[i][move.index] = this.map[i-1][move.index]
      }
      this.map[0][move.index] = this.movingPiece
      this.movingPiece = newMovingPiece

      for (let i = 0; i < this.players.length; i++) {
        if (this.playerPos[i].y === move.index) {
          this.playerPos[i].x++
          if (this.playerPos[i].x >= this.rules.size) {
            this.playerPos[i].x = 0
          }
        }
      }
      break
    case BOTTOM:
      newMovingPiece = this.map[move.index][0]
      for (let i = 0; i < this.rules.size - 1; i++) {
        this.map[move.index][i] = this.map[move.index][i+1]
      }
      this.map[move.index][this.rules.size - 1] = this.movingPiece
      this.movingPiece = newMovingPiece

      for (let i = 0; i < this.players.length; i++) {
        if (this.playerPos[i].x === move.index) {
          this.playerPos[i].y--
          if (this.playerPos[i].y < 0) {
            this.playerPos[i].y = this.rules.size - 1
          }
        }
      }
      break
    case RIGHT:
      newMovingPiece = this.map[0][move.index]
      for (let i = 0; i < this.rules.size - 1; i++) {
        this.map[i][move.index] = this.map[i+1][move.index]
      }
      this.map[this.rules.size - 1][move.index] = this.movingPiece
      this.movingPiece = newMovingPiece

      for (let i = 0; i < this.players.length; i++) {
        if (this.playerPos[i].y === move.index) {
          this.playerPos[i].x--
          if (this.playerPos[i].x < 0) {
            this.playerPos[i].x = this.rules.size - 1
          }
        }
      }
      break
  }

  this.emit('mapUpdate', { map: this.map, movingPiece: this.movingPiece })
  this.emit('playerPosUpdate', this.playerPos)
  this.pieceMoved = true
}

function hasTopGap(piece) {
  switch (piece.type) {
    case SPAWN:
    case CORNER:
      return piece.rotation >= 2
    case STRAIGHT:
      return piece.rotation % 2 === 0
    case TRIPLE:
      return piece.rotation !== 2
  }
}
function hasBottomGap(piece) {
  switch (piece.type) {
    case SPAWN:
    case CORNER:
      return piece.rotation < 2
    case STRAIGHT:
      return piece.rotation % 2 === 0
    case TRIPLE:
      return piece.rotation !== 0
  }
}
function hasLeftGap(piece) {
  switch (piece.type) {
    case SPAWN:
    case CORNER:
      return piece.rotation % 3 !== 0
    case STRAIGHT:
      return piece.rotation % 2 === 1
    case TRIPLE:
      return piece.rotation !== 1
  }
}
function hasRightGap(piece) {
  switch (piece.type) {
    case SPAWN:
    case CORNER:
      return piece.rotation % 3 === 0
    case STRAIGHT:
      return piece.rotation % 2 === 1
    case TRIPLE:
      return piece.rotation !== 3
  }
}

Game.prototype.canMove = function (from, to) {
  if (from.x < 0 || from.x >= this.rules.size
   || from.y < 0 || from.y >= this.rules.size
   || to.x < 0 || to.x >= this.rules.size
   || to.y < 0 || to.y >= this.rules.size) {
     return false
   }

  if (from.y < to.y) {
    return hasBottomGap(this.map[from.x][from.y])
        && hasTopGap   (this.map[to.x][to.y])
  }
  if (from.y > to.y) {
    return hasTopGap   (this.map[from.x][from.y])
        && hasBottomGap(this.map[to.x][to.y])
  }
  if (from.x < to.x) {
    return hasRightGap(this.map[from.x][from.y])
        && hasLeftGap (this.map[to.x][to.y])
  }
  if (from.x > to.x) {
    return hasLeftGap (this.map[from.x][from.y])
        && hasRightGap(this.map[to.x][to.y])
  }
}

/**
 * Determine if there's a path between the two pos
 * @param {Pos2D} from
 * @param {Pos2D} to
 * @param {Array} explored
 */
Game.prototype.canMovePath = function (from, to, explored) {
  if (from.x === to.x && from.y === to.y) {
    return true
  }

  if (explored.indexOf(from.x + ':' + from.y) > -1) {
    return false
  }

  explored.push(from.x + ':' + from.y)
  if (this.canMove(from, { x: from.x - 1, y: from.y })) {
    if (this.canMovePath({ x: from.x - 1, y: from.y }, to, explored)) {
      return true
    }
  }
  if (this.canMove(from, { x: from.x + 1, y: from.y })) {
    if (this.canMovePath({ x: from.x + 1, y: from.y }, to, explored)) {
      return true
    }
  }
  if (this.canMove(from, { x: from.x, y: from.y - 1 })) {
    if (this.canMovePath({ x: from.x, y: from.y - 1 }, to, explored)) {
      return true
    }
  }
  if (this.canMove(from, { x: from.x, y: from.y + 1 })) {
    if (this.canMovePath({ x: from.x, y: from.y + 1 }, to, explored)) {
      return true
    }
  }

  return false
}

/**
 * When a user try to move, check if it's his turn
 * and he used his piece then move him if possible
 * @param {User} user
 * @param {Pos2D} newPos
 */
Game.prototype.movePlayer = function (user, newPos) {
  if (this.players[this.currentPlayer] !== user || !this.pieceMoved) {
    return
  }

  let id = this.players.indexOf(user)
  if (this.canMovePath(this.playerPos[id], newPos, [])) {
    this.playerPos[id] = newPos
    let tId = this.playerGoals[id].findIndex(goal => goal.id === this.map[newPos.x][newPos.y].treasure)
    if (tId > -1) {
      this.playerGoals[id][tId].found = true
      user.socket.emit('goalsUpdate', this.playerGoals[id])

      this.map[newPos.x][newPos.y].treasure = -1
      this.emit('mapUpdate', { map: this.map, movingPiece: this.movingPiece })
    }

    if (this.map[newPos.x][newPos.y].type === SPAWN
     && this.map[newPos.x][newPos.y].rotation === id
     && this.playerGoals[id].filter(goal => goal.found === false).length === 0) {
      this.emit('playerPosUpdate', this.playerPos)
      for (let i = 0; i < this.players.length; i++) {
        if (i === id) {
          this.players[i].socket.emit('playerWon', id)
        } else {
          this.players[i].socket.emit('playerLoose', id)
        }
        this.players[i].game = null
      }
      activeGames.splice(activeGames.indexOf(this), 1)
    } else {
      this.emit('playerPosUpdate', this.playerPos)
      this.newTurn()
    }
  } else {
    user.socket.emit('alert', 'There is no path to this destination!')
  }
}

/**
 * When a user try to rotate the piece, check if it's his turn then rotate
 * @param {User} user
 */
Game.prototype.rotateMovingPiece = function (user) {
  if (this.players[this.currentPlayer] !== user || this.pieceMoved) {
    return
  }

  this.movingPiece.rotation++
  if (this.movingPiece.rotation > 3) {
    this.movingPiece.rotation = 0
  }
  this.emit('movingPieceUpdate', this.movingPiece)
}

/**
 * When a user try to rotate the piece, check if it's his turn then rotate
 * @param {User} user
 */
Game.prototype.handleLeave = function (user) {
  // Game has started
  if (this.map !== null) {
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].socket.emit('returnHome')
      this.players[i].game = null
    }
    activeGames.splice(activeGames.indexOf(this), 1)
  } else {
    user.socket.emit('returnHome')
    user.game = null
    if (this.players.length === 1) {
      pendingGames.splice(pendingGames.indexOf(this), 1)
    } else {
      let index = this.players.indexOf(user)
      this.players.splice(index, 1)
      this.emit('playerLeave', index)
    }
  }
}

/**
 * Find opponent for a user
 * @param {User} user
 * @param {SearchSettings} settings
 */
function findGame(user, settings) {
  let gameFound = null
	for (let i = 0; i < pendingGames.length; i++) {
    if (settings.wantsDefaultRules) {
      if (rulesAreEquals(pendingGames[i].rules, defaultRules)) {
        gameFound = pendingGames[i]
        break
      }
    } else {
      gameFound = pendingGames[i]
      break
    }
	}

  if (gameFound === null) {
    user.socket.emit('alert', "No game is available matching your criteria. Try creating one instead!")
  } else {
    user.game = gameFound
    gameFound.players.push(user)
    user.socket.emit('gameFound', gameFound.rules)
    for (let i = 0; i < gameFound.players.length - 1; i++) {
      gameFound.players[i].socket.emit('playerJoin', user.name)
      user.socket.emit('playerJoin', gameFound.players[i].name)
    }
    user.socket.emit('playerJoin', user.name)

    if (gameFound.players.length == gameFound.rules.playerCount) {
      gameFound.start()
    }
  }
}

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = function (socket) {
	let user = new User(socket)

  // -- GENERAL EVENTS -- //
  socket.on('disconnect', function () {
    if (user.game !== null) {
      user.game.handleLeave(user)
    }
  });

  // -- PREPARING A GAME -- //
  socket.emit('username', user.name)
  socket.on('username', function (name) {
    user.name = name.trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
    socket.emit('username', user.name)
  })

  socket.on('createLobby', function (rules) {
    if (user.game !== null) return

    let validity = rulesAreValid(rules)
    if (validity !== true) {
      socket.emit('alert', 'Invalid ' + validity + '!')
      return
    }
    user.game = new Game(rules, user)
    pendingGames.push(user.game)
    socket.emit('gameFound', rules)
    socket.emit('playerJoin', user.name)
  })

  socket.on('joinLobby', function (settings) {
    if (user.game !== null) return
    findGame(user, settings)
  })

  socket.on('leaveLobby', function () {
    if (user.game === null) return
    user.game.handleLeave(user)
  })

  // -- PLAYING A GAME -- //
	socket.on('movePiece', function (move) {
    if (user.game === null) return
    user.game.movePiece(user, move)
	})

  socket.on('movePlayer', function (move) {
    if (user.game === null) return
    user.game.movePlayer(user, move)
  })

  socket.on('rotateMovingPiece', function () {
    if (user.game === null) return
    user.game.rotateMovingPiece(user)
  })

	console.log('Connected: ' + socket.id);
};