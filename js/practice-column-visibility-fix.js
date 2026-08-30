// ============================================================
// LATIHAN SISWA
// COLUMN VISIBILITY FIX V2
//
// Tingkat 10 - 15 = mode perkalian bersusun
//
// Fungsi:
// - menyembunyikan soal biasa
// - menyembunyikan input jawaban biasa
// - memastikan area bersusun tetap tampil
//
// Tidak bergantung pada window.levelData.
// ============================================================

(() => {

    // ========================================================
    // URL
    // ========================================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const currentStage =
        Number(
            params.get(
                "stage"
            )
        );


    // ========================================================
    // DETEKSI MODE BERSUSUN
    //
    // Saat ini struktur final:
    // Tingkat 10 - 15 = perkalian bersusun.
    // ========================================================

    function shouldUseColumnMode() {

        // Cara paling stabil:
        // baca Tingkat langsung dari URL.

        if (
            Number.isInteger(
                currentStage
            )
            &&
            currentStage >= 10
            &&
            currentStage <= 15
        ) {

            return true;
        }


        // Fallback tambahan apabila struktur berubah nanti.

        try {

            if (
                typeof levelData !== "undefined"
                &&
                levelData
                &&
                levelData.config
            ) {

                const inputMode =
                    String(
                        levelData.config.input_mode
                        ||
                        ""
                    );


                const columnMethod =
                    String(
                        levelData.config.column_method
                        ||
                        ""
                    );


                if (
                    inputMode === "column_steps"
                    ||
                    columnMethod === "digit_by_digit"
                    ||
                    columnMethod === "long_multiplication_2x2"
                ) {

                    return true;
                }
            }

        } catch (error) {

            // Fallback URL di atas tetap digunakan.
        }


        return false;
    }


    // ========================================================
    // APPLY
    // ========================================================

    function applyVisibility() {

        const columnMode =
            shouldUseColumnMode();


        const directArea =
            document.getElementById(
                "directQuestionArea"
            );


        const columnArea =
            document.getElementById(
                "columnQuestionArea"
            );


        const questionText =
            document.getElementById(
                "questionText"
            );


        const answerInput =
            document.getElementById(
                "answerInput"
            );


        // ====================================================
        // MODE BERSUSUN
        // ====================================================

        if (columnMode) {

            document.documentElement
                .classList
                .add(
                    "column-mode-active"
                );


            if (document.body) {

                document.body
                    .classList
                    .add(
                        "column-mode-active"
                    );
            }


            // ------------------------------------------------
            // SEMBUNYIKAN SOAL BIASA SECARA PAKSA
            // ------------------------------------------------

            if (directArea) {

                directArea.classList.add(
                    "hidden"
                );


                directArea.style.setProperty(
                    "display",
                    "none",
                    "important"
                );


                directArea.style.setProperty(
                    "visibility",
                    "hidden",
                    "important"
                );


                directArea.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }


            // Safety tambahan:
            // sembunyikan isi langsung juga.

            if (questionText) {

                questionText.style.setProperty(
                    "display",
                    "none",
                    "important"
                );
            }


            if (answerInput) {

                answerInput.style.setProperty(
                    "display",
                    "none",
                    "important"
                );


                answerInput.disabled =
                    true;


                answerInput.tabIndex =
                    -1;
            }


            // ------------------------------------------------
            // PASTIKAN AREA BERSUSUN TERBUKA
            // ------------------------------------------------

            if (columnArea) {

                columnArea.classList.remove(
                    "hidden"
                );


                columnArea.style.removeProperty(
                    "display"
                );


                columnArea.style.removeProperty(
                    "visibility"
                );


                columnArea.removeAttribute(
                    "aria-hidden"
                );
            }


            return;
        }


        // ====================================================
        // MODE SOAL BIASA
        // ====================================================

        document.documentElement
            .classList
            .remove(
                "column-mode-active"
            );


        if (document.body) {

            document.body
                .classList
                .remove(
                    "column-mode-active"
                );
        }


        if (directArea) {

            directArea.style.removeProperty(
                "display"
            );


            directArea.style.removeProperty(
                "visibility"
            );


            directArea.removeAttribute(
                "aria-hidden"
            );
        }


        if (questionText) {

            questionText.style.removeProperty(
                "display"
            );
        }


        if (answerInput) {

            answerInput.style.removeProperty(
                "display"
            );


            answerInput.disabled =
                false;


            answerInput.removeAttribute(
                "tabindex"
            );
        }
    }


    // ========================================================
    // JALANKAN LANGSUNG
    // ========================================================

    applyVisibility();


    // ========================================================
    // JALANKAN SETELAH PAGE LOAD
    // ========================================================

    window.addEventListener(
        "load",
        applyVisibility
    );


    window.addEventListener(
        "pageshow",
        applyVisibility
    );


    // ========================================================
    // PRACTICE.JS / ENGINE LAIN BISA MENGUBAH CLASS
    // SETELAH SOAL DIRENDER.
    //
    // Karena itu cek kembali setelah render.
    // ========================================================

    const delays = [
        0,
        50,
        150,
        300,
        600,
        1000,
        1500
    ];


    delays.forEach(
        delay => {

            setTimeout(
                applyVisibility,
                delay
            );
        }
    );


    // ========================================================
    // OBSERVER
    //
    // Jika script latihan mencoba membuka directQuestionArea
    // kembali, langsung sembunyikan lagi.
    // ========================================================

    function startObserver() {

        const directArea =
            document.getElementById(
                "directQuestionArea"
            );


        if (
            !directArea
            ||
            !shouldUseColumnMode()
        ) {

            return;
        }


        const observer =
            new MutationObserver(
                () => {

                    directArea.classList.add(
                        "hidden"
                    );


                    directArea.style.setProperty(
                        "display",
                        "none",
                        "important"
                    );


                    directArea.style.setProperty(
                        "visibility",
                        "hidden",
                        "important"
                    );
                }
            );


        observer.observe(
            directArea,
            {
                attributes: true,
                attributeFilter: [
                    "class",
                    "style"
                ]
            }
        );
    }


    setTimeout(
        startObserver,
        100
    );

})();
