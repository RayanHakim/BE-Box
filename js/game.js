
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


    // =====================================================
    // GAME STATE
    // =====================================================

    let players = [];

    let boxes = [];

    let turnIndex = 0;

    let questionPool = [];

    let questionIndex = 0;

    let currentQuestion = null;

    let timerInterval = null;

    let questionStartedAt = null;

    let timeRemaining = 0;

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
        const activeQuestions =
            MBStorage.getActiveQuestions();

        questionPool = shuffleArray(activeQuestions);

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

        currentQuestion = null;

        shuffleQuestionPool();

        hideElement(setupSection);

        hideElement(resultSection);

        showElement(gameSection);

        updateGameDisplay();

        renderBoxes();

        renderLeaderboard();

        saveGameSession();

        console.log(
            "[Mystery Box] Game dimulai.",
            {
                players: players,
                boxes: boxes.length
            }
        );
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
        if (gameFinished) {
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

        saveGameSession();

        if (box.type === "quiz") {
            handleQuizBox(player);
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

        currentQuestion = null;
    }


    function hideModalCloseButton() {
        if (closeModalButton) {
            closeModalButton.classList.add("hidden");
        }
    }


    function showModalCloseButton() {
        if (closeModalButton) {
            closeModalButton.classList.remove("hidden");
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

    function handleQuizBox(player) {
        const question = getNextQuestion();

        if (!question) {
            player.turns--;

            alert(
                "Tidak ada pertanyaan aktif. " +
                "Permainan tidak dapat dilanjutkan."
            );

            boxGrid.querySelectorAll(
                ".mystery-box"
            ).forEach(function (button) {
                button.disabled = true;
            });

            return;
        }

        currentQuestion = question;

        showQuizModal(player, question);
    }


    function showQuizModal(player, question) {
        clearModal();

        hideModalCloseButton();

        const difficulty = question.difficulty;

        const difficultyPoints = {
            easy: currentSettings.easyPoints,
            medium: currentSettings.mediumPoints,
            hard: currentSettings.hardPoints
        };

        const basePoints =
            Number(difficultyPoints[difficulty]) || 0;

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

        initializeQuizTimer(player, question, basePoints);

        modalContent.querySelectorAll(
            ".quiz-option"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const selectedAnswer =
                            button.dataset.answer;

                        handleQuizAnswer(
                            player,
                            question,
                            selectedAnswer,
                            basePoints,
                            false
                        );

                    }
                );

            }
        );
    }


    // =====================================================
    // QUIZ TIMER
    // =====================================================

    function initializeQuizTimer(
        player,
        question,
        basePoints
    ) {
        stopTimer();

        timeRemaining = Math.max(
            1,
            Number(currentSettings.timerDuration) || 20
        );

        questionStartedAt = Date.now();

        updateTimerDisplay();

        timerInterval = setInterval(
            function () {

                timeRemaining--;

                updateTimerDisplay();

                if (timeRemaining <= 0) {

                    handleQuizAnswer(
                        player,
                        question,
                        null,
                        basePoints,
                        true
                    );

                }

            },
            1000
        );
    }


    function updateTimerDisplay() {
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

            if (timeRemaining <= 5) {
                timerElement.classList.add("danger");
            } else {
                timerElement.classList.remove("danger");
            }

        }
    }


    function stopTimer() {
        if (timerInterval !== null) {
            clearInterval(timerInterval);

            timerInterval = null;
        }
    }


    // =====================================================
    // QUIZ ANSWER
    // =====================================================

    function handleQuizAnswer(
        player,
        question,
        selectedAnswer,
        basePoints,
        isTimeout
    ) {
        // Mencegah jawaban diproses dua kali.
        if (
            !currentQuestion ||
            currentQuestion.id !== question.id
        ) {
            return;
        }

        stopTimer();

        const elapsedSeconds = Math.max(
            0,
            Math.ceil(
                (Date.now() - questionStartedAt) / 1000
            )
        );

        player.timeSpent += elapsedSeconds;

        const isCorrect =
            !isTimeout &&
            selectedAnswer === question.answer;

        let earnedPoints = 0;

        if (isCorrect) {

            earnedPoints = basePoints;

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
                    button.classList.add("incorrect");
                }

            }
        );


        // Display result.
        let resultTitle = "";

        let resultDescription = "";

        if (isTimeout) {

            resultTitle = "Time's Up! ⏰";

            resultDescription =
                `Waktu habis. Jawaban yang benar adalah ` +
                `${question.answer}. Tidak ada poin yang diperoleh.`;

        } else if (isCorrect) {

            resultTitle = "Correct Answer! 🎉";

            resultDescription =
                `Kamu mendapatkan +${earnedPoints} poin!`;

        } else {

            resultTitle = "Wrong Answer! 😵";

            resultDescription =
                `Jawaban yang benar adalah ${question.answer}.`;

        }


        const resultElement = document.createElement("div");

        resultElement.className = "quiz-result";

        resultElement.innerHTML = `
            <h3>${resultTitle}</h3>
            <p>${escapeHTML(resultDescription)}</p>
        `;

        modalContent.appendChild(resultElement);


        // Next turn button.
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
            function () {
                finishCurrentTurn();
            }
        );

        currentQuestion = null;

        renderLeaderboard();

        saveGameSession();
    }


    // =====================================================
    // SPECIAL BOXES
    // =====================================================

    function handleSpecialBox(type, player) {
        clearModal();

        hideModalCloseButton();

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


        const pointsText = points > 0
            ? `+${points}`
            : String(points);


        modalContent.innerHTML = `

            <div class="special-result-icon">
                ${icon}
            </div>

            <h2>
                ${title}
            </h2>

            <div class="special-result-points">
                ${pointsText}
            </div>

            <p class="special-result-description">
                ${escapeHTML(description)}
            </p>

            <p>
                Player: <strong>${escapeHTML(player.name)}</strong>
            </p>

        `;


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

        renderLeaderboard();

        saveGameSession();

        openModal();
    }


    // =====================================================
    // FINISH CURRENT TURN
    // =====================================================

    function finishCurrentTurn() {
        stopTimer();

        closeModal();

        if (gameFinished) {
            return;
        }

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

            gameFinished: gameFinished,

            savedAt: new Date().toISOString()
        };

        MBStorage.saveSession(session);
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

        MBStorage.saveSession({
            players: players,
            boxes: boxes,
            turnIndex: turnIndex,
            gameFinished: true,
            savedAt: new Date().toISOString()
        });

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

    function restartGame() {
        const confirmed = confirm(
            "Mulai permainan baru?\n\n" +
            "Hasil permainan sebelumnya akan dihapus."
        );

        if (!confirmed) {
            return;
        }

        stopTimer();

        closeModal();

        MBStorage.clearSession();

        players = [];

        boxes = [];

        turnIndex = 0;

        questionPool = [];

        questionIndex = 0;

        currentQuestion = null;

        gameFinished = false;

        currentSettings = null;

        hideElement(gameSection);

        hideElement(resultSection);

        showElement(setupSection);

        renderPlayerInputs();

        console.log(
            "[Mystery Box] Siap untuk permainan baru."
        );
    }


    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    function initializeEventListeners() {

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
                function () {

                    // Modal quiz tidak boleh ditutup
                    // sebelum jawaban atau timer selesai.

                    if (currentQuestion) {
                        return;
                    }

                    finishCurrentTurn();

                }
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
                restartGame
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
