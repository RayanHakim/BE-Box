
/*
=========================================================
 MYSTERY BOX - LOCAL STORAGE
=========================================================

Fungsi:
1. Menyimpan dan membaca pertanyaan.
2. Menyimpan dan membaca pengaturan permainan.
3. Menyimpan dan membaca sesi permainan.
4. Menyediakan ID unik untuk setiap data.
5. Menyediakan pertanyaan bawaan saat pertama kali dibuka.

Semua data disimpan di browser menggunakan LocalStorage.
Tidak membutuhkan database atau backend.
*/

(function () {
    "use strict";

    // =====================================================
    // STORAGE KEYS
    // =====================================================

    const STORAGE_KEYS = {
        QUESTIONS: "mb_questions",
        SETTINGS: "mb_settings",
        SESSION: "mb_session",
        GAME_HISTORY: "mb_game_history",
        MUSIC_ENABLED: "mb_music_enabled"
    };


    // =====================================================
    // DEFAULT SETTINGS
    // =====================================================

    const DEFAULT_SETTINGS = {
        timerDuration: 20,

        easyPoints: 100,
        mediumPoints: 150,
        hardPoints: 200,

        bombPoints: 100,
        luckyPoints: 100,
        doubleMultiplier: 2,

        bombCount: 3,
        luckyCount: 3,
        doubleCount: 2,
        unluckyCount: 2
    };


    // =====================================================
    // DEFAULT QUESTIONS
    // =====================================================

    const DEFAULT_QUESTIONS = [

        {
            id: "q001",
            question: "Apa ibu kota negara Jepang?",
            category: "Geography",
            difficulty: "easy",
            options: {
                A: "Seoul",
                B: "Tokyo",
                C: "Beijing",
                D: "Bangkok"
            },
            answer: "B",
            active: true
        },

        {
            id: "q002",
            question: "Planet terbesar dalam tata surya adalah?",
            category: "Science",
            difficulty: "easy",
            options: {
                A: "Mars",
                B: "Saturnus",
                C: "Jupiter",
                D: "Venus"
            },
            answer: "C",
            active: true
        },

        {
            id: "q003",
            question: "Berapa jumlah warna pada pelangi?",
            category: "General Knowledge",
            difficulty: "easy",
            options: {
                A: "5",
                B: "6",
                C: "7",
                D: "8"
            },
            answer: "C",
            active: true
        },

        {
            id: "q004",
            question: "Hewan darat tercepat di dunia adalah?",
            category: "Science",
            difficulty: "easy",
            options: {
                A: "Singa",
                B: "Cheetah",
                C: "Kuda",
                D: "Harimau"
            },
            answer: "B",
            active: true
        },

        {
            id: "q005",
            question: "Berapa hasil dari 12 x 12?",
            category: "Mathematics",
            difficulty: "easy",
            options: {
                A: "124",
                B: "132",
                C: "144",
                D: "156"
            },
            answer: "C",
            active: true
        },

        {
            id: "q006",
            question: "Negara yang terkenal dengan Menara Eiffel adalah?",
            category: "Geography",
            difficulty: "easy",
            options: {
                A: "Italia",
                B: "Jerman",
                C: "Prancis",
                D: "Spanyol"
            },
            answer: "C",
            active: true
        },

        {
            id: "q007",
            question: "Apa simbol kimia untuk emas?",
            category: "Science",
            difficulty: "medium",
            options: {
                A: "Ag",
                B: "Au",
                C: "Fe",
                D: "Cu"
            },
            answer: "B",
            active: true
        },

        {
            id: "q008",
            question: "Siapa penulis novel Laskar Pelangi?",
            category: "Literature",
            difficulty: "medium",
            options: {
                A: "Tere Liye",
                B: "Andrea Hirata",
                C: "Pramoedya Ananta Toer",
                D: "Dee Lestari"
            },
            answer: "B",
            active: true
        },

        {
            id: "q009",
            question: "Berapa jumlah tulang pada tubuh manusia dewasa?",
            category: "Science",
            difficulty: "medium",
            options: {
                A: "196",
                B: "206",
                C: "216",
                D: "226"
            },
            answer: "B",
            active: true
        },

        {
            id: "q010",
            question: "Samudra terbesar di dunia adalah?",
            category: "Geography",
            difficulty: "medium",
            options: {
                A: "Atlantik",
                B: "Hindia",
                C: "Arktik",
                D: "Pasifik"
            },
            answer: "D",
            active: true
        },

        {
            id: "q011",
            question: "Apa nama proses tumbuhan membuat makanan?",
            category: "Science",
            difficulty: "easy",
            options: {
                A: "Respirasi",
                B: "Fotosintesis",
                C: "Evaporasi",
                D: "Transpirasi"
            },
            answer: "B",
            active: true
        },

        {
            id: "q012",
            question: "Siapa presiden pertama Republik Indonesia?",
            category: "History",
            difficulty: "easy",
            options: {
                A: "Soeharto",
                B: "B.J. Habibie",
                C: "Soekarno",
                D: "Mohammad Hatta"
            },
            answer: "C",
            active: true
        },

        {
            id: "q013",
            question: "Berapa jumlah planet dalam tata surya?",
            category: "Science",
            difficulty: "medium",
            options: {
                A: "7",
                B: "8",
                C: "9",
                D: "10"
            },
            answer: "B",
            active: true
        },

        {
            id: "q014",
            question: "Apa nama gunung tertinggi di dunia?",
            category: "Geography",
            difficulty: "medium",
            options: {
                A: "Kilimanjaro",
                B: "Elbrus",
                C: "Everest",
                D: "Fuji"
            },
            answer: "C",
            active: true
        },

        {
            id: "q015",
            question: "Dalam komputer, kepanjangan CPU adalah?",
            category: "Technology",
            difficulty: "medium",
            options: {
                A: "Central Processing Unit",
                B: "Computer Personal Unit",
                C: "Central Program Utility",
                D: "Control Processing User"
            },
            answer: "A",
            active: true
        },

        {
            id: "q016",
            question: "Negara dengan jumlah penduduk terbesar di dunia saat ini adalah?",
            category: "Geography",
            difficulty: "hard",
            options: {
                A: "Amerika Serikat",
                B: "India",
                C: "Indonesia",
                D: "Tiongkok"
            },
            answer: "B",
            active: true
        },

        {
            id: "q017",
            question: "Siapa ilmuwan yang mengembangkan teori relativitas?",
            category: "Science",
            difficulty: "medium",
            options: {
                A: "Isaac Newton",
                B: "Nikola Tesla",
                C: "Albert Einstein",
                D: "Galileo Galilei"
            },
            answer: "C",
            active: true
        },

        {
            id: "q018",
            question: "Apa nama mata uang resmi Korea Selatan?",
            category: "General Knowledge",
            difficulty: "medium",
            options: {
                A: "Yen",
                B: "Won",
                C: "Yuan",
                D: "Baht"
            },
            answer: "B",
            active: true
        },

        {
            id: "q019",
            question: "Berapa jumlah sisi pada sebuah dodekagon?",
            category: "Mathematics",
            difficulty: "hard",
            options: {
                A: "10",
                B: "11",
                C: "12",
                D: "14"
            },
            answer: "C",
            active: true
        },

        {
            id: "q020",
            question: "Apa nama lapisan atmosfer tempat sebagian besar fenomena cuaca terjadi?",
            category: "Science",
            difficulty: "hard",
            options: {
                A: "Stratosfer",
                B: "Mesosfer",
                C: "Termosfer",
                D: "Troposfer"
            },
            answer: "D",
            active: true
        }

    ];


    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    function cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }


    function createId() {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return crypto.randomUUID();
        }

        return (
            "mb-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).substring(2, 10)
        );
    }


    function readStorage(key, fallback = null) {
        try {
            const rawData = localStorage.getItem(key);

            if (rawData === null) {
                return cloneData(fallback);
            }

            return JSON.parse(rawData);

        } catch (error) {
            console.error(
                `[MBStorage] Gagal membaca ${key}:`,
                error
            );

            return cloneData(fallback);
        }
    }


    function writeStorage(key, data) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {
            console.error(
                `[MBStorage] Gagal menyimpan ${key}:`,
                error
            );

            return false;
        }
    }


    // =====================================================
    // QUESTION STORAGE
    // =====================================================

    function getQuestions() {
        const rawData = localStorage.getItem(
            STORAGE_KEYS.QUESTIONS
        );

        // Seed hanya ketika data belum pernah dibuat.
        // Jika admin sengaja menghapus semua pertanyaan,
        // daftar kosong tetap dipertahankan.

        if (rawData === null) {
            saveQuestions(DEFAULT_QUESTIONS);

            return cloneData(DEFAULT_QUESTIONS);
        }

        const questions = readStorage(
            STORAGE_KEYS.QUESTIONS,
            []
        );

        return Array.isArray(questions)
            ? questions
            : [];
    }


    function saveQuestions(questions) {
        if (!Array.isArray(questions)) {
            console.error(
                "[MBStorage] Data pertanyaan harus berupa array."
            );

            return false;
        }

        return writeStorage(
            STORAGE_KEYS.QUESTIONS,
            questions
        );
    }


    function addQuestion(questionData) {
        const questions = getQuestions();

        const newQuestion = {
            id: createId(),
            question: questionData.question,
            category: questionData.category,
            difficulty: questionData.difficulty,
            options: {
                A: questionData.options.A,
                B: questionData.options.B,
                C: questionData.options.C,
                D: questionData.options.D
            },
            answer: questionData.answer,
            active: questionData.active !== false
        };

        questions.push(newQuestion);

        const saved = saveQuestions(questions);

        return saved ? cloneData(newQuestion) : null;
    }


    function updateQuestion(id, updatedData) {
        const questions = getQuestions();

        const index = questions.findIndex(
            question => question.id === id
        );

        if (index === -1) {
            return false;
        }

        questions[index] = {
            ...questions[index],
            ...updatedData,
            id: questions[index].id,
            options: {
                ...questions[index].options,
                ...(updatedData.options || {})
            }
        };

        return saveQuestions(questions);
    }


    function deleteQuestion(id) {
        const questions = getQuestions();

        const filteredQuestions = questions.filter(
            question => question.id !== id
        );

        if (filteredQuestions.length === questions.length) {
            return false;
        }

        return saveQuestions(filteredQuestions);
    }


    function getQuestionById(id) {
        const questions = getQuestions();

        const question = questions.find(
            item => item.id === id
        );

        return question
            ? cloneData(question)
            : null;
    }


    function getActiveQuestions() {
        return getQuestions().filter(
            question => question.active === true
        );
    }


    // =====================================================
    // SETTINGS STORAGE
    // =====================================================

    function getSettings() {
        const savedSettings = readStorage(
            STORAGE_KEYS.SETTINGS,
            {}
        );

        return {
            ...cloneData(DEFAULT_SETTINGS),
            ...(savedSettings || {}),
            unluckyCount: savedSettings?.unluckyCount ?? savedSettings?.emptyCount ?? DEFAULT_SETTINGS.unluckyCount
        };
    }


    function saveSettings(settings) {
        if (
            !settings ||
            typeof settings !== "object" ||
            Array.isArray(settings)
        ) {
            console.error(
                "[MBStorage] Pengaturan tidak valid."
            );

            return false;
        }

        const mergedSettings = {
            ...getSettings(),
            ...settings
        };

        return writeStorage(
            STORAGE_KEYS.SETTINGS,
            mergedSettings
        );
    }


    function resetSettings() {
        return writeStorage(
            STORAGE_KEYS.SETTINGS,
            DEFAULT_SETTINGS
        );
    }

    function getMusicEnabled() {
        return readStorage(STORAGE_KEYS.MUSIC_ENABLED, true);
    }

    function saveMusicEnabled(enabled) {
        return writeStorage(STORAGE_KEYS.MUSIC_ENABLED, enabled);
    }


    // =====================================================
    // GAME SESSION STORAGE
    // =====================================================

    function getSession() {
        return readStorage(
            STORAGE_KEYS.SESSION,
            null
        );
    }

    function getUnfinishedSession() {
        const session = getSession();

        if (
            session?.gameFinished === false &&
            Array.isArray(session.players) && session.players.length > 0 &&
            Array.isArray(session.boxes) && session.boxes.length > 0 &&
            Number.isInteger(session.turnIndex) &&
            session.turnIndex >= 0 && session.turnIndex <= session.boxes.length
        ) {
            return session;
        }

        return null;
    }

    function archiveFinishedSession(session, history) {
        if (!session?.gameFinished || !session.savedAt || !Array.isArray(session.players) || session.players.length === 0) {
            return history;
        }

        const id = session.id ?? `legacy:${session.savedAt}`;
        if (history.some(game => game.id === id)) {
            return history;
        }

        const players = session.players.map(({ name, score, correctAnswers, turns, timeSpent }) => ({
            name, score, correctAnswers, turns, timeSpent
        }));
        const updated = [{ id, finishedAt: session.savedAt, players }, ...history]
            .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
            .slice(0, 3);
        writeStorage(STORAGE_KEYS.GAME_HISTORY, updated);
        return updated;
    }

    function readGameHistory() {
        const history = readStorage(STORAGE_KEYS.GAME_HISTORY, []);
        return Array.isArray(history) ? history : [];
    }

    function getGameHistory() {
        return archiveFinishedSession(getSession(), readGameHistory());
    }


    function saveSession(sessionData) {
        if (
            !sessionData ||
            typeof sessionData !== "object"
        ) {
            console.error(
                "[MBStorage] Sesi permainan tidak valid."
            );

            return false;
        }

        if (sessionData.gameFinished) {
            archiveFinishedSession(sessionData, readGameHistory());
        }

        return writeStorage(
            STORAGE_KEYS.SESSION,
            sessionData
        );
    }


    function clearSession() {
        try {
            getGameHistory();
            localStorage.removeItem(
                STORAGE_KEYS.SESSION
            );

            return true;

        } catch (error) {
            console.error(
                "[MBStorage] Gagal menghapus sesi:",
                error
            );

            return false;
        }
    }


    // =====================================================
    // RESET STORAGE
    // =====================================================

    function resetAll() {
        try {
            localStorage.removeItem(
                STORAGE_KEYS.QUESTIONS
            );

            localStorage.removeItem(
                STORAGE_KEYS.SETTINGS
            );

            localStorage.removeItem(
                STORAGE_KEYS.SESSION
            );

            localStorage.removeItem(
                STORAGE_KEYS.GAME_HISTORY
            );

            localStorage.removeItem(
                STORAGE_KEYS.MUSIC_ENABLED
            );

            return true;

        } catch (error) {
            console.error(
                "[MBStorage] Gagal mereset data:",
                error
            );

            return false;
        }
    }


    // =====================================================
    // PUBLIC API
    // =====================================================

    window.MBStorage = {

        // Constants
        STORAGE_KEYS,
        DEFAULT_SETTINGS,
        QUESTIONS_PER_PLAYER: 5,
        SPECIAL_BOXES_PER_PLAYER: 2,

        // Helper
        createId,

        // Questions
        getQuestions,
        saveQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        getQuestionById,
        getActiveQuestions,

        // Settings
        getSettings,
        saveSettings,
        resetSettings,
        getMusicEnabled,
        saveMusicEnabled,

        // Session
        getSession,
        getUnfinishedSession,
        getGameHistory,
        saveSession,
        clearSession,

        // Reset
        resetAll

    };


    // =====================================================
    // INITIALIZATION
    // =====================================================

    // Inisialisasi pertanyaan bawaan pada kunjungan pertama.
    getQuestions();

    console.log(
        "%c MYSTERY BOX STORAGE READY ",
        "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
    );

})();
