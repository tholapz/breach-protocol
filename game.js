const MATRIX_SIZE = 5;
const HEX_VALUES = ["1C", "BD", "E9", "7A", "55"];
const SEQUENCE_LENGTH = 4;
const SEQUENCE_COUNT = 2;
const BUFFER_LIMIT = 7;
const GAME_TIME = 30.0;

let matrix = [];
let sequences = [];
let buffer = [];
let matchedSequences = [];
let lastSelected = null;
let timer = GAME_TIME;
let timerInterval = null;

function randomHex() {
    return HEX_VALUES[Math.floor(Math.random() * HEX_VALUES.length)];
}

function generateMatrix() {
    matrix = [];
    for (let i = 0; i < MATRIX_SIZE; i++) {
        let row = [];
        for (let j = 0; j < MATRIX_SIZE; j++) {
            row.push(randomHex());
        }
        matrix.push(row);
    }
}

function generateSequences() {
    sequences = [];
    for (let i = 0; i < SEQUENCE_COUNT; i++) {
        let seq = [];
        for (let j = 0; j < SEQUENCE_LENGTH; j++) {
            seq.push(randomHex());
        }
        sequences.push(seq);
    }
}

function renderMatrix() {
    // Helper functions for highlighting
    function highlightRowCol(row, col) {
        const matrixDiv = document.getElementById("code-matrix");
        Array.from(matrixDiv.children).forEach(cell => {
            if (parseInt(cell.dataset.row) === row || parseInt(cell.dataset.col) === col) {
                cell.classList.add("highlight");
            }
        });
    }
    function removeHighlightRowCol(row, col) {
        const matrixDiv = document.getElementById("code-matrix");
        Array.from(matrixDiv.children).forEach(cell => {
            cell.classList.remove("highlight");
        });
    }
    const matrixDiv = document.getElementById("code-matrix");
    matrixDiv.innerHTML = "";
    for (let i = 0; i < MATRIX_SIZE; i++) {
        for (let j = 0; j < MATRIX_SIZE; j++) {
            const cell = document.createElement("div");
            cell.className = "matrix-cell";
            cell.textContent = matrix[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            if (buffer.some(sel => sel[0] === i && sel[1] === j)) {
                cell.classList.add("selected");
            }
            cell.onclick = () => handleCellClick(i, j);
            cell.onmouseover = (e) => highlightRowCol(i, j);
            cell.onmouseout = (e) => removeHighlightRowCol(i, j);
            matrixDiv.appendChild(cell);
        }
    }
}

function renderBuffer() {
    const bufferDiv = document.getElementById("buffer");
    bufferDiv.innerHTML = "";
    
    // Create all buffer slots (empty or filled)
    for (let i = 0; i < BUFFER_LIMIT; i++) {
        const slot = document.createElement("div");
        slot.className = "buffer-slot";
        
        // If we have data for this slot, fill it
        if (i < buffer.length) {
            const [row, col] = buffer[i];
            slot.textContent = matrix[row][col];
            slot.classList.add("filled");
        }
        
        bufferDiv.appendChild(slot);
    }
}

function renderSequences() {
    const seqUl = document.getElementById("sequences");
    seqUl.innerHTML = "";
    sequences.forEach((seq, idx) => {
        const li = document.createElement("li");
        li.textContent = seq.join(" ");
        
        // Add matched class if this sequence has been matched
        if (matchedSequences.includes(idx)) {
            li.classList.add("matched");
        }
        
        seqUl.appendChild(li);
    });
}

function resetGame() {
    generateMatrix();
    generateSequences();
    buffer = [];
    matchedSequences = [];
    lastSelected = null;
    timer = GAME_TIME;
    clearInterval(timerInterval);
    renderAll();
    // Reset progress bar to full width
    document.getElementById("timer-progress").style.width = "100%";
    document.getElementById("timer-progress").style.background = "#e6ff62";
    
    // Hide the game over banner if visible
    document.getElementById("game-over-banner").classList.add("hidden");
    
    startTimer();
}

function renderAll() {
    renderMatrix();
    renderBuffer();
    renderSequences();
    document.getElementById("timer").textContent = `Time: ${timer.toFixed(2)}`;
}

function handleCellClick(row, col) {
    if (buffer.length === 0) {
        buffer.push([row, col]);
        lastSelected = [row, col];
    } else if (buffer.length < BUFFER_LIMIT) {
        // Only allow same row or same column, and not already selected
        if (
            (row === lastSelected[0] || col === lastSelected[1]) &&
            !buffer.some(sel => sel[0] === row && sel[1] === col)
        ) {
            buffer.push([row, col]);
            lastSelected = [row, col];
        } else {
            return; // Invalid move
        }
    } else {
        return; // Buffer full
    }
    renderAll();
    checkSequences();
    
    // Check if buffer is now full
    if (buffer.length === BUFFER_LIMIT) {
        // Stop the timer and end the game
        clearInterval(timerInterval);
        endGame("Buffer full!");
    }
}

function checkSequences() {
    const selectedSeq = buffer.map(([row, col]) => matrix[row][col]);
    sequences.forEach((seq, idx) => {
        if (!matchedSequences.includes(idx) && arraysEqual(seq, selectedSeq)) {
            matchedSequences.push(idx);
            // Highlight matched cells
            highlightMatchedCells();
        }
    });
    renderSequences();
}

function highlightMatchedCells() {
    const matrixDiv = document.getElementById("code-matrix");
    Array.from(matrixDiv.children).forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        if (buffer.some(sel => sel[0] === row && sel[1] === col)) {
            cell.classList.add("matched");
        }
    });
}

function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer -= 0.05;
        if (timer <= 0) {
            timer = 0;
            clearInterval(timerInterval);
            endGame();
        }
        document.getElementById("timer").textContent = `Time: ${timer.toFixed(2)}`;
        
        // Update progress bar width based on remaining time
        const progressPercent = (timer / GAME_TIME) * 100;
        document.getElementById("timer-progress").style.width = `${progressPercent}%`;
        
        // Change color as time decreases
        if (progressPercent < 25) {
            document.getElementById("timer-progress").style.background = "#ff3a3a";
        } else if (progressPercent < 50) {
            document.getElementById("timer-progress").style.background = "#ff9a3a";
        } else {
            document.getElementById("timer-progress").style.background = "#e6ff62";
        }
    }, 50);
}

function endGame(reason = "Time's up!") {
    // Show game over banner instead of alert
    const gameOverBanner = document.getElementById("game-over-banner");
    const gameOverMessage = document.getElementById("game-over-message");
    
    // Update the message with reason and match count
    gameOverMessage.textContent = `${reason} You matched ${matchedSequences.length} sequence(s)`;
    
    // Show the banner
    gameOverBanner.classList.remove("hidden");
}

document.getElementById("reset-btn").onclick = resetGame;

// Add event listener for the restart button in the game over banner
document.getElementById("restart-btn").onclick = resetGame;

// Start the game on load
resetGame();
