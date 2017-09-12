let SPAWN    = 0
let STRAIGHT = 1
let CORNER   = 2
let TRIPLE   = 3

let TOP    = 0
let LEFT   = 1
let BOTTOM = 2
let RIGHT  = 3

function rulesAreEquals (r1, r2) {
  if (r1.playerCount !== r2.playerCount
    || r1.size !== r2.size
    || r1.treasureCount !== r2.treasureCount
    || r1.pieces.length !== r2.pieces.length) {
    return false
  }

  for (let i = 0; i < r1.pieces.length; i++) {
    if (r1.pieces[i].type !== r2.pieces[i].type
      && r1.pieces[i].count !== r2.pieces[i].count) {
      return false
    }
  }

  return true
}

function rulesAreValid (rules) {
  if (rules.playerCount < 2 || rules.playerCount > 4) return 'player count'
  if (rules.goalsCount < 1 || rules.goalsCount > 6) return 'goals per player'
  if (rules.goalsCount * 4 > rules.size * rules.size - 4) return 'goals per player'
  if (rules.size % 2 !== 1 || rules.size < 3 || rules.size > 7) return 'size'

  return true
}

let defaultRules = {
  playerCount: 4,
  size: 7,
  pieces: [
    { type: STRAIGHT, count: 12 },
    { type: CORNER,   count: 16 },
    { type: TRIPLE,   count: 18 }
  ],
  goalsCount: 6
}

let playerColors = ['Red', 'Green', 'Blue', 'Yellow']