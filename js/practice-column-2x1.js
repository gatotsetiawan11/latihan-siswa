// ======================================================
// LATIHAN SISWA - COLUMN MULTIPLICATION V2
//
// Tingkat 10:
// 2 digit x 1 digit, tanpa carry
//
// Tingkat 11:
// 2 digit x 1 digit, carry diperbolehkan
//
// Tingkat 12:
// 3 digit x 1 digit, tanpa carry
//
// Tingkat 13:
// 3 digit x 1 digit, carry diperbolehkan
//
// Dimuat setelah practice.js dan sebelum
// practice-navigation-fix.js
// ======================================================

(() => {

    const STEP_DELAY = 420;
    const SUBMIT_DELAY = 850;


    // ==================================================
    // DOM
    // ==================================================

    const topTensDigit =
        document.getElementById(
            "columnTopTensDigit"
        );

    const topOnesDigit =
        document.getElementById(
            "columnTopOnesDigit"
        );

    const bottomSingleDigit =
        document.getElementById(
            "columnBottomSingleDigit"
        );

    const carryBadge =
        document.getElementById(
            "columnCarryBadge"
        );

    const carryValue =
        document.getElementById(
            "columnCarryValue"
        );

    const carryNote =
        document.getElementById(
            "columnCarryNote"
        );

    const guideArrow =
        document.getElementById(
            "columnGuideArrow"
        );

    const guideArrowPath =
        document.getElementById(
            "columnGuideArrowPath"
        );

    const columnMethodText =
        document.getElementById(
            "columnMethodText"
        );

    const columnStep2Wrap =
        document.getElementById(
            "columnStep2Wrap"
        );

    const columnBoard =
        document.querySelector(
            ".column-board-2x1"
        );

    const topGrid =
        document.querySelector(
            ".column-top-grid"
        );

    const bottomGrid =
        document.querySelector(
            ".column-bottom-grid"
        );

    const resultGrid =
        document.querySelector(
            ".column-result-grid"
        );


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
        !columnStep2Wrap ||
        !columnBoard ||
        !topGrid ||
        !bottomGrid ||
        !resultGrid
    ) {

        console.error(
            "Column V2: elemen HTML belum lengkap."
        );

        return;
    }


    // ==================================================
    // TAMBAH DOM UNTUK 3 DIGIT
    //
    // Tidak perlu mengubah practice.html.
    // ==================================================

    const topHundredsDigit =
        document.createElement(
            "span"
        );

    topHundredsDigit.id =
        "columnTopHundredsDigit";

    topHundredsDigit.className =
        "column-board-digit";

    topHundredsDigit.hidden =
        true;

    topGrid.insertBefore(
        topHundredsDigit,
        topTensDigit
    );


    const bottomSpacer2 =
        document.createElement(
            "span"
        );

    bottomSpacer2.className =
        "column-grid-spacer";

    bottomSpacer2.hidden =
        true;

    bottomGrid.insertBefore(
        bottomSpacer2,
        bottomSingleDigit
    );


    // ==================================================
    // INPUT LANGKAH 3
    //
    // columnFinalInput lama kita gunakan sebagai
    // input digit paling depan untuk mode 3 digit.
    // ==================================================

    const columnStep3Wrap =
        document.createElement(
            "div"
        );

    columnStep3Wrap.id =
        "columnStep3Wrap";

    columnStep3Wrap.className =
        "column-result-front column-step-locked";

    columnStep3Wrap.hidden =
        true;


    const columnStep3Label =
        document.createElement(
            "label"
        );

    columnStep3Label.id =
        "columnStep3Label";

    columnStep3Label.className =
        "column-result-label";

    columnStep3Label.htmlFor =
        "columnFinalInput";

    columnStep3Label.textContent =
        "Langkah 3";


    columnStep3Wrap.appendChild(
        columnStep3Label
    );

    columnStep3Wrap.appendChild(
        columnFinalInput
    );

    resultGrid.insertBefore(
        columnStep3Wrap,
        columnStep2Wrap
    );


    // ==================================================
    // CSS KHUSUS 3 DIGIT
    //
    // CSS panah yang sekarang tetap dipakai.
    // ==================================================

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `

        .column-board-2x1.column-board-3digit {
            width: 334px;
        }


        .column-board-3digit .column-number-grid {
            width: 232px;
            grid-template-columns:
                48px
                58px
                58px
                58px;
        }


        .column-board-3digit .column-board-rule {
            width: 234px;
        }


        .column-board-3digit .column-result-grid {
            width: 242px;
            grid-template-columns:
                106px
                58px
                58px;
            gap: 10px;
        }


        .column-step3-visible {
            position: static !important;

            width: 106px !important;
            height: auto !important;
            min-height: 56px !important;

            padding: 8px !important;
            margin: 0 !important;

            opacity: 1 !important;

            pointer-events: auto !important;

            clip: auto !important;

            border:
                2px solid
                #d9deea !important;
        }


        .column-step3-visible:focus {
            border-color:
                #4f5cff !important;

            background:
                #ffffff !important;

            box-shadow:
                0 0 0 4px
                rgba(
                    79,
                    92,
                    255,
                    0.11
                )
                !important;

            outline:
                none !important;
        }


        .column-step3-visible.step-correct {
            border-color:
                #36a569 !important;

            background:
                #effbf4 !important;

            color:
                #167744 !important;
        }


        .column-guide-arrow:not(.hidden)
        .arrow-to-hundreds
        .column-arrow-path {
            animation:
                columnArrowDraw
                0.48s
                cubic-bezier(
                    0.22,
                    0.8,
                    0.32,
                    1
                )
                forwards;
        }


        .column-guide-arrow:not(.hidden)
        .arrow-to-hundreds
        .column-arrow-head {
            animation:
                columnArrowHeadReveal
                0.11s
                ease-out
                0.39s
                forwards;
        }


        @media (max-width: 600px) {

            .column-board-2x1.column-board-3digit {
                width: 296px;
            }


            .column-board-3digit .column-number-grid {
                width: 208px;

                grid-template-columns:
                    42px
                    52px
                    52px
                    52px;
            }


            .column-board-3digit .column-board-rule {
                width: 210px;
            }


            .column-board-3digit .column-result-grid {
                width: 218px;

                grid-template-columns:
                    94px
                    52px
                    52px;

                gap: 10px;
            }


            .column-step3-visible {
                width: 94px !important;

                min-height:
                    50px !important;

                padding:
                    6px !important;

                font-size:
                    27px !important;
            }

        }


        @media (max-width: 390px) {

            .column-board-2x1.column-board-3digit {
                width: 278px;
            }

        }

    `;


    document.head.appendChild(
        style
    );


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
    // CONFIG
    // ==================================================

    function getCarryMode() {

        return String(
            levelData
                ?.config
                ?.carry_mode
            ||
            "allowed"
        );
    }


    // ==================================================
    // CEK TANPA CARRY
    //
    // Contoh:
    //
    // 23 × 3
    //
    // 3 × 3 = 9
    // 3 × 2 = 6
    //
    // semua < 10
    // ==================================================

    function noCarry(
        a,
        b
    ) {

        return String(a)

            .split("")

            .map(
                Number
            )

            .every(
                digit =>
                    digit * b < 10
            );
    }


    // ==================================================
    // SHUFFLE
    // ==================================================

    function shuffle(
        items
    ) {

        for (
            let i =
                items.length - 1;

            i > 0;

            i--
        ) {

            const j =
                Math.floor(
                    Math.random()
                    *
                    (
                        i + 1
                    )
                );


            [
                items[i],
                items[j]
            ]
            =
            [
                items[j],
                items[i]
            ];
        }


        return items;
    }


    // ==================================================
    // HELP TEXT
    // ==================================================

    function setColumnHelpText() {

        const main =
            document.querySelector(
                ".practice-help-main"
            );

        const note =
            document.querySelector(
                ".practice-help-note"
            );


        if (main) {

            main.textContent =
                "Kerjakan dari angka paling belakang. Setelah benar, kursor berpindah otomatis ke depan.";
        }


        if (note) {

            note.textContent =
                "Jika belum benar, jawaban masih dapat diperbaiki sampai waktu habis.";
        }
    }


    function setDirectHelpText() {

        const main =
            document.querySelector(
                ".practice-help-main"
            );

        const note =
            document.querySelector(
                ".practice-help-note"
            );


        if (main) {

            main.innerHTML =
                'Tekan <strong class="enter-key">Enter / Selesai</strong> untuk mengirim jawaban.';
        }


        if (note) {

            note.textContent =
                "Jika belum benar, jawaban masih dapat diperbaiki sampai waktu habis.";
        }
    }


    // ==================================================
    // GENERATOR SOAL
    //
    // Tingkat 10/12:
    // carry_mode = none
    //
    // Tingkat 11/13:
    // carry_mode = allowed
    // ==================================================

    generateMultiDigitQuestions =
        function generateColumnQuestions(
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


            const digits =
                Number(
                    config
                        .multiplicand_digits
                ) === 3

                    ? 3
                    : 2;


            const defaultMinA =
                digits === 3
                    ? 100
                    : 10;


            const defaultMaxA =
                digits === 3
                    ? 999
                    : 99;


            const minA =
                Number.isInteger(
                    Number(
                        config.min_a
                    )
                )

                    ? Math.max(
                        defaultMinA,
                        Number(
                            config.min_a
                        )
                    )

                    : defaultMinA;


            const maxA =
                Number.isInteger(
                    Number(
                        config.max_a
                    )
                )

                    ? Math.min(
                        defaultMaxA,
                        Number(
                            config.max_a
                        )
                    )

                    : defaultMaxA;


            const minB =
                Number.isInteger(
                    Number(
                        config.min_b
                    )
                )

                    ? Math.max(
                        1,
                        Number(
                            config.min_b
                        )
                    )

                    : 2;


            const maxB =
                Number.isInteger(
                    Number(
                        config.max_b
                    )
                )

                    ? Math.min(
                        9,
                        Number(
                            config.max_b
                        )
                    )

                    : 9;


            const target =
                Number(
                    level
                        .question_count
                );


            const carryMode =
                String(
                    config
                        .carry_mode
                    ||
                    "allowed"
                );


            const candidates =
                [];


            for (
                let a = minA;

                a <= maxA;

                a++
            ) {

                for (
                    let b = minB;

                    b <= maxB;

                    b++
                ) {

                    if (
                        carryMode ===
                        "none"

                        &&

                        !noCarry(
                            a,
                            b
                        )
                    ) {

                        continue;
                    }


                    candidates.push({

                        a,

                        b,

                        answer:
                            a * b

                    });
                }
            }


            shuffle(
                candidates
            );


            return candidates.slice(
                0,
                target
            );
        };


    // ==================================================
    // HITUNG LANGKAH BERSUSUN
    //
    // Dari kanan -> kiri.
    // ==================================================

    getColumnExpected =
        function getColumnExpectedV2(
            question
        ) {

            const a =
                Number(
                    question.a
                );

            const b =
                Number(
                    question.b
                );


            const digits =
                String(a)

                    .split("")

                    .map(
                        Number
                    );


            const steps =
                [];


            let carry =
                0;


            for (
                let index =
                    digits.length - 1;

                index >= 0;

                index--
            ) {

                const digit =
                    digits[index];


                const carryIn =
                    carry;


                const product =
                    (
                        b * digit
                    )
                    +
                    carryIn;


                const isLeftmost =
                    index === 0;


                const writeValue =
                    isLeftmost

                        ? product

                        : product % 10;


                const carryOut =
                    isLeftmost

                        ? 0

                        : Math.floor(
                            product / 10
                        );


                steps.push({

                    digit,

                    carryIn,

                    product,

                    writeValue,

                    carryOut,

                    isLeftmost

                });


                carry =
                    carryOut;
            }


            return {

                digits,

                digitCount:
                    digits.length,

                multiplier:
                    b,

                steps,

                partial1:
                    steps[0]
                        ?.writeValue
                    ??
                    0,

                partial2:
                    steps[1]
                        ?.writeValue
                    ??
                    0,

                step3:
                    steps[2]
                        ?.writeValue
                    ??
                    null,

                final:
                    a * b
            };
        };


    // ==================================================
    // DIRECT
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
    // LAYOUT 2 / 3 DIGIT
    // ==================================================

    function applyDigitLayout(
        digitCount
    ) {

        const isThree =
            digitCount === 3;


        columnBoard
            .classList
            .toggle(
                "column-board-3digit",
                isThree
            );


        topHundredsDigit.hidden =
            !isThree;


        bottomSpacer2.hidden =
            !isThree;


        columnStep3Wrap.hidden =
            !isThree;


        if (isThree) {

            columnFinalInput.className =
                "column-final-input column-step-input column-front-input column-step3-visible";


            columnFinalInput
                .removeAttribute(
                    "aria-hidden"
                );


            columnFinalInput.tabIndex =
                0;

        } else {

            columnFinalInput.className =
                "column-final-input column-final-engine-input";


            columnFinalInput
                .setAttribute(
                    "aria-hidden",
                    "true"
                );


            columnFinalInput.tabIndex =
                -1;
        }
    }


    // ==================================================
    // LABEL LANGKAH
    // ==================================================

    function makeStepLabel(
        multiplier,
        step
    ) {

        if (!step) {
            return "";
        }


        return step.carryIn > 0

            ? `${multiplier} × ${step.digit} + ${step.carryIn}`

            : `${multiplier} × ${step.digit}`;
    }


    // ==================================================
    // RENDER COLUMN
    // ==================================================

    renderColumnQuestion =
        function renderColumnQuestionV2(
            question
        ) {

            directQuestionArea
                .classList
                .add(
                    "hidden"
                );


            columnQuestionArea
                .classList
                .remove(
                    "hidden"
                );


            setColumnHelpText();


            const expected =
                getColumnExpected(
                    question
                );


            applyDigitLayout(
                expected
                    .digitCount
            );


            columnTopNumber.textContent =
                formatNumber(
                    question.a
                );


            columnBottomNumber.textContent =
                formatNumber(
                    question.b
                );


            // ==========================================
            // 3 DIGIT
            // ==========================================

            if (
                expected
                    .digitCount === 3
            ) {

                topHundredsDigit.textContent =
                    String(
                        expected
                            .digits[0]
                    );


                topTensDigit.textContent =
                    String(
                        expected
                            .digits[1]
                    );


                topOnesDigit.textContent =
                    String(
                        expected
                            .digits[2]
                    );


            // ==========================================
            // 2 DIGIT
            // ==========================================

            } else {

                topTensDigit.textContent =
                    String(
                        expected
                            .digits[0]
                    );


                topOnesDigit.textContent =
                    String(
                        expected
                            .digits[1]
                    );
            }


            bottomSingleDigit.textContent =
                String(
                    expected
                        .multiplier
                );


            columnStep1Label.textContent =
                `${expected.multiplier} × ${expected.steps[0].digit}`;


            columnStep2Label.textContent =
                makeStepLabel(
                    expected
                        .multiplier,

                    expected
                        .steps[1]
                );


            if (
                expected
                    .digitCount === 3
            ) {

                columnStep3Label.textContent =
                    makeStepLabel(
                        expected
                            .multiplier,

                        expected
                            .steps[2]
                    );
            }


            // ==========================================
            // MAX LENGTH
            // ==========================================

            columnStep1Input.maxLength =
                1;


            columnStep2Input.maxLength =
                expected
                    .digitCount === 3

                    ? 1

                    : String(
                        expected
                            .steps[1]
                            .writeValue
                    ).length;


            columnFinalInput.maxLength =
                expected
                    .digitCount === 3

                    ? String(
                        expected
                            .steps[2]
                            .writeValue
                    ).length

                    : String(
                        expected.final
                    ).length;


            columnMethodText.textContent =
                `Mulai dari belakang: ${expected.multiplier} × ${expected.steps[0].digit}`;


            clearStepClasses();

            hideCarry();

            lockAfterStep1();

            setActiveDigit(
                0,
                expected
            );

            setArrow(
                0,
                expected
            );
        };


    // ==================================================
    // RESET
    // ==================================================

    resetQuestionInputs =
        function resetQuestionInputsV2() {

            if (
                !isColumnMode()
            ) {

                originalResetQuestionInputs();

                return;
            }


            answerFeedback.textContent =
                "";


            answerFeedback.className =
                "answer-feedback";


            answerInput.disabled =
                false;


            columnStep1Input.disabled =
                false;


            columnStep2Input.disabled =
                true;


            columnFinalInput.disabled =
                true;


            clearStepClasses();

            hideCarry();
        };


    // ==================================================
    // CLEAR VALUES
    // ==================================================

    clearCurrentInputValues =
        function clearCurrentInputValuesV2() {

            if (
                !isColumnMode()
            ) {

                originalClearCurrentInputValues();

                return;
            }


            answerInput.value =
                "";


            columnStep1Input.value =
                "";


            columnStep2Input.value =
                "";


            columnFinalInput.value =
                "";


            columnStep1Input.disabled =
                false;


            columnStep2Input.disabled =
                true;


            columnFinalInput.disabled =
                true;


            clearStepClasses();

            hideCarry();

            lockAfterStep1();
        };


    // ==================================================
    // GET INPUT
    // ==================================================

    getColumnInputs =
        function getColumnInputsV2() {

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


    // ==================================================
    // CHECK ALL
    // ==================================================

    columnInputsAreCorrect =
        function columnInputsAreCorrectV2(
            inputs,
            expected
        ) {

            const step1 =
                Number(
                    inputs.partial1
                )
                ===
                expected
                    .steps[0]
                    .writeValue;


            const step2 =
                Number(
                    inputs.partial2
                )
                ===
                expected
                    .steps[1]
                    .writeValue;


            if (
                expected
                    .digitCount === 2
            ) {

                return (
                    step1
                    &&
                    step2
                );
            }


            const step3 =
                Number(
                    inputs.final
                )
                ===
                expected
                    .steps[2]
                    .writeValue;


            return (
                step1
                &&
                step2
                &&
                step3
            );
        };


    // ==================================================
    // RESTORE / REFRESH
    // ==================================================

    refreshColumnLiveMarkers =
        function refreshColumnLiveMarkersV2() {

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


            applyDigitLayout(
                expected
                    .digitCount
            );


            clearStepClasses();


            // ==========================================
            // STEP 1
            // ==========================================

            if (
                !isCorrect(
                    columnStep1Input,
                    expected
                        .steps[0]
                        .writeValue
                )
            ) {

                columnStep2Input.value =
                    "";


                columnFinalInput.value =
                    "";


                lockAfterStep1();

                hideCarry();


                setActiveDigit(
                    0,
                    expected
                );


                setArrow(
                    0,
                    expected
                );


                return;
            }


            columnStep1Input
                .classList
                .add(
                    "step-correct"
                );


            columnStep2Input.disabled =
                false;


            setLocked(
                columnStep2Wrap,
                false
            );


            // ==========================================
            // STEP 2
            // ==========================================

            if (
                !isCorrect(
                    columnStep2Input,
                    expected
                        .steps[1]
                        .writeValue
                )
            ) {

                if (
                    expected
                        .digitCount === 3
                ) {

                    columnFinalInput.value =
                        "";


                    columnFinalInput.disabled =
                        true;


                    setLocked(
                        columnStep3Wrap,
                        true
                    );
                }


                showCarryFrom(
                    expected
                        .steps[0]
                );


                setActiveDigit(
                    1,
                    expected
                );


                setArrow(
                    1,
                    expected
                );


                return;
            }


            columnStep2Input
                .classList
                .add(
                    "step-correct"
                );


            // ==========================================
            // 2 DIGIT SELESAI
            // ==========================================

            if (
                expected
                    .digitCount === 2
            ) {

                columnFinalInput.value =
                    String(
                        expected.final
                    );


                hideCarry();

                clearActiveDigits();

                hideArrow();

                scheduleSubmit();

                return;
            }


            // ==========================================
            // STEP 3
            // ==========================================

            columnFinalInput.disabled =
                false;


            setLocked(
                columnStep3Wrap,
                false
            );


            if (
                !isCorrect(
                    columnFinalInput,
                    expected
                        .steps[2]
                        .writeValue
                )
            ) {

                showCarryFrom(
                    expected
                        .steps[1]
                );


                setActiveDigit(
                    2,
                    expected
                );


                setArrow(
                    2,
                    expected
                );


                return;
            }


            columnFinalInput
                .classList
                .add(
                    "step-correct"
                );


            hideCarry();

            clearActiveDigits();

            hideArrow();

            scheduleSubmit();
        };


    // ==================================================
    // FOCUS
    // ==================================================

    focusCurrentInput =
        function focusCurrentInputV2() {

            if (
                !isColumnMode()
            ) {

                originalFocusCurrentInput();

                return;
            }


            if (
                answerLocked
            ) {

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


            // STEP 1

            if (
                !isCorrect(
                    columnStep1Input,
                    expected
                        .steps[0]
                        .writeValue
                )
            ) {

                focusInput(
                    columnStep1Input
                );

                return;
            }


            // STEP 2

            columnStep2Input.disabled =
                false;


            setLocked(
                columnStep2Wrap,
                false
            );


            if (
                !isCorrect(
                    columnStep2Input,
                    expected
                        .steps[1]
                        .writeValue
                )
            ) {

                focusInput(
                    columnStep2Input
                );

                return;
            }


            // STEP 3

            if (
                expected
                    .digitCount === 3
            ) {

                columnFinalInput.disabled =
                    false;


                setLocked(
                    columnStep3Wrap,
                    false
                );


                focusInput(
                    columnFinalInput
                );
            }
        };


    // ==================================================
    // DISABLE
    // ==================================================

    disableColumnInputs =
        function disableColumnInputsV2() {

            columnStep1Input.disabled =
                true;


            columnStep2Input.disabled =
                true;


            columnFinalInput.disabled =
                true;
        };


    // ==================================================
    // SUBMIT
    // ==================================================

    submitColumnAnswer =
        function submitColumnAnswerV2() {

            if (
                answerLocked
            ) {

                return;
            }


            const question =
                questions[
                    currentQuestionIndex
                ];


            if (!question) {
                return;
            }


            if (
                !hasAnyColumnInput()
            ) {

                submitTimeout();

                return;
            }


            const expected =
                getColumnExpected(
                    question
                );


            const step1Correct =
                isCorrect(
                    columnStep1Input,
                    expected
                        .steps[0]
                        .writeValue
                );


            const step2Correct =
                isCorrect(
                    columnStep2Input,
                    expected
                        .steps[1]
                        .writeValue
                );


            const step3Correct =
                expected
                    .digitCount === 2

                    ? true

                    : isCorrect(
                        columnFinalInput,
                        expected
                            .steps[2]
                            .writeValue
                    );


            const assembled =
                assembleAnswer(
                    expected
                );


            const finalCorrect =
                assembled !== ""

                &&

                Number(
                    assembled
                )
                ===
                expected.final;


            const fullyCorrect =
                step1Correct

                &&

                step2Correct

                &&

                step3Correct

                &&

                finalCorrect;


            answerLocked =
                true;


            clearTimer();


            clearTimeout(
                delayedSubmit
            );


            delayedSubmit =
                null;


            disableColumnInputs();

            hideArrow();

            hideCarry();


            applyColumnResultClass(
                columnStep1Input,
                step1Correct
            );


            applyColumnResultClass(
                columnStep2Input,
                step2Correct
            );


            if (
                expected
                    .digitCount === 3
            ) {

                applyColumnResultClass(
                    columnFinalInput,
                    step3Correct
                );
            }


            let status;


            if (
                fullyCorrect
            ) {

                status =
                    "correct";


                correctCount++;


                answerFeedback.textContent =
                    "✓ Benar";


                answerFeedback.className =
                    "answer-feedback feedback-correct";


            } else {

                status =
                    "wrong";


                wrongCount++;


                answerFeedback.textContent =
                    `Belum tepat • Hasil akhir ${formatNumber(
                        expected.final
                    )}`;


                answerFeedback.className =
                    "answer-feedback feedback-wrong";
            }


            // ==========================================
            // SERVER
            //
            // Karena pengali hanya 1 digit:
            // partial_1 = hasil akhir
            // partial_2 = 0
            //
            // Ini mempertahankan kompatibilitas
            // dengan grading server yang sudah ada.
            // ==========================================

            answers.push({

                a:
                    question.a,

                b:
                    question.b,

                user_answer:
                    assembled,

                steps: {

                    partial_1:
                        assembled,

                    partial_2:
                        assembled === ""
                            ? ""
                            : "0",

                    final:
                        assembled
                },

                response_time_ms:
                    getResponseTime(),

                client_status:
                    status

            });


            liveCorrect.textContent =
                String(
                    correctCount
                );


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
    // INPUT
    // ==================================================

    function handleInput(
        event
    ) {

        if (
            !isColumnMode()
        ) {

            return;
        }


        event.stopImmediatePropagation();


        if (
            answerLocked
        ) {

            return;
        }


        clearTimeout(
            delayedSubmit
        );


        delayedSubmit =
            null;


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

            handleStep1(
                expected
            );


        } else if (
            event.currentTarget ===
            columnStep2Input
        ) {

            handleStep2(
                expected
            );


        } else if (
            event.currentTarget ===
            columnFinalInput
        ) {

            handleStep3(
                expected
            );
        }


        savePracticeState();
    }


    // ==================================================
    // STEP 1
    // ==================================================

    function handleStep1(
        expected
    ) {

        columnStep1Input.value =
            digitsOnly(
                columnStep1Input.value,
                1
            );


        columnStep1Input
            .classList
            .remove(
                "step-correct",
                "step-wrong"
            );


        if (
            !isCorrect(
                columnStep1Input,
                expected
                    .steps[0]
                    .writeValue
            )
        ) {

            columnStep2Input.value =
                "";


            columnFinalInput.value =
                "";


            lockAfterStep1();

            hideCarry();


            setActiveDigit(
                0,
                expected
            );


            setArrow(
                0,
                expected
            );


            return;
        }


        columnStep1Input
            .classList
            .add(
                "step-correct"
            );


        showCarryFrom(
            expected
                .steps[0]
        );


        columnStep2Input.disabled =
            false;


        setLocked(
            columnStep2Wrap,
            false
        );


        setActiveDigit(
            1,
            expected
        );


        setArrow(
            1,
            expected
        );


        columnMethodText.textContent =
            instruction(
                expected,
                1
            );


        setTimeout(
            () => {

                if (
                    !answerLocked

                    &&

                    isCorrect(
                        columnStep1Input,
                        expected
                            .steps[0]
                            .writeValue
                    )
                ) {

                    focusInput(
                        columnStep2Input
                    );
                }

            },
            STEP_DELAY
        );
    }


    // ==================================================
    // STEP 2
    // ==================================================

    function handleStep2(
        expected
    ) {

        if (
            !isCorrect(
                columnStep1Input,
                expected
                    .steps[0]
                    .writeValue
            )
        ) {

            columnStep2Input.value =
                "";


            focusInput(
                columnStep1Input
            );


            return;
        }


        const maxLength =
            expected
                .digitCount === 3

                ? 1

                : String(
                    expected
                        .steps[1]
                        .writeValue
                ).length;


        columnStep2Input.value =
            digitsOnly(
                columnStep2Input.value,
                maxLength
            );


        columnStep2Input
            .classList
            .remove(
                "step-correct",
                "step-wrong"
            );


        if (
            !isCorrect(
                columnStep2Input,
                expected
                    .steps[1]
                    .writeValue
            )
        ) {

            if (
                expected
                    .digitCount === 3
            ) {

                columnFinalInput.value =
                    "";


                columnFinalInput.disabled =
                    true;


                setLocked(
                    columnStep3Wrap,
                    true
                );
            }


            showCarryFrom(
                expected
                    .steps[0]
            );


            setActiveDigit(
                1,
                expected
            );


            setArrow(
                1,
                expected
            );


            return;
        }


        columnStep2Input
            .classList
            .add(
                "step-correct"
            );


        // ==============================================
        // 2 DIGIT SELESAI
        // ==============================================

        if (
            expected
                .digitCount === 2
        ) {

            columnFinalInput.value =
                String(
                    expected.final
                );


            hideCarry();

            clearActiveDigits();

            hideArrow();


            columnMethodText.textContent =
                `Hasilnya ${expected.final}.`;


            scheduleSubmit();


            return;
        }


        // ==============================================
        // LANJUT STEP 3
        // ==============================================

        showCarryFrom(
            expected
                .steps[1]
        );


        columnFinalInput.disabled =
            false;


        setLocked(
            columnStep3Wrap,
            false
        );


        setActiveDigit(
            2,
            expected
        );


        setArrow(
            2,
            expected
        );


        columnMethodText.textContent =
            instruction(
                expected,
                2
            );


        setTimeout(
            () => {

                if (
                    !answerLocked

                    &&

                    isCorrect(
                        columnStep2Input,
                        expected
                            .steps[1]
                            .writeValue
                    )
                ) {

                    focusInput(
                        columnFinalInput
                    );
                }

            },
            STEP_DELAY
        );
    }


    // ==================================================
    // STEP 3
    // ==================================================

    function handleStep3(
        expected
    ) {

        if (
            expected
                .digitCount !== 3
        ) {

            columnFinalInput.value =
                String(
                    expected.final
                );


            return;
        }


        if (
            !isCorrect(
                columnStep2Input,
                expected
                    .steps[1]
                    .writeValue
            )
        ) {

            columnFinalInput.value =
                "";


            focusInput(
                columnStep2Input
            );


            return;
        }


        const maxLength =
            String(
                expected
                    .steps[2]
                    .writeValue
            ).length;


        columnFinalInput.value =
            digitsOnly(
                columnFinalInput.value,
                maxLength
            );


        columnFinalInput
            .classList
            .remove(
                "step-correct",
                "step-wrong"
            );


        if (
            !isCorrect(
                columnFinalInput,
                expected
                    .steps[2]
                    .writeValue
            )
        ) {

            showCarryFrom(
                expected
                    .steps[1]
            );


            setActiveDigit(
                2,
                expected
            );


            setArrow(
                2,
                expected
            );


            return;
        }


        columnFinalInput
            .classList
            .add(
                "step-correct"
            );


        hideCarry();

        clearActiveDigits();

        hideArrow();


        columnMethodText.textContent =
            `Hasilnya ${expected.final}.`;


        scheduleSubmit();
    }


    // ==================================================
    // ENTER
    // ==================================================

    function handleKeydown(
        event
    ) {

        if (
            !isColumnMode()

            ||

            event.key !==
            "Enter"
        ) {

            return;
        }


        event.preventDefault();

        event.stopImmediatePropagation();


        if (
            answerLocked
        ) {

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


        // STEP 1

        if (
            event.currentTarget ===
            columnStep1Input
        ) {

            if (
                isCorrect(
                    columnStep1Input,
                    expected
                        .steps[0]
                        .writeValue
                )
            ) {

                focusInput(
                    columnStep2Input
                );
            }


            return;
        }


        // STEP 2

        if (
            event.currentTarget ===
            columnStep2Input
        ) {

            if (
                !isCorrect(
                    columnStep2Input,
                    expected
                        .steps[1]
                        .writeValue
                )
            ) {

                return;
            }


            if (
                expected
                    .digitCount === 2
            ) {

                columnFinalInput.value =
                    String(
                        expected.final
                    );


                submitColumnAnswer();

            } else {

                focusInput(
                    columnFinalInput
                );
            }


            return;
        }


        // STEP 3

        if (
            event.currentTarget ===
            columnFinalInput

            &&

            expected
                .digitCount === 3

            &&

            isCorrect(
                columnFinalInput,
                expected
                    .steps[2]
                    .writeValue
            )
        ) {

            submitColumnAnswer();
        }
    }


    // ==================================================
    // AUTO SUBMIT
    // ==================================================

    function scheduleSubmit() {

        clearTimeout(
            delayedSubmit
        );


        delayedSubmit =
            setTimeout(
                () => {

                    if (
                        answerLocked
                    ) {

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
                        allStepsCorrect(
                            expected
                        )
                    ) {

                        submitColumnAnswer();
                    }

                },
                SUBMIT_DELAY
            );
    }


    // ==================================================
    // CHECK COMPLETE
    // ==================================================

    function allStepsCorrect(
        expected
    ) {

        if (
            !isCorrect(
                columnStep1Input,
                expected
                    .steps[0]
                    .writeValue
            )

            ||

            !isCorrect(
                columnStep2Input,
                expected
                    .steps[1]
                    .writeValue
            )
        ) {

            return false;
        }


        if (
            expected
                .digitCount === 2
        ) {

            return true;
        }


        return isCorrect(
            columnFinalInput,
            expected
                .steps[2]
                .writeValue
        );
    }


    // ==================================================
    // SUSUN JAWABAN AKHIR
    //
    // Contoh 127 × 4
    //
    // step1 = 8
    // step2 = 0
    // step3 = 5
    //
    // hasil = 508
    // ==================================================

    function assembleAnswer(
        expected
    ) {

        const step1 =
            columnStep1Input
                .value
                .trim();


        const step2 =
            columnStep2Input
                .value
                .trim();


        if (
            step1 === ""

            ||

            step2 === ""
        ) {

            return "";
        }


        if (
            expected
                .digitCount === 2
        ) {

            return `${step2}${step1}`;
        }


        const step3 =
            columnFinalInput
                .value
                .trim();


        if (
            step3 === ""
        ) {

            return "";
        }


        return `${step3}${step2}${step1}`;
    }


    // ==================================================
    // INSTRUCTION
    // ==================================================

    function instruction(
        expected,
        stepIndex
    ) {

        const step =
            expected
                .steps[
                    stepIndex
                ];


        if (!step) {
            return "";
        }


        if (
            step.carryIn > 0
        ) {

            return (
                `Lanjut: `
                +
                `${expected.multiplier} × ${step.digit}, `
                +
                `lalu tambah simpanan ${step.carryIn}`
            );
        }


        return (
            `Lanjut: `
            +
            `${expected.multiplier} × ${step.digit}`
        );
    }


    // ==================================================
    // CARRY
    // ==================================================

    function showCarryFrom(
        step
    ) {

        if (
            step?.carryOut > 0
        ) {

            carryValue.textContent =
                String(
                    step.carryOut
                );


            carryBadge
                .classList
                .remove(
                    "hidden"
                );


            if (
                carryNote
            ) {

                carryNote.textContent =
                    `Simpan ${step.carryOut}, lalu lanjut ke angka berikutnya.`;
            }


        } else {

            hideCarry();
        }
    }


    function hideCarry() {

        carryValue.textContent =
            "";


        carryBadge
            .classList
            .add(
                "hidden"
            );


        if (
            carryNote
        ) {

            carryNote.textContent =
                getCarryMode() ===
                "none"

                    ? "Tingkat ini belum menggunakan angka simpanan."

                    : "Kerjakan dari kanan ke kiri.";
        }
    }


    // ==================================================
    // LOCK
    // ==================================================

    function lockAfterStep1() {

        columnStep2Input.disabled =
            true;


        columnFinalInput.disabled =
            true;


        setLocked(
            columnStep2Wrap,
            true
        );


        setLocked(
            columnStep3Wrap,
            true
        );
    }


    function setLocked(
        wrapper,
        locked
    ) {

        if (!wrapper) {
            return;
        }


        wrapper
            .classList
            .toggle(
                "column-step-locked",
                locked
            );


        wrapper.setAttribute(

            "aria-hidden",

            locked
                ? "true"
                : "false"
        );
    }


    // ==================================================
    // CLASSES
    // ==================================================

    function clearStepClasses() {

        [
            columnStep1Input,
            columnStep2Input,
            columnFinalInput
        ]

        .forEach(
            input => {

                input
                    .classList
                    .remove(
                        "step-correct",
                        "step-wrong"
                    );
            }
        );
    }


    // ==================================================
    // CHECK INPUT
    // ==================================================

    function isCorrect(
        input,
        expectedValue
    ) {

        const value =
            input
                .value
                .trim();


        return (
            value !== ""

            &&

            Number(
                value
            )
            ===
            Number(
                expectedValue
            )
        );
    }


    // ==================================================
    // DIGITS ONLY
    // ==================================================

    function digitsOnly(
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
                Number(
                    maxLength
                )
                ||
                1
            )
        );
    }


    // ==================================================
    // FOCUS
    // ==================================================

    function focusInput(
        input
    ) {

        input.disabled =
            false;


        input.focus({

            preventScroll:
                true

        });


        input.select();
    }


    // ==================================================
    // ACTIVE DIGIT
    // ==================================================

    function clearActiveDigits() {

        [
            topHundredsDigit,
            topTensDigit,
            topOnesDigit
        ]

        .forEach(
            element => {

                element
                    .classList
                    .remove(
                        "column-active-digit"
                    );
            }
        );
    }


    function setActiveDigit(
        stepIndex,
        expected
    ) {

        clearActiveDigits();


        // SATUAN

        if (
            stepIndex === 0
        ) {

            topOnesDigit
                .classList
                .add(
                    "column-active-digit"
                );


            return;
        }


        // PULUHAN

        if (
            stepIndex === 1
        ) {

            topTensDigit
                .classList
                .add(
                    "column-active-digit"
                );


            return;
        }


        // RATUSAN

        if (
            stepIndex === 2

            &&

            expected
                .digitCount === 3
        ) {

            topHundredsDigit
                .classList
                .add(
                    "column-active-digit"
                );
        }
    }


    // ==================================================
    // PANAH
    // ==================================================

    function setArrow(
        stepIndex,
        expected
    ) {

        // Level 1-5: bantuan panah aktif.
        // Level 6+: engine panah tidak dijalankan.
        if (
            Number(levelNumber) >= 6
        ) {

            hideArrow();
            return;
        }

        guideArrow
            .classList
            .remove(
                "hidden",
                "arrow-to-ones",
                "arrow-to-tens",
                "arrow-to-hundreds"
            );


        let cssClass;
        let path;


        // ==============================================
        // 3 DIGIT
        // ==============================================

        if (
            expected
                .digitCount === 3
        ) {

            // SATUAN

            if (
                stepIndex === 0
            ) {

                cssClass =
                    "arrow-to-ones";


                path =
                    "M 210 132 C 222 110, 222 78, 210 45";


            // PULUHAN

            } else if (
                stepIndex === 1
            ) {

                cssClass =
                    "arrow-to-tens";


                path =
                    "M 210 132 C 186 108, 170 76, 152 45";


            // RATUSAN

            } else {

                cssClass =
                    "arrow-to-hundreds";


                path =
                    "M 210 132 C 166 106, 126 74, 94 45";
            }


        // ==============================================
        // 2 DIGIT
        // ==============================================

        } else {

            // SATUAN

            if (
                stepIndex === 0
            ) {

                cssClass =
                    "arrow-to-ones";


                path =
                    "M 178 132 C 205 112, 210 80, 188 45";


            // PULUHAN

            } else {

                cssClass =
                    "arrow-to-tens";


                path =
                    "M 178 132 C 150 108, 132 78, 126 45";
            }
        }


        guideArrowPath.setAttribute(
            "d",
            path
        );


        // Restart animasi dari pangkal.

        void guideArrow
            .getBoundingClientRect();


        guideArrow
            .classList
            .add(
                cssClass
            );
    }


    function hideArrow() {

        guideArrow
            .classList
            .add(
                "hidden"
            );
    }


    // ==================================================
    // CAPTURE LISTENERS
    //
    // Harus menang sebelum listener lama.
    // ==================================================

    [
        columnStep1Input,
        columnStep2Input,
        columnFinalInput
    ]

    .forEach(
        input => {

            input.addEventListener(

                "input",

                handleInput,

                true
            );


            input.addEventListener(

                "keydown",

                handleKeydown,

                true
            );
        }
    );

})();
