
/*
=========================================================
 MYSTERY BOX - ADMIN PANEL
=========================================================

Fitur:
1. Admin login.
2. Dashboard statistik.
3. Menampilkan daftar pertanyaan.
4. Menambah pertanyaan.
5. Mengedit pertanyaan.
6. Menghapus pertanyaan.
7. Mengaktifkan / menonaktifkan pertanyaan.
8. Pencarian dan filter.
9. Mengatur pengaturan permainan.
10. Logout.

Default login:
Username : admin
Password : 123

Penyimpanan:
LocalStorage melalui MBStorage.
=========================================================
*/

(function () {
    "use strict";

    // =====================================================
    // CONFIGURATION
    // =====================================================

    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "123";

    // =====================================================
    // DOM HELPER
    // =====================================================

    function getElement(id) {
        return document.getElementById(id);
    }

    function getQuestions() {
        return MBStorage.getQuestions();
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeQuestion(question) {
        if (!question || typeof question !== "object") {
            return null;
        }

        const answer = String(
            question.answer || question.correctAnswer || "A"
        ).toUpperCase();

        return {
            id: question.id,
            question: String(question.question || ""),
            category: String(question.category || "General Knowledge"),
            difficulty: String(question.difficulty || "easy").toLowerCase(),
            options: {
                A: String(question.options?.A || ""),
                B: String(question.options?.B || ""),
                C: String(question.options?.C || ""),
                D: String(question.options?.D || "")
            },
            answer,
            correctAnswer: answer,
            active: question.active !== false
        };
    }

    function showFeedback(element, message, type = "success") {
        if (!element) return;

        element.textContent = message;
        element.className = `feedback-message ${type}`;
        element.classList.remove("hidden");

        if (element.dataset.timeout) {
            clearTimeout(Number(element.dataset.timeout));
        }

        const timeout = setTimeout(() => {
            element.classList.add("hidden");
        }, 3500);

        element.dataset.timeout = String(timeout);
    }

    // =====================================================
    // DOM ELEMENTS
    // =====================================================

    const loginSection = getElement("adminLoginSection");
    const loginForm = getElement("adminLoginForm");
    const usernameInput = getElement("adminUsername");
    const passwordInput = getElement("adminPassword");
    const loginError = getElement("loginError");

    const dashboard = getElement("adminDashboard");
    const logoutButton = getElement("adminLogoutButton");

    const totalQuestionsElement = getElement("totalQuestions");
    const activeQuestionsElement = getElement("activeQuestions");
    const totalCategoriesElement = getElement("totalCategories");

    const questionTableBody = getElement("questionTableBody");
    const emptyQuestionState = getElement("emptyQuestionState");
    const addQuestionButton = getElement("addQuestionButton");

    const questionSearch = getElement("questionSearch");
    const categoryFilter = getElement("categoryFilter");
    const difficultyFilter = getElement("difficultyFilter");
    const statusFilter = getElement("statusFilter");

    const questionModal = getElement("questionModal");
    const questionModalTitle = getElement("questionModalTitle");
    const closeQuestionModalButton = getElement("closeQuestionModalButton");
    const questionForm = getElement("questionForm");
    const questionIdInput = getElement("questionId");
    const questionTextInput = getElement("questionText");
    const questionCategoryInput = getElement("questionCategory");
    const questionDifficultyInput = getElement("questionDifficulty");

    const optionAInput = getElement("optionA");
    const optionBInput = getElement("optionB");
    const optionCInput = getElement("optionC");
    const optionDInput = getElement("optionD");

    const correctAnswerInput = getElement("correctAnswer");
    const questionActiveInput = getElement("questionActive");
    const cancelQuestionButton = getElement("cancelQuestionButton");

    const settingInputs = {
        timerDuration: getElement("timerDuration"),
        easyPoints: getElement("easyPoints"),
        mediumPoints: getElement("mediumPoints"),
        hardPoints: getElement("hardPoints"),
        bombPoints: getElement("bombPoints"),
        luckyPoints: getElement("luckyPoints"),
        doubleMultiplier: getElement("doubleMultiplier"),
        bombCount: getElement("bombCount"),
        luckyCount: getElement("luckyCount"),
        doubleCount: getElement("doubleCount"),
        emptyCount: getElement("emptyCount")
    };

    const saveSettingsButton = getElement("saveSettingsButton");
    const settingsFeedback = getElement("settingsFeedback");

    // =====================================================
    // LOGIN
    // =====================================================

    function showLoginError(message) {
        if (!loginError) return;

        loginError.textContent = message;
        loginError.classList.remove("hidden");
    }

    function hideLoginError() {
        if (!loginError) return;

        loginError.textContent = "";
        loginError.classList.add("hidden");
    }

    function loginAdmin(event) {
        event.preventDefault();

        const username = usernameInput?.value.trim() || "";
        const password = passwordInput?.value || "";

        hideLoginError();

        if (
            username !== ADMIN_USERNAME ||
            password !== ADMIN_PASSWORD
        ) {
            showLoginError("Username atau password salah.");

            if (passwordInput) {
                passwordInput.value = "";
                passwordInput.focus();
            }

            return;
        }

        loginSection?.classList.add("hidden");
        dashboard?.classList.remove("hidden");

        if (passwordInput) {
            passwordInput.value = "";
        }

        initializeDashboard();

        console.log("[Mystery Box] Admin berhasil login.");
    }

    function logoutAdmin() {
        const confirmed = confirm(
            "Apakah kamu yakin ingin keluar dari Admin Panel?"
        );

        if (!confirmed) return;

        dashboard?.classList.add("hidden");
        loginSection?.classList.remove("hidden");

        closeQuestionModal();

        loginForm?.reset();
        hideLoginError();

        console.log("[Mystery Box] Admin logout.");
    }

    // =====================================================
    // DASHBOARD STATISTICS
    // =====================================================

    function updateDashboardStatistics() {
        const questions = getQuestions();

        const activeQuestions = questions.filter(
            question => question.active !== false
        );

        const categories = [
            ...new Set(
                questions
                    .map(question =>
                        String(question.category || "").trim()
                    )
                    .filter(Boolean)
            )
        ];

        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = questions.length;
        }

        if (activeQuestionsElement) {
            activeQuestionsElement.textContent = activeQuestions.length;
        }

        if (totalCategoriesElement) {
            totalCategoriesElement.textContent = categories.length;
        }
    }

    // =====================================================
    // CATEGORY FILTER
    // =====================================================

    function updateCategoryFilter() {
        if (!categoryFilter) return;

        const previousValue = categoryFilter.value;

        const categories = [
            ...new Set(
                getQuestions()
                    .map(question =>
                        String(question.category || "").trim()
                    )
                    .filter(Boolean)
            )
        ].sort((a, b) => a.localeCompare(b));

        categoryFilter.innerHTML =
            '<option value="all">Semua Kategori</option>';

        categories.forEach(category => {
            const option = document.createElement("option");

            option.value = category;
            option.textContent = category;

            categoryFilter.appendChild(option);
        });

        categoryFilter.value = categories.includes(previousValue)
            ? previousValue
            : "all";
    }

    // =====================================================
    // QUESTION FILTERING
    // =====================================================

    function getFilteredQuestions() {
        let questions = getQuestions();

        const searchValue = questionSearch
            ? questionSearch.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter?.value || "all";
        const selectedDifficulty = difficultyFilter?.value || "all";
        const selectedStatus = statusFilter?.value || "all";

        if (searchValue) {
            questions = questions.filter(question => {
                const questionText = String(
                    question.question || ""
                ).toLowerCase();

                const category = String(
                    question.category || ""
                ).toLowerCase();

                return (
                    questionText.includes(searchValue) ||
                    category.includes(searchValue)
                );
            });
        }

        if (selectedCategory !== "all") {
            questions = questions.filter(
                question => question.category === selectedCategory
            );
        }

        if (selectedDifficulty !== "all") {
            questions = questions.filter(
                question =>
                    String(question.difficulty).toLowerCase() ===
                    selectedDifficulty
            );
        }

        if (selectedStatus === "active") {
            questions = questions.filter(
                question => question.active !== false
            );
        } else if (selectedStatus === "inactive") {
            questions = questions.filter(
                question => question.active === false
            );
        }

        return questions;
    }

    // =====================================================
    // RENDER QUESTION TABLE
    // =====================================================

    function renderQuestionTable() {
        if (!questionTableBody) {
            console.error(
                "[Mystery Box] Elemen questionTableBody tidak ditemukan."
            );
            return;
        }

        const questions = getFilteredQuestions();

        questionTableBody.innerHTML = "";

        if (questions.length === 0) {
            if (emptyQuestionState) {
                emptyQuestionState.classList.remove("hidden");
            }

            return;
        }

        if (emptyQuestionState) {
            emptyQuestionState.classList.add("hidden");
        }

        const difficultyLabels = {
            easy: "Easy",
            medium: "Medium",
            hard: "Hard"
        };

        questions.forEach((rawQuestion, index) => {
            const question = normalizeQuestion(rawQuestion);

            if (!question) return;

            const row = document.createElement("tr");

            const difficulty = ["easy", "medium", "hard"].includes(
                question.difficulty
            )
                ? question.difficulty
                : "easy";

            const isActive = question.active;

            row.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    <div class="question-cell">
                        <strong>${escapeHTML(question.question)}</strong>
                        <small>${escapeHTML(question.category)}</small>
                    </div>
                </td>

                <td>
                    <span class="difficulty-badge ${difficulty}">
                        ${difficultyLabels[difficulty]}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${isActive ? "active" : "inactive"}">
                        ${isActive ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-btn"
                            data-action="edit"
                            data-id="${escapeHTML(question.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="action-btn"
                            data-action="toggle"
                            data-id="${escapeHTML(question.id)}"
                        >
                            ${isActive ? "Disable" : "Enable"}
                        </button>

                        <button
                            type="button"
                            class="action-btn delete"
                            data-action="delete"
                            data-id="${escapeHTML(question.id)}"
                        >
                            Delete
                        </button>
                    </div>
                </td>
            `;

            questionTableBody.appendChild(row);
        });
    }

    // =====================================================
    // REFRESH QUESTION DISPLAY
    // =====================================================

    function refreshQuestionDisplay() {
        updateDashboardStatistics();
        updateCategoryFilter();
        renderQuestionTable();

        console.log(
            "[Mystery Box] Data pertanyaan:",
            getQuestions()
        );
    }

    // =====================================================
    // QUESTION MODAL
    // =====================================================

    function openQuestionModal(question = null) {
        if (!questionModal || !questionForm) return;

        questionForm.reset();
        hideQuestionModalFeedback();

        if (question) {
            const data = normalizeQuestion(question);

            if (!data) return;

            if (questionModalTitle) {
                questionModalTitle.textContent = "Edit Question";
            }

            questionIdInput.value = data.id;
            questionTextInput.value = data.question;
            questionCategoryInput.value = data.category;
            questionDifficultyInput.value = data.difficulty;

            optionAInput.value = data.options.A;
            optionBInput.value = data.options.B;
            optionCInput.value = data.options.C;
            optionDInput.value = data.options.D;

            correctAnswerInput.value = data.answer;
            questionActiveInput.checked = data.active;
        } else {
            if (questionModalTitle) {
                questionModalTitle.textContent = "Add New Question";
            }

            questionIdInput.value = "";
            questionDifficultyInput.value = "easy";
            correctAnswerInput.value = "A";
            questionActiveInput.checked = true;
        }

        questionModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        setTimeout(() => {
            questionTextInput?.focus();
        }, 100);
    }

    function closeQuestionModal() {
        if (!questionModal) return;

        questionModal.classList.add("hidden");
        document.body.style.overflow = "";

        questionForm?.reset();
        hideQuestionModalFeedback();
    }

    function hideQuestionModalFeedback() {
        const feedback = questionModal?.querySelector(
            ".feedback-message"
        );

        if (!feedback) return;

        feedback.classList.add("hidden");
        feedback.textContent = "";
    }

    // =====================================================
    // QUESTION FORM
    // =====================================================

    function getQuestionFormData() {
        return {
            question: questionTextInput?.value.trim() || "",
            category: questionCategoryInput?.value.trim() || "",
            difficulty: questionDifficultyInput?.value || "easy",

            options: {
                A: optionAInput?.value.trim() || "",
                B: optionBInput?.value.trim() || "",
                C: optionCInput?.value.trim() || "",
                D: optionDInput?.value.trim() || ""
            },

            answer: String(
                correctAnswerInput?.value || "A"
            ).toUpperCase(),

            active: questionActiveInput?.checked !== false
        };
    }

    function validateQuestionForm(data) {
        if (!data.question) {
            return "Pertanyaan tidak boleh kosong.";
        }

        if (!data.category) {
            return "Kategori pertanyaan harus diisi.";
        }

        const optionValues = Object.values(data.options);

        if (optionValues.some(option => !option)) {
            return "Semua pilihan jawaban harus diisi.";
        }

        if (!["A", "B", "C", "D"].includes(data.answer)) {
            return "Pilih jawaban yang benar.";
        }

        if (!["easy", "medium", "hard"].includes(data.difficulty)) {
            return "Tingkat kesulitan tidak valid.";
        }

        return null;
    }

    function saveQuestion(event) {
        event.preventDefault();

        if (!window.MBStorage) {
            alert("Storage tidak ditemukan. Periksa storage.js.");
            return;
        }

        const id = questionIdInput?.value || "";
        const questionData = getQuestionFormData();

        const validationError = validateQuestionForm(questionData);

        if (validationError) {
            alert(validationError);
            return;
        }

        let saved = false;

        try {
            if (id) {
                saved = MBStorage.updateQuestion(id, questionData);
            } else {
                saved = Boolean(MBStorage.addQuestion(questionData));
            }
        } catch (error) {
            console.error(
                "[Mystery Box] Kesalahan menyimpan pertanyaan:",
                error
            );

            alert("Terjadi kesalahan saat menyimpan pertanyaan.");
            return;
        }

        if (!saved) {
            alert(
                "Pertanyaan gagal disimpan. Periksa kapasitas LocalStorage."
            );
            return;
        }

        closeQuestionModal();
        refreshQuestionDisplay();

        console.log(
            "[Mystery Box] Pertanyaan berhasil disimpan:",
            questionData
        );
    }

    // =====================================================
    // EDIT QUESTION
    // =====================================================

    function editQuestion(id) {
        const question = MBStorage.getQuestionById(id);

        if (!question) {
            alert("Pertanyaan tidak ditemukan.");
            return;
        }

        openQuestionModal(question);
    }

    // =====================================================
    // DELETE QUESTION
    // =====================================================

    function deleteQuestion(id) {
        const question = MBStorage.getQuestionById(id);

        if (!question) {
            alert("Pertanyaan tidak ditemukan.");
            return;
        }

        const confirmed = confirm(
            `Hapus pertanyaan ini?\n\n"${question.question}"`
        );

        if (!confirmed) return;

        const deleted = MBStorage.deleteQuestion(id);

        if (!deleted) {
            alert("Pertanyaan gagal dihapus.");
            return;
        }

        refreshQuestionDisplay();

        console.log(
            "[Mystery Box] Pertanyaan berhasil dihapus:",
            id
        );
    }

    // =====================================================
    // TOGGLE QUESTION STATUS
    // =====================================================

    function toggleQuestionStatus(id) {
        const question = MBStorage.getQuestionById(id);

        if (!question) {
            alert("Pertanyaan tidak ditemukan.");
            return;
        }

        const updated = MBStorage.updateQuestion(id, {
            active: question.active === false
        });

        if (!updated) {
            alert("Status pertanyaan gagal diperbarui.");
            return;
        }

        refreshQuestionDisplay();
    }

    // =====================================================
    // QUESTION TABLE ACTIONS
    // =====================================================

    function handleQuestionTableAction(event) {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (!id) return;

        switch (action) {
            case "edit":
                editQuestion(id);
                break;

            case "delete":
                deleteQuestion(id);
                break;

            case "toggle":
                toggleQuestionStatus(id);
                break;

            default:
                console.warn(
                    "[Mystery Box] Aksi tidak dikenal:",
                    action
                );
        }
    }

    // =====================================================
    // SETTINGS: LOAD
    // =====================================================

    function loadSettings() {
        const settings = MBStorage.getSettings();

        Object.keys(settingInputs).forEach(key => {
            const input = settingInputs[key];

            if (input && settings[key] !== undefined) {
                input.value = settings[key];
            }
        });
    }

    // =====================================================
    // SETTINGS: VALIDATION
    // =====================================================

    function validateSettings(settings) {
        const rules = {
            timerDuration: {
                min: 5,
                max: 300,
                label: "Durasi timer"
            },

            easyPoints: {
                min: 0,
                max: 100000,
                label: "Poin Easy"
            },

            mediumPoints: {
                min: 0,
                max: 100000,
                label: "Poin Medium"
            },

            hardPoints: {
                min: 0,
                max: 100000,
                label: "Poin Hard"
            },

            bombPoints: {
                min: 0,
                max: 100000,
                label: "Poin Bomb"
            },

            luckyPoints: {
                min: 0,
                max: 100000,
                label: "Poin Lucky"
            },

            doubleMultiplier: {
                min: 1,
                max: 10,
                label: "Double Multiplier"
            },

            bombCount: {
                min: 0,
                max: 100,
                label: "Jumlah Bomb"
            },

            luckyCount: {
                min: 0,
                max: 100,
                label: "Jumlah Lucky"
            },

            doubleCount: {
                min: 0,
                max: 100,
                label: "Jumlah Double"
            },

            emptyCount: {
                min: 0,
                max: 100,
                label: "Jumlah Empty"
            }
        };

        for (const key of Object.keys(rules)) {
            const value = settings[key];
            const rule = rules[key];

            if (
                !Number.isInteger(value) ||
                value < rule.min ||
                value > rule.max
            ) {
                return (
                    `${rule.label} harus berupa angka antara ` +
                    `${rule.min} dan ${rule.max}.`
                );
            }
        }

        return null;
    }

    // =====================================================
    // SETTINGS: SAVE
    // =====================================================

    function saveGameSettings() {
        const settings = {};

        Object.keys(settingInputs).forEach(key => {
            const input = settingInputs[key];

            if (input) {
                settings[key] = Number(input.value);
            }
        });

        const validationError = validateSettings(settings);

        if (validationError) {
            showFeedback(
                settingsFeedback,
                validationError,
                "error"
            );

            return;
        }

        const saved = MBStorage.saveSettings(settings);

        if (!saved) {
            showFeedback(
                settingsFeedback,
                "Pengaturan gagal disimpan.",
                "error"
            );

            return;
        }

        showFeedback(
            settingsFeedback,
            "Pengaturan berhasil disimpan.",
            "success"
        );

        console.log(
            "[Mystery Box] Pengaturan berhasil disimpan:",
            settings
        );
    }

    // =====================================================
    // TAB NAVIGATION
    // =====================================================

    function initializeTabs() {
        const tabButtons = document.querySelectorAll(".admin-tab");
        const tabContents = document.querySelectorAll(
            ".admin-tab-content"
        );

        tabButtons.forEach(button => {
            button.addEventListener("click", () => {
                const targetTab = button.dataset.tab;

                if (!targetTab) return;

                tabButtons.forEach(tab => {
                    tab.classList.remove("active");
                });

                tabContents.forEach(content => {
                    content.classList.add("hidden");
                });

                button.classList.add("active");

                const targetContent = getElement(
                    `${targetTab}Tab`
                );

                targetContent?.classList.remove("hidden");

                if (targetTab === "questions") {
                    refreshQuestionDisplay();
                }

                if (targetTab === "settings") {
                    loadSettings();
                }
            });
        });
    }

    // =====================================================
    // DASHBOARD INITIALIZATION
    // =====================================================

    function initializeDashboard() {
        initializeTabs();
        refreshQuestionDisplay();
        loadSettings();
    }

    // =====================================================
    // EVENT LISTENERS
    // =====================================================

    function initializeEventListeners() {
        // Login
        loginForm?.addEventListener("submit", loginAdmin);

        // Logout
        logoutButton?.addEventListener("click", logoutAdmin);

        // Add question
        addQuestionButton?.addEventListener("click", () => {
            openQuestionModal();
        });

        // Submit question form
        questionForm?.addEventListener("submit", saveQuestion);

        // Close modal
        closeQuestionModalButton?.addEventListener(
            "click",
            closeQuestionModal
        );

        cancelQuestionButton?.addEventListener(
            "click",
            closeQuestionModal
        );

        // Click outside modal
        questionModal?.addEventListener("click", event => {
            if (event.target === questionModal) {
                closeQuestionModal();
            }
        });

        // Escape key
        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                questionModal &&
                !questionModal.classList.contains("hidden")
            ) {
                closeQuestionModal();
            }
        });

        // Question table actions
        questionTableBody?.addEventListener(
            "click",
            handleQuestionTableAction
        );

        // Search
        questionSearch?.addEventListener(
            "input",
            renderQuestionTable
        );

        // Filters
        [
            categoryFilter,
            difficultyFilter,
            statusFilter
        ].forEach(filter => {
            filter?.addEventListener(
                "change",
                renderQuestionTable
            );
        });

        // Save settings
        saveSettingsButton?.addEventListener(
            "click",
            saveGameSettings
        );
    }

    // =====================================================
    // INITIALIZATION
    // =====================================================

    function initializeAdmin() {
        if (!window.MBStorage) {
            console.error(
                "[Mystery Box] MBStorage tidak ditemukan. " +
                "Pastikan storage.js dimuat sebelum admin.js."
            );

            alert(
                "Storage tidak ditemukan. Periksa urutan script di admin.html."
            );

            return;
        }

        initializeEventListeners();

        console.log(
            "%c MYSTERY BOX ADMIN READY ",
            "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
        );

        console.log(
            "[Mystery Box] Jumlah pertanyaan:",
            MBStorage.getQuestions().length
        );
    }

    // =====================================================
    // RUN
    // =====================================================

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeAdmin
        );
    } else {
        initializeAdmin();
    }

})();
