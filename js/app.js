(function () {
    "use strict";

    const startButton = document.querySelector('a[href="game.html"]');
    const activeQuestionCount = document.getElementById("activeQuestionCount");
    const minimumTurns = document.getElementById("minimumTurns");
    const secondsPerQuestion = document.getElementById("secondsPerQuestion");

    function updateHome() {
        const storage = window.MBStorage;
        if (!storage) {
            return;
        }

        const settings = storage.getSettings();

        activeQuestionCount.textContent = storage.getActiveQuestions().length;
        minimumTurns.textContent = storage.QUESTIONS_PER_PLAYER + storage.SPECIAL_BOXES_PER_PLAYER;
        secondsPerQuestion.textContent = settings.timerDuration;
    }

    startButton.addEventListener("click", function (event) {
        const storage = window.MBStorage;
        if (storage?.getUnfinishedSession() || storage?.getActiveQuestions().length > 0) {
            return;
        }

        event.preventDefault();
        alert("Belum ada pertanyaan aktif. Silakan tambahkan pertanyaan melalui Panel Admin.");
    });

    updateHome();
    window.addEventListener("pageshow", updateHome);
    window.addEventListener("storage", updateHome);
})();
