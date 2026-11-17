const emojis = ['🐶', '🐱', '🍕', '🚗', '⭐', '🎈', '⚽', '🎮']; // tecla Windows + . para obtener emojis
let cards = [...emojis, ...emojis];
let firstCard = null;
let secondCard = null;
let lock = false;
let startTime = null;
let timerInterval = null;
let moves = 0;
let pairs = 0;
let flipBackTimeout = null;

// Mezcla Fisher-Yates: todas las posiciones tienen la misma probabilidad
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = formatTime(diff);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function saveBestTime(time) {
  const best = Number(localStorage.getItem('bestTime'));
  if (!best || time < best) {
    localStorage.setItem('bestTime', time);
    document.getElementById('bestTime').textContent = formatTime(time);
    return true;
  }
  return false;
}

function updateScore() {
  document.getElementById('moves').textContent = moves;
  document.getElementById('pairs').textContent = pairs;
}

function setupGame() {
  stopTimer();
  clearTimeout(flipBackTimeout);
  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  const shuffled = shuffle(cards);
  shuffled.forEach((emoji, index) => {
    const div = document.createElement('div');
    div.classList.add('card');
    div.dataset.emoji = emoji;
    div.dataset.index = index;
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', 'Carta oculta');
    div.addEventListener('click', flipCard);
    board.appendChild(div);
  });
  firstCard = secondCard = null;
  lock = false;
  moves = 0;
  pairs = 0;
  startTime = null;
  updateScore();
  document.getElementById('timer').textContent = '00:00';
  document.getElementById('mensaje').textContent = '';
}

function flipCard(e) {
  const card = e.currentTarget;
  if (lock || card.classList.contains('flipped')) return;

  // El cronómetro empieza con la primera carta que se voltea
  if (!timerInterval) startTimer();

  card.textContent = card.dataset.emoji;
  card.classList.add('flipped');
  card.setAttribute('aria-label', 'Carta ' + card.dataset.emoji);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lock = true;
  moves++;

  if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard = secondCard = null;
    lock = false;
    pairs++;
    updateScore();

    if (pairs === emojis.length) {
      stopTimer();
      const time = Math.floor((Date.now() - startTime) / 1000);
      const record = saveBestTime(time);
      document.getElementById('mensaje').textContent =
        `¡Ganaste! Tiempo: ${formatTime(time)} en ${moves} intentos` + (record ? ' — ¡Nuevo récord!' : '');
      setTimeout(() => alert('¡Ganaste!'), 300);
    }
  } else {
    updateScore();
    flipBackTimeout = setTimeout(() => {
      firstCard.textContent = '';
      secondCard.textContent = '';
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      firstCard.setAttribute('aria-label', 'Carta oculta');
      secondCard.setAttribute('aria-label', 'Carta oculta');
      firstCard = secondCard = null;
      lock = false;
    }, 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const best = localStorage.getItem('bestTime');
  if (best) {
    document.getElementById('bestTime').textContent = formatTime(Number(best));
  }
  document.getElementById('btnRestart').addEventListener('click', setupGame);
  setupGame();
});

// Registro del Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(() => console.log('Service Worker registrado'))
    .catch(err => console.error('Error SW:', err));
}

// Instalación manual de la PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const btn = document.getElementById('btnInstall');
  btn.style.display = 'inline-block';

  btn.onclick = () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log('Resultado de la instalación:', choiceResult.outcome);
      deferredPrompt = null;
      btn.style.display = 'none';
    });
  };
});

window.addEventListener('appinstalled', () => {
  console.log('Memorama instalado');
  document.getElementById('btnInstall').style.display = 'none';
});
