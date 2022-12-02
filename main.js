// game screen
let canvas = document.querySelector('#canvas')
let ctx = canvas.getContext('2d')

// selected HTML elems
let replayGameBtn = document.querySelector('.replay-game-btn')
let timerElem = document.querySelector('.game-timer-val')

// time / interval management
const interval = setInterval(draw, 10)
let startingGameTime = 90
const ballSpeed = 8

// GAME BOARD CONSTRUCTION VARS ==================================

// cords to be passed to draw shape with
let x = canvas.width / 2;
let y = canvas.height - 30;


// used to make collision detection easier
let ballRadius = 6

// vars that represent Δx / Δy)
let dx = 2;
let dy = -2; 

// users paddle
const paddleHeight = 8;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

// bricks
let brickRowCount = 3;
let brickColumnCount = 5;
let brickWidth = 40;
let brickHeight = 8;
let brickPadding = 10;
let brickOffsetTop = 20;
let brickOffsetLeft = 30;
let bricks = []

// creates empty data structure to hold the generated cords of our bricks
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// GAME TIMER =================================================== 

function handleTimerCalcAndUpdate() {
  if (canvas.style.display !== 'none') {
    startingGameTime -= 1
    timerElem.textContent = startingGameTime
  }
}

function runTimer() {
  setInterval(handleTimerCalcAndUpdate, 1000)
}

// ROUND SCORE TRACKING ==========================================
// WORKS:

let score = 0;
let gameStartBtn = document.querySelector('.start-game-btn')


function updateScore() {
  score += 5
  let scoreElem = document.querySelector('.current-score-val')
  scoreElem.textContent = score

}

function calculateTimerScoreBonus() {
  let currentTime = document.querySelector('.current-score-val').textContent
  currentTime = Number.parseInt(currentTime)
  let remainingTime = startingGameTime - currentTime
  let secondBonus = remainingTime * 3
  return secondBonus
}

function addTimerBonusToScore() {
  let secondBonus = calculateTimerScoreBonus()
  score += secondBonus
}

// HIGH SCORE ====================================================
// WORKS:

function handleHighScore() {
  // highscore local storage key: highScore
  // IMPORTANT: must convert returned result from string to obj 
  let stringifiedHighScore = getHighScoreFromLocal()
  let highScoreObj = JSON.parse(stringifiedHighScore)
  // console.log(highScoreObj)
  if (score > highScoreObj.score) {
    // player has made a new high score
    let playerInitials = getPlayerInitials()
    // launch prompt to accept player initials
    saveCurrentHighScoreToLocal(playerInitials, score)
    // save initials and score (func)
  }
}

function getPlayerInitials() {
  let initials = prompt('enter initals [3 character max]')
  let intialsSet = false;
  while (intialsSet === false) {
    if (initials.length <= 3) {
      intialsSet = true
      return initials 
    }
    else {
      alert('intials must be 3 characters or less ...')
      initials = prompt('enter initals [3 character max]')
    }
  }
}

function saveCurrentHighScoreToLocal(initials, score) {
  // save high score to local storage
  let scoreEntry = JSON.stringify({initials: initials, score: score})
  localStorage.setItem('highScore', scoreEntry)
}

function clearHighScore() {
  localStorage.clear()
}

// POSSIBLE REPLACEMENT FOR HANDLEHIGHSCORES()
function getHighScoreFromLocal() {
  // retrieve high score from local storage
  let highscore = localStorage.getItem('highScore')
  return highscore
}

function checkForHighScore(playerIntials, currentScore) {
  let highScores = localStorage.getItem('highScores')
  let highScoresObj = JSON.parse(highScores)
  
  for (let i = 0; i < highScoresObj.length; i++) {
    if (currentScore > highScoresObj[i].score) {
      highScoresObj[i].intials = playerIntials
      highScoresObj[i].score = currentScore
      break
    }
    else {
      continue
    }
  }
  saveCurrentHighScoreToLocal(playerIntials, currentScore)
}

// MANAGING GAME STATE ===========================================
// WORKS:

function handleSplashScreen() {
  let splashPage = document.querySelector('#splash-page')
  splashPage.style.display = 'none'
  canvas.style.display = 'block'
}

function handleGameOverScreen() {
  let gameEndScreen = document.querySelector('#game-end-screen')
  // disable the game screen
  canvas.style.display = 'none'
  // enable the end game screen
  gameEndScreen.style.display = 'flex'
}

function renderHighScoresForGameOverScreen() {
  let scoreVal = getHighScoreFromLocal()
  scoreVal = JSON.parse(scoreVal)
  let intialScoreVal = document.querySelector('.high-score-intials')
  intialScoreVal.textContent = scoreVal.initials

  let scoreValTag = document.querySelector('.high-score-val')
  scoreValTag.textContent = scoreVal.score
}

function handleGameOver() {
  clearInterval(handleTimerCalcAndUpdate)
  handleAudio('gameOverAudio')
  addTimerBonusToScore()
  handleHighScore()
  setTimeout(() => {
    // timeout is so the audio has a chance to finish before the reload..
    renderHighScoresForGameOverScreen()
    clearRoundValues() // clear round score
    handleGameOverScreen() // hide canvas, show game end screen
  }, 3000)
  clearInterval(interval); // Needed for Chrome to end game
}

function clearRoundValues() {
  score = 0;
}

// COLLISIONS ====================================================
// WORKS:

function handleWallCollision() {
  // if the ball goes past the left or right edge it should bounce
  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
    dx = -dx;
  }

  else if (y + dy < ballRadius) {
    // top rail bounce
      dy = -dy;
  }

  else if(y + dy > canvas.height-ballRadius) {
    // bottom rail bounce ..
    handleBottomRailOutcome()
  }
}

function handleBottomRailOutcome() {
  if(x > paddleX && x < paddleX + paddleWidth) {
    // paddle hit, reverse ball direction, play audio
    handleAudio('paddleBounce')
    dy = -dy;
  }
  else {
    handleGameOver()
  }
}

function handleBrickCollision() {
  for (var c = 0; c < brickColumnCount; c++) {
      for (var r = 0; r < brickRowCount; r++) {
          var b = bricks[c][r];
          if (b.status == 1) {
              if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                  handleAudio('brickCrumble')
                  dy = -dy;
                  b.status = 0; // change status so block is not redrawn on next screen redraw
                  updateScore()
              }
          }
      }
  }
}

// MOVEMENT ======================================================
// WORKS:

// key presses
let rightPressed = false;
let leftPressed = false;

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a") {
    leftPressed = false;
  }
}

function handlePaddleMovement() {
  if (rightPressed === true) {
    paddleX = Math.min(paddleX + ballSpeed, canvas.width - paddleWidth);
  }
  
  if (leftPressed === true) {
    paddleX = Math.max(paddleX - ballSpeed, 0);
  }
}


// CANVAS =======================================================
WORKS:

function draw() {
  // clear previous drawings (frame rate)
  if (canvas.style.display === 'block') {
    // if canvas is set to block then start btn has been clicked
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks()
    drawCircleGamePiece(x, y)
    drawPaddle()
    // move ball by incrementing the x/y cords used to draw the circle
    x += dx
    y += dy

    handleWallCollision()
    handlePaddleMovement()
    handleBrickCollision()

  }
}

function drawCircleGamePiece(x, y) {
  // draws the circle
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2, false);
  ctx.fillStyle = "blue";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (var c = 0; c < brickColumnCount; c++) {
      for (var r = 0; r < brickRowCount; r++) {
        // if brick has status of 1 it hasnt been hit and should be drawn
          if (bricks[c][r].status == 1) {
              var brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
              var brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
              bricks[c][r].x = brickX;
              bricks[c][r].y = brickY;
              ctx.beginPath();
              ctx.rect(brickX, brickY, brickWidth, brickHeight);
              ctx.fillStyle = "#292E1E";
              ctx.fill();
              ctx.closePath();
          }
      }
  }
}


function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

// AUDIO ========================================================
WORKS:

function handleAudio(audioEventType) {
  // all audio for the game can be used through this function, simply pass in a string matching the audio event to handle
  switch(audioEventType) {
    case 'paddleBounce':
      let audio1 = document.querySelector('.paddleHitAudio')
      audio1.currentTime = 0 // restarts so there isnt a delay
      audio1.play()
      break
    
    case 'brickCrumble':
      let audio2 = document.querySelector('.brickCrumbleAudio')
      audio2.currentTime = 0
      audio2.play()
      break
    
    case 'gameStartAudio':
      let audio3 = document.querySelector('.gameStartAudio')
      audio3.currentTime = 0
      audio3.play()
      break
    
    case 'gameOverAudio':
      let audio4 = document.querySelector('.gameOverAudio')
      audio4.currentTime = 0
      audio4.play()
      break
  }
}

// GAME EXE ====================================================
WORKS:

function runGame() {
  if (bricks.length > 0) {
    draw()
    handleWallCollision()
    handlePaddleMovement()
    handleBrickCollision()
  }
  else {
    // player has beat game, start end game sequence
    handleGameOver()
  }
}


// EVENTS & EXE ================================================

// tracks movement
document.addEventListener('keydown', keyDownHandler, false)
document.addEventListener('keyup', keyUpHandler, false)

// deals with game start
window.addEventListener('load', (e) => {
  gameStartBtn.addEventListener('click', (e) => {
    // handles the switch from the splash screen and enables the canvas visibility
    runTimer()
    setTimeout(handleSplashScreen, 1500)
  })  
})

// deals with game end
replayGameBtn.addEventListener('click', (e) => {
  window.location.reload() // works, but isn't ideal     
})

// handles bulk of game
runGame()



// ORIGINAL CODE SNIPPETS [DEL AS YOU GO]

// function draw() {
//   // clear previous drawings (frame rate)
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   drawBricks()
//   drawCircleGamePiece(x, y)
//   drawPaddle()
//   // move ball by incrementing the x/y cords used to draw the circle
//   x += dx
//   y += dy

//   handleWallCollision()
//   handlePaddleMovement()
//   handleBrickCollision()
// }