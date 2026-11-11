
/*
=========================================================
 MYSTERY BOX - EXCEL EXPORT
=========================================================

Fungsi:
1. Mengekspor leaderboard pemain.
2. Membuat file Excel (.xlsx).
3. Menyediakan CSV sebagai fallback.
4. Hanya mengekspor hasil permainan.

Data yang diekspor:
- Peringkat
- Nama pemain
- Total poin
- Jawaban benar
- Jumlah giliran
- Total waktu

Tidak mengekspor:
- Pertanyaan
- Pilihan jawaban
- Kunci jawaban
- Pengaturan admin
=========================================================
*/

(function () {
    "use strict";


    // =====================================================
    // CONFIGURATION
    // =====================================================

    const EXCEL_LIBRARY_URL =
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";


    // =====================================================
    // LOAD EXCEL LIBRARY
    // =====================================================

    let excelLibraryPromise = null;

    function loadExcelLibrary() {

        // Jika library sudah tersedia, langsung gunakan.
        if (window.XLSX) {
            return Promise.resolve(window.XLSX);
        }

        // Mencegah pemuatan script berulang.
        if (excelLibraryPromise) {
            return excelLibraryPromise;
        }

        excelLibraryPromise = new Promise(
            function (resolve, reject) {

                const existingScript = document.querySelector(
                    'script[data-mysterybox-xlsx="true"]'
                );

                if (existingScript) {

                    existingScript.addEventListener(
                        "load",
                        function () {
                            if (window.XLSX) {
                                resolve(window.XLSX);
                            } else {
                                reject(
                                    new Error(
                                        "Library Excel gagal dimuat."
                                    )
                                );
                            }
                        },
                        { once: true }
                    );

                    existingScript.addEventListener(
                        "error",
                        function () {
                            reject(
                                new Error(
                                    "Tidak dapat memuat library Excel."
                                )
                            );
                        },
                        { once: true }
                    );

                    return;
                }

                const script = document.createElement("script");

                script.src = EXCEL_LIBRARY_URL;

                script.async = true;

                script.dataset.mysteryboxXlsx = "true";

                script.onload = function () {

                    if (window.XLSX) {
                        resolve(window.XLSX);
                    } else {
                        reject(
                            new Error(
                                "Library Excel tidak ditemukan."
                            )
                        );
                    }

                };

                script.onerror = function () {

                    reject(
                        new Error(
                            "Gagal mengunduh library Excel. Periksa koneksi internet."
                        )
                    );

                };

                document.head.appendChild(script);

            }
        );

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
                "Kemungkinan koneksi internet tidak tersedia.\n\n" +
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
    // PUBLIC API
    // =====================================================

    window.MBExcel = {

        exportLeaderboard: exportToExcel,

        exportCSV: exportToCSV,

        formatLeaderboard: formatLeaderboard

    };


    console.log(
        "%c MYSTERY BOX EXCEL READY ",
        "background:#183F35;color:#fff;padding:6px 12px;border-radius:4px;"
    );

})();
