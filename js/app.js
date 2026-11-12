
/*
=========================================================
 MYSTERY BOX - HOME PAGE
=========================================================

Fungsi:
1. Menginisialisasi halaman utama.
2. Menampilkan statistik pertanyaan.
3. Menampilkan informasi permainan.
4. Memberikan interaksi visual ringan.
5. Menambahkan efek animasi pada tombol.

Tidak membutuhkan backend.
=========================================================
*/

(function () {
    "use strict";


    // =====================================================
    // ELEMENTS
    // =====================================================

    const startButton = document.querySelector(
        'a[href="game.html"]'
    );

    const adminButton = document.querySelector(
        'a[href="admin.html"]'
    );

    const hero = document.querySelector(".hero");

    const miniStats = document.querySelector(
        ".mini-stats"
    );


    // =====================================================
    // STORAGE CHECK
    // =====================================================

    function getGameData() {
        if (!window.MBStorage) {
            console.warn(
                "[Mystery Box] MBStorage belum tersedia."
            );

            return {
                questions: [],
                activeQuestions: [],
                settings: null
            };
        }

        return {
            questions: MBStorage.getQuestions(),

            activeQuestions:
                MBStorage.getActiveQuestions(),

            settings: MBStorage.getSettings()
        };
    }


    // =====================================================
    // UPDATE HOME STATISTICS
    // =====================================================

    function updateStatistics() {
        if (!miniStats) {
            return;
        }

        const data = getGameData();

        const statItems = miniStats.querySelectorAll(
            "div"
        );

        if (statItems.length >= 3) {

            // Statistik pertama: jumlah pertanyaan aktif.
            const firstNumber =
                statItems[0].querySelector("b");

            const firstLabel =
                statItems[0].querySelector("small");

            if (firstNumber) {
                firstNumber.textContent =
                    String(data.activeQuestions.length)
                        .padStart(2, "0");
            }

            if (firstLabel) {
                firstLabel.textContent =
                    "Pertanyaan aktif";
            }


            // Statistik kedua: jumlah tipe special box.
            const secondNumber =
                statItems[1].querySelector("b");

            const secondLabel =
                statItems[1].querySelector("small");

            if (secondNumber && data.settings) {
                const totalSpecialBoxes =
                    Number(data.settings.bombCount || 0) +
                    Number(data.settings.luckyCount || 0) +
                    Number(data.settings.doubleCount || 0) +
                    Number(data.settings.emptyCount || 0);

                secondNumber.textContent =
                    String(totalSpecialBoxes).padStart(2, "0");
            }

            if (secondLabel) {
                secondLabel.textContent =
                    "Special boxes";
            }


            // Statistik ketiga: durasi timer.
            const thirdNumber =
                statItems[2].querySelector("b");

            const thirdLabel =
                statItems[2].querySelector("small");

            if (thirdNumber && data.settings) {
                thirdNumber.textContent =
                    String(data.settings.timerDuration)
                        .padStart(2, "0");
            }

            if (thirdLabel) {
                thirdLabel.textContent =
                    "Detik per soal";
            }
        }
    }


    // =====================================================
    // BUTTON INTERACTION
    // =====================================================

    function initializeButtonEffects() {
        const buttons = document.querySelectorAll(
            ".btn"
        );

        buttons.forEach(button => {

            button.addEventListener(
                "mouseenter",
                function () {
                    button.style.transform =
                        "translateY(-3px)";
                }
            );

            button.addEventListener(
                "mouseleave",
                function () {
                    button.style.transform = "";
                }
            );

        });
    }


    // =====================================================
    // HERO PARALLAX EFFECT
    // =====================================================

    function initializeHeroEffect() {
        if (!hero) {
            return;
        }

        // Efek hanya aktif pada perangkat dengan pointer mouse.
        if (
            window.matchMedia(
                "(hover: hover) and (pointer: fine)"
            ).matches === false
        ) {
            return;
        }

        hero.addEventListener(
            "mousemove",
            function (event) {

                const rect = hero.getBoundingClientRect();

                const x =
                    (event.clientX - rect.left) /
                    rect.width;

                const y =
                    (event.clientY - rect.top) /
                    rect.height;

                const moveX = (x - 0.5) * 5;
                const moveY = (y - 0.5) * 5;

                hero.style.setProperty(
                    "--mouse-x",
                    `${moveX}px`
                );

                hero.style.setProperty(
                    "--mouse-y",
                    `${moveY}px`
                );

            }
        );

        hero.addEventListener(
            "mouseleave",
            function () {
                hero.style.setProperty(
                    "--mouse-x",
                    "0px"
                );

                hero.style.setProperty(
                    "--mouse-y",
                    "0px"
                );
            }
        );
    }


    // =====================================================
    // PREVENT EMPTY QUESTION GAME
    // =====================================================

    function initializeStartButton() {
        if (!startButton) {
            return;
        }

        const label = document.getElementById("startGameLabel");

        function updateStartLabel() {
            label.textContent = window.MBStorage?.getUnfinishedSession()
                ? "Lanjutkan Permainan"
                : "Mulai Permainan";
        }

        updateStartLabel();
        window.addEventListener("pageshow", updateStartLabel);
        window.addEventListener("storage", updateStartLabel);

        startButton.addEventListener(
            "click",
            function (event) {

                if (window.MBStorage?.getUnfinishedSession()) {
                    return;
                }

                const data = getGameData();

                if (data.activeQuestions.length === 0) {
                    event.preventDefault();

                    alert(
                        "Belum ada pertanyaan aktif. " +
                        "Silakan tambahkan pertanyaan melalui Admin Panel."
                    );

                    return;
                }

            }
        );
    }


    // =====================================================
    // PREVENT ADMIN LINK ISSUE
    // =====================================================

    function initializeAdminButton() {
        if (!adminButton) {
            return;
        }

        adminButton.addEventListener(
            "click",
            function () {
                console.log(
                    "[Mystery Box] Membuka Admin Panel."
                );
            }
        );
    }


    // =====================================================
    // PAGE INITIALIZATION
    // =====================================================

    function initializeApp() {

        updateStatistics();

        initializeButtonEffects();

        initializeHeroEffect();

        initializeStartButton();

        initializeAdminButton();

        console.log(
            "%c MYSTERY BOX HOME READY ",
            "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
        );
    }


    // =====================================================
    // RUN
    // =====================================================

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeApp
        );

    } else {

        initializeApp();

    }

})();
