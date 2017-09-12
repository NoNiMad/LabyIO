let Renderer = {
  tileSize: 80,
  mapOffset: 80 / 3 + 20
}

let UI = {}
let Game = {}

let socket, // Socket.IO client
    canvas, // Canvas element
    ctx,    // 2D context
    inName,
    message,
    players,
    gameInfo

function getInputValue(id) {
  return document.getElementById(id).value
}

function swapState (newState) {
  let states = document.getElementsByClassName('state')
  for (let i = 0; i < states.length; i++) {
    states[i].style.display = 'none'
  }
  document.getElementById(newState).style.display = 'block'
}

function changeTitles (docTitle, inPageTitle) {
  document.title = 'LabyIO - ' + docTitle
  message.innerHTML = inPageTitle
}

function onChangeName(e) {
  socket.emit('username', inName.value)
}

function onCreateLobby(e) {
  onChangeName()
  let rules = JSON.parse(JSON.stringify(defaultRules))
  rules.playerCount = +getInputValue('inPlayerCount')
  rules.goalsCount  = +getInputValue('inGoalsCount')
  rules.size        = +getInputValue('inSize')

  socket.emit('createLobby', rules)
}

function onJoinLobby(e) {
  onChangeName()
  socket.emit('joinLobby', { wantsDefaultRules: document.getElementById("inDefaultRules").checked })
}

function onLeaveLobby(e) {
  socket.emit('leaveLobby')
}

/**
 * Client module init
 */
function init() {
    loadSprites()

    socket = io({ upgrade: false, transports: ["websocket"] })

    players = document.getElementById('players')
    message = document.getElementById('message')
    inName = document.getElementById('inName')
    gameInfo = document.getElementById('gameInfo')

    document.getElementById('btnCreateLobby').addEventListener('click', onCreateLobby)
    document.getElementById('btnJoinLobby').addEventListener('click', onJoinLobby)
    document.getElementById('btnLeaveLobby').addEventListener('click', onLeaveLobby)
    document.getElementById('btnQuitGame').addEventListener('click', onLeaveLobby)

    canvas = document.getElementById('canvas')
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onMouseClick)
    ctx = canvas.getContext('2d')

    reset()
    bind()
}

window.addEventListener('load', init, false)