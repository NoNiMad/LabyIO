let treasureSpritesheet = null
let playerSpritesheet   = null

function loadSprites () {
  treasureSpritesheet = loadSprite('/items.png')
  playerSpritesheet   = loadSprite('/players.png')
}

function loadSprite (path) {
  let sprite = new Image()
  sprite.src = path
  return sprite
}

/**
 * Get the right color for a player index
 * @param {int} player
 */
function getColorForPlayer(player) {
  switch (player) {
    case 0:
      return "#FF0000"
    case 1:
      return "#00AA00"
    case 2:
      return "#0000FF"
    case 3:
      return "#FFBB00"
  }
}

/**
 * Draw a piece at the specified pos
 * @param {CanvasRenderingContext2D} ctx
 * @param {int} x
 * @param {int} y
 * @param {Piece} piece
 */
function drawPiece(ctx, x, y, piece) {
  let ts = Renderer.tileSize
  ctx.save()
  ctx.translate(x + ts / 2, y + ts /2)

  ctx.fillStyle = '#CCCCCC'
  ctx.fillRect(-ts / 2, -ts / 2, ts, ts)
  ctx.fillStyle = '#372900'

  ctx.rotate(piece.rotation * Math.PI / 2)
  switch(piece.type) {
    case SPAWN:
    case CORNER:
      ctx.fillRect(-ts / 2, -ts / 2, ts,     ts / 3)
      ctx.fillRect(-ts / 2, -ts / 2, ts / 3, ts)
      ctx.fillRect( ts / 6,  ts / 6, ts / 3, ts / 3)
      break
    case STRAIGHT:
      ctx.fillRect(-ts / 2, -ts / 2, ts / 3, ts)
      ctx.fillRect( ts / 6, -ts / 2, ts / 3, ts)
      break
    case TRIPLE:
      ctx.fillRect(-ts / 2, -ts / 2, ts / 3, ts / 3)
      ctx.fillRect( ts / 6, -ts / 2, ts / 3, ts / 3)
      ctx.fillRect(-ts / 2,  ts / 6, ts,     ts / 3)
      break
  }
  ctx.rotate(-piece.rotation * Math.PI / 2)

  if (piece.type == SPAWN) {
    ctx.fillStyle = getColorForPlayer(piece.rotation)
    ctx.beginPath()
    ctx.arc(0, 0, ts / 8, 0, 2 * Math.PI)
    ctx.fill()
  }

  if (piece.treasure >= 0) {
    ctx.drawImage(treasureSpritesheet,
      piece.treasure * 16, 0,
      16, 16,
      -ts / 8, -ts / 8,
      ts / 4, ts / 4)
  }

  ctx.strokeStyle = "#FFFFFF"
  ctx.strokeRect(-ts / 2, -ts / 2, ts, ts)
  ctx.restore()
}

/**
 * Draw the map at the specified pos
 * @param {CanvasRenderingContext2D} ctx
 * @param {int} x
 * @param {int} y
 */
function drawMap(ctx, x, y) {
  for (let i = 0; i < Game.rules.size; i++) { // Lines
    for (let j = 0; j < Game.rules.size; j++) { // Columns
      drawPiece(ctx, x + i * Renderer.tileSize, y + j * Renderer.tileSize, Game.map[i][j])
    }
  }
}

/**
 * Draw the players on the map
 * @param {CanvasRenderingContext2D} ctx
 */
function drawPlayers(ctx) {
  let ts = Renderer.tileSize

  for (let i = 0; i < Game.playerPos.length; i++) {
    ctx.save()

    ctx.translate(Game.playerPos[i].x * ts + ts / 2 + Renderer.mapOffset,
      Game.playerPos[i].y * ts + ts / 2 + Renderer.mapOffset)
    ctx.translate((i % 2) * 2 * ts / 3, Math.floor(i / 2) * 2 * ts / 3)
    ctx.drawImage(playerSpritesheet,
      (i + 1) * 16, 0,
      16, 16,
      -ts / 2, -ts / 2,
      ts / 3, ts / 3)

    ctx.restore()
  }
}

/**
 * Draw the goals
 * @param {CanvasRenderingContext2D} ctx
 */
function drawGoals(ctx) {
  let ts = Renderer.tileSize
  ctx.save()
  ctx.translate(ts * Game.rules.size + 3 * Renderer.mapOffset,
    Renderer.mapOffset + 2 * ts)

  let notFoundGoals = Game.goals.filter(g => g.found === false)

  if (notFoundGoals.length === 0) {
    ctx.font = (ts / 5) + 'px Calibri'
    ctx.fillText('All goals found!', -12, 0)
    ctx.fillText('Go back to spawn!', -22, 20)
  } else {
    ctx.font = (ts / 5) + 'px Calibri'
    ctx.fillText('Your goals :', 0, 0)
    for (let i = 0; i < notFoundGoals.length; i++) {
      let x = (i % 3) * 3 * ts / 8
      let y = Math.floor(i / 3) * 3 * ts / 8 + ts / 5
      ctx.drawImage(treasureSpritesheet,
        notFoundGoals[i].id * 16, 0,
        16, 16,
        x, y,
        ts / 4, ts / 4)
    }
  }

  ctx.restore()
}

/**
 * Draw buttons
 * @param {CanvasRenderingContext2D} ctx
 */
function drawButtons(ctx) {
  ctx.save()
  let btn = null
  for (let i = 0; i < UI.buttons.length; i++) {
    btn = UI.buttons[i]
    ctx.font = btn.font
    ctx.fillStyle = btn.background
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height)
    ctx.fillStyle = btn.foreground
    ctx.fillText(btn.text,
      btn.x + btn.width / 2 - ctx.measureText(btn.text).width / 2,
      btn.y + btn.height / 2 + 5)
  }
  ctx.restore()
}

/**
 * Draw the game
 * @param {CanvasRenderingContext2D} ctx
 */
function renderGame(ctx) {
  let rect = canvas.getBoundingClientRect()
  ctx.clearRect(0, 0, rect.width, rect.height)

  drawMap(ctx, Renderer.mapOffset, Renderer.mapOffset)
  ctx.font = (Renderer.tileSize / 5) + 'px Calibri'
  ctx.fillText('Next piece :', Renderer.tileSize * Game.rules.size + 3 * Renderer.mapOffset,
    Renderer.mapOffset - 16 + 4)
  drawPiece(ctx, Renderer.tileSize * Game.rules.size + 3 * Renderer.mapOffset,
    Renderer.mapOffset, Game.movingPiece)
  drawGoals(ctx)
  drawPlayers(ctx)
  drawButtons(ctx)
}