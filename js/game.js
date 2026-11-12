
/*
=========================================================
 MYSTERY BOX - GAME ENGINE
=========================================================

Fitur:
1. Player setup.
2. Automatic turn rotation.
3. Random mystery boxes.
4. Quiz with countdown timer.
5. Easy / Medium / Hard scoring.
6. Bomb / Lucky / Double / Empty boxes.
7. Live leaderboard.
8. Winner determination.
9. Excel leaderboard export.

Dependencies:
- storage.js
- excel.js

=========================================================
*/

(function () {
    "use strict";


    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const setupSection = document.getElementById("setupSection");
    const resumeSection = document.getElementById("resumeSection");
    const resumeGameButton = document.getElementById("resumeGameButton");
    const newGameButton = document.getElementById("newGameButton");
    const gameSection = document.getElementById("gameSection");
    const resultSection = document.getElementById("resultSection");

    const playerCountInput = document.getElementById("playerCount");
    const boxCountInput = document.getElementById("boxCount");
    const playerInputs = document.getElementById("playerInputs");
    const startGameButton = document.getElementById("startGameButton");

    const gameStatus = document.getElementById("gameStatus");
    const roundInfo = document.getElementById("roundInfo");
    const remainingBoxes = document.getElementById("remainingBoxes");

    const currentPlayerName = document.getElementById("currentPlayerName");
    const currentTurnInfo = document.getElementById("currentTurnInfo");

    const boxGrid = document.getElementById("boxGrid");

    const leaderboardBody = document.getElementById("leaderboardBody");

    const boxModal = document.getElementById("boxModal");
    const closeModalButton = document.getElementById("closeModalButton");
    const modalContent = document.getElementById("modalContent");
    const modalActions = document.getElementById("modalActions");

    const winnerMessage = document.getElementById("winnerMessage");
    const winnerDisplay = document.getElementById("winnerDisplay");
    const finalLeaderboardBody = document.getElementById("finalLeaderboardBody");

    const exportExcelButton = document.getElementById("exportExcelButton");
    const restartGameButton = document.getElementById("restartGameButton");
    const restartDialog = document.getElementById("restartDialog");


    // =====================================================
    // GAME STATE
    // =====================================================

    let players = [];

    let boxes = [];

    let turnIndex = 0;

    let questionPool = [];

    let questionIndex = 0;

    let pendingTurn = null;

    let timerInterval = null;

    let quizDeadline = null;

    let gameFinished = false;

    let currentSettings = null;


    // =====================================================
    // CONSTANTS
    // =====================================================

    const BOX_TYPES = {
        quiz: {
            label: "Quiz",
            icon: "❓"
        },

        bomb: {
            label: "Bomb",
            icon: "💣"
        },

        lucky: {
            label: "Lucky",
            icon: "🍀"
        },

        double: {
            label: "Double",
            icon: "⚡"
        },

        empty: {
            label: "Empty",
            icon: "🌿"
        }
    };


    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function shuffleArray(array) {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [result[i], result[j]] = [
                result[j],
                result[i]
            ];
        }

        return result;
    }


    function formatTime(seconds) {
        const safeSeconds = Math.max(
            0,
            Math.floor(Number(seconds) || 0)
        );

        const minutes = Math.floor(safeSeconds / 60);

        const remaining = safeSeconds % 60;

        return (
            String(minutes).padStart(2, "0") +
            ":" +
            String(remaining).padStart(2, "0")
        );
    }


    function showElement(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }


    function hideElement(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }


    function getCurrentPlayer() {
        if (players.length === 0) {
            return null;
        }

        return players[turnIndex % players.length];
    }


    function getCompletedTurns() {
        return turnIndex;
    }


    function getTotalTurns() {
        return boxes.length;
    }


    function getCurrentRound() {
        if (players.length === 0) {
            return 1;
        }

        return Math.floor(turnIndex / players.length) + 1;
    }


    function getCurrentPlayerTurn() {
        if (players.length === 0) {
            return 0;
        }

        return (turnIndex % players.length) + 1;
    }


    // =====================================================
    // PLAYER SETUP
    // =====================================================

    function renderPlayerInputs() {
        if (!playerInputs || !playerCountInput) {
            return;
        }

        let count = Number(playerCountInput.value);

        if (!Number.isInteger(count)) {
            count = 5;
        }

        count = Math.min(20, Math.max(2, count));

        playerCountInput.value = count;

        const previousNames = [];

        playerInputs.querySelectorAll(
            'input[name="playerName"]'
        ).forEach(function (input) {
            previousNames.push(input.value);
        });

        playerInputs.innerHTML = "";

        for (let i = 0; i < count; i++) {
            const wrapper = document.createElement("div");

            wrapper.className = "player-input-item";

            wrapper.innerHTML = `
                <label for="playerName${i}">
                    Player ${String(i + 1).padStart(2, "0")}
                </label>

                <input
                    type="text"
                    id="playerName${i}"
                    name="playerName"
                    placeholder="Masukkan nama pemain ${i + 1}"
                    maxlength="30"
                    autocomplete="off"
                    required
                >
            `;

            playerInputs.appendChild(wrapper);

            const input = wrapper.querySelector("input");

            input.value = previousNames[i] || "";
        }
    }


    function collectPlayerNames() {
        if (!playerInputs) {
            return [];
        }

        const inputs = playerInputs.querySelectorAll(
            'input[name="playerName"]'
        );

        const names = Array.from(inputs).map(
            input => input.value.trim()
        );

        if (names.some(name => name.length === 0)) {
            alert("Semua nama pemain harus diisi.");

            return null;
        }

        const normalizedNames = names.map(
            name => name.toLowerCase()
        );

        if (
            new Set(normalizedNames).size !==
            normalizedNames.length
        ) {
            alert("Nama pemain tidak boleh sama.");

            return null;
        }

        return names;
    }


    // =====================================================
    // BOX GENERATION
    // =====================================================

    function generateBoxes(totalBoxes, settings) {
        const specialBoxes = [];

        const specialConfigurations = [
            {
                type: "bomb",
                count: settings.bombCount
            },
            {
                type: "lucky",
                count: settings.luckyCount
            },
            {
                type: "double",
                count: settings.doubleCount
            },
            {
                type: "empty",
                count: settings.emptyCount
            }
        ];

        specialConfigurations.forEach(
            function (configuration) {
                const count = Math.max(
                    0,
                    Math.floor(Number(configuration.count) || 0)
                );

                for (let i = 0; i < count; i++) {
                    specialBoxes.push(configuration.type);
                }
            }
        );

        // Jika jumlah special box melebihi total box,
        // pilih secara acak agar komposisinya tidak selalu sama.
        const selectedSpecialBoxes = shuffleArray(
            specialBoxes
        ).slice(0, totalBoxes);

        const generatedBoxes = selectedSpecialBoxes.map(
            function (type, index) {
                return {
                    id: `box-${index + 1}`,
                    type: type,
                    used: false
                };
            }
        );

        // Isi sisa box dengan kuis.
        while (generatedBoxes.length < totalBoxes) {
            generatedBoxes.push({
                id: `box-${generatedBoxes.length + 1}`,
                type: "quiz",
                used: false
            });
        }

        return shuffleArray(generatedBoxes).map(
            function (box, index) {
                return {
                    ...box,
                    id: `box-${index + 1}`,
                    number: index + 1
                };
            }
        );
    }


    // =====================================================
    // QUESTION POOL
    // =====================================================

    function shuffleQuestionPool() {
        questionPool = shuffleArray(questionPool);

        questionIndex = 0;
    }


    function getNextQuestion() {
        if (questionPool.length === 0) {
            return null;
        }

        if (questionIndex >= questionPool.length) {
            shuffleQuestionPool();
        }

        const question = questionPool[questionIndex];

        questionIndex++;

        return question;
    }


    // =====================================================
    // START GAME
    // =====================================================

    function startGame() {
        const names = collectPlayerNames();

        if (!names) {
            return;
        }

        const totalBoxes = Number(boxCountInput.value);

        if (
            !Number.isInteger(totalBoxes) ||
            totalBoxes < 1 ||
            totalBoxes > 100
        ) {
            alert(
                "Jumlah mystery box harus antara 1 sampai 100."
            );

            return;
        }

        const activeQuestions =
            MBStorage.getActiveQuestions();

        if (activeQuestions.length === 0) {
            alert(
                "Belum ada pertanyaan aktif. " +
                "Silakan tambahkan pertanyaan melalui Admin Panel."
            );

            return;
        }

        currentSettings = MBStorage.getSettings();

        players = names.map(
            function (name) {
                return {
                    id: MBStorage.createId(),
                    name: name,

                    score: 0,

                    correctAnswers: 0,

                    turns: 0,

                    timeSpent: 0,

                    doubleNext: false
                };
            }
        );

        boxes = generateBoxes(
            totalBoxes,
            currentSettings
        );

        turnIndex = 0;

        gameFinished = false;

        pendingTurn = null;

        questionPool = activeQuestions;
        shuffleQuestionPool();

        saveGameSession();
        showGameBoard();
    }

    function showGameBoard() {
        hideElement(setupSection);
        hideElement(resumeSection);

        hideElement(resultSection);

        showElement(gameSection);

        updateGameDisplay();

        renderBoxes();

        renderLeaderboard();
    }


    // =====================================================
    // GAME DISPLAY
    // =====================================================

    function updateGameDisplay() {
        const player = getCurrentPlayer();

        if (!player || gameFinished) {
            return;
        }

        const remaining = boxes.filter(
            box => !box.used
        ).length;

        if (gameStatus) {
            gameStatus.textContent = "IN PROGRESS";
        }

        if (roundInfo) {
            roundInfo.textContent =
                `Round ${getCurrentRound()}`;
        }

        if (remainingBoxes) {
            remainingBoxes.textContent =
                `${remaining} boxes left`;
        }

        if (currentPlayerName) {
            currentPlayerName.textContent =
                player.name;
        }

        if (currentTurnInfo) {
            currentTurnInfo.textContent =
                `Player ${getCurrentPlayerTurn()} of ${players.length} · ` +
                `Turn ${getCompletedTurns() + 1} of ${getTotalTurns()}`;
        }
    }


    // =====================================================
    // RENDER BOX GRID
    // =====================================================

    function renderBoxes() {
        if (!boxGrid) {
            return;
        }

        boxGrid.innerHTML = "";

        boxes.forEach(
            function (box) {

                const button = document.createElement("button");

                button.type = "button";

                button.className = "mystery-box";

                button.dataset.boxId = box.id;

                if (box.used) {
                    button.classList.add("used");
                    button.disabled = true;
                }

                const icon = box.used
                    ? "✓"
                    : "🎁";

                const label = box.used
                    ? "Opened"
                    : "Mystery Box";

                button.innerHTML = `
                    <span class="box-number">
                        ${String(box.number).padStart(2, "0")}
                    </span>

                    <span class="box-icon">
                        ${icon}
                    </span>

                    <span class="box-label">
                        ${label}
                    </span>
                `;

                if (!box.used) {
                    button.addEventListener(
                        "click",
                        function () {
                            selectBox(box.id);
                        }
                    );
                }

                boxGrid.appendChild(button);
            }
        );
    }


    // =====================================================
    // SELECT BOX
    // =====================================================

    function selectBox(boxId) {
        if (gameFinished || pendingTurn) {
            return;
        }

        const box = boxes.find(
            item => item.id === boxId
        );

        if (!box || box.used) {
            return;
        }

        const player = getCurrentPlayer();

        if (!player) {
            return;
        }

        // Box langsung ditandai sebagai terpakai.
        box.used = true;

        // Satu box = satu giliran pemain.
        player.turns++;

        renderBoxes();

        updateGameDisplay();

        if (box.type === "quiz") {
            handleQuizBox(box, player);
        } else {
            handleSpecialBox(box.type, player);
        }
    }


    // =====================================================
    // MODAL MANAGEMENT
    // =====================================================

    function openModal() {
        if (!boxModal) {
            return;
        }

        boxModal.classList.remove("hidden");

        document.body.style.overflow = "hidden";
    }


    function closeModal() {
        if (!boxModal) {
            return;
        }

        stopTimer();

        boxModal.classList.add("hidden");

        document.body.style.overflow = "";
    }


    function hideModalCloseButton() {
        if (closeModalButton) {
            closeModalButton.classList.add("hidden");
        }
    }


    function clearModal() {
        if (modalContent) {
            modalContent.innerHTML = "";
        }

        if (modalActions) {
            modalActions.innerHTML = "";
        }
    }


    // =====================================================
    // QUIZ BOX
    // =====================================================

    function handleQuizBox(box, player) {
        const question = getNextQuestion();

        if (!question) {
            box.used = false;
            player.turns--;
            renderBoxes();
            updateGameDisplay();

            alert(
                "Tidak ada pertanyaan aktif. " +
                "Permainan tidak dapat dilanjutkan."
            );

            return;
        }

        const durationMs = Math.max(1, Number(currentSettings.timerDuration) || 20) * 1000;
        pendingTurn = { type: "quiz", question, durationMs, remainingMs: durationMs };

        saveGameSession();
        showQuizModal(player, question);
        startQuizTimer();
    }


    function getQuizPoints(difficulty) {
        const difficultyPoints = {
            easy: currentSettings.easyPoints,
            medium: currentSettings.mediumPoints,
            hard: currentSettings.hardPoints
        };

        return Number(difficultyPoints[difficulty]) || 0;
    }

    function showQuizModal(player, question) {
        clearModal();

        hideModalCloseButton();

        const difficulty = question.difficulty;
        const basePoints = getQuizPoints(difficulty);

        const options = ["A", "B", "C", "D"];

        const optionHTML = options.map(
            function (letter) {

                return `
                    <button
                        type="button"
                        class="quiz-option"
                        data-answer="${letter}"
                    >
                        <span class="option-letter">
                            ${letter}
                        </span>

                        <span>
                            ${escapeHTML(question.options[letter])}
                        </span>
                    </button>
                `;

            }
        ).join("");


        modalContent.innerHTML = `

            <div class="quiz-meta">

                <span class="difficulty-badge ${escapeHTML(difficulty)}">
                    ${escapeHTML(difficulty.toUpperCase())}
                </span>

                <span>
                    ${escapeHTML(question.category)}
                </span>

            </div>

            <div class="quiz-timer" id="quizTimer">
                <span>⏱</span>
                <strong id="timerValue">
                    ${currentSettings.timerDuration}
                </strong>
                <small>seconds</small>
            </div>

            <div class="quiz-question">

                <p>
                    ${escapeHTML(question.question)}
                </p>

            </div>

            <div class="quiz-options" id="quizOptions">

                ${optionHTML}

            </div>

            <p class="quiz-player-label">
                Player: <strong>${escapeHTML(player.name)}</strong>
            </p>

            <p class="quiz-points-label">
                Correct answer: +${basePoints} points
            </p>

        `;

        modalActions.innerHTML = "";

        openModal();

        modalContent.querySelectorAll(
            ".quiz-option"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const selectedAnswer =
                            button.dataset.answer;

                        handleQuizAnswer(selectedAnswer);

                    }
                );

            }
        );
    }


    // =====================================================
    // QUIZ TIMER
    // =====================================================

    function getQuizTimeRemaining() {
        return quizDeadline === null
            ? pendingTurn.remainingMs
            : Math.min(pendingTurn.durationMs, Math.max(0, quizDeadline - Date.now()));
    }

    function startQuizTimer() {
        if (pendingTurn?.type !== "quiz" || pendingTurn.result || quizDeadline !== null) {
            return;
        }

        let seconds = Math.ceil(pendingTurn.remainingMs / 1000);
        updateTimerDisplay(seconds);

        if (document.hidden) {
            return;
        }

        quizDeadline = Date.now() + pendingTurn.remainingMs;
        if (seconds === 0) {
            handleQuizAnswer(null);
            return;
        }

        timerInterval = setInterval(function () {
            const remainingMs = getQuizTimeRemaining();
            const nextSeconds = Math.ceil(remainingMs / 1000);

            if (nextSeconds === 0) {
                handleQuizAnswer(null);
            } else if (nextSeconds !== seconds) {
                seconds = nextSeconds;
                pendingTurn.remainingMs = remainingMs;
                updateTimerDisplay(seconds);
                saveGameSession();
            }
        }, 200);
    }

    function pauseQuizTimer() {
        if (quizDeadline === null) {
            return;
        }

        pendingTurn.remainingMs = getQuizTimeRemaining();
        stopTimer();
        saveGameSession();
    }

    function updateTimerDisplay(timeRemaining) {
        const timerValue = document.getElementById(
            "timerValue"
        );

        const timerElement = document.getElementById(
            "quizTimer"
        );

        if (timerValue) {
            timerValue.textContent = timeRemaining;
        }

        if (timerElement) {

            timerElement.classList.toggle("warning", timeRemaining <= 5);

        }
    }


    function stopTimer() {
        quizDeadline = null;

        if (timerInterval !== null) {
            clearInterval(timerInterval);

            timerInterval = null;
        }
    }


    // =====================================================
    // QUIZ ANSWER
    // =====================================================

    function handleQuizAnswer(selectedAnswer) {
        if (pendingTurn?.type !== "quiz" || pendingTurn.result || quizDeadline === null) {
            return;
        }

        const remainingMs = getQuizTimeRemaining();
        stopTimer();

        const { question, durationMs } = pendingTurn;
        const player = getCurrentPlayer();
        const isTimeout = remainingMs === 0;
        if (isTimeout) {
            selectedAnswer = null;
        }

        player.timeSpent += Math.ceil((durationMs - remainingMs) / 1000);

        const isCorrect =
            !isTimeout &&
            selectedAnswer === question.answer;

        let earnedPoints = 0;

        if (isCorrect) {

            earnedPoints = getQuizPoints(question.difficulty);

            player.correctAnswers++;

            if (player.doubleNext) {

                earnedPoints *= Math.max(
                    1,
                    Number(currentSettings.doubleMultiplier) || 2
                );

                player.doubleNext = false;
            }

            player.score += earnedPoints;
        }

        pendingTurn.result = { selectedAnswer, isTimeout, earnedPoints };
        saveGameSession();
        renderQuizResult(question, pendingTurn.result);
        renderLeaderboard();
    }

    function renderQuizResult(question, { selectedAnswer, isTimeout, earnedPoints }) {
        modalContent.querySelector(".quiz-timer").classList.add("hidden");
        modalContent.querySelector(".quiz-points-label").classList.add("hidden");

        const isCorrect = selectedAnswer === question.answer;

        // Disable all answer options.
        const optionButtons = modalContent.querySelectorAll(
            ".quiz-option"
        );

        optionButtons.forEach(
            function (button) {

                button.disabled = true;

                const answer = button.dataset.answer;

                if (answer === question.answer) {
                    button.classList.add("correct");
                } else if (
                    answer === selectedAnswer &&
                    !isCorrect
                ) {
                    button.classList.add("wrong");
                }

            }
        );


        // Display result.
        let resultTitle = "";

        let resultDescription = "";

        if (isTimeout) {

            resultTitle = "Waktu habis";

            resultDescription =
                `Jawaban yang benar adalah ${question.answer}. ` +
                `Kamu mendapat 0 poin.`;

        } else if (isCorrect) {

            resultTitle = "Correct Answer! 🎉";

            resultDescription =
                `Kamu mendapatkan +${earnedPoints} poin!`;

        } else {

            resultTitle = "Jawaban salah";

            resultDescription =
                `Pilihanmu ${selectedAnswer}. Jawaban yang benar adalah ` +
                `${question.answer}. Kamu mendapat 0 poin.`;

        }


        const resultElement = document.createElement("div");

        resultElement.className = "quiz-result";

        resultElement.innerHTML = `
            <h3>${resultTitle}</h3>
            <p>${escapeHTML(resultDescription)}</p>
        `;

        modalContent.appendChild(resultElement);


        showContinueButton();
    }

    function showContinueButton() {
        modalActions.innerHTML = `
            <button
                type="button"
                class="btn btn-primary"
                id="continueGameButton"
            >
                Lanjutkan →
            </button>
        `;

        const continueButton = document.getElementById(
            "continueGameButton"
        );

        continueButton.addEventListener(
            "click",
            finishCurrentTurn
        );
    }


    // =====================================================
    // SPECIAL BOXES
    // =====================================================

    function handleSpecialBox(type, player) {
        let title = "";

        let icon = "";

        let points = 0;

        let description = "";

        switch (type) {

            case "bomb":

                icon = "💣";

                title = "BOOM!";

                points = -Math.abs(
                    Number(currentSettings.bombPoints) || 0
                );

                player.score += points;

                description =
                    `Sayang sekali! Poin kamu berkurang ` +
                    `${Math.abs(points)} poin.`;

                break;


            case "lucky":

                icon = "🍀";

                title = "LUCKY YOU!";

                points = Math.abs(
                    Number(currentSettings.luckyPoints) || 0
                );

                player.score += points;

                description =
                    `Keberuntungan berpihak padamu! ` +
                    `Kamu mendapatkan ${points} poin tambahan.`;

                break;


            case "double":

                icon = "⚡";

                title = "DOUBLE POINTS!";

                player.doubleNext = true;

                points = 0;

                description =
                    `Kuis berikutnya akan memberikan ` +
                    `${currentSettings.doubleMultiplier}x poin jika jawabanmu benar.`;

                break;


            case "empty":

                icon = "🌿";

                title = "EMPTY BOX";

                points = 0;

                description =
                    "Tidak ada poin kali ini. Tetap semangat untuk giliran berikutnya!";

                break;


            default:

                icon = "🎁";

                title = "MYSTERY BOX";

                description = "Box berhasil dibuka.";

        }


        pendingTurn = { type, result: { title, icon, points, description } };
        saveGameSession();
        renderSpecialResult(player, pendingTurn.result);
        renderLeaderboard();
    }

    function renderSpecialResult(player, { title, icon, points, description }) {
        clearModal();
        hideModalCloseButton();

        const pointsText = points > 0
            ? `+${points}`
            : String(points);


        modalContent.innerHTML = `

            <div class="special-result-icon">
                ${escapeHTML(icon)}
            </div>

            <h2>
                ${escapeHTML(title)}
            </h2>

            <div class="special-result-points">
                ${escapeHTML(pointsText)}
            </div>

            <p class="special-result-description">
                ${escapeHTML(description)}
            </p>

            <p>
                Player: <strong>${escapeHTML(player.name)}</strong>
            </p>

        `;


        showContinueButton();
        openModal();
    }


    // =====================================================
    // FINISH CURRENT TURN
    // =====================================================

    function finishCurrentTurn() {
        if (gameFinished || !pendingTurn?.result) {
            return;
        }

        closeModal();
        pendingTurn = null;
        turnIndex++;

        const remaining = boxes.filter(
            box => !box.used
        ).length;

        renderLeaderboard();

        if (remaining === 0) {
            finishGame();
            return;
        }

        updateGameDisplay();

        saveGameSession();
    }


    // =====================================================
    // LEADERBOARD SORTING
    // =====================================================

    function getSortedPlayers() {
        return [...players].sort(
            function (a, b) {

                // 1. Highest score.
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                // 2. Lowest total time.
                if (a.timeSpent !== b.timeSpent) {
                    return a.timeSpent - b.timeSpent;
                }

                // 3. Most correct answers.
                return b.correctAnswers - a.correctAnswers;

            }
        );
    }


    // =====================================================
    // LIVE LEADERBOARD
    // =====================================================

    function renderLeaderboard() {
        if (!leaderboardBody) {
            return;
        }

        const sortedPlayers = getSortedPlayers();

        leaderboardBody.innerHTML = "";

        sortedPlayers.forEach(
            function (player, index) {

                const row = document.createElement("tr");

                if (index === 0) {
                    row.classList.add("leaderboard-first");
                }

                row.innerHTML = `

                    <td>
                        ${index === 0 ? "🥇" :
                            index === 1 ? "🥈" :
                            index === 2 ? "🥉" :
                            index + 1}
                    </td>

                    <td>
                        ${escapeHTML(player.name)}
                    </td>

                    <td>
                        ${player.score}
                    </td>

                    <td>
                        ${player.correctAnswers}
                    </td>

                `;

                leaderboardBody.appendChild(row);

            }
        );
    }


    // =====================================================
    // GAME SESSION
    // =====================================================

    function saveGameSession() {

        if (players.length === 0) {
            return;
        }

        const session = {
            players: players,

            boxes: boxes,

            turnIndex: turnIndex,

            questionIndex: questionIndex,

            questionPool: questionPool,

            settings: currentSettings,

            pendingTurn: pendingTurn,

            gameFinished: gameFinished,

            savedAt: new Date().toISOString()
        };

        MBStorage.saveSession(session);
    }

    function showSessionChoice() {
        const session = MBStorage.getUnfinishedSession();

        if (session) {
            gameStatus.textContent = "Sesi tersimpan";
            hideElement(setupSection);
            showElement(resumeSection);
        } else {
            gameStatus.textContent = "Menunggu permainan";
            hideElement(resumeSection);
            showElement(setupSection);
        }
    }

    function resumeGame() {
        const session = MBStorage.getUnfinishedSession();
        if (!session) {
            showSessionChoice();
            return;
        }

        players = session.players;
        boxes = session.boxes;
        turnIndex = session.turnIndex;
        currentSettings = session.settings ?? MBStorage.getSettings();
        pendingTurn = session.pendingTurn ?? null;

        if (Array.isArray(session.questionPool)) {
            questionPool = session.questionPool;
            questionIndex = session.questionIndex ?? 0;
        } else {
            // Sesi lama hanya menyimpan kotak yang sudah dibuka dan skor pemain.
            questionPool = MBStorage.getActiveQuestions();
            shuffleQuestionPool();
            turnIndex = Math.max(turnIndex, boxes.filter(box => box.used).length);
        }

        showGameBoard();

        if (!pendingTurn && boxes.every(box => box.used)) {
            finishGame();
            return;
        }

        saveGameSession();

        if (pendingTurn?.type === "quiz") {
            showQuizModal(getCurrentPlayer(), pendingTurn.question);
            if (pendingTurn.result) {
                renderQuizResult(pendingTurn.question, pendingTurn.result);
            } else {
                startQuizTimer();
            }
        } else if (pendingTurn) {
            renderSpecialResult(getCurrentPlayer(), pendingTurn.result);
        }
    }


    // =====================================================
    // FINAL LEADERBOARD
    // =====================================================

    function renderFinalLeaderboard() {
        if (!finalLeaderboardBody) {
            return;
        }

        const sortedPlayers = getSortedPlayers();

        finalLeaderboardBody.innerHTML = "";

        sortedPlayers.forEach(
            function (player, index) {

                const row = document.createElement("tr");

                row.innerHTML = `

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(player.name)}
                    </td>

                    <td>
                        <strong>${player.score}</strong>
                    </td>

                    <td>
                        ${player.correctAnswers}
                    </td>

                    <td>
                        ${player.turns}
                    </td>

                    <td>
                        ${formatTime(player.timeSpent)}
                    </td>

                `;

                finalLeaderboardBody.appendChild(row);

            }
        );
    }


    // =====================================================
    // FINISH GAME
    // =====================================================

    function finishGame() {
        gameFinished = true;

        stopTimer();

        closeModal();

        hideElement(gameSection);

        showElement(resultSection);

        const sortedPlayers = getSortedPlayers();

        const winner = sortedPlayers[0];

        if (gameStatus) {
            gameStatus.textContent = "COMPLETED";
        }

        if (winnerMessage) {
            winnerMessage.textContent =
                "The adventure has ended!";
        }

        if (winnerDisplay) {

            winnerDisplay.innerHTML = `
                <div class="winner-trophy">
                    🏆
                </div>

                <div class="winner-label">
                    MYSTERY BOX CHAMPION
                </div>

                <h2>
                    ${escapeHTML(winner.name)}
                </h2>

                <p>
                    ${winner.score} Points
                </p>

                <small>
                    ${winner.correctAnswers} correct answers
                </small>
            `;

        }

        renderFinalLeaderboard();

        saveGameSession();

        console.log(
            "[Mystery Box] Permainan selesai.",
            {
                winner: winner,
                leaderboard: sortedPlayers
            }
        );
    }


    // =====================================================
    // EXCEL EXPORT
    // =====================================================

    async function exportLeaderboard() {
        if (players.length === 0) {
            alert("Belum ada hasil permainan.");

            return;
        }

        if (!window.MBExcel) {
            alert(
                "Excel module tidak ditemukan. " +
                "Pastikan excel.js dimuat sebelum game.js."
            );

            return;
        }

        await MBExcel.exportLeaderboard(
            getSortedPlayers()
        );
    }


    // =====================================================
    // RESTART GAME
    // =====================================================

    function showRestartDialog() {
        restartDialog.returnValue = "";
        restartDialog.showModal();
    }

    function restartGame() {
        stopTimer();

        closeModal();

        MBStorage.clearSession();

        players = [];

        boxes = [];

        turnIndex = 0;

        questionPool = [];

        questionIndex = 0;

        pendingTurn = null;

        gameFinished = false;

        currentSettings = null;

        hideElement(gameSection);

        hideElement(resultSection);

        hideElement(resumeSection);
        showElement(setupSection);

        gameStatus.textContent = "Menunggu permainan";

        renderPlayerInputs();
        playerCountInput.focus();

        console.log(
            "[Mystery Box] Siap untuk permainan baru."
        );
    }


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    function initializeEventListeners() {
        resumeGameButton.addEventListener("click", resumeGame);
        newGameButton.addEventListener("click", showRestartDialog);
        restartDialog.addEventListener("close", function () {
            if (restartDialog.returnValue === "restart") {
                restartGame();
            }
        });

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                pauseQuizTimer();
            } else {
                startQuizTimer();
            }
        });
        window.addEventListener("pagehide", pauseQuizTimer);
        window.addEventListener("pageshow", startQuizTimer);

        window.addEventListener("storage", function (event) {
            if (event.key !== MBStorage.STORAGE_KEYS.SESSION && event.key !== null) {
                return;
            }

            if (players.length > 0 && !gameFinished) {
                stopTimer();
                window.location.reload();
            } else if (!gameFinished) {
                showSessionChoice();
            }
        });

        if (playerCountInput) {

            playerCountInput.addEventListener(
                "change",
                renderPlayerInputs
            );

        }


        if (startGameButton) {

            startGameButton.addEventListener(
                "click",
                startGame
            );

        }


        if (closeModalButton) {

            closeModalButton.addEventListener(
                "click",
                finishCurrentTurn
            );

        }


        if (exportExcelButton) {

            exportExcelButton.addEventListener(
                "click",
                exportLeaderboard
            );

        }


        if (restartGameButton) {

            restartGameButton.addEventListener(
                "click",
                showRestartDialog
            );

        }

    }


    // =====================================================
    // INITIALIZATION
    // =====================================================

    function initializeGame() {

        if (!window.MBStorage) {

            console.error(
                "[Mystery Box] MBStorage tidak ditemukan. " +
                "Pastikan storage.js dimuat sebelum game.js."
            );

            return;
        }

        if (!window.MBExcel) {

            console.error(
                "[Mystery Box] MBExcel tidak ditemukan. " +
                "Pastikan excel.js dimuat sebelum game.js."
            );

        }

        renderPlayerInputs();

        showSessionChoice();
        initializeEventListeners();

        console.log(
            "%c MYSTERY BOX GAME READY ",
            "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
        );
    }


    // =====================================================
    // RUN
    // =====================================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeGame
        );

    } else {

        initializeGame();

    }

})();
