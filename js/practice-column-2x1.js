// ======================================================
// LATIHAN SISWA
// COLUMN MULTIPLICATION PATCH V1
// 2 DIGIT x 1 DIGIT - DIGIT BY DIGIT WITH CARRY
//
// Tujuan:
// - Bersusun hanya 2 digit x 1 digit.
// - Wajib mulai dari digit paling belakang.
// - Panah bantu bergerak dari pengali ke digit aktif.
// - Carry/simpanan muncul otomatis jika langkah pertama benar.
// - Jawaban salah tidak langsung dinilai; siswa boleh memperbaiki
//   sampai waktu habis.
// - Setelah langkah pertama benar, fokus pindah otomatis.
// - Setelah langkah kedua benar, jawaban auto-submit setelah jeda.
//
// File ini harus dimuat SETELAH practice.js dan SEBELUM
// practice-navigation-fix.js.
// ======================================================

(() => {

    // ==================================================
    // SETTINGS
    // ==================================================

    const STEP_ADVANCE_DELAY_MS = 450;
    const CORRECT_SUBMIT_DELAY_MS = 850;


    // ==================================================
    // DOM TAMBAHAN
    // ==================================================

    const topTensDigit =
        document.getElementById("columnTopTensDigit");

    const topOnesDigit =
        document.getElementById("columnTopOnesDigit");

    const bottomSingleDigit =
        document.getElementById("columnBottomSingleDigit");

    const carryBadge =
        document.getElementById("columnCarryBadge");

    const carryValue =
        document.getElementById("columnCarryValue");

    const carryNote =
        document.getElementById("columnCarryNote");

    const guideArrow =
        document.getElementById("columnGuideArrow");

    const guideArrowPath =
        document.getElementById("columnGuideArrowPath");

    const columnMethodText =
        document.getElementById("columnMethodText");

    const columnStep2Wrap =
        document.getElementById("columnStep2Wrap");


    // ==================================================
    // SAFETY
    // ==================================================

    if (
        !columnQuestionArea ||
        !columnTopNumber ||
        !columnBottomNumber ||
        !columnStep1Label ||
        !columnStep2Label ||
        !columnStep1Input ||
        !columnStep2Input ||
        !columnFinalInput ||
        !topTensDigit ||
        !topOnesDigit ||
        !bottomSingleDigit ||
        !carryBadge ||
        !carryValue ||
        !guideArrow ||
        !guideArrowPath ||
        !columnMethodText ||
        !columnStep2Wrap
    ) {

        console.error(
            "Column 2x1 patch: elemen HTML belum lengkap."
        );

        return;
    }


    // ==================================================
    // ORIGINAL FUNCTIONS
    // ==================================================

    const originalGenerateMultiDigitQuestions =
        generateMultiDigitQuestions;

    const originalRenderDirectQuestion =
        renderDirectQuestion;

    const originalResetQuestionInputs =
        resetQuestionInputs;

    const originalClearCurrentInputValues =
        clearCurrentInputValues;

    const originalFocusCurrentInput =
        focusCurrentInput;


    // ==================================================
    // HELP TEXT
    // ==================================================

    function setColumnHelpText() {

        const helpMain =
            document.querySelector(
                ".practice-help-main"
            );

        const helpNote =
            document.querySelector(
                ".practice-help-note"
            );


        if (helpMain) {

            helpMain.textContent =
                "Mulai dari angka paling belakang. Isi satu langkah, lalu fokus berpindah otomatis.";
        }


        if (helpNote) {

            helpNote.textContent =
                "Jika belum benar, jawaban tetap bisa diperbaiki sampai waktu habis.";
        }
    }


    function setDirectHelpText() {

        const helpMain =
            document.querySelector(
                ".practice-help-main"
            );

        const helpNote =
            document.querySelector(
                ".practice-help-note"
            );


        if (helpMain) {

            helpMain.innerHTML =
                'Tekan <strong class="enter-key">Enter / Selesai</strong> untuk mengirim jawaban.';
        }


        if (helpNote) {

            helpNote.textContent =
                "Jika belum benar, jawaban masih dapat diperbaiki sampai waktu habis.";
        }
    }


    // ==================================================
    // QUESTION GENERATOR OVERRIDE
    // ==================================================

    generateMultiDigitQuestions =
        function generateMultiDigitQuestions2x1(
            level
        ) {

            const config =
                level?.config || {};


            if (
                config.input_mode !==
                "column_steps"
            ) {

                return originalGenerateMultiDigitQuestions(
                    level
                );
            }


            const rawMinA =
                Number(config.min_a);

            const rawMaxA =
                Number(config.max_a);

            const rawMinB =
                Number(config.min_b);

            const rawMaxB =
                Number(config.max_b);


            const minA =
                Number.isInteger(rawMinA)
                    ? Math.max(10, rawMinA)
                    : 10;

            const maxA =
                Number.isInteger(rawMaxA)
                    ? Math.min(99, rawMaxA)
                    : 99;

            const minB =
                Number.isInteger(rawMinB)
                    ? Math.max(1, rawMinB)
                    : 2;

            const maxB =
                Number.isInteger(rawMaxB)
                    ? Math.min(9, rawMaxB)
                    : 9;


            if (
                minA > maxA ||
                minB > maxB
            ) {

                return [];
            }


            const target =
                Number(
                    level.question_count
                );

            const result = [];
            const used = new Set();

            let safety = 0;


            while (
                result.length < target &&
                safety < 5000
            ) {

                safety++;


                const a =
                    randomInteger(
                        minA,
                        maxA
                    );

                const b =
                    randomInteger(
                        minB,
                        maxB
                    );

                const key =
                    `${a}x${b}`;


                if (used.has(key)) {
                    continue;
                }


                used.add(key);


                result.push({

                    a,

                    b,

                    answer:
                        a * b

                });
            }


            return result;
        };


    // ==================================================
    // EXPECTED VALUES
    // ==================================================

    getColumnExpected =
        function getColumnExpected2x1(
            question
        ) {

            const a =
                Number(question.a);

            const b =
                Number(question.b);

            const tensDigit =
                Math.floor(a / 10);

            const onesDigit =
                a % 10;

            const firstProduct =
                b * onesDigit;

            const resultOnesDigit =
                firstProduct % 10;

            const carry =
                Math.floor(
                    firstProduct / 10
                );

            const frontResult =
                (b * tensDigit) + carry;

            const final =
                a * b;


            return {

                unitsDigit:
                    b,

                tensValue:
                    0,

                partial1:
                    resultOnesDigit,

                partial2:
                    frontResult,

                final,

                tensDigit,

                onesDigit,

                multiplier:
                    b,

                firstProduct,

                resultOnesDigit,

                carry,

                frontResult,

                serverPartial1:
                    final,

                serverPartial2:
                    0
            };
        };


    // ==================================================
    // DIRECT RENDER OVERRIDE
    // ==================================================

    renderDirectQuestion =
        function renderDirectQuestionWithHelp(
            question
        ) {

            setDirectHelpText();

            originalRenderDirectQuestion(
                question
            );
        };


    // ==================================================
    // COLUMN RENDER
    // ==================================================

    renderColumnQuestion =
        function renderColumnQuestion2x1(
            question
        ) {

            directQuestionArea
                .classList
                .add("hidden");

            columnQuestionArea
                .classList
                .remove("hidden");


            setColumnHelpText();


            const expected =
                getColumnExpected(
                    question
                );


            // Kompatibilitas engine lama.
            columnTopNumber.textContent =
                formatNumber(
                    question.a
                );

            columnBottomNumber.textContent =
                formatNumber(
                    question.b
                );


            // Tampilan digit baru.
            topTensDigit.textContent =
                String(
                    expected.tensDigit
                );

            topOnesDigit.textContent =
                String(
                    expected.onesDigit
                );

            bottomSingleDigit.textContent =
                String(
                    expected.multiplier
                );


            columnStep1Label.textContent =
                `${expected.multiplier} × ${expected.onesDigit} dulu`;

            columnStep2Label.textContent =
                expected.carry > 0
                    ? `${expected.multiplier} × ${expected.tensDigit} + simpanan ${expected.carry}`
                    : `${expected.multiplier} × ${expected.tensDigit}`;


            columnMethodText.textContent =
                `Mulai dari belakang: ${expected.multiplier} × ${expected.onesDigit}`;


            columnStep1Input.maxLength = 1;

            columnStep2Input.maxLength =
                String(
                    expected.frontResult
                ).length;


            columnFinalInput.value = "";
            columnFinalInput.disabled = true;
            columnFinalInput.tabIndex = -1;


            hideCarry();
            setArrowToOnes();
            setStep2Visible(false);


            topOnesDigit.classList.add(
                "column-active-digit"
            );

            topTensDigit.classList.remove(
                "column-active-digit"
            );
        };


    // ==================================================
    // RESET OVERRIDE
    // ==================================================

    resetQuestionInputs =
        function resetQuestionInputs2x1() {

            if (!isColumnMode()) {

                originalResetQuestionInputs();
                return;
            }


            answerFeedback.textContent = "";
            answerFeedback.className =
                "answer-feedback";


            answerInput.disabled = false;

            columnStep1Input.disabled = false;
            columnStep2Input.disabled = true;
            columnFinalInput.disabled = true;


            [
                columnStep1Input,
                columnStep2Input,
                columnFinalInput
            ].forEach(
                input => {

                    input.classList.remove(
                        "step-correct",
                        "step-wrong"
                    );
                }
            );


            hideCarry();
            setStep2Visible(false);
        };


    // ==================================================
    // CLEAR VALUE OVERRIDE
    // ==================================================

    clearCurrentInputValues =
        function clearCurrentInputValues2x1() {

            if (!isColumnMode()) {

                originalClearCurrentInputValues();
                return;
            }


            answerInput.value = "";

            columnStep1Input.value = "";
            columnStep2Input.value = "";
            columnFinalInput.value = "";


            columnStep1Input.disabled = false;
            columnStep2Input.disabled = true;
            columnFinalInput.disabled = true;


            [
                columnStep1Input,
                columnStep2Input,
                columnFinalInput
            ].forEach(
                input => {

                    input.classList.remove(
                        "step-correct",
                        "step-wrong"
                    );
                }
            );


            hideCarry();
            setStep2Visible(false);
            setArrowToOnes();
        };


    // ==================================================
    // INPUT VALUES OVERRIDE
    // ==================================================

    getColumnInputs =
        function getColumnInputs2x1() {

            return {

                partial1:
                    columnStep1Input
                        .value
                        .trim(),

                partial2:
                    columnStep2Input
                        .value
                        .trim(),

                final:
                    columnFinalInput
                        .value
                        .trim()
            };
        };


    columnInputsAreCorrect =
        function columnInputsAreCorrect2x1(
            inputs,
            expected
        ) {

            return (
                Number(inputs.partial1) ===
                    expected.resultOnesDigit
                &&
                Number(inputs.partial2) ===
                    expected.frontResult
                &&
                Number(inputs.final) ===
                    expected.final
            );
        };


    // ==================================================
    // LIVE MARKERS / RESTORE
    // ==================================================

    refreshColumnLiveMarkers =
        function refreshColumnLiveMarkers2x1() {

            const question =
                questions[
                    currentQuestionIndex
                ];


            if (!question) {
                return;
            }


            const expected =
                getColumnExpected(
                    question
                );


            columnStep1Input.classList.remove(
                "step-correct",
                "step-wrong"
            );

            columnStep2Input.classList.remove(
                "step-correct",
                "step-wrong"
            );


            const step1Correct =
                columnStep1Input.value !== ""
                &&
                Number(
                    columnStep1Input.value
                ) ===
                expected.resultOnesDigit;


            if (!step1Correct) {

                columnStep2Input.value = "";
                columnFinalInput.value = "";
                columnStep2Input.disabled = true;

                hideCarry();
                setStep2Visible(false);
                setArrowToOnes();

                topOnesDigit.classList.add(
                    "column-active-digit"
                );

                topTensDigit.classList.remove(
                    "column-active-digit"
                );

                return;
            }


            columnStep1Input.classList.add(
                "step-correct"
            );


            showCarry(
                expected.carry
            );

            setStep2Visible(true);
            columnStep2Input.disabled = false;
            setArrowToTens();


            const step2Correct =
                columnStep2Input.value !== ""
                &&
                Number(
                    columnStep2Input.value
                ) ===
                expected.frontResult;


            if (step2Correct) {

                columnStep2Input.classList.add(
                    "step-correct"
                );

                columnFinalInput.value =
                    String(
                        expected.final
                    );

                hideArrow();

                scheduleCorrectSubmit();

            } else {

                columnFinalInput.value = "";
            }
        };


    // ==================================================
    // FOCUS OVERRIDE
    // ==================================================

    focusCurrentInput =
        function focusCurrentInput2x1() {

            if (!isColumnMode()) {

                originalFocusCurrentInput();
                return;
            }


            if (answerLocked) {
                return;
            }


            const question =
                questions[
                    currentQuestionIndex
                ];


            if (!question) {
                return;
            }


            const expected =
                getColumnExpected(
                    question
                );


            const step1Correct =
                columnStep1Input.value !== ""
                &&
                Number(
                    columnStep1Input.value
                ) ===
                expected.resultOnesDigit;


            if (!step1Correct) {

                columnStep1Input.focus({
                    preventScroll: true
                });

                columnStep1Input.select();

                return;
            }


            columnStep2Input.disabled = false;
            setStep2Visible(true);


            columnStep2Input.focus({
                preventScroll: true
            });

            columnStep2Input.select();
        };


    // ==================================================
    // DISABLE OVERRIDE
    // ==================================================

    disableColumnInputs =
        function disableColumnInputs2x1() {

            columnStep1Input.disabled = true;
            columnStep2Input.disabled = true;
            columnFinalInput.disabled = true;
        };


    // ==================================================
    // SUBMIT OVERRIDE
    // ==================================================

    submitColumnAnswer =
        function submitColumnAnswer2x1() {

            if (answerLocked) {
                return;
            }


            const question =
                questions[
                    currentQuestionIndex
                ];


            if (!question) {
                return;
            }


            if (!hasAnyColumnInput()) {

                submitTimeout();
                return;
            }


            answerLocked = true;


            clearTimer();

            clearTimeout(
                delayedSubmit
            );

            delayedSubmit = null;


            disableColumnInputs();
            hideArrow();


            const values =
                getColumnInputs();

            const expected =
                getColumnExpected(
                    question
                );


            const step1Correct =
                values.partial1 !== ""
                &&
                Number(values.partial1) ===
                    expected.resultOnesDigit;


            const step2Correct =
                values.partial2 !== ""
                &&
                Number(values.partial2) ===
                    expected.frontResult;


            const assembledAnswer =
                values.partial2 !== "" &&
                values.partial1 !== ""
                    ? `${values.partial2}${values.partial1}`
                    : "";


            const finalCorrect =
                assembledAnswer !== ""
                &&
                Number(assembledAnswer) ===
                    expected.final;


            const fullyCorrect =
                step1Correct
                &&
                step2Correct
                &&
                finalCorrect;


            applyColumnResultClass(
                columnStep1Input,
                step1Correct
            );

            applyColumnResultClass(
                columnStep2Input,
                step2Correct
            );


            let status;


            if (fullyCorrect) {

                status = "correct";
                correctCount++;


                answerFeedback.textContent =
                    expected.carry > 0
                        ? `✓ Benar • ${expected.multiplier} × ${expected.onesDigit} = ${expected.firstProduct}, simpan ${expected.carry} • ${expected.multiplier} × ${expected.tensDigit} + ${expected.carry} = ${expected.frontResult}`
                        : `✓ Benar • ${expected.multiplier} × ${expected.onesDigit} = ${expected.firstProduct} • ${expected.multiplier} × ${expected.tensDigit} = ${expected.frontResult}`;

                answerFeedback.className =
                    "answer-feedback feedback-correct";

            } else {

                status = "wrong";
                wrongCount++;


                answerFeedback.textContent =
                    `Belum tepat • Hasil akhir ${formatNumber(
                        expected.final
                    )}`;

                answerFeedback.className =
                    "answer-feedback feedback-wrong";
            }


            // ==================================================
            // DATA UNTUK SERVER
            //
            // Server lama mengenal partial_1, partial_2, final.
            // Karena pengali sekarang hanya 1 digit:
            // - partial_1 = hasil penuh a × b
            // - partial_2 = 0
            // - final     = hasil penuh
            //
            // Nilai ini menjaga kompatibilitas dengan grading
            // server yang sebelumnya digunakan untuk column_steps.
            // ==================================================

            const serverFinal =
                assembledAnswer;


            answers.push({

                a:
                    question.a,

                b:
                    question.b,

                user_answer:
                    serverFinal,

                steps: {

                    partial_1:
                        serverFinal,

                    partial_2:
                        serverFinal === ""
                            ? ""
                            : "0",

                    final:
                        serverFinal
                },

                response_time_ms:
                    getResponseTime(),

                client_status:
                    status
            });


            liveCorrect.textContent =
                String(correctCount);


            closeCurrentQuestionState();
            savePracticeState();


            setTimeout(
                nextQuestion,
                fullyCorrect
                    ? 900
                    : 1100
            );
        };


    // ==================================================
    // CAPTURE INPUT HANDLER
    // ==================================================

    function handleColumn2x1Input(
        event
    ) {

        if (!isColumnMode()) {
            return;
        }


        // Patch ini harus berjalan sebelum handler lama.
        event.stopImmediatePropagation();


        if (answerLocked) {
            return;
        }


        const question =
            questions[
                currentQuestionIndex
            ];


        if (!question) {
            return;
        }


        const expected =
            getColumnExpected(
                question
            );


        clearTimeout(
            delayedSubmit
        );

        delayedSubmit = null;


        if (
            event.currentTarget ===
            columnStep1Input
        ) {

            handleStep1Input(
                expected
            );

        } else if (
            event.currentTarget ===
            columnStep2Input
        ) {

            handleStep2Input(
                expected
            );
        }


        savePracticeState();
    }


    // ==================================================
    // STEP 1 INPUT
    // ==================================================

    function handleStep1Input(
        expected
    ) {

        columnStep1Input.value =
            sanitizeDigits(
                columnStep1Input.value,
                1
            );


        columnStep1Input.classList.remove(
            "step-correct",
            "step-wrong"
        );


        const value =
            columnStep1Input.value;


        if (value === "") {

            resetAfterIncorrectStep1(
                expected
            );

            return;
        }


        if (
            Number(value) !==
            expected.resultOnesDigit
        ) {

            // Salah: biarkan saja. Tidak auto-submit,
            // tidak pindah fokus, dan tidak langsung merah.
            resetAfterIncorrectStep1(
                expected,
                false
            );

            return;
        }


        columnStep1Input.classList.add(
            "step-correct"
        );


        showCarry(
            expected.carry
        );

        setStep2Visible(true);
        columnStep2Input.disabled = false;
        setArrowToTens();


        topOnesDigit.classList.remove(
            "column-active-digit"
        );

        topTensDigit.classList.add(
            "column-active-digit"
        );


        columnMethodText.textContent =
            expected.carry > 0
                ? `Lanjut: ${expected.multiplier} × ${expected.tensDigit}, lalu tambah simpanan ${expected.carry}`
                : `Lanjut: ${expected.multiplier} × ${expected.tensDigit}`;


        window.setTimeout(
            () => {

                if (
                    answerLocked ||
                    columnStep1Input.value === "" ||
                    Number(
                        columnStep1Input.value
                    ) !==
                    expected.resultOnesDigit
                ) {

                    return;
                }


                columnStep2Input.focus({
                    preventScroll: true
                });

                columnStep2Input.select();

            },
            STEP_ADVANCE_DELAY_MS
        );
    }


    // ==================================================
    // STEP 2 INPUT
    // ==================================================

    function handleStep2Input(
        expected
    ) {

        const step1Correct =
            columnStep1Input.value !== ""
            &&
            Number(
                columnStep1Input.value
            ) ===
            expected.resultOnesDigit;


        if (!step1Correct) {

            columnStep2Input.value = "";
            columnFinalInput.value = "";
            columnStep2Input.disabled = true;

            setStep2Visible(false);
            setArrowToOnes();

            columnStep1Input.focus({
                preventScroll: true
            });

            return;
        }


        const maxLength =
            String(
                expected.frontResult
            ).length;


        columnStep2Input.value =
            sanitizeDigits(
                columnStep2Input.value,
                maxLength
            );


        columnStep2Input.classList.remove(
            "step-correct",
            "step-wrong"
        );


        const value =
            columnStep2Input.value;


        if (
            value === "" ||
            Number(value) !==
                expected.frontResult
        ) {

            // Salah / belum lengkap: biarkan siswa memperbaiki.
            columnFinalInput.value = "";
            setArrowToTens();

            return;
        }


        columnStep2Input.classList.add(
            "step-correct"
        );


        columnFinalInput.value =
            String(
                expected.final
            );


        columnMethodText.textContent =
            `Hasilnya ${expected.final}. Bagus.`;


        hideArrow();
        scheduleCorrectSubmit();
    }


    // ==================================================
    // ENTER HANDLER
    // ==================================================

    function handleColumn2x1Keydown(
        event
    ) {

        if (!isColumnMode()) {
            return;
        }


        if (event.key !== "Enter") {
            return;
        }


        event.preventDefault();
        event.stopImmediatePropagation();


        if (answerLocked) {
            return;
        }


        const question =
            questions[
                currentQuestionIndex
            ];


        if (!question) {
            return;
        }


        const expected =
            getColumnExpected(
                question
            );


        if (
            event.currentTarget ===
            columnStep1Input
        ) {

            if (
                columnStep1Input.value !== "" &&
                Number(
                    columnStep1Input.value
                ) ===
                expected.resultOnesDigit
            ) {

                columnStep2Input.disabled = false;
                setStep2Visible(true);

                columnStep2Input.focus({
                    preventScroll: true
                });

                columnStep2Input.select();
            }


            return;
        }


        if (
            event.currentTarget ===
            columnStep2Input
        ) {

            const fullyCorrect =
                columnStep1Input.value !== ""
                &&
                Number(
                    columnStep1Input.value
                ) ===
                expected.resultOnesDigit
                &&
                columnStep2Input.value !== ""
                &&
                Number(
                    columnStep2Input.value
                ) ===
                expected.frontResult;


            if (fullyCorrect) {

                columnFinalInput.value =
                    String(
                        expected.final
                    );

                submitColumnAnswer();
            }
        }
    }


    // ==================================================
    // CORRECT AUTO SUBMIT
    // ==================================================

    function scheduleCorrectSubmit() {

        clearTimeout(
            delayedSubmit
        );


        delayedSubmit =
            window.setTimeout(
                () => {

                    if (answerLocked) {
                        return;
                    }


                    const question =
                        questions[
                            currentQuestionIndex
                        ];


                    if (!question) {
                        return;
                    }


                    const expected =
                        getColumnExpected(
                            question
                        );


                    const fullyCorrect =
                        columnStep1Input.value !== ""
                        &&
                        Number(
                            columnStep1Input.value
                        ) ===
                        expected.resultOnesDigit
                        &&
                        columnStep2Input.value !== ""
                        &&
                        Number(
                            columnStep2Input.value
                        ) ===
                        expected.frontResult;


                    if (!fullyCorrect) {
                        return;
                    }


                    columnFinalInput.value =
                        String(
                            expected.final
                        );


                    submitColumnAnswer();

                },
                CORRECT_SUBMIT_DELAY_MS
            );
    }


    // ==================================================
    // CARRY
    // ==================================================

    function showCarry(
        value
    ) {

        if (
            !Number.isFinite(
                Number(value)
            ) ||
            Number(value) <= 0
        ) {

            hideCarry();
            return;
        }


        carryValue.textContent =
            String(value);

        carryBadge.classList.remove(
            "hidden"
        );


        if (carryNote) {

            carryNote.textContent =
                `Simpan ${value}`;
        }
    }


    function hideCarry() {

        carryValue.textContent = "";

        carryBadge.classList.add(
            "hidden"
        );


        if (carryNote) {

            carryNote.textContent = "";
        }
    }


    // ==================================================
    // ARROW
    // ==================================================

    function setArrowToOnes() {

        guideArrow.classList.remove(
            "hidden"
        );

        guideArrow.classList.remove(
            "arrow-to-tens"
        );

        guideArrow.classList.add(
            "arrow-to-ones"
        );


        guideArrowPath.setAttribute(
            "d",
            "M 178 132 C 205 112, 210 80, 188 45"
        );
    }


    function setArrowToTens() {

        guideArrow.classList.remove(
            "hidden"
        );

        guideArrow.classList.remove(
            "arrow-to-ones"
        );

        guideArrow.classList.add(
            "arrow-to-tens"
        );


        guideArrowPath.setAttribute(
            "d",
            "M 178 132 C 150 108, 132 78, 126 45"
        );
    }


    function hideArrow() {

        guideArrow.classList.add(
            "hidden"
        );
    }


    // ==================================================
    // STEP 2 VISIBILITY
    // ==================================================

    function setStep2Visible(
        visible
    ) {

        columnStep2Wrap.classList.toggle(
            "column-step-locked",
            !visible
        );

        columnStep2Wrap.setAttribute(
            "aria-hidden",
            visible
                ? "false"
                : "true"
        );
    }


    // ==================================================
    // RESET AFTER WRONG STEP 1
    // ==================================================

    function resetAfterIncorrectStep1(
        expected,
        clearFeedback = true
    ) {

        clearTimeout(
            delayedSubmit
        );

        delayedSubmit = null;


        columnStep2Input.value = "";
        columnFinalInput.value = "";
        columnStep2Input.disabled = true;


        columnStep2Input.classList.remove(
            "step-correct",
            "step-wrong"
        );


        hideCarry();
        setStep2Visible(false);
        setArrowToOnes();


        topOnesDigit.classList.add(
            "column-active-digit"
        );

        topTensDigit.classList.remove(
            "column-active-digit"
        );


        columnMethodText.textContent =
            `Mulai dari belakang: ${expected.multiplier} × ${expected.onesDigit}`;


        if (clearFeedback) {

            answerFeedback.textContent = "";
            answerFeedback.className =
                "answer-feedback";
        }
    }


    // ==================================================
    // DIGIT SANITIZER
    // ==================================================

    function sanitizeDigits(
        value,
        maxLength
    ) {

        return String(
            value ?? ""
        )
        .replace(
            /\D/g,
            ""
        )
        .slice(
            0,
            Math.max(
                1,
                Number(maxLength) || 1
            )
        );
    }


    // ==================================================
    // CAPTURE LISTENERS
    //
    // Didaftarkan sebelum practice-navigation-fix.js,
    // sehingga handler kolom lama tidak ikut berjalan.
    // ==================================================

    columnStep1Input.addEventListener(
        "input",
        handleColumn2x1Input,
        true
    );

    columnStep2Input.addEventListener(
        "input",
        handleColumn2x1Input,
        true
    );

    columnFinalInput.addEventListener(
        "input",
        event => {

            if (!isColumnMode()) {
                return;
            }

            event.stopImmediatePropagation();
        },
        true
    );


    columnStep1Input.addEventListener(
        "keydown",
        handleColumn2x1Keydown,
        true
    );

    columnStep2Input.addEventListener(
        "keydown",
        handleColumn2x1Keydown,
        true
    );

    columnFinalInput.addEventListener(
        "keydown",
        event => {

            if (!isColumnMode()) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
        },
        true
    );

})();
