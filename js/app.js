(function () {
    "use strict";

    const startButton = document.querySelector('a[href="game.html"]');
    const activeQuestionCount = document.getElementById("activeQuestionCount");
    const specialBoxCount = document.getElementById("specialBoxCount");
    const secondsPerQuestion = document.getElementById("secondsPerQuestion");

    function updateHome() {
        const storage = window.MBStorage;
        if (!storage) {
            return;
        }

        const settings = storage.getSettings();
        const specialBoxes = [settings.bombCount, settings.luckyCount, settings.doubleCount, settings.emptyCount];

        activeQuestionCount.textContent = storage.getActiveQuestions().length;
        specialBoxCount.textContent = specialBoxes.reduce((total, count) => total + (Number(count) || 0), 0);
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
