
/*
=========================================================
 MYSTERY BOX - EXCEL
=========================================================
 Ekspor leaderboard dan impor/ekspor bank soal (.xlsx).
=========================================================
*/

(function () {
    "use strict";

    const QUESTION_SHEET = "Bank Soal";
    const QUESTION_COLUMNS = ["ID", "Pertanyaan", "Kategori", "Kesulitan", "A", "B", "C", "D", "Kunci Jawaban", "Status"];
    let excelLibraryPromise = null;

    function loadExcelLibrary() {
        if (!excelLibraryPromise) {
            excelLibraryPromise = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "js/vendor/xlsx.mini.min.js";
                script.onload = () => {
                    if (window.XLSX) {
                        resolve(window.XLSX);
                    } else {
                        script.remove();
                        reject(new Error("Pustaka Excel gagal dimuat."));
                    }
                };
                script.onerror = () => {
                    script.remove();
                    reject(new Error("Pustaka Excel gagal dimuat."));
                };
                document.head.appendChild(script);
            }).catch(error => {
                excelLibraryPromise = null;
                throw error;
            });
        }

        return excelLibraryPromise;
    }


    // =====================================================
    // FORMAT PLAYER DATA
    // =====================================================

    function formatLeaderboard(players) {

        if (!Array.isArray(players)) {
            return [];
        }

        const sortedPlayers = [...players].sort(
            function (a, b) {

                // Skor tertinggi berada di posisi pertama.
                const scoreDifference =
                    Number(b.score || 0) -
                    Number(a.score || 0);

                if (scoreDifference !== 0) {
                    return scoreDifference;
                }

                // Jika skor sama, waktu lebih singkat menang.
                const timeDifference =
                    Number(a.timeSpent || 0) -
                    Number(b.timeSpent || 0);

                if (timeDifference !== 0) {
                    return timeDifference;
                }

                // Jika waktu sama, jawaban benar lebih banyak.
                return (
                    Number(b.correctAnswers || 0) -
                    Number(a.correctAnswers || 0)
                );

            }
        );


        return sortedPlayers.map(
            function (player, index) {

                return {
                    "Rank": index + 1,

                    "Player Name":
                        String(player.name || "Unknown"),

                    "Total Points":
                        Number(player.score || 0),

                    "Correct Answers":
                        Number(player.correctAnswers || 0),

                    "Total Turns":
                        Number(player.turns || 0),

                    "Total Time (Seconds)":
                        Number(player.timeSpent || 0)
                };

            }
        );
    }


    // =====================================================
    // GENERATE FILE NAME
    // =====================================================

    function generateFileName() {

        const now = new Date();

        const year = now.getFullYear();

        const month = String(
            now.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            now.getDate()
        ).padStart(2, "0");

        const hour = String(
            now.getHours()
        ).padStart(2, "0");

        const minute = String(
            now.getMinutes()
        ).padStart(2, "0");

        return (
            `Mystery_Box_Leaderboard_` +
            `${year}${month}${day}_` +
            `${hour}${minute}`
        );
    }


    // =====================================================
    // DOWNLOAD EXCEL
    // =====================================================

    async function exportToExcel(players) {

        const data = formatLeaderboard(players);

        if (data.length === 0) {
            alert(
                "Belum ada data pemain yang dapat diekspor."
            );

            return false;
        }

        try {

            const XLSX = await loadExcelLibrary();

            const worksheet =
                XLSX.utils.json_to_sheet(data);

            // Lebar kolom.
            worksheet["!cols"] = [
                { wch: 10 },
                { wch: 24 },
                { wch: 18 },
                { wch: 20 },
                { wch: 16 },
                { wch: 24 }
            ];

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Leaderboard"
            );

            // Informasi file hanya berupa hasil permainan.
            workbook.Props = {
                Title: "Mystery Box Leaderboard",
                Subject: "Game Results",
                Author: "Mystery Box",
                CreatedDate: new Date()
            };

            const fileName =
                generateFileName() + ".xlsx";

            XLSX.writeFile(
                workbook,
                fileName
            );

            console.log(
                "[Mystery Box] Excel berhasil dibuat:",
                fileName
            );

            return true;

        } catch (error) {

            console.error(
                "[Mystery Box] Export Excel gagal:",
                error
            );

            const useCSV = confirm(
                "File Excel tidak dapat dibuat.\n\n" +
                "Apakah kamu ingin mengunduh CSV sebagai alternatif? " +
                "File CSV tetap dapat dibuka menggunakan Microsoft Excel."
            );

            if (useCSV) {
                return exportToCSV(players);
            }

            return false;

        }
    }


    // =====================================================
    // CSV FALLBACK
    // =====================================================

    function exportToCSV(players) {

        const data = formatLeaderboard(players);

        if (data.length === 0) {
            alert(
                "Belum ada data pemain yang dapat diekspor."
            );

            return false;
        }

        const headers = Object.keys(data[0]);

        const escapeCSV = function (value) {

            const stringValue = String(value ?? "");

            return (
                '"' +
                stringValue.replace(/"/g, '""') +
                '"'
            );

        };

        const rows = data.map(
            function (row) {

                return headers.map(
                    header => escapeCSV(row[header])
                ).join(",");

            }
        );

        const csvContent = [
            headers.map(escapeCSV).join(","),
            ...rows
        ].join("\r\n");

        // BOM agar karakter UTF-8 terbaca dengan baik di Excel.
        const blob = new Blob(
            ["\uFEFF" + csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            generateFileName() + ".csv";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log(
            "[Mystery Box] CSV berhasil dibuat."
        );

        return true;
    }


    // =====================================================
    // QUESTION BANK
    // =====================================================

    async function exportQuestions(questions) {
        const XLSX = await loadExcelLibrary();
        const rows = questions.map(question => [
            String(question.id ?? ""), question.question, question.category, question.difficulty,
            question.options.A, question.options.B, question.options.C, question.options.D,
            question.answer, question.active ? "Aktif" : "Nonaktif"
        ]);
        const worksheet = XLSX.utils.aoa_to_sheet([QUESTION_COLUMNS, ...rows]);
        worksheet["!cols"] = [34, 64, 24, 14, 25, 25, 25, 25, 17, 14].map(wch => ({ wch }));
        worksheet["!autofilter"] = { ref: worksheet["!ref"] };

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, QUESTION_SHEET);
        XLSX.writeFile(workbook, "bank-soal.xlsx");
    }

    async function readQuestions(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!/\.xlsx$/i.test(file.name) || bytes[0] !== 0x50 || bytes[1] !== 0x4B) {
            throw new Error("Pilih file Excel berformat .xlsx.");
        }

        const XLSX = await loadExcelLibrary();
        let workbook;
        try {
            workbook = XLSX.read(bytes, { nodim: true });
        } catch {
            throw new Error("File Excel tidak dapat dibaca. Periksa apakah file bisa dibuka di Excel.");
        }

        const worksheet = workbook.Sheets[QUESTION_SHEET] ?? workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet?.["!ref"]) {
            throw new Error("Lembar bank soal kosong.");
        }

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: true });
        const firstRow = XLSX.utils.decode_range(worksheet["!ref"]).s.r + 1;
        const headers = rows.shift().map(value => String(value).trim().toLowerCase());
        const columns = QUESTION_COLUMNS.map(name => {
            const header = name.toLowerCase();
            const column = headers.indexOf(header);
            if (column === -1 && name !== "ID") {
                throw new Error(`Kolom "${name}" tidak ditemukan. Gunakan format dari Ekspor Excel.`);
            }
            if (column !== -1 && column !== headers.lastIndexOf(header)) {
                throw new Error(`Kolom "${name}" muncul lebih dari sekali.`);
            }
            return column;
        });

        const questions = [];
        rows.forEach((row, index) => {
            const values = columns.map(column => String(row[column] ?? "").trim());
            if (values.every(value => value === "")) {
                return;
            }

            const rowNumber = firstRow + index + 1;
            const [id, question, category, difficulty, A, B, C, D, answer, status] = values;
            const statusValue = status.toLowerCase();
            if (!["aktif", "nonaktif", "true", "false", "1", "0"].includes(statusValue)) {
                throw new Error(`Baris ${rowNumber}: Status harus Aktif atau Nonaktif.`);
            }

            questions.push({
                rowNumber,
                id,
                question,
                category,
                difficulty: difficulty.toLowerCase(),
                options: { A, B, C, D },
                answer: answer.toUpperCase(),
                active: ["aktif", "true", "1"].includes(statusValue)
            });
        });

        if (questions.length === 0) {
            throw new Error("Tidak ada soal untuk diimpor.");
        }

        return questions;
    }

    // =====================================================
    // PUBLIC API
    // =====================================================

    window.MBExcel = {

        exportLeaderboard: exportToExcel,

        exportCSV: exportToCSV,

        formatLeaderboard: formatLeaderboard,

        exportQuestions,

        readQuestions

    };


    console.log(
        "%c MYSTERY BOX EXCEL READY ",
        "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
    );

})();
