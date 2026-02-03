const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const integrityEl = document.getElementById("integrity");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const arena = {
  width: canvas.width,
  height: canvas.height,
};

const guardian = {
  x: arena.width / 2,
  y: arena.height / 2,
  radius: 18,
  speed: 5.5,
  targetX: arena.width / 2,
  targetY: arena.height / 2,
  velocityX: 0,
  velocityY: 0,
};

const core = {
  x: arena.width / 2,
  y: arena.height / 2,
  radius: 42,
};

const state = {
  running: false,
  paused: false,
  score: 0,
  streak: 0,
  integrity: 100,
  meteors: [],
  lastSpawn: 0,
  spawnRate: 1200,
  lastTime: 0,
  pulseReady: true,
  pulseActive: false,
  pulseTimeLeft: 0,
  difficulty: 1,
};

const controls = {
  keys: new Set(),
  usingMouse: false,
};

function resetState() {
  state.score = 0;
  state.streak = 0;
  state.integrity = 100;
  state.meteors = [];
  state.lastSpawn = 0;
  state.spawnRate = 1200;
  state.lastTime = 0;
  state.pulseReady = true;
  state.pulseActive = false;
  state.pulseTimeLeft = 0;
  state.difficulty = 1;
  guardian.x = arena.width / 2;
  guardian.y = arena.height / 2;
  guardian.targetX = guardian.x;
  guardian.targetY = guardian.y;
  guardian.velocityX = 0;
  guardian.velocityY = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = Math.floor(state.score).toString();
  streakEl.textContent = state.streak.toString();
  integrityEl.textContent = `${Math.max(state.integrity, 0)}%`;
}

function spawnMeteor() {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = Math.random() * arena.width;
    y = -40;
  } else if (edge === 1) {
    x = arena.width + 40;
    y = Math.random() * arena.height;
  } else if (edge === 2) {
    x = Math.random() * arena.width;
    y = arena.height + 40;
  } else {
    x = -40;
    y = Math.random() * arena.height;
  }

  const angle = Math.atan2(core.y - y, core.x - x);
  const speed = 1.4 + Math.random() * 1.4 + state.difficulty * 0.18;
  state.meteors.push({
    x,
    y,
    radius: 10 + Math.random() * 14,
    velocityX: Math.cos(angle) * speed,
    velocityY: Math.sin(angle) * speed,
    glow: Math.random() * 0.5 + 0.5,
  });
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(
    core.x,
    core.y,
    10,
    core.x,
    core.y,
    420
  );
  gradient.addColorStop(0, "rgba(124, 58, 237, 0.2)");
  gradient.addColorStop(1, "rgba(4, 4, 15, 0.9)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, arena.width, arena.height);
}

function drawCore() {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "rgba(62, 233, 255, 0.08)";
  ctx.arc(core.x, core.y, core.radius + 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(124, 58, 237, 0.4)";
  ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(62, 233, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(core.x, core.y, core.radius + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGuardian() {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "rgba(62, 233, 255, 0.9)";
  ctx.shadowColor = "rgba(62, 233, 255, 0.7)";
  ctx.shadowBlur = 20;
  ctx.arc(guardian.x, guardian.y, guardian.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(124, 58, 237, 0.8)";
  ctx.arc(guardian.x, guardian.y, guardian.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMeteors() {
  state.meteors.forEach((meteor) => {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = `rgba(249, 115, 22, ${meteor.glow})`;
    ctx.shadowColor = "rgba(249, 115, 22, 0.7)";
    ctx.shadowBlur = 12;
    ctx.arc(meteor.x, meteor.y, meteor.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPulse() {
  if (!state.pulseActive) return;
  const progress = state.pulseTimeLeft / 2000;
  ctx.save();
  ctx.strokeStyle = `rgba(62, 233, 255, ${0.8 * progress})`;
  ctx.lineWidth = 3 + 8 * progress;
  ctx.beginPath();
  ctx.arc(guardian.x, guardian.y, 120 * (1 - progress) + 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function updateGuardian() {
  if (controls.usingMouse) {
    const dx = guardian.targetX - guardian.x;
    const dy = guardian.targetY - guardian.y;
    guardian.velocityX = dx * 0.06;
    guardian.velocityY = dy * 0.06;
  } else {
    const moveX = (controls.keys.has("ArrowRight") ? 1 : 0) -
      (controls.keys.has("ArrowLeft") ? 1 : 0);
    const moveY = (controls.keys.has("ArrowDown") ? 1 : 0) -
      (controls.keys.has("ArrowUp") ? 1 : 0);
    guardian.velocityX = moveX * guardian.speed;
    guardian.velocityY = moveY * guardian.speed;
  }

  guardian.x += guardian.velocityX;
  guardian.y += guardian.velocityY;

  guardian.x = Math.max(guardian.radius, Math.min(arena.width - guardian.radius, guardian.x));
  guardian.y = Math.max(guardian.radius, Math.min(arena.height - guardian.radius, guardian.y));
}

function updateMeteors(delta) {
  const slowFactor = state.pulseActive ? 0.35 : 1;
  state.meteors.forEach((meteor) => {
    meteor.x += meteor.velocityX * slowFactor;
    meteor.y += meteor.velocityY * slowFactor;
  });

  state.meteors = state.meteors.filter((meteor) => {
    const offscreen =
      meteor.x < -80 ||
      meteor.x > arena.width + 80 ||
      meteor.y < -80 ||
      meteor.y > arena.height + 80;
    if (offscreen) {
      state.score += 4;
      state.streak += 1;
      if (state.streak % 10 === 0) {
        state.pulseReady = true;
      }
      return false;
    }
    return true;
  });

  state.score += delta * 0.01;
  state.difficulty = 1 + state.score / 500;
  state.spawnRate = Math.max(420, 1200 - state.score * 0.8);
}

function checkCollisions() {
  state.meteors.forEach((meteor) => {
    const dx = meteor.x - core.x;
    const dy = meteor.y - core.y;
    const distance = Math.hypot(dx, dy);
    if (distance < meteor.radius + core.radius) {
      state.integrity -= Math.ceil(6 + meteor.radius * 0.3);
      state.streak = 0;
      meteor.x = -999;
      meteor.y = -999;
    }

    const gx = meteor.x - guardian.x;
    const gy = meteor.y - guardian.y;
    const gDistance = Math.hypot(gx, gy);
    if (gDistance < meteor.radius + guardian.radius) {
      state.integrity -= Math.ceil(3 + meteor.radius * 0.2);
      state.streak = 0;
      meteor.x = -999;
      meteor.y = -999;
    }
  });
}

function handlePulse() {
  if (!state.pulseActive) return;
  state.pulseTimeLeft -= state.delta;
  if (state.pulseTimeLeft <= 0) {
    state.pulseActive = false;
  }
}

function gameLoop(timestamp) {
  if (!state.running || state.paused) return;

  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;
  state.delta = delta;

  if (timestamp - state.lastSpawn > state.spawnRate) {
    spawnMeteor();
    state.lastSpawn = timestamp;
  }

  updateGuardian();
  updateMeteors(delta);
  handlePulse();
  checkCollisions();

  drawBackground();
  drawCore();
  drawPulse();
  drawMeteors();
  drawGuardian();
  updateHud();

  if (state.integrity <= 0) {
    endGame();
    return;
  }

  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (state.running && !state.paused) return;
  state.running = true;
  state.paused = false;
  pauseButton.textContent = "Pausar";
  pauseButton.disabled = false;
  startButton.disabled = true;
  overlay.classList.remove("visible");
  state.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function pauseGame() {
  if (!state.running) return;
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "Reanudar" : "Pausar";
  if (!state.paused) {
    state.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

function endGame() {
  state.running = false;
  pauseButton.disabled = true;
  startButton.disabled = false;
  overlayTitle.textContent = "Núcleo colapsado";
  overlayText.textContent = `Puntaje final: ${Math.floor(state.score)}. Reinicia para intentarlo de nuevo.`;
  overlay.classList.add("visible");
}

function restartGame() {
  resetState();
  overlayTitle.textContent = "Misión preparada";
  overlayText.textContent = "Inicia la misión y mantén el núcleo a salvo el mayor tiempo posible.";
  overlay.classList.add("visible");
  startButton.disabled = false;
  pauseButton.disabled = true;
  state.running = false;
  state.paused = false;
}

function activatePulse() {
  if (!state.pulseReady || state.pulseActive || !state.running) return;
  state.pulseReady = false;
  state.pulseActive = true;
  state.pulseTimeLeft = 2000;
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  guardian.targetX = ((event.clientX - rect.left) / rect.width) * arena.width;
  guardian.targetY = ((event.clientY - rect.top) / rect.height) * arena.height;
  controls.usingMouse = true;
});

canvas.addEventListener("mouseleave", () => {
  controls.usingMouse = false;
});

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    controls.keys.add(event.key);
    controls.usingMouse = false;
  }
  if (event.code === "Space") {
    activatePulse();
  }
});

window.addEventListener("keyup", (event) => {
  controls.keys.delete(event.key);
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", restartGame);

overlay.classList.add("visible");
resetState();
