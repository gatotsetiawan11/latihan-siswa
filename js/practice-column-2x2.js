// ======================================================
// LATIHAN SISWA
// LONG MULTIPLICATION 2x2 PATCH V1
//
// Tingkat 14:
// 2 digit x 2 digit, tanpa carry
//
// Tingkat 15:
// 2 digit x 2 digit, carry diperbolehkan
//
// File ini WAJIB dimuat:
// practice.js
// practice-column-2x1.js
// practice-column-2x2.js
// practice-navigation-fix.js
// ======================================================

(() => {

    const STEP_DELAY = 420;
    const SUBMIT_DELAY = 850;

    // ==================================================
    // GUARD
    // ==================================================

    if (
        typeof generateMultiDigitQuestions !== "function" ||
        typeof renderColumnQuestion !== "function" ||
        typeof getColumnExpected !== "function" ||
        typeof submitColumnAnswer !== "function"
    ) {
        console.error("2x2 patch: practice engine belum siap.");
        return;
    }

    const columnPractice =
        document.querySelector(".column-practice");

    const existingBoard =
        document.querySelector(".column-board-2x1");

    const columnMethodText =
        document.getElementById("columnMethodText");

    const carryNote =
        document.getElementById("columnCarryNote");

    if (!columnPractice || !existingBoard || !columnMethodText) {
        console.error("2x2 patch: area bersusun tidak ditemukan.");
        return;
    }

    // ==================================================
    // ORIGINAL / PREVIOUS OVERRIDES
    // ==================================================

    const previousGenerateMultiDigitQuestions =
        generateMultiDigitQuestions;

    const previousRenderColumnQuestion =
        renderColumnQuestion;

    const previousGetColumnExpected =
        getColumnExpected;

    const previousResetQuestionInputs =
        resetQuestionInputs;

    const previousClearCurrentInputValues =
        clearCurrentInputValues;

    const previousGetColumnInputs =
        getColumnInputs;

    const previousHasAnyColumnInput =
        hasAnyColumnInput;

    const previousColumnInputsAreCorrect =
        columnInputsAreCorrect;

    const previousRefreshColumnLiveMarkers =
        refreshColumnLiveMarkers;

    const previousFocusCurrentInput =
        focusCurrentInput;

    const previousDisableColumnInputs =
        disableColumnInputs;

    const previousSubmitColumnAnswer =
        submitColumnAnswer;

    // ==================================================
    // MODE
    // ==================================================

    function isLong2x2Mode() {
        return (
            isColumnMode() &&
            String(
                levelData?.config?.column_method || ""
            ) === "long_multiplication_2x2"
        );
    }

    // ==================================================
    // MATH
    // ==================================================

    function analyzeLong2x2(a, b) {

        const aTens = Math.floor(a / 10);
        const aOnes = a % 10;

        const bTens = Math.floor(b / 10);
        const bOnes = b % 10;

        // STEP 1
        const row1FirstProduct =
            bOnes * aOnes;

        const row1Ones =
            row1FirstProduct % 10;

        const row1Carry =
            Math.floor(
                row1FirstProduct / 10
            );

        const row1Front =
            bOnes * aTens +
            row1Carry;

        const row1 =
            a * bOnes;

        // STEP 2
        const row2FirstProduct =
            bTens * aOnes;

        const row2OnesRaw =
            row2FirstProduct % 10;

        const row2Carry =
            Math.floor(
                row2FirstProduct / 10
            );

        const row2Front =
            bTens * aTens +
            row2Carry;

        const row2Raw =
            a * bTens;

        const row2Shifted =
            row2Raw * 10;

        // STEP 3
        const additionSteps = [];

        let additionCarry = 0;

        for (
            let column = 0;
            column < 4;
            column++
        ) {

            const power =
                10 ** column;

            const row1Digit =
                Math.floor(
                    row1 / power
                ) % 10;

            const row2Digit =
                Math.floor(
                    row2Shifted / power
                ) % 10;

            const carryIn =
                additionCarry;

            const sum =
                row1Digit +
                row2Digit +
                carryIn;

            const writeDigit =
                sum % 10;

            const carryOut =
                Math.floor(
                    sum / 10
                );

            additionSteps.push({
                column,
                row1Digit,
                row2Digit,
                carryIn,
                sum,
                writeDigit,
                carryOut
            });

            additionCarry =
                carryOut;
        }

        const hasCarry =
            row1Carry > 0 ||
            row2Carry > 0 ||
            additionSteps.some(
                step =>
                    step.carryOut > 0
            );

        return {
            a,
            b,

            aTens,
            aOnes,
            bTens,
            bOnes,

            row1FirstProduct,
            row1Ones,
            row1Carry,
            row1Front,
            row1,

            row2FirstProduct,
            row2OnesRaw,
            row2Carry,
            row2Front,
            row2Raw,
            row2Shifted,

            additionSteps,

            final:
                a * b,

            hasCarry
        };
    }

    function noCarryLong2x2(a, b) {
        return !analyzeLong2x2(
            a,
            b
        ).hasCarry;
    }

    function shuffle(items) {

        for (
            let i = items.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );

            [
                items[i],
                items[j]
            ] = [
                items[j],
                items[i]
            ];
        }

        return items;
    }

    // ==================================================
    // QUESTION GENERATOR
    // ==================================================

    generateMultiDigitQuestions =
        function generateMultiDigitQuestions2x2(
            level
        ) {

            const config =
                level?.config || {};

            if (
                String(
                    config.column_method || ""
                ) !==
                "long_multiplication_2x2"
            ) {

                return previousGenerateMultiDigitQuestions(
                    level
                );
            }

            const minA =
                Math.max(
                    10,
                    Number(config.min_a) || 10
                );

            const maxA =
                Math.min(
                    99,
                    Number(config.max_a) || 99
                );

            const minB =
                Math.max(
                    10,
                    Number(config.min_b) || 10
                );

            const maxB =
                Math.min(
                    99,
                    Number(config.max_b) || 99
                );

            const carryMode =
                String(
                    config.carry_mode || "allowed"
                );

            const target =
                Number(
                    level.question_count
                );

            const candidates = [];

            for (
                let a = minA;
                a <= maxA;
                a++
            ) {

                // Supaya dua langkah tetap bermakna.
                if (a % 10 === 0) {
                    continue;
                }

                for (
                    let b = minB;
                    b <= maxB;
                    b++
                ) {

                    // Hindari pengali satuan 0.
                    if (b % 10 === 0) {
                        continue;
                    }

                    if (
                        carryMode === "none" &&
                        !noCarryLong2x2(
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

            shuffle(candidates);

            return candidates.slice(
                0,
                target
            );
        };

    // ==================================================
    // EXPECTED OVERRIDE
    // ==================================================

    getColumnExpected =
        function getColumnExpected2x2(
            question
        ) {

            if (!isLong2x2Mode()) {
                return previousGetColumnExpected(
                    question
                );
            }

            const expected =
                analyzeLong2x2(
                    Number(question.a),
                    Number(question.b)
                );

            return {
                ...expected,

                // Kompatibilitas dengan engine lama.
                partial1:
                    expected.row1,

                partial2:
                    expected.row2Shifted,

                final:
                    expected.final
            };
        };

    // ==================================================
    // CREATE UI
    // ==================================================

    const longBoard =
        document.createElement("div");

    longBoard.id =
        "columnLong2x2Board";

    longBoard.className =
        "long2x2-board hidden";

    longBoard.innerHTML = `
        <svg
            id="long2x2Arrow"
            class="long2x2-arrow hidden"
            viewBox="0 0 320 185"
            aria-hidden="true"
        >
            <path
                id="long2x2ArrowPath"
                class="long2x2-arrow-path"
                pathLength="1"
                d="M221 135 C221 112 221 90 221 68"
            ></path>

            <path
                id="long2x2ArrowHead"
                class="long2x2-arrow-head"
                d="M215 75 L221 67 L227 75"
            ></path>
        </svg>

        <div
            class="long2x2-carry-row"
            aria-hidden="true"
        >
            <span></span>
            <span></span>

            <span
                id="long2x2MultiplyCarry"
                class="long2x2-carry-value hidden"
            ></span>

            <span></span>
        </div>

        <div class="long2x2-number-row">
            <span></span>
            <span></span>

            <strong
                id="long2x2TopTens"
            >1</strong>

            <strong
                id="long2x2TopOnes"
            >5</strong>
        </div>

        <div class="long2x2-number-row">
            <span></span>

            <span class="long2x2-sign">
                ×
            </span>

            <strong
                id="long2x2BottomTens"
            >1</strong>

            <strong
                id="long2x2BottomOnes"
            >2</strong>
        </div>

        <div class="long2x2-rule"></div>

        <!-- STEP 1 -->

        <div
            id="long2x2Phase1"
            class="long2x2-partial-row"
        >

            <div
                id="long2x2Row1FrontWrap"
                class="long2x2-front-wrap long2x2-locked"
            >
                <input
                    id="long2x2Row1Front"
                    class="long2x2-front-input"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="off"
                    disabled
                >
            </div>

            <span></span>

            <input
                id="long2x2Row1Ones"
                class="long2x2-digit-input"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="off"
                maxlength="1"
            >
        </div>

        <!-- STEP 2 -->

        <div
            id="long2x2Phase2"
            class="long2x2-partial-row long2x2-phase-locked"
        >

            <div
                id="long2x2Row2FrontWrap"
                class="long2x2-front-wrap long2x2-locked"
            >
                <input
                    id="long2x2Row2Front"
                    class="long2x2-front-input"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="off"
                    disabled
                >
            </div>

            <input
                id="long2x2Row2Ones"
                class="long2x2-digit-input"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                autocomplete="off"
                maxlength="1"
                disabled
            >

            <span
                class="long2x2-auto-zero"
            >0</span>
        </div>

        <!-- STEP 3 -->

        <div
            id="long2x2AdditionBlock"
            class="long2x2-addition long2x2-phase-locked"
        >

            <div class="long2x2-add-title">
                Step 3 • Jumlahkan dua baris
            </div>

            <div
                class="long2x2-add-carry-row"
                aria-hidden="true"
            >
                <span
                    id="long2x2AddCarry1000"
                    class="long2x2-add-carry hidden"
                ></span>

                <span
                    id="long2x2AddCarry100"
                    class="long2x2-add-carry hidden"
                ></span>

                <span
                    id="long2x2AddCarry10"
                    class="long2x2-add-carry hidden"
                ></span>

                <span></span>
            </div>

            <div class="long2x2-add-row">
                <span id="long2x2AddR1Thousands"></span>
                <span id="long2x2AddR1Hundreds"></span>
                <span id="long2x2AddR1Tens"></span>
                <span id="long2x2AddR1Ones"></span>
            </div>

            <div class="long2x2-add-row long2x2-add-row2">
                <span id="long2x2AddR2Thousands"></span>
                <span id="long2x2AddR2Hundreds"></span>
                <span id="long2x2AddR2Tens"></span>
                <span id="long2x2AddR2Ones"></span>
            </div>

            <div class="long2x2-add-rule"></div>

            <div class="long2x2-sum-row">

                <input
                    id="long2x2SumThousands"
                    class="long2x2-sum-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    disabled
                >

                <input
                    id="long2x2SumHundreds"
                    class="long2x2-sum-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    disabled
                >

                <input
                    id="long2x2SumTens"
                    class="long2x2-sum-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    disabled
                >

                <input
                    id="long2x2SumOnes"
                    class="long2x2-sum-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    disabled
                >

            </div>
        </div>
    `;

    const learningNote =
        columnPractice.querySelector(
            ".column-learning-note"
        );

    columnPractice.insertBefore(
        longBoard,
        learningNote
    );

    // ==================================================
    // LONG DOM
    // ==================================================

    const longArrow =
        document.getElementById(
            "long2x2Arrow"
        );

    const longArrowPath =
        document.getElementById(
            "long2x2ArrowPath"
        );

    const longArrowHead =
        document.getElementById(
            "long2x2ArrowHead"
        );

    const multiplyCarry =
        document.getElementById(
            "long2x2MultiplyCarry"
        );

    const topTens =
        document.getElementById(
            "long2x2TopTens"
        );

    const topOnes =
        document.getElementById(
            "long2x2TopOnes"
        );

    const bottomTens =
        document.getElementById(
            "long2x2BottomTens"
        );

    const bottomOnes =
        document.getElementById(
            "long2x2BottomOnes"
        );

    const phase2 =
        document.getElementById(
            "long2x2Phase2"
        );

    const additionBlock =
        document.getElementById(
            "long2x2AdditionBlock"
        );

    const row1FrontWrap =
        document.getElementById(
            "long2x2Row1FrontWrap"
        );

    const row1Front =
        document.getElementById(
            "long2x2Row1Front"
        );

    const row1Ones =
        document.getElementById(
            "long2x2Row1Ones"
        );

    const row2FrontWrap =
        document.getElementById(
            "long2x2Row2FrontWrap"
        );

    const row2Front =
        document.getElementById(
            "long2x2Row2Front"
        );

    const row2Ones =
        document.getElementById(
            "long2x2Row2Ones"
        );

    const addR1Thousands =
        document.getElementById(
            "long2x2AddR1Thousands"
        );

    const addR1Hundreds =
        document.getElementById(
            "long2x2AddR1Hundreds"
        );

    const addR1Tens =
        document.getElementById(
            "long2x2AddR1Tens"
        );

    const addR1Ones =
        document.getElementById(
            "long2x2AddR1Ones"
        );

    const addR2Thousands =
        document.getElementById(
            "long2x2AddR2Thousands"
        );

    const addR2Hundreds =
        document.getElementById(
            "long2x2AddR2Hundreds"
        );

    const addR2Tens =
        document.getElementById(
            "long2x2AddR2Tens"
        );

    const addR2Ones =
        document.getElementById(
            "long2x2AddR2Ones"
        );

    const sumThousands =
        document.getElementById(
            "long2x2SumThousands"
        );

    const sumHundreds =
        document.getElementById(
            "long2x2SumHundreds"
        );

    const sumTens =
        document.getElementById(
            "long2x2SumTens"
        );

    const sumOnes =
        document.getElementById(
            "long2x2SumOnes"
        );

    const addCarry1000 =
        document.getElementById(
            "long2x2AddCarry1000"
        );

    const addCarry100 =
        document.getElementById(
            "long2x2AddCarry100"
        );

    const addCarry10 =
        document.getElementById(
            "long2x2AddCarry10"
        );

    const visibleInputs = [
        row1Ones,
        row1Front,
        row2Ones,
        row2Front,
        sumOnes,
        sumTens,
        sumHundreds,
        sumThousands
    ];

    // ==================================================
    // CSS
    // ==================================================

    const style =
        document.createElement("style");

    style.textContent = `
        .long2x2-board {
            position: relative;
            width: 320px;
            margin: 0 auto;
            padding: 18px 20px 22px;
            box-sizing: border-box;
            border: 1px solid #e4e8f0;
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 12px 34px rgba(23,32,51,.07);
        }

        .long2x2-board.hidden {
            display: none !important;
        }

        .long2x2-number-row,
        .long2x2-partial-row,
        .long2x2-add-row,
        .long2x2-sum-row,
        .long2x2-carry-row,
        .long2x2-add-carry-row {
            width: 236px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(4, 52px);
            column-gap: 9px;
            align-items: center;
            justify-items: center;
        }

        .long2x2-number-row {
            min-height: 47px;
        }

        .long2x2-number-row strong {
            width: 52px;
            min-height: 43px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #172033;
            font-size: 38px;
            line-height: 1;
            font-weight: 850;
            font-variant-numeric: tabular-nums;
            transition: color .18s ease, transform .18s ease;
        }

        .long2x2-active-digit {
            color: #2457e6 !important;
            transform: scale(1.08);
        }

        .long2x2-sign {
            color: #566175;
            font-size: 26px;
            font-weight: 850;
        }

        .long2x2-rule,
        .long2x2-add-rule {
            width: 236px;
            height: 3px;
            margin: 7px auto 10px;
            border-radius: 999px;
            background: #172033;
        }

        .long2x2-partial-row {
            min-height: 58px;
            margin-top: 7px;
        }

        .long2x2-front-wrap {
            grid-column: 2 / 4;
            width: 113px;
            display: flex;
            justify-content: flex-end;
        }

        #long2x2Phase2 .long2x2-front-wrap {
            grid-column: 1 / 3;
        }

        #long2x2Phase1 #long2x2Row1Ones {
            grid-column: 4;
        }

        #long2x2Phase2 #long2x2Row2Ones {
            grid-column: 3;
        }

        #long2x2Phase2 .long2x2-auto-zero {
            grid-column: 4;
        }

        .long2x2-digit-input,
        .long2x2-front-input,
        .long2x2-sum-input {
            box-sizing: border-box;
            min-height: 48px;
            padding: 6px;
            border: 2px solid #d9deea;
            border-radius: 12px;
            outline: none;
            background: #fff;
            color: #172033;
            text-align: center;
            font-family: inherit;
            font-size: 27px;
            line-height: 1;
            font-weight: 850;
            caret-color: #2457e6;
            font-variant-numeric: tabular-nums;
            transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
        }

        .long2x2-digit-input,
        .long2x2-sum-input {
            width: 52px;
        }

        .long2x2-front-input {
            width: 113px;
            padding-right: 12px;
            text-align: right;
            letter-spacing: .18em;
        }

        .long2x2-digit-input:focus,
        .long2x2-front-input:focus,
        .long2x2-sum-input:focus {
            border-color: #4f5cff;
            box-shadow: 0 0 0 4px rgba(79,92,255,.11);
        }

        .long2x2-correct {
            border-color: #36a569 !important;
            background: #effbf4 !important;
            color: #167744 !important;
        }

        .long2x2-wrong {
            border-color: #d85c5c !important;
            background: #fff4f4 !important;
            color: #b73535 !important;
        }

        .long2x2-locked,
        .long2x2-phase-locked {
            opacity: .28;
            pointer-events: none;
        }

        .long2x2-addition.long2x2-phase-locked
        .long2x2-add-row,
        .long2x2-addition.long2x2-phase-locked
        .long2x2-add-carry-row,
        .long2x2-addition.long2x2-phase-locked
        .long2x2-add-rule,
        .long2x2-addition.long2x2-phase-locked
        .long2x2-sum-row {
            visibility: hidden;
        }

        .long2x2-auto-zero {
            width: 52px;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #f4f6fa;
            color: #8a94a6;
            font-size: 27px;
            font-weight: 850;
        }

        .long2x2-carry-row {
            min-height: 23px;
        }

        .long2x2-carry-value,
        .long2x2-add-carry {
            min-width: 23px;
            height: 23px;
            padding: 0 5px;
            box-sizing: border-box;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #f4a51c;
            border-radius: 999px;
            background: #fff7dc;
            color: #b45309;
            font-size: 14px;
            line-height: 1;
            font-weight: 900;
            box-shadow: 0 4px 10px rgba(245,158,11,.16);
        }

        .long2x2-carry-value.hidden,
        .long2x2-add-carry.hidden {
            visibility: hidden !important;
        }

        .long2x2-arrow {
            position: absolute;
            z-index: 10;
            inset: 0;
            width: 100%;
            height: 185px;
            overflow: visible;
            pointer-events: none;
        }

        .long2x2-arrow.hidden {
            opacity: 0;
        }

        .long2x2-arrow-path {
            fill: none;
            stroke: #f59e0b;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            vector-effect: non-scaling-stroke;
        }

        .long2x2-arrow-head {
            fill: none;
            stroke: #f59e0b;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
            opacity: 0;
            vector-effect: non-scaling-stroke;
        }

        .long2x2-arrow.long2x2-draw .long2x2-arrow-path {
            animation: long2x2ArrowDraw .44s cubic-bezier(.22,.8,.32,1) forwards;
        }

        .long2x2-arrow.long2x2-draw .long2x2-arrow-head {
            animation: long2x2ArrowHead .10s ease-out .36s forwards;
        }

        @keyframes long2x2ArrowDraw {
            from {
                stroke-dashoffset: 1;
                opacity: .35;
            }

            to {
                stroke-dashoffset: 0;
                opacity: 1;
            }
        }

        @keyframes long2x2ArrowHead {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .long2x2-addition {
            margin-top: 14px;
            padding-top: 11px;
            border-top: 1px dashed #dfe4ec;
        }

        .long2x2-add-title {
            margin-bottom: 7px;
            color: #647084;
            font-size: 11px;
            line-height: 1.35;
            font-weight: 750;
            text-align: center;
        }

        .long2x2-add-carry-row {
            min-height: 25px;
            margin-bottom: 2px;
        }

        .long2x2-add-row {
            min-height: 39px;
            color: #172033;
            font-size: 27px;
            line-height: 1;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
        }

        .long2x2-add-row2 {
            position: relative;
        }

        .long2x2-add-row2::before {
            content: "+";
            position: absolute;
            left: -4px;
            color: #566175;
            font-size: 23px;
            font-weight: 850;
        }

        .long2x2-add-rule {
            margin-top: 3px;
            margin-bottom: 8px;
        }

        .long2x2-sum-row {
            min-height: 50px;
        }

        .long2x2-leading-hidden {
            visibility: hidden !important;
            pointer-events: none !important;
        }

        .long2x2-active-sum {
            border-color: #4f5cff !important;
            box-shadow: 0 0 0 4px rgba(79,92,255,.09);
        }

        @media (max-width: 600px) {

            .long2x2-board {
                width: 286px;
                padding-left: 13px;
                padding-right: 13px;
                border-radius: 18px;
            }

            .long2x2-number-row,
            .long2x2-partial-row,
            .long2x2-add-row,
            .long2x2-sum-row,
            .long2x2-carry-row,
            .long2x2-add-carry-row {
                width: 220px;
                grid-template-columns: repeat(4, 49px);
                column-gap: 8px;
            }

            .long2x2-number-row strong {
                width: 49px;
                font-size: 35px;
            }

            .long2x2-rule,
            .long2x2-add-rule {
                width: 220px;
            }

            .long2x2-digit-input,
            .long2x2-sum-input,
            .long2x2-auto-zero {
                width: 49px;
            }

            .long2x2-front-wrap,
            .long2x2-front-input {
                width: 106px;
            }

            .long2x2-arrow {
                height: 180px;
            }
        }
    `;

    document.head.appendChild(
        style
    );

    // ==================================================
    // RENDER
    // ==================================================

    renderColumnQuestion =
        function renderColumnQuestion2x2(
            question
        ) {

            if (!isLong2x2Mode()) {

                longBoard.classList.add(
                    "hidden"
                );

                existingBoard.classList.remove(
                    "hidden"
                );

                previousRenderColumnQuestion(
                    question
                );

                return;
            }

            directQuestionArea.classList.add(
                "hidden"
            );

            columnQuestionArea.classList.remove(
                "hidden"
            );

            existingBoard.classList.add(
                "hidden"
            );

            longBoard.classList.remove(
                "hidden"
            );

            const expected =
                analyzeLong2x2(
                    Number(question.a),
                    Number(question.b)
                );

            columnTopNumber.textContent =
                formatNumber(
                    question.a
                );

            columnBottomNumber.textContent =
                formatNumber(
                    question.b
                );

            topTens.textContent =
                String(
                    expected.aTens
                );

            topOnes.textContent =
                String(
                    expected.aOnes
                );

            bottomTens.textContent =
                String(
                    expected.bTens
                );

            bottomOnes.textContent =
                String(
                    expected.bOnes
                );

            row1Front.maxLength =
                String(
                    expected.row1Front
                ).length;

            row2Front.maxLength =
                String(
                    expected.row2Front
                ).length;

            clearVisibleInputs();

            resetLocks();

            renderAdditionRows(
                expected
            );

            setActiveDigits(
                "row1_ones"
            );

            setArrow(
                "row1_ones"
            );

            columnMethodText.textContent =
                `Step 1: ${expected.bOnes} × ${expected.aOnes}`;

            if (carryNote) {

                carryNote.textContent =
                    "Kerjakan baris pertama dari kanan ke kiri.";
            }
        };

    function renderAdditionRows(
        expected
    ) {

        const row1String =
            String(expected.row1)
                .padStart(4, "0");

        const row2String =
            String(
                expected.row2Shifted
            )
                .padStart(4, "0");

        const row1Elements = [
            addR1Thousands,
            addR1Hundreds,
            addR1Tens,
            addR1Ones
        ];

        const row2Elements = [
            addR2Thousands,
            addR2Hundreds,
            addR2Tens,
            addR2Ones
        ];

        const row1Leading =
            4 -
            String(
                expected.row1
            ).length;

        const row2Leading =
            4 -
            String(
                expected.row2Shifted
            ).length;

        row1Elements.forEach(
            (element, index) => {

                element.textContent =
                    index < row1Leading
                        ? ""
                        : row1String[index];
            }
        );

        row2Elements.forEach(
            (element, index) => {

                element.textContent =
                    index < row2Leading
                        ? ""
                        : row2String[index];
            }
        );

        const finalLength =
            String(
                expected.final
            ).length;

        const hiddenLeading =
            4 - finalLength;

        [
            sumThousands,
            sumHundreds,
            sumTens,
            sumOnes
        ].forEach(
            (input, index) => {

                input.classList.toggle(
                    "long2x2-leading-hidden",
                    index < hiddenLeading
                );
            }
        );
    }

    // ==================================================
    // RESET / CLEAR
    // ==================================================

    resetQuestionInputs =
        function resetQuestionInputs2x2() {

            if (!isLong2x2Mode()) {
                previousResetQuestionInputs();
                return;
            }

            answerFeedback.textContent =
                "";

            answerFeedback.className =
                "answer-feedback";

            clearVisibleClasses();
        };

    clearCurrentInputValues =
        function clearCurrentInputValues2x2() {

            if (!isLong2x2Mode()) {
                previousClearCurrentInputValues();
                return;
            }

            answerInput.value = "";

            columnStep1Input.value = "";
            columnStep2Input.value = "";
            columnFinalInput.value = "";

            clearVisibleInputs();

            resetLocks();

            hideMultiplyCarry();
            hideAdditionCarries();

            setActiveDigits(
                "row1_ones"
            );

            setArrow(
                "row1_ones"
            );
        };

    // ==================================================
    // ENGINE STATE
    // ==================================================

    getColumnInputs =
        function getColumnInputs2x2() {

            if (!isLong2x2Mode()) {
                return previousGetColumnInputs();
            }

            return {
                partial1:
                    columnStep1Input.value
                        .trim(),

                partial2:
                    columnStep2Input.value
                        .trim(),

                final:
                    columnFinalInput.value
                        .trim()
            };
        };

    hasAnyColumnInput =
        function hasAnyColumnInput2x2() {

            if (!isLong2x2Mode()) {
                return previousHasAnyColumnInput();
            }

            return visibleInputs.some(
                input =>
                    input.value.trim() !== ""
            );
        };

    columnInputsAreCorrect =
        function columnInputsAreCorrect2x2(
            inputs,
            expected
        ) {

            if (!isLong2x2Mode()) {

                return previousColumnInputsAreCorrect(
                    inputs,
                    expected
                );
            }

            return (
                row1Complete(expected) &&
                row2Complete(expected) &&
                additionComplete(expected)
            );
        };

    // ==================================================
    // SAVE / RESTORE VISUAL STATE
    // ==================================================

    function syncEngineState() {

        const r1Ones =
            row1Ones.value.trim();

        const r1Front =
            row1Front.value.trim();

        const r2Ones =
            row2Ones.value.trim();

        const r2Front =
            row2Front.value.trim();

        // Row 1 progress.
        columnStep1Input.value =
            r1Front !== ""
                ? `${r1Front}${r1Ones}`
                : r1Ones;

        // Row 2 stores RAW product progress.
        columnStep2Input.value =
            r2Front !== ""
                ? `${r2Front}${r2Ones}`
                : r2Ones;

        // Sum progress is stored in the actual work order:
        // ones -> tens -> hundreds -> thousands.
        const progress = [];

        for (
            const input of getActiveSumInputs()
        ) {

            if (input.value === "") {
                break;
            }

            progress.push(
                input.value
            );
        }

        columnFinalInput.value =
            progress.join("");
    }

    refreshColumnLiveMarkers =
        function refreshColumnLiveMarkers2x2() {

            if (!isLong2x2Mode()) {

                previousRefreshColumnLiveMarkers();

                return;
            }

            restoreVisualState();
        };

    function restoreVisualState() {

        const expected =
            getExpected();

        if (!expected) {
            return;
        }

        clearVisibleInputs();
        resetLocks();

        hideMultiplyCarry();
        hideAdditionCarries();

        const savedRow1 =
            String(
                columnStep1Input.value || ""
            );

        const savedRow2 =
            String(
                columnStep2Input.value || ""
            );

        const savedSum =
            String(
                columnFinalInput.value || ""
            );

        // Row 1
        if (savedRow1.length >= 1) {

            row1Ones.value =
                savedRow1.slice(-1);
        }

        if (savedRow1.length > 1) {

            row1Front.value =
                savedRow1.slice(
                    0,
                    -1
                );
        }

        if (!row1Complete(expected)) {

            if (
                row1Ones.value !== "" &&
                Number(row1Ones.value) ===
                    expected.row1Ones
            ) {

                row1Ones.classList.add(
                    "long2x2-correct"
                );

                unlockRow1Front(
                    expected
                );

                showMultiplyCarry(
                    expected.row1Carry
                );

                setActiveDigits(
                    "row1_front"
                );

                setArrow(
                    "row1_front"
                );

            } else {

                setActiveDigits(
                    "row1_ones"
                );

                setArrow(
                    "row1_ones"
                );
            }

            return;
        }

        row1Ones.classList.add(
            "long2x2-correct"
        );

        row1Front.classList.add(
            "long2x2-correct"
        );

        unlockPhase2();

        // Row 2
        if (savedRow2.length >= 1) {

            row2Ones.value =
                savedRow2.slice(-1);
        }

        if (savedRow2.length > 1) {

            row2Front.value =
                savedRow2.slice(
                    0,
                    -1
                );
        }

        if (!row2Complete(expected)) {

            if (
                row2Ones.value !== "" &&
                Number(row2Ones.value) ===
                    expected.row2OnesRaw
            ) {

                row2Ones.classList.add(
                    "long2x2-correct"
                );

                unlockRow2Front(
                    expected
                );

                showMultiplyCarry(
                    expected.row2Carry
                );

                setActiveDigits(
                    "row2_front"
                );

                setArrow(
                    "row2_front"
                );

            } else {

                setActiveDigits(
                    "row2_ones"
                );

                setArrow(
                    "row2_ones"
                );
            }

            return;
        }

        row2Ones.classList.add(
            "long2x2-correct"
        );

        row2Front.classList.add(
            "long2x2-correct"
        );

        unlockAddition(
            expected
        );

        const activeInputs =
            getActiveSumInputs();

        for (
            let index = 0;
            index <
                Math.min(
                    savedSum.length,
                    activeInputs.length
                );
            index++
        ) {

            const input =
                activeInputs[index];

            input.value =
                savedSum[index];

            if (
                Number(input.value) ===
                expected
                    .additionSteps[index]
                    .writeDigit
            ) {

                input.classList.add(
                    "long2x2-correct"
                );
            }
        }

        updateAdditionProgress(
            expected,
            false
        );
    }

    // ==================================================
    // FOCUS / DISABLE
    // ==================================================

    focusCurrentInput =
        function focusCurrentInput2x2() {

            if (!isLong2x2Mode()) {
                previousFocusCurrentInput();
                return;
            }

            if (answerLocked) {
                return;
            }

            focusNextLongInput();
        };

    disableColumnInputs =
        function disableColumnInputs2x2() {

            if (!isLong2x2Mode()) {
                previousDisableColumnInputs();
                return;
            }

            visibleInputs.forEach(
                input => {
                    input.disabled = true;
                }
            );

            columnStep1Input.disabled =
                true;

            columnStep2Input.disabled =
                true;

            columnFinalInput.disabled =
                true;
        };

    // ==================================================
    // INPUT HANDLER
    // ==================================================

    function handleInput(event) {

        if (!isLong2x2Mode()) {
            return;
        }

        event.stopImmediatePropagation();

        if (answerLocked) {
            return;
        }

        clearTimeout(
            delayedSubmit
        );

        delayedSubmit = null;

        const expected =
            getExpected();

        if (!expected) {
            return;
        }

        const input =
            event.currentTarget;

        input.classList.remove(
            "long2x2-correct",
            "long2x2-wrong"
        );

        if (input === row1Ones) {

            handleRow1Ones(
                expected
            );

        } else if (
            input === row1Front
        ) {

            handleRow1Front(
                expected
            );

        } else if (
            input === row2Ones
        ) {

            handleRow2Ones(
                expected
            );

        } else if (
            input === row2Front
        ) {

            handleRow2Front(
                expected
            );

        } else {

            handleSumInput(
                expected,
                input
            );
        }

        syncEngineState();

        savePracticeState();
    }

    function handleRow1Ones(
        expected
    ) {

        row1Ones.value =
            digitsOnly(
                row1Ones.value,
                1
            );

        if (
            row1Ones.value === "" ||
            Number(row1Ones.value) !==
                expected.row1Ones
        ) {

            row1Front.value = "";
            row1Front.disabled = true;

            row1FrontWrap.classList.add(
                "long2x2-locked"
            );

            resetAfterRow1();

            hideMultiplyCarry();

            setActiveDigits(
                "row1_ones"
            );

            setArrow(
                "row1_ones"
            );

            columnMethodText.textContent =
                `Step 1: ${expected.bOnes} × ${expected.aOnes}`;

            return;
        }

        row1Ones.classList.add(
            "long2x2-correct"
        );

        showMultiplyCarry(
            expected.row1Carry
        );

        unlockRow1Front(
            expected
        );

        setActiveDigits(
            "row1_front"
        );

        setArrow(
            "row1_front"
        );

        columnMethodText.textContent =
            expected.row1Carry > 0
                ? `Lanjut: ${expected.bOnes} × ${expected.aTens} + ${expected.row1Carry}`
                : `Lanjut: ${expected.bOnes} × ${expected.aTens}`;

        setTimeout(
            () => {

                if (
                    !answerLocked &&
                    Number(
                        row1Ones.value
                    ) ===
                    expected.row1Ones
                ) {

                    focusInput(
                        row1Front
                    );
                }
            },
            STEP_DELAY
        );
    }

    function handleRow1Front(
        expected
    ) {

        row1Front.value =
            digitsOnly(
                row1Front.value,
                String(
                    expected.row1Front
                ).length
            );

        if (
            row1Front.value === "" ||
            Number(row1Front.value) !==
                expected.row1Front
        ) {

            resetAfterRow1Front();

            showMultiplyCarry(
                expected.row1Carry
            );

            setActiveDigits(
                "row1_front"
            );

            setArrow(
                "row1_front"
            );

            return;
        }

        row1Front.classList.add(
            "long2x2-correct"
        );

        hideMultiplyCarry();

        unlockPhase2();

        setActiveDigits(
            "row2_ones"
        );

        setArrow(
            "row2_ones"
        );

        columnMethodText.textContent =
            `Step 2: ${expected.bTens} × ${expected.aOnes}`;

        if (carryNote) {

            carryNote.textContent =
                "Baris kedua bergeser satu tempat ke kiri. Nol kanan muncul otomatis.";
        }

        setTimeout(
            () => {

                if (
                    !answerLocked &&
                    row1Complete(
                        expected
                    )
                ) {

                    focusInput(
                        row2Ones
                    );
                }
            },
            STEP_DELAY
        );
    }

    function handleRow2Ones(
        expected
    ) {

        row2Ones.value =
            digitsOnly(
                row2Ones.value,
                1
            );

        if (
            row2Ones.value === "" ||
            Number(row2Ones.value) !==
                expected.row2OnesRaw
        ) {

            row2Front.value = "";
            row2Front.disabled = true;

            row2FrontWrap.classList.add(
                "long2x2-locked"
            );

            resetAdditionOnly();

            hideMultiplyCarry();

            setActiveDigits(
                "row2_ones"
            );

            setArrow(
                "row2_ones"
            );

            columnMethodText.textContent =
                `Step 2: ${expected.bTens} × ${expected.aOnes}`;

            return;
        }

        row2Ones.classList.add(
            "long2x2-correct"
        );

        showMultiplyCarry(
            expected.row2Carry
        );

        unlockRow2Front(
            expected
        );

        setActiveDigits(
            "row2_front"
        );

        setArrow(
            "row2_front"
        );

        columnMethodText.textContent =
            expected.row2Carry > 0
                ? `Lanjut: ${expected.bTens} × ${expected.aTens} + ${expected.row2Carry}`
                : `Lanjut: ${expected.bTens} × ${expected.aTens}`;

        setTimeout(
            () => {

                if (
                    !answerLocked &&
                    Number(
                        row2Ones.value
                    ) ===
                    expected.row2OnesRaw
                ) {

                    focusInput(
                        row2Front
                    );
                }
            },
            STEP_DELAY
        );
    }

    function handleRow2Front(
        expected
    ) {

        row2Front.value =
            digitsOnly(
                row2Front.value,
                String(
                    expected.row2Front
                ).length
            );

        if (
            row2Front.value === "" ||
            Number(row2Front.value) !==
                expected.row2Front
        ) {

            resetAdditionOnly();

            showMultiplyCarry(
                expected.row2Carry
            );

            setActiveDigits(
                "row2_front"
            );

            setArrow(
                "row2_front"
            );

            return;
        }

        row2Front.classList.add(
            "long2x2-correct"
        );

        hideMultiplyCarry();
        clearActiveDigits();
        hideArrow();

        unlockAddition(
            expected
        );

        setTimeout(
            () => {

                if (
                    !answerLocked &&
                    row2Complete(
                        expected
                    )
                ) {

                    focusNextLongInput();
                }
            },
            STEP_DELAY
        );
    }

    function handleSumInput(
        expected,
        input
    ) {

        input.value =
            digitsOnly(
                input.value,
                1
            );

        const activeInputs =
            getActiveSumInputs();

        const index =
            activeInputs.indexOf(
                input
            );

        if (index < 0) {
            return;
        }

        // Harus kanan -> kiri.
        for (
            let i = 0;
            i < index;
            i++
        ) {

            const previousInput =
                activeInputs[i];

            const previousStep =
                expected
                    .additionSteps[i];

            if (
                previousInput.value === "" ||
                Number(
                    previousInput.value
                ) !==
                previousStep.writeDigit
            ) {

                input.value = "";

                focusInput(
                    previousInput
                );

                return;
            }
        }

        const step =
            expected
                .additionSteps[index];

        if (
            input.value === "" ||
            Number(input.value) !==
                step.writeDigit
        ) {

            clearSumAfter(
                index + 1
            );

            updateAdditionProgress(
                expected,
                false
            );

            return;
        }

        input.classList.add(
            "long2x2-correct"
        );

        clearSumAfter(
            index + 1
        );

        updateAdditionProgress(
            expected,
            true
        );

        if (
            index <
            activeInputs.length - 1
        ) {

            setTimeout(
                () => {

                    if (
                        !answerLocked &&
                        Number(
                            input.value
                        ) ===
                        step.writeDigit
                    ) {

                        focusInput(
                            activeInputs[
                                index + 1
                            ]
                        );
                    }
                },
                STEP_DELAY
            );

            return;
        }

        if (
            additionComplete(
                expected
            )
        ) {

            hideAdditionCarries();

            columnMethodText.textContent =
                `Hasilnya ${expected.final}.`;

            if (carryNote) {

                carryNote.textContent =
                    "Semua langkah benar.";
            }

            scheduleSubmit();
        }
    }

    // ==================================================
    // ADDITION PROGRESS
    // ==================================================

    function updateAdditionProgress(
        expected,
        showCarry
    ) {

        hideAdditionCarries();

        const activeInputs =
            getActiveSumInputs();

        activeInputs.forEach(
            input => {

                input.classList.remove(
                    "long2x2-active-sum"
                );
            }
        );

        let nextIndex = 0;

        while (
            nextIndex <
            activeInputs.length
        ) {

            const input =
                activeInputs[nextIndex];

            const step =
                expected
                    .additionSteps[
                        nextIndex
                    ];

            if (
                input.value !== "" &&
                Number(input.value) ===
                    step.writeDigit
            ) {

                input.classList.add(
                    "long2x2-correct"
                );

                nextIndex++;

                continue;
            }

            break;
        }

        if (
            nextIndex <
            activeInputs.length
        ) {

            activeInputs[nextIndex]
                .classList.add(
                    "long2x2-active-sum"
                );

            const step =
                expected
                    .additionSteps[
                        nextIndex
                    ];

            columnMethodText.textContent =
                step.carryIn > 0
                    ? `Jumlahkan: ${step.row1Digit} + ${step.row2Digit} + simpanan ${step.carryIn}`
                    : `Jumlahkan: ${step.row1Digit} + ${step.row2Digit}`;
        }

        if (
            nextIndex > 0 &&
            nextIndex <
                expected.additionSteps.length
        ) {

            const currentStep =
                expected
                    .additionSteps[
                        nextIndex
                    ];

            if (
                currentStep &&
                currentStep.carryIn > 0
            ) {

                showAdditionCarry(
                    nextIndex,
                    currentStep.carryIn
                );
            }
        }
    }

    function clearSumAfter(
        startIndex
    ) {

        const activeInputs =
            getActiveSumInputs();

        for (
            let index = startIndex;
            index <
                activeInputs.length;
            index++
        ) {

            activeInputs[index].value =
                "";

            activeInputs[index]
                .classList
                .remove(
                    "long2x2-correct",
                    "long2x2-wrong"
                );
        }
    }

    // ==================================================
    // ENTER
    // ==================================================

    function handleKeydown(
        event
    ) {

        if (
            !isLong2x2Mode() ||
            event.key !== "Enter"
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (answerLocked) {
            return;
        }

        const expected =
            getExpected();

        if (!expected) {
            return;
        }

        const current =
            event.currentTarget;

        if (
            current === row1Ones &&
            Number(current.value) ===
                expected.row1Ones
        ) {

            focusInput(
                row1Front
            );

            return;
        }

        if (
            current === row1Front &&
            Number(current.value) ===
                expected.row1Front
        ) {

            focusInput(
                row2Ones
            );

            return;
        }

        if (
            current === row2Ones &&
            Number(current.value) ===
                expected.row2OnesRaw
        ) {

            focusInput(
                row2Front
            );

            return;
        }

        if (
            current === row2Front &&
            Number(current.value) ===
                expected.row2Front
        ) {

            focusNextLongInput();

            return;
        }

        if (
            getActiveSumInputs()
                .includes(current) &&
            additionComplete(
                expected
            )
        ) {

            submitColumnAnswer();
        }
    }

    // ==================================================
    // SUBMIT
    // ==================================================

    submitColumnAnswer =
        function submitColumnAnswer2x2() {

            if (!isLong2x2Mode()) {
                previousSubmitColumnAnswer();
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

            if (!hasAnyColumnInput()) {

                submitTimeout();

                return;
            }

            const expected =
                analyzeLong2x2(
                    Number(question.a),
                    Number(question.b)
                );

            const row1Correct =
                row1Complete(
                    expected
                );

            const row2Correct =
                row2Complete(
                    expected
                );

            const sumCorrect =
                additionComplete(
                    expected
                );

            const fullyCorrect =
                row1Correct &&
                row2Correct &&
                sumCorrect;

            const finalValue =
                getFinalTypedValue();

            answerLocked = true;

            clearTimer();

            clearTimeout(
                delayedSubmit
            );

            delayedSubmit = null;

            disableColumnInputs();

            hideMultiplyCarry();
            hideAdditionCarries();
            hideArrow();
            clearActiveDigits();

            markResult(
                row1Ones,
                Number(
                    row1Ones.value
                ) === expected.row1Ones
            );

            markResult(
                row1Front,
                Number(
                    row1Front.value
                ) === expected.row1Front
            );

            markResult(
                row2Ones,
                Number(
                    row2Ones.value
                ) === expected.row2OnesRaw
            );

            markResult(
                row2Front,
                Number(
                    row2Front.value
                ) === expected.row2Front
            );

            getActiveSumInputs()
                .forEach(
                    (input, index) => {

                        markResult(
                            input,
                            input.value !== "" &&
                            Number(
                                input.value
                            ) ===
                            expected
                                .additionSteps[
                                    index
                                ]
                                .writeDigit
                        );
                    }
                );

            let status;

            if (fullyCorrect) {

                status =
                    "correct";

                correctCount++;

                answerFeedback.textContent =
                    "✓ Semua langkah benar";

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

            answers.push({

                a:
                    question.a,

                b:
                    question.b,

                user_answer:
                    finalValue,

                steps: {

                    partial_1:
                        row1Correct
                            ? String(
                                expected.row1
                            )
                            : getTypedRow1(),

                    partial_2:
                        row2Correct
                            ? String(
                                expected.row2Shifted
                            )
                            : getTypedRow2Shifted(),

                    final:
                        finalValue
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
                    ? 1000
                    : 1200
            );
        };

    function scheduleSubmit() {

        clearTimeout(
            delayedSubmit
        );

        delayedSubmit =
            setTimeout(
                () => {

                    if (answerLocked) {
                        return;
                    }

                    const expected =
                        getExpected();

                    if (
                        expected &&
                        row1Complete(
                            expected
                        ) &&
                        row2Complete(
                            expected
                        ) &&
                        additionComplete(
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
    // COMPLETION
    // ==================================================

    function row1Complete(
        expected
    ) {

        return (
            row1Ones.value !== "" &&
            Number(
                row1Ones.value
            ) === expected.row1Ones &&
            row1Front.value !== "" &&
            Number(
                row1Front.value
            ) === expected.row1Front
        );
    }

    function row2Complete(
        expected
    ) {

        return (
            row2Ones.value !== "" &&
            Number(
                row2Ones.value
            ) === expected.row2OnesRaw &&
            row2Front.value !== "" &&
            Number(
                row2Front.value
            ) === expected.row2Front
        );
    }

    function additionComplete(
        expected
    ) {

        const activeInputs =
            getActiveSumInputs();

        return activeInputs.every(
            (input, index) =>
                input.value !== "" &&
                Number(
                    input.value
                ) ===
                expected
                    .additionSteps[
                        index
                    ]
                    .writeDigit
        );
    }

    function getExpected() {

        const question =
            questions[
                currentQuestionIndex
            ];

        if (!question) {
            return null;
        }

        return analyzeLong2x2(
            Number(question.a),
            Number(question.b)
        );
    }

    // ==================================================
    // LOCKS
    // ==================================================

    function resetLocks() {

        row1Ones.disabled = false;

        row1Front.disabled = true;

        row2Ones.disabled = true;

        row2Front.disabled = true;

        row1FrontWrap.classList.add(
            "long2x2-locked"
        );

        row2FrontWrap.classList.add(
            "long2x2-locked"
        );

        phase2.classList.add(
            "long2x2-phase-locked"
        );

        additionBlock.classList.add(
            "long2x2-phase-locked"
        );

        [
            sumThousands,
            sumHundreds,
            sumTens,
            sumOnes
        ].forEach(
            input => {
                input.disabled = true;
            }
        );
    }

    function unlockRow1Front(
        expected
    ) {

        row1Front.disabled = false;

        row1Front.maxLength =
            String(
                expected.row1Front
            ).length;

        row1FrontWrap.classList.remove(
            "long2x2-locked"
        );
    }

    function unlockPhase2() {

        phase2.classList.remove(
            "long2x2-phase-locked"
        );

        row2Ones.disabled = false;

        row2Front.disabled = true;

        row2FrontWrap.classList.add(
            "long2x2-locked"
        );
    }

    function unlockRow2Front(
        expected
    ) {

        row2Front.disabled = false;

        row2Front.maxLength =
            String(
                expected.row2Front
            ).length;

        row2FrontWrap.classList.remove(
            "long2x2-locked"
        );
    }

    function unlockAddition(
        expected
    ) {

        additionBlock.classList.remove(
            "long2x2-phase-locked"
        );

        getActiveSumInputs()
            .forEach(
                input => {
                    input.disabled = false;
                }
            );

        hideMultiplyCarry();
        hideArrow();
        clearActiveDigits();

        columnMethodText.textContent =
            "Step 3: jumlahkan dua baris dari kanan ke kiri.";

        if (carryNote) {

            carryNote.textContent =
                "Jika hasil penjumlahan 2 digit, angka depan menjadi simpanan.";
        }

        updateAdditionProgress(
            expected,
            false
        );
    }

    function resetAfterRow1() {

        row2Ones.value = "";
        row2Front.value = "";

        row2Ones.disabled = true;
        row2Front.disabled = true;

        phase2.classList.add(
            "long2x2-phase-locked"
        );

        resetAdditionOnly();
    }

    function resetAfterRow1Front() {

        row2Ones.value = "";
        row2Front.value = "";

        row2Ones.disabled = true;
        row2Front.disabled = true;

        phase2.classList.add(
            "long2x2-phase-locked"
        );

        resetAdditionOnly();
    }

    function resetAdditionOnly() {

        additionBlock.classList.add(
            "long2x2-phase-locked"
        );

        [
            sumThousands,
            sumHundreds,
            sumTens,
            sumOnes
        ].forEach(
            input => {

                input.value = "";
                input.disabled = true;

                input.classList.remove(
                    "long2x2-correct",
                    "long2x2-wrong",
                    "long2x2-active-sum"
                );
            }
        );

        hideAdditionCarries();
    }

    // ==================================================
    // CARRY
    // ==================================================

    function showMultiplyCarry(
        value
    ) {

        if (
            !value ||
            Number(value) <= 0
        ) {

            hideMultiplyCarry();

            return;
        }

        multiplyCarry.textContent =
            String(value);

        multiplyCarry.classList.remove(
            "hidden"
        );

        if (carryNote) {

            carryNote.textContent =
                `Simpan ${value}, lalu tambahkan pada perkalian berikutnya.`;
        }
    }

    function hideMultiplyCarry() {

        multiplyCarry.textContent = "";

        multiplyCarry.classList.add(
            "hidden"
        );
    }

    function hideAdditionCarries() {

        [
            addCarry1000,
            addCarry100,
            addCarry10
        ].forEach(
            element => {

                element.textContent = "";

                element.classList.add(
                    "hidden"
                );
            }
        );
    }

    function showAdditionCarry(
        nextIndex,
        value
    ) {

        hideAdditionCarries();

        if (
            !value ||
            Number(value) <= 0
        ) {
            return;
        }

        const target =
            nextIndex === 1
                ? addCarry10
                : nextIndex === 2
                    ? addCarry100
                    : nextIndex === 3
                        ? addCarry1000
                        : null;

        if (!target) {
            return;
        }

        target.textContent =
            String(value);

        target.classList.remove(
            "hidden"
        );
    }

    // ==================================================
    // ACTIVE DIGITS + ARROW
    // ==================================================

    function clearActiveDigits() {

        [
            topTens,
            topOnes,
            bottomTens,
            bottomOnes
        ].forEach(
            element => {

                element.classList.remove(
                    "long2x2-active-digit"
                );
            }
        );
    }

    function setActiveDigits(
        step
    ) {

        clearActiveDigits();

        if (step === "row1_ones") {

            bottomOnes.classList.add(
                "long2x2-active-digit"
            );

            topOnes.classList.add(
                "long2x2-active-digit"
            );

            return;
        }

        if (step === "row1_front") {

            bottomOnes.classList.add(
                "long2x2-active-digit"
            );

            topTens.classList.add(
                "long2x2-active-digit"
            );

            return;
        }

        if (step === "row2_ones") {

            bottomTens.classList.add(
                "long2x2-active-digit"
            );

            topOnes.classList.add(
                "long2x2-active-digit"
            );

            return;
        }

        bottomTens.classList.add(
            "long2x2-active-digit"
        );

        topTens.classList.add(
            "long2x2-active-digit"
        );
    }

    function setArrow(
        step
    ) {

        let path;
        let head;

        if (step === "row1_ones") {

            path =
                "M 221 137 C 221 115, 221 91, 221 69";

            head =
                "M 215 76 L 221 68 L 227 76";

        } else if (
            step === "row1_front"
        ) {

            path =
                "M 221 137 C 205 111, 187 87, 160 69";

            head =
                "M 162 78 L 159 68 L 169 70";

        } else if (
            step === "row2_ones"
        ) {

            path =
                "M 160 137 C 177 111, 195 87, 221 69";

            head =
                "M 211 70 L 222 68 L 219 79";

        } else {

            path =
                "M 160 137 C 160 115, 160 91, 160 69";

            head =
                "M 154 76 L 160 68 L 166 76";
        }

        longArrowPath.setAttribute(
            "d",
            path
        );

        longArrowHead.setAttribute(
            "d",
            head
        );

        longArrow.classList.remove(
            "hidden",
            "long2x2-draw"
        );

        void longArrow.getBoundingClientRect();

        longArrow.classList.add(
            "long2x2-draw"
        );
    }

    function hideArrow() {

        longArrow.classList.add(
            "hidden"
        );

        longArrow.classList.remove(
            "long2x2-draw"
        );
    }

    // ==================================================
    // VALUES
    // ==================================================

    function getActiveSumInputs() {

        return [
            sumOnes,
            sumTens,
            sumHundreds,
            sumThousands
        ].filter(
            input =>
                !input.classList.contains(
                    "long2x2-leading-hidden"
                )
        );
    }

    function getTypedRow1() {

        const front =
            row1Front.value.trim();

        const ones =
            row1Ones.value.trim();

        if (
            front === "" &&
            ones === ""
        ) {
            return "";
        }

        return `${front}${ones}`;
    }

    function getTypedRow2Raw() {

        const front =
            row2Front.value.trim();

        const ones =
            row2Ones.value.trim();

        if (
            front === "" &&
            ones === ""
        ) {
            return "";
        }

        return `${front}${ones}`;
    }

    function getTypedRow2Shifted() {

        const raw =
            getTypedRow2Raw();

        if (raw === "") {
            return "";
        }

        return `${raw}0`;
    }

    function getFinalTypedValue() {

        const leftToRight =
            [
                sumThousands,
                sumHundreds,
                sumTens,
                sumOnes
            ].filter(
                input =>
                    !input.classList.contains(
                        "long2x2-leading-hidden"
                    )
            );

        if (
            leftToRight.some(
                input =>
                    input.value === ""
            )
        ) {
            return "";
        }

        return leftToRight
            .map(
                input =>
                    input.value
            )
            .join("");
    }

    // ==================================================
    // UI HELPERS
    // ==================================================

    function clearVisibleInputs() {

        visibleInputs.forEach(
            input => {

                input.value = "";

                input.classList.remove(
                    "long2x2-correct",
                    "long2x2-wrong",
                    "long2x2-active-sum"
                );
            }
        );
    }

    function clearVisibleClasses() {

        visibleInputs.forEach(
            input => {

                input.classList.remove(
                    "long2x2-correct",
                    "long2x2-wrong",
                    "long2x2-active-sum"
                );
            }
        );
    }

    function markResult(
        input,
        correct
    ) {

        input.classList.remove(
            "long2x2-correct",
            "long2x2-wrong"
        );

        input.classList.add(
            correct
                ? "long2x2-correct"
                : "long2x2-wrong"
        );
    }

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
                    Number(maxLength) || 1
                )
            );
    }

    function focusInput(
        input
    ) {

        input.disabled = false;

        input.focus({
            preventScroll: true
        });

        input.select();
    }

    function focusNextLongInput() {

        const expected =
            getExpected();

        if (!expected) {
            return;
        }

        if (
            row1Ones.value === "" ||
            Number(row1Ones.value) !==
                expected.row1Ones
        ) {

            focusInput(
                row1Ones
            );

            return;
        }

        if (
            row1Front.value === "" ||
            Number(row1Front.value) !==
                expected.row1Front
        ) {

            unlockRow1Front(
                expected
            );

            focusInput(
                row1Front
            );

            return;
        }

        unlockPhase2();

        if (
            row2Ones.value === "" ||
            Number(row2Ones.value) !==
                expected.row2OnesRaw
        ) {

            focusInput(
                row2Ones
            );

            return;
        }

        if (
            row2Front.value === "" ||
            Number(row2Front.value) !==
                expected.row2Front
        ) {

            unlockRow2Front(
                expected
            );

            focusInput(
                row2Front
            );

            return;
        }

        unlockAddition(
            expected
        );

        const activeInputs =
            getActiveSumInputs();

        for (
            let index = 0;
            index <
                activeInputs.length;
            index++
        ) {

            const input =
                activeInputs[index];

            const step =
                expected
                    .additionSteps[index];

            if (
                input.value === "" ||
                Number(input.value) !==
                    step.writeDigit
            ) {

                focusInput(
                    input
                );

                return;
            }
        }
    }

    // ==================================================
    // EVENTS
    // ==================================================

    visibleInputs.forEach(
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
