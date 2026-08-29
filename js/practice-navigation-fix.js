// ======================================================
// LATIHAN SISWA
// PRACTICE FIXES V3
//
// Memperbaiki:
// 1. Ulangi latihan
// 2. Keluar dari latihan
// 3. Tombol lanjut
// 4. Prefix jawaban benar
// 5. Jawaban salah tidak auto-submit
//
// ATURAN V3:
//
// JAWABAN BENAR
// - Enter          = langsung submit
// - Tanpa Enter    = auto-submit setelah idle
//
// JAWABAN SALAH
// - Tidak auto-submit
// - Siswa masih boleh memperbaiki jawaban
// - Baru dinilai jika:
//      a. siswa menekan Enter
//      b. waktu soal habis
//
// Dengan demikian siswa mendapatkan waktu maksimal
// ketika jawabannya belum benar.
// ======================================================


(() => {

    // ==================================================
    // SETTINGS
    // ==================================================

    const DIRECT_CORRECT_IDLE_MS =
        1500;


    const COLUMN_CORRECT_IDLE_MS =
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


        if (
            !oldButton
        ) {

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
    // CLEANUP PRACTICE
    // ==================================================

    function cleanupPracticeBeforeNavigation() {

        discardPracticeStateOnUnload =
            true;


        try {

            clearTimer();

        } catch (error) {

            console.error(
                "Timer cleanup error:",
                error
            );

        }


        try {

            clearTimeout(
                delayedSubmit
            );

        } catch (error) {

            console.error(
                "Delayed submit cleanup error:",
                error
            );

        }


        try {

            clearSavedPracticeState();

        } catch (error) {

            console.error(
                "Practice state cleanup error:",
                error
            );

        }

    }


    // ==================================================
    // RETRY
    // ==================================================

    replaceButton(
        "retryButton",
        () => {

            cleanupPracticeBeforeNavigation();


            window.location.reload();

        }
    );


    // ==================================================
    // CONTINUE
    // ==================================================

    replaceButton(
        "continueButton",
        () => {

            cleanupPracticeBeforeNavigation();


            goBackToLevels();

        }
    );


    // ==================================================
    // QUIT
    // ==================================================

    replaceButton(
        "quitButton",
        () => {

            cleanupPracticeBeforeNavigation();


            goBackToLevels();

        }
    );


    // ==================================================
    // DIRECT INPUT FIX
    // ==================================================

    function handleSafeDirectInput(
        event
    ) {

        // --------------------------------------------------
        // Hentikan handler input lama dari practice.js
        // --------------------------------------------------

        event.stopImmediatePropagation();


        if (
            answerLocked
        ) {

            return;

        }


        // --------------------------------------------------
        // Hanya angka
        // --------------------------------------------------

        answerInput.value =
            answerInput.value
                .replace(
                    /\D/g,
                    ""
                );


        // --------------------------------------------------
        // Simpan state
        // --------------------------------------------------

        savePracticeState();


        // --------------------------------------------------
        // Batalkan auto-submit sebelumnya
        // --------------------------------------------------

        clearTimeout(
            delayedSubmit
        );


        delayedSubmit =
            null;


        const value =
            answerInput.value
                .trim();


        // --------------------------------------------------
        // Kosong
        // --------------------------------------------------

        if (
            value === ""
        ) {

            return;

        }


        // --------------------------------------------------
        // Ambil soal aktif
        // --------------------------------------------------

        const question =
            questions[
                currentQuestionIndex
            ];


        if (
            !question
        ) {

            return;

        }


        const correctText =
            String(
                question.answer
            );


        // ==================================================
        // JAWABAN SALAH
        //
        // PENTING:
        //
        // Jangan submit.
        //
        // Berikan siswa seluruh sisa waktu untuk
        // memperbaiki jawabannya.
        //
        // Jika siswa menekan Enter sendiri,
        // listener keydown dari practice.js tetap
        // akan melakukan submit.
        //
        // Jika tidak menekan Enter,
        // handleTimerEnd() dari practice.js akan
        // menilai jawaban ketika waktu habis.
        // ==================================================

        if (
            value !==
            correctText
        ) {

            return;

        }


        // ==================================================
        // JAWABAN BENAR
        //
        // Jangan langsung submit saat digit benar muncul.
        //
        // Tunggu siswa berhenti mengetik agar kasus:
        //
        // jawaban benar = 5
        // siswa ingin mengetik = 50
        //
        // tidak langsung dinilai ketika baru mengetik "5".
        // ==================================================

        delayedSubmit =
            window.setTimeout(
                () => {

                    if (
                        answerLocked
                    ) {

                        return;

                    }


                    const latestValue =
                        answerInput.value
                            .trim();


                    // ------------------------------------------
                    // Input berubah selama menunggu
                    // ------------------------------------------

                    if (
                        latestValue !==
                        correctText
                    ) {

                        return;

                    }


                    submitDirectAnswer();

                },
                DIRECT_CORRECT_IDLE_MS
            );

    }


    // ==================================================
    // DIRECT INPUT LISTENER
    //
    // capture=true agar berjalan sebelum handler
    // lama dari practice.js.
    // ==================================================

    if (
        answerInput
    ) {

        answerInput.addEventListener(
            "input",
            handleSafeDirectInput,
            true
        );

    }


    // ==================================================
    // COLUMN INPUT FIX
    // ==================================================

    function handleSafeColumnInput(
        event
    ) {

        // --------------------------------------------------
        // Hentikan handler lama
        // --------------------------------------------------

        event.stopImmediatePropagation();


        if (
            answerLocked
        ) {

            return;

        }


        const input =
            event.currentTarget;


        // --------------------------------------------------
        // Hanya angka
        // --------------------------------------------------

        input.value =
            input.value
                .replace(
                    /\D/g,
                    ""
                );


        // --------------------------------------------------
        // Hapus indikator sementara
        //
        // Indikator benar/salah final baru diberikan
        // setelah jawaban benar-benar disubmit.
        // --------------------------------------------------

        [
            columnStep1Input,
            columnStep2Input,
            columnFinalInput
        ].forEach(
            element => {

                if (
                    !element
                ) {

                    return;

                }


                element.classList.remove(
                    "step-correct",
                    "step-wrong"
                );

            }
        );


        // --------------------------------------------------
        // Simpan state
        // --------------------------------------------------

        savePracticeState();


        // --------------------------------------------------
        // Batalkan auto-submit lama
        // --------------------------------------------------

        clearTimeout(
            delayedSubmit
        );


        delayedSubmit =
            null;


        // --------------------------------------------------
        // Ambil soal
        // --------------------------------------------------

        const question =
            questions[
                currentQuestionIndex
            ];


        if (
            !question
        ) {

            return;

        }


        // --------------------------------------------------
        // Ambil input
        // --------------------------------------------------

        const values =
            getColumnInputs();


        // ==================================================
        // BELUM SEMUA FIELD DIISI
        //
        // Jangan submit.
        // ==================================================

        if (
            values.partial1 === "" ||
            values.partial2 === "" ||
            values.final === ""
        ) {

            return;

        }


        // --------------------------------------------------
        // Expected
        // --------------------------------------------------

        const expected =
            getColumnExpected(
                question
            );


        // --------------------------------------------------
        // Check masing-masing langkah
        // --------------------------------------------------

        const partial1Correct =
            Number(
                values.partial1
            )
            ===
            expected.partial1;


        const partial2Correct =
            Number(
                values.partial2
            )
            ===
            expected.partial2;


        const finalCorrect =
            Number(
                values.final
            )
            ===
            expected.final;


        const allCorrect =
            partial1Correct
            &&
            partial2Correct
            &&
            finalCorrect;


        // ==================================================
        // ADA JAWABAN SALAH
        //
        // Jangan auto-submit.
        //
        // Siswa mendapatkan seluruh sisa waktu untuk
        // memeriksa dan memperbaiki langkahnya.
        // ==================================================

        if (
            !allCorrect
        ) {

            return;

        }


        // ==================================================
        // SEMUA BENAR
        //
        // Tunggu sebentar sebelum auto-submit.
        // ==================================================

        delayedSubmit =
            window.setTimeout(
                () => {

                    if (
                        answerLocked
                    ) {

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


                    const latestQuestion =
                        questions[
                            currentQuestionIndex
                        ];


                    if (
                        !latestQuestion
                    ) {

                        return;

                    }


                    const latestExpected =
                        getColumnExpected(
                            latestQuestion
                        );


                    const latestAllCorrect =
                        Number(
                            latestValues.partial1
                        )
                            ===
                            latestExpected.partial1

                        &&

                        Number(
                            latestValues.partial2
                        )
                            ===
                            latestExpected.partial2

                        &&

                        Number(
                            latestValues.final
                        )
                            ===
                            latestExpected.final;


                    if (
                        !latestAllCorrect
                    ) {

                        return;

                    }


                    submitColumnAnswer();

                },
                COLUMN_CORRECT_IDLE_MS
            );

    }


    // ==================================================
    // COLUMN LISTENERS
    // ==================================================

    if (
        columnStep1Input
    ) {

        columnStep1Input.addEventListener(
            "input",
            handleSafeColumnInput,
            true
        );

    }


    if (
        columnStep2Input
    ) {

        columnStep2Input.addEventListener(
            "input",
            handleSafeColumnInput,
            true
        );

    }


    if (
        columnFinalInput
    ) {

        columnFinalInput.addEventListener(
            "input",
            handleSafeColumnInput,
            true
        );

    }

})();
