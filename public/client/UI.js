/**
 * Add game buttons
 */
function addGameButtons () {
  let offset = Renderer.mapOffset
  let ts = Renderer.tileSize
  for (let i = 1; i < Game.rules.size - 1; i += 2) {
    addButton({
      x: offset + i * ts + ts / 3, y: offset - ts / 3 - 10,
      background: '#FFFFFF', foreground: '#000000', font: '20px Calibri',
      width: ts / 3, height: ts / 3, text: '▼',
      callback: function() {
        handlePlay(TOP, i)
      }
    })
    addButton({
      x: offset - ts / 3 - 10, y: offset + i * ts + ts / 3,
      background: '#FFFFFF', foreground: '#000000', font: '20px Calibri',
      width: ts / 3, height: ts / 3, text: '▶',
      callback: function() {
        handlePlay(LEFT, i)
      }
    })
    addButton({
      x: offset + i * ts + ts / 3, y: offset + Game.rules.size * ts + 10,
      background: '#FFFFFF', foreground: '#000000', font: '20px Calibri',
      width: ts / 3, height: ts / 3, text: '▲',
      callback: function() {
        handlePlay(BOTTOM, i)
      }
    })
    addButton({
      x: offset + Game.rules.size * ts + 10, y: offset + i * ts + ts / 3,
      background: '#FFFFFF', foreground: '#000000', font: '20px Calibri',
      width: ts / 3, height: ts / 3, text: '◀',
      callback: function() {
        handlePlay(RIGHT, i)
      }
    })
  }

  addButton({
    x: ts * Game.rules.size + 3 * offset, y: offset + 3 * ts / 3 + ts / 4,
    width: ts, height: ts / 3, text: 'Rotate',
    callback: function() {
      socket.emit('rotateMovingPiece')
    }
  })
}

/**
 * Add a button with a listener
 * @param {object} params
 */
function addButton (params) {
  UI.buttons.push({
    x: params.x || 0, y: params.y || 0,
    width: params.width || 100, height: params.height || 30,
    text: params.text || '',
    font: params.font || (Renderer.tileSize / 5) + 'px Calibri',
    foreground: params.foreground || '#FFFFFF',
    background: params.background || '#000000',
    callback: params.callback || function() {}
  })
}

/**
 * Get relative mouse pos from event
 * @param {MouseEvent} event
 */
function getMousePos (event) {
    let rect = canvas.getBoundingClientRect()
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

/**
 * Canvas mouse clicks
 * @param {MouseEvent} event
 */
function onMouseClick (event) {
  let mouse = getMousePos(event)
  let btn = null

  if (mouse.x >= Renderer.mapOffset
   && mouse.x <= Renderer.mapOffset + Renderer.tileSize * Game.rules.size
   && mouse.y >= Renderer.mapOffset
   && mouse.y <= Renderer.mapOffset + Renderer.tileSize * Game.rules.size) {
    let tileClicked = {
      x: Math.floor((mouse.x - Renderer.mapOffset) / Renderer.tileSize),
      y: Math.floor((mouse.y - Renderer.mapOffset) / Renderer.tileSize)
    }

    socket.emit('movePlayer', tileClicked)
  } else {
    for(let i = 0; i < UI.buttons.length; i++) {
      btn = UI.buttons[i]
      if (mouse.x >= btn.x && mouse.x < btn.x + btn.width
       && mouse.y >= btn.y && mouse.y < btn.y + btn.height) {
        btn.callback()
      }
    }
  }
}

function onMouseMove (event) {
  let mouse = getMousePos(event)
  let btn = null
  let cursor = 'default'

  if (mouse.x >= Renderer.mapOffset
   && mouse.x <= Renderer.mapOffset + Renderer.tileSize * Game.rules.size
   && mouse.y >= Renderer.mapOffset
   && mouse.y <= Renderer.mapOffset + Renderer.tileSize * Game.rules.size
   && Game.pieceMoved) {
    cursor = 'pointer'
  } else {
    for(let i = 0; i < UI.buttons.length; i++) {
      btn = UI.buttons[i]
      if (mouse.x >= btn.x && mouse.x < btn.x + btn.width
       && mouse.y >= btn.y && mouse.y < btn.y + btn.height) {
        cursor = 'pointer'
      }
    }
  }

  canvas.style.cursor = cursor
}