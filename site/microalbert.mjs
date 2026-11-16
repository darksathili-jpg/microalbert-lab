const sprite = document.querySelector("#albert");
const controls = document.querySelector("#albert-controls");
const output = document.querySelector("#albert-position");
const context = sprite.getContext("2d");
const tile = 256;
const directions = {
  down: { row: 0, x: 0, y: 7, label: "de face" },
  left: { row: 1, x: -25, y: 0, label: "vers la gauche" },
  right: { row: 2, x: 25, y: 0, label: "vers la droite" },
  up: { row: 3, x: 0, y: -7, label: "de dos" }
};
const frames = [1, 0, 1, 2];
const duration = 640;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const image = new Image();
const buttons = [...controls.querySelectorAll("button")];
let direction = "down";
let x = 0;
let y = 0;
let animation;

function paint(column = 1) {
  context.clearRect(0, 0, tile, tile);
  context.drawImage(image, column * tile, directions[direction].row * tile, tile, tile, 0, 0, tile, tile);
  sprite.style.transform = `translate(${x}px, ${y}px)`;
}

function limit(value, max) {
  return Math.max(-max, Math.min(max, value));
}

function move(nextDirection) {
  cancelAnimationFrame(animation);
  direction = nextDirection;
  const pose = directions[direction];
  const stageWidth = sprite.parentElement.clientWidth;
  const horizontalLimit = Math.max(24, Math.floor((stageWidth - sprite.clientWidth * .58) / 2 - 4));
  const fromX = x;
  const fromY = y;
  const targetX = limit(x + pose.x, horizontalLimit);
  const targetY = limit(y + pose.y, 9);
  const start = performance.now();
  buttons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.direction === direction)));

  function resting() {
    x = targetX;
    y = targetY;
    paint();
    output.textContent = `MicroAlbert, ${pose.label}.`;
  }

  function tick(now) {
    const progress = Math.min(1, (now - start) / duration);
    if (progress >= 1) {
      resting();
      return;
    }
    x = fromX + (targetX - fromX) * progress;
    y = fromY + (targetY - fromY) * progress;
    paint(frames[Math.floor(progress * 8) % frames.length]);
    animation = requestAnimationFrame(tick);
  }

  if (reducedMotion.matches || (targetX === x && targetY === y)) resting();
  else animation = requestAnimationFrame(tick);
}

if (context) {
  image.addEventListener("load", () => {
    paint();
    controls.hidden = false;
    buttons.forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.direction === direction));
      button.addEventListener("click", () => move(button.dataset.direction));
    });
    controls.addEventListener("keydown", (event) => {
      const nextDirection = event.key.startsWith("Arrow") && event.key.slice(5).toLowerCase();
      if (!nextDirection || !Object.hasOwn(directions, nextDirection)) return;
      event.preventDefault();
      if (!event.repeat) move(nextDirection);
    });
  }, { once: true });
  image.src = new URL("./assets/microalbert-einstein-sprites.png", import.meta.url).href;
}
