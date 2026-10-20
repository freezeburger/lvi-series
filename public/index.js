const board = document.querySelector('#board');
const scoreElement = document.querySelector('#score');
const bestScoreElement = document.querySelector('#best-score');
const timeElement = document.querySelector('#time');
const messageElement = document.querySelector('#message');
const restartButton = document.querySelector('#restart');

const ROUND_TIME = 90;
const REVEAL_TIME = 1500;
const bestScoreKey = 'memori-best-score';

let score = 0;
let timeLeft = ROUND_TIME;
let firstCard = null;
let locked = false;
let started = false;
let finished = false;
let timer = null;
let revealTimer = null;

bestScoreElement.textContent = localStorage.getItem(bestScoreKey) || '0';

function shuffle(values) {
    for (let i = values.length - 1; i > 0; i -= 1) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [values[i], values[randomIndex]] = [values[randomIndex], values[i]];
    }
    return values;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateScore() {
    scoreElement.textContent = String(score);

    const bestScore = Number(bestScoreElement.textContent);
    if (score > bestScore) {
        bestScoreElement.textContent = String(score);
        localStorage.setItem(bestScoreKey, String(score));
    }
}

function finishGame(won) {
    finished = true;
    locked = true;
    clearInterval(timer);
    clearTimeout(revealTimer);
    messageElement.textContent = won
        ? 'Bravo, vous avez trouvé toutes les paires !'
        : 'Temps écoulé ! Recommencez pour retenter votre chance.';
}

function hideCard(card) {
    card.classList.remove('is-revealed');
    card.setAttribute('aria-label', 'Carte cachée');
}

function handleCardClick(event) {
    const card = event.currentTarget;
    if (finished || locked || card.disabled || card === firstCard) {
        return;
    }

    if (!started) {
        started = true;
        timer = setInterval(() => {
            timeLeft -= 1;
            timeElement.textContent = formatTime(timeLeft);
            if (timeLeft === 0) {
                finishGame(false);
            }
        }, 1000);
    }

    card.classList.add('is-revealed');
    card.setAttribute('aria-label', `Carte ${card.dataset.value}`);

    if (!firstCard) {
        firstCard = card;
        revealTimer = setTimeout(() => {
            hideCard(firstCard);
            firstCard = null;
        }, REVEAL_TIME);
        return;
    }

    clearTimeout(revealTimer);
    locked = true;

    if (firstCard.dataset.value === card.dataset.value) {
        firstCard.disabled = true;
        card.disabled = true;
        firstCard.classList.add('is-matched');
        card.classList.add('is-matched');
        firstCard = null;
        locked = false;
        score += 1;
        updateScore();

        if (board.querySelectorAll('.is-matched').length === 16) {
            finishGame(true);
        } else {
            messageElement.textContent = 'Paire trouvée ! Continuez.';
        }
        return;
    }

    const previousCard = firstCard;
    firstCard = null;
    messageElement.textContent = 'Ces cartes sont différentes. Réessayez !';
    revealTimer = setTimeout(() => {
        hideCard(previousCard);
        hideCard(card);
        locked = false;
    }, REVEAL_TIME);
}

function startGame() {
    clearInterval(timer);
    clearTimeout(revealTimer);

    score = 0;
    timeLeft = ROUND_TIME;
    firstCard = null;
    locked = false;
    started = false;
    finished = false;

    scoreElement.textContent = '0';
    timeElement.textContent = formatTime(timeLeft);
    messageElement.textContent = 'Trouvez les 8 paires avant la fin du temps !';
    board.replaceChildren();

    const values = shuffle([...Array(8)].flatMap((_, index) => {
        const value = String(index + 1);
        return [value, value];
    }));

    console.log(values);

    values.forEach((value, index) => {
        const card = document.createElement('button');
        card.className = 'card';
        card.type = 'button';
        card.dataset.value = value;
        card.setAttribute('aria-label', `Carte ${index + 1}, cachée`);
        card.innerHTML = `<span class="card-back" aria-hidden="true">?</span><span class="card-value" aria-hidden="true">${value}</span>`;
        card.addEventListener('click', handleCardClick);
        board.append(card);
    });
}

restartButton.addEventListener('click', startGame);
startGame();
