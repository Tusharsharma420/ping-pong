const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const BASE_WIDTH = 960;
const BASE_HEIGHT = 540;
const WIN_SCORE = 7;
const PADDLE_W = 18;
const PADDLE_H = 116;
const BALL_R = 10;

const keys = new Set();
const pointer = { active: false, y: BASE_HEIGHT / 2 };

const state = {
  mode: "menu",
  playerScore: 0,
  cpuScore: 0,
  message: "Press Space to serve",
  player: { x: 54, y: BASE_HEIGHT / 2 - PADDLE_H / 2, vy: 0 },
  cpu: { x: BASE_WIDTH - 54 - PADDLE_W, y: BASE_HEIGHT / 2 - PADDLE_H / 2, vy: 0 },
  ball: { x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, vx: 0, vy: 0, speed: 430 },
  lastTime: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
  const angle = (Math.random() * 0.7 - 0.35);
  state.ball.x = BASE_WIDTH / 2;
  state.ball.y = BASE_HEIGHT / 2;
  state.ball.speed = 430;
  state.ball.vx = Math.cos(angle) * state.ball.speed * direction;
  state.ball.vy = Math.sin(angle) * state.ball.speed;
}

function resetMatch() {
  state.playerScore = 0;
  state.cpuScore = 0;
  state.player.y = BASE_HEIGHT / 2 - PADDLE_H / 2;
  state.cpu.y = BASE_HEIGHT / 2 - PADDLE_H / 2;
  state.mode = "menu";
  state.message = "Press Space to serve";
  state.ball.x = BASE_WIDTH / 2;
  state.ball.y = BASE_HEIGHT / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
}

function serve() {
  if (state.mode === "menu" || state.mode === "point") {
    state.mode = "playing";
    state.message = "";
    resetBall(state.cpuScore > state.playerScore ? 1 : -1);
  }
}

function endPoint(winner) {
  if (winner === "player") {
    state.playerScore += 1;
  } else {
    state.cpuScore += 1;
  }

  if (state.playerScore >= WIN_SCORE || state.cpuScore >= WIN_SCORE) {
    state.mode = "gameover";
    state.message = state.playerScore > state.cpuScore ? "You win. Press R to play again." : "CPU wins. Press R to play again.";
    state.ball.vx = 0;
    state.ball.vy = 0;
    return;
  }

  state.mode = "point";
  state.message = winner === "player" ? "Point to you. Press Space." : "Point to CPU. Press Space.";
  state.ball.x = BASE_WIDTH / 2;
  state.ball.y = BASE_HEIGHT / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
}

function updatePlayer(dt) {
  const keyboardMove = (keys.has("arrowdown") || keys.has("s") ? 1 : 0) - (keys.has("arrowup") || keys.has("w") ? 1 : 0);
  if (pointer.active) {
    const target = pointer.y - PADDLE_H / 2;
    state.player.vy = clamp((target - state.player.y) * 12, -620, 620);
  } else {
    state.player.vy = keyboardMove * 570;
  }
  state.player.y = clamp(state.player.y + state.player.vy * dt, 20, BASE_HEIGHT - PADDLE_H - 20);
}

function updateCpu(dt) {
  const target = state.ball.y - PADDLE_H / 2;
  const difficulty = 4.2 + Math.min(2.6, (state.playerScore + state.cpuScore) * 0.25);
  state.cpu.vy = clamp((target - state.cpu.y) * difficulty, -480, 480);
  state.cpu.y = clamp(state.cpu.y + state.cpu.vy * dt, 20, BASE_HEIGHT - PADDLE_H - 20);
}

function bounceFromPaddle(paddle, direction) {
  const paddleCenter = paddle.y + PADDLE_H / 2;
  const offset = clamp((state.ball.y - paddleCenter) / (PADDLE_H / 2), -1, 1);
  state.ball.speed = Math.min(740, state.ball.speed + 28);
  state.ball.vx = direction * state.ball.speed;
  state.ball.vy = offset * 430;
  state.ball.x = direction > 0 ? paddle.x + PADDLE_W + BALL_R : paddle.x - BALL_R;
}

function intersectsPaddle(paddle) {
  return state.ball.x + BALL_R >= paddle.x &&
    state.ball.x - BALL_R <= paddle.x + PADDLE_W &&
    state.ball.y + BALL_R >= paddle.y &&
    state.ball.y - BALL_R <= paddle.y + PADDLE_H;
}

function updateBall(dt) {
  if (state.mode !== "playing") return;

  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  if (state.ball.y - BALL_R <= 18 || state.ball.y + BALL_R >= BASE_HEIGHT - 18) {
    state.ball.y = clamp(state.ball.y, 18 + BALL_R, BASE_HEIGHT - 18 - BALL_R);
    state.ball.vy *= -1;
  }

  if (state.ball.vx < 0 && intersectsPaddle(state.player)) {
    bounceFromPaddle(state.player, 1);
  }

  if (state.ball.vx > 0 && intersectsPaddle(state.cpu)) {
    bounceFromPaddle(state.cpu, -1);
  }

  if (state.ball.x < -BALL_R * 2) endPoint("cpu");
  if (state.ball.x > BASE_WIDTH + BALL_R * 2) endPoint("player");
}

function update(dt) {
  if (state.mode === "paused") return;
  updatePlayer(dt);
  updateCpu(dt);
  updateBall(dt);
}

function drawCourt() {
  const gradient = ctx.createLinearGradient(0, 0, BASE_WIDTH, BASE_HEIGHT);
  gradient.addColorStop(0, "#204f31");
  gradient.addColorStop(0.52, "#183d2d");
  gradient.addColorStop(1, "#354516");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  ctx.strokeStyle = "rgba(243, 247, 238, 0.34)";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, BASE_WIDTH - 36, BASE_HEIGHT - 36);

  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(BASE_WIDTH / 2, 34);
  ctx.lineTo(BASE_WIDTH / 2, BASE_HEIGHT - 34);
  ctx.strokeStyle = "rgba(243, 247, 238, 0.46)";
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawText(text, x, y, size = 24, align = "center", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#f5f8eb";
  ctx.font = `700 ${size}px Inter, system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  drawCourt();

  ctx.fillStyle = "#f7ffe9";
  ctx.fillRect(state.player.x, state.player.y, PADDLE_W, PADDLE_H);
  ctx.fillStyle = "#ffdb72";
  ctx.fillRect(state.cpu.x, state.cpu.y, PADDLE_W, PADDLE_H);

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = "#f1ff78";
  ctx.fill();

  drawText(String(state.playerScore), BASE_WIDTH / 2 - 76, 68, 58);
  drawText(String(state.cpuScore), BASE_WIDTH / 2 + 76, 68, 58);

  if (state.mode !== "playing") {
    ctx.fillStyle = "rgba(12, 17, 14, 0.64)";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    drawText("Ping Pong", BASE_WIDTH / 2, 178, 64);
    drawText(state.message, BASE_WIDTH / 2, 256, 28);
    drawText("W/S or Arrow Keys  |  Mouse  |  P pause  |  F fullscreen", BASE_WIDTH / 2, 322, 20, "center", 0.82);
  } else {
    drawText("P", BASE_WIDTH - 34, 34, 16, "center", 0.46);
  }
}

function frame(time) {
  const dt = Math.min(0.033, ((time || 0) - state.lastTime) / 1000 || 0);
  state.lastTime = time || 0;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * BASE_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * BASE_HEIGHT,
  };
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (key === " " || key === "spacebar") {
    event.preventDefault();
    serve();
  }
  if (key === "r") resetMatch();
  if (key === "p" && state.mode === "playing") {
    state.mode = "paused";
    state.message = "Paused. Press P to resume.";
  } else if (key === "p" && state.mode === "paused") {
    state.mode = "playing";
    state.message = "";
  }
  if (key === "f") {
    if (document.fullscreenElement) document.exitFullscreen();
    else canvas.requestFullscreen?.();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointermove", (event) => {
  pointer.active = true;
  pointer.y = canvasPoint(event).y;
});
canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});
canvas.addEventListener("click", serve);

window.render_game_to_text = () => JSON.stringify({
  coordinates: "origin top-left, x right, y down, canvas 960x540",
  mode: state.mode,
  score: { player: state.playerScore, cpu: state.cpuScore, target: WIN_SCORE },
  player: { x: Math.round(state.player.x), y: Math.round(state.player.y), width: PADDLE_W, height: PADDLE_H },
  cpu: { x: Math.round(state.cpu.x), y: Math.round(state.cpu.y), width: PADDLE_W, height: PADDLE_H },
  ball: { x: Math.round(state.ball.x), y: Math.round(state.ball.y), vx: Math.round(state.ball.vx), vy: Math.round(state.ball.vy), radius: BALL_R },
  message: state.message,
});

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  draw();
};

resetMatch();
draw();
requestAnimationFrame(frame);
