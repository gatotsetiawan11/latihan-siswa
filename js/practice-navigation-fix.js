// ======================================================
// LATIHAN SISWA
// PRACTICE FIXES V2
//
// Memperbaiki:
// 1. Ulangi latihan
// 2. Keluar dari latihan
// 3. Tombol lanjut
// 4. Auto-submit terlalu cepat
// 5. Prefix jawaban benar
//
// Contoh bug lama:
//
// Soal: 1 × 5
// Anak ingin menjawab: 50
//
// Saat mengetik:
// 5
//
// V4 langsung menganggap benar setelah 120ms.
//
// V2 FIX:
// Jawaban baru diperiksa setelah siswa berhenti
// mengetik selama beberapa saat.
//
// ENTER tetap dapat digunakan untuk submit langsung.
// ======================================================


(() => {

    // ==================================================
    // SETTINGS
    // ==================================================

    const DIRECT_IDLE_SUBMIT_MS =
        1500;

    const COLUMN_IDLE_SUBMIT_MS =
        1800;


    let discardPracticeStateOnUnload =
        false;


    // ==================================================
    // NAVIGATION STATE CLEANUP
    // ==================================================

    window.addEventListener(
        "pagehide",
        () => {

            if (
                discardPracticeStateOnUnload
                !== true
            ) {
                return;
            }


            try {

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Final practice cleanup error:",
                    error
                );

            }

        }
    );


    // ==================================================
    // BUTTON REPLACEMENT
    //
    // Clone button agar listener lama dari practice.js
    // tidak ikut dijalankan.
    // ==================================================

    function replaceButton(
        buttonId,
        clickHandler
    ) {

        const oldButton =
            document.getElementById(
                buttonId
            );


        if (!oldButton) {

            console.warn(
                `Button ${buttonId} tidak ditemukan.`
            );

            return;

        }


        const newButton =
            oldButton.cloneNode(
                true
            );


        oldButton.replaceWith(
            newButton
        );


        newButton.addEventListener(
            "click",
            clickHandler
        );

    }


    // ==================================================
    // RETRY
    // ==================================================

    replaceButton(
        "retryButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Retry cleanup error:",
                    error
                );

            }


            window.location.reload();

        }
    );


    // ==================================================
    // CONTINUE
    // ==================================================

    replaceButton(
        "continueButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Continue cleanup error:",
                    error
                );

            }


            goBackToLevels();

        }
    );


    // ==================================================
    // QUIT
    // ==================================================

    replaceButton(
        "quitButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Quit cleanup error:",
                    error
                );

            }


            goBackToLevels();

        }
    );


    // ==================================================
    // DIRECT INPUT FIX
    //
    // PENTING:
    //
    // Jangan pernah langsung submit hanya karena
    // input sementara sama dengan jawaban benar.
    //
    // Kita menunggu sampai siswa berhenti mengetik.
    // ==================================================

    function handleSafeDirectInput(
        event
    ) {

        /*
         * Hentikan input handler lama
         * milik Practice Engine V4.
         */

        event.stopImmediatePropagation();


        if (answerLocked) {

            return;

        }


        // Hanya angka
        answerInput.value =
            answerInput.value
                .replace(
                    /\D/g,
                    ""
                );


        /*
         * Simpan state agar refresh masih aman.
         */

        savePracticeState();


        /*
         * Setiap siswa mengetik digit baru,
         * timer submit lama dibatalkan.
         */

        clearTimeout(
            delayedSubmit
        );


        const value =
            answerInput.value
                .trim();


        if (value === "") {

            return;

        }


        /*
         * Jangan lihat jawaban benar di sini.
         *
         * Kita hanya melihat:
         * "apakah siswa sudah berhenti mengetik?"
         */

        delayedSubmit =
            setTimeout(
                () => {

                    if (answerLocked) {

                        return;

                    }


                    const finalValue =
                        answerInput.value
                            .trim();


                    if (
                        finalValue === ""
                    ) {

                        return;

                    }


                    submitDirectAnswer();

                },
                DIRECT_IDLE_SUBMIT_MS
            );

    }


    /*
     * capture = true
     *
     * Dengan capture listener, handler ini berjalan
     * sebelum listener input lama dari practice.js.
     */

    answerInput.addEventListener(
        "input",
        handleSafeDirectInput,
        true
    );


    // ==================================================
    // COLUMN INPUT FIX
    //
    // Risiko yang sama juga ada pada perkalian bersusun.
    //
    // Misalnya hasil benar 918,
    // anak ingin mengetik 9180.
    //
    // Jangan submit ketika baru mencapai 918.
    // ==================================================

    function handleSafeColumnInput(
        event
    ) {

        event.stopImmediatePropagation();


        if (answerLocked) {

            return;

        }


        const input =
            event.currentTarget;


        // Hanya angka
        input.value =
            input.value
                .replace(
                    /\D/g,
                    ""
                );


        /*
         * Hilangkan marker sementara.
         *
         * Jangan beri warna hijau hanya karena
         * angka yang sedang diketik kebetulan
         * sama dengan hasil benar.
         */

        [
            columnStep1Input,
            columnStep2Input,
            columnFinalInput
        ].forEach(
            element => {

                element.classList.remove(
                    "step-correct",
                    "step-wrong"
                );

            }
        );


        savePracticeState();


        clearTimeout(
            delayedSubmit
        );


        const values =
            getColumnInputs();


        /*
         * Belum semua langkah diisi.
         */

        if (
            values.partial1 === "" ||
            values.partial2 === "" ||
            values.final === ""
        ) {

            return;

        }


        /*
         * Setelah SEMUA field terisi,
         * tunggu siswa berhenti mengetik.
         */

        delayedSubmit =
            setTimeout(
                () => {

                    if (answerLocked) {

                        return;

                    }


                    const latestValues =
                        getColumnInputs();


                    if (
                        latestValues.partial1 === "" ||
                        latestValues.partial2 === "" ||
                        latestValues.final === ""
                    ) {

                        return;

                    }


                    submitColumnAnswer();

                },
                COLUMN_IDLE_SUBMIT_MS
            );

    }


    columnStep1Input.addEventListener(
        "input",
        handleSafeColumnInput,
        true
    );


    columnStep2Input.addEventListener(
        "input",
        handleSafeColumnInput,
        true
    );


    columnFinalInput.addEventListener(
        "input",
        handleSafeColumnInput,
        true
    );


})();
