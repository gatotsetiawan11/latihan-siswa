// ======================================================
// LATIHAN SISWA - LONG MULTIPLICATION 2 DIGIT x 2 DIGIT V2
// Tingkat 14: tanpa carry
// Tingkat 15: carry diperbolehkan
// Semua input satu digit, dikerjakan dari kanan ke kiri.
//
// Urutan script:
// practice.js
// practice-column-2x1.js
// practice-column-2x2.js
// practice-navigation-fix.js
// ======================================================

(() => {

    const MOVE_DELAY = 430;
    const SUBMIT_DELAY = 900;


    // ==================================================
    // ENGINE CHECK
    // ==================================================

    if (
        typeof generateMultiDigitQuestions !== "function" ||
        typeof renderColumnQuestion !== "function" ||
        typeof getColumnExpected !== "function" ||
        typeof submitColumnAnswer !== "function"
    ) {

        console.error(
            "2x2 V2: practice engine belum siap."
        );

        return;
    }


    // ==================================================
    // DOM
    // ==================================================

    const columnPractice =
        document.querySelector(
            ".column-practice"
        );

    const existingBoard =
        document.querySelector(
            ".column-board-2x1"
        );

    const methodText =
        document.getElementById(
            "columnMethodText"
        );

    const carryNote =
        document.getElementById(
            "columnCarryNote"
        );


    if (
        !columnPractice ||
        !existingBoard ||
        !methodText
    ) {

        console.error(
            "2x2 V2: area bersusun tidak ditemukan."
        );

        return;
    }


    // ==================================================
    // SIMPAN ENGINE SEBELUMNYA
    // ==================================================

    const prev = {

        generate:
            generateMultiDigitQuestions,

        render:
            renderColumnQuestion,

        expected:
            getColumnExpected,

        reset:
            resetQuestionInputs,

        clear:
            clearCurrentInputValues,

        focus:
            focusCurrentInput,

        disable:
            disableColumnInputs,

        submit:
            submitColumnAnswer,

        getInputs:
            typeof getColumnInputs === "function"
                ? getColumnInputs
                : null,

        hasAny:
            typeof hasAnyColumnInput === "function"
                ? hasAnyColumnInput
                : null,

        inputsCorrect:
            typeof columnInputsAreCorrect === "function"
                ? columnInputsAreCorrect
                : null,

        refresh:
            typeof refreshColumnLiveMarkers === "function"
                ? refreshColumnLiveMarkers
                : null

    };


    // ==================================================
    // MODE CHECK
    // ==================================================

    function is2x2() {

        return (

            typeof isColumnMode === "function"

            &&

            isColumnMode()

            &&

            String(
                levelData
                    ?.config
                    ?.column_method
                ||
                ""
            )
            ===
            "long_multiplication_2x2"

        );
    }


    // ==================================================
    // ANALISIS MATEMATIKA
    // ==================================================

    function analyze(
        a,
        b
    ) {

        const aT =
            Math.floor(
                a / 10
            );

        const aO =
            a % 10;


        const bT =
            Math.floor(
                b / 10
            );

        const bO =
            b % 10;


        // ==============================================
        // STEP 1
        // digit satuan pengali
        // ==============================================

        const r1s1 =
            bO * aO;

        const r1O =
            r1s1 % 10;

        const r1c1 =
            Math.floor(
                r1s1 / 10
            );


        const r1s2 =
            bO * aT
            +
            r1c1;

        const r1T =
            r1s2 % 10;

        const r1c2 =
            Math.floor(
                r1s2 / 10
            );


        const row1 =
            a * bO;


        // ==============================================
        // STEP 2
        // digit puluhan pengali
        // ==============================================

        const r2s1 =
            bT * aO;

        const r2T =
            r2s1 % 10;

        const r2c1 =
            Math.floor(
                r2s1 / 10
            );


        const r2s2 =
            bT * aT
            +
            r2c1;

        const r2H =
            r2s2 % 10;

        const r2c2 =
            Math.floor(
                r2s2 / 10
            );


        const row2Raw =
            a * bT;


        // Bergeser 1 tempat ke kiri.
        const row2 =
            row2Raw * 10;


        // ==============================================
        // STEP 3
        // PENJUMLAHAN
        // ==============================================

        const final =
            a * b;


        const finalLength =
            String(
                final
            ).length;


        const add = [];


        let carry =
            0;


        for (
            let col = 0;
            col < finalLength;
            col++
        ) {

            const p =
                10 ** col;


            const d1 =
                Math.floor(
                    row1 / p
                )
                %
                10;


            const d2 =
                Math.floor(
                    row2 / p
                )
                %
                10;


            const carryIn =
                carry;


            const total =
                d1
                +
                d2
                +
                carryIn;


            const write =
                total % 10;


            const carryOut =
                Math.floor(
                    total / 10
                );


            add.push({

                col,

                d1,

                d2,

                carryIn,

                total,

                write,

                carryOut

            });


            carry =
                carryOut;
        }


        const hasCarry =

            r1c1 > 0

            ||

            r1c2 > 0

            ||

            r2c1 > 0

            ||

            r2c2 > 0

            ||

            add.some(
                step =>
                    step.carryOut > 0
            );


        return {

            a,

            b,

            aT,

            aO,

            bT,

            bO,


            r1s1,

            r1O,

            r1c1,

            r1s2,

            r1T,

            r1c2,

            row1,


            r2s1,

            r2T,

            r2c1,

            r2s2,

            r2H,

            r2c2,

            row2Raw,

            row2,


            add,

            final,

            finalLength,

            hasCarry

        };
    }


    // ==================================================
    // SHUFFLE
    // ==================================================

    function shuffle(
        arr
    ) {

        for (
            let i =
                arr.length - 1;

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
                arr[i],
                arr[j]
            ]
            =
            [
                arr[j],
                arr[i]
            ];
        }


        return arr;
    }


    // ==================================================
    // GENERATOR SOAL
    // ==================================================

    generateMultiDigitQuestions =
        function (
            level
        ) {

            const c =
                level?.config
                ||
                {};


            if (
                String(
                    c.column_method
                    ||
                    ""
                )
                !==
                "long_multiplication_2x2"
            ) {

                return prev.generate(
                    level
                );
            }


            const minA =
                Math.max(
                    10,
                    Number(
                        c.min_a
                    )
                    ||
                    10
                );


            const maxA =
                Math.min(
                    99,
                    Number(
                        c.max_a
                    )
                    ||
                    99
                );


            const minB =
                Math.max(
                    10,
                    Number(
                        c.min_b
                    )
                    ||
                    10
                );


            const maxB =
                Math.min(
                    99,
                    Number(
                        c.max_b
                    )
                    ||
                    99
                );


            const carryMode =
                String(
                    c.carry_mode
                    ||
                    "allowed"
                );


            const target =
                Number(
                    level
                        .question_count
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

                    // Hindari angka yang berakhir 0
                    // agar semua langkah tetap bermakna.

                    if (
                        a % 10 === 0
                        ||
                        b % 10 === 0
                    ) {

                        continue;
                    }


                    const x =
                        analyze(
                            a,
                            b
                        );


                    // Tingkat 14:
                    // tidak boleh membutuhkan carry.

                    if (
                        carryMode ===
                            "none"

                        &&

                        x.hasCarry
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
    // EXPECTED
    // ==================================================

    getColumnExpected =
        function (
            question
        ) {

            if (
                !is2x2()
            ) {

                return prev.expected(
                    question
                );
            }


            const x =
                analyze(

                    Number(
                        question.a
                    ),

                    Number(
                        question.b
                    )

                );


            return {

                ...x,

                partial1:
                    x.row1,

                partial2:
                    x.row2,

                final:
                    x.final

            };
        };


    // ==================================================
    // CREATE UI
    //
    // 4 kolom:
    // ribuan | ratusan | puluhan | satuan
    // ==================================================

    const board =
        document.createElement(
            "div"
        );


    board.id =
        "columnLong2x2Board";


    board.className =
        "lm22-board hidden";


    board.innerHTML = `

        <svg
            id="lm22Arrow"
            class="lm22-arrow hidden"
            viewBox="0 0 340 220"
            aria-hidden="true"
        >

            <path
                id="lm22ArrowPath"
                class="lm22-arrow-path"
                pathLength="1"
            ></path>

            <path
                id="lm22ArrowHead"
                class="lm22-arrow-head"
            ></path>

        </svg>


        <div
            id="lm22Carry"
            class="lm22-carry hidden"
            aria-live="polite"
        >

            <span>
                simpan
            </span>

            <strong
                id="lm22CarryValue"
            ></strong>

        </div>


        <!-- ANGKA ATAS -->

        <div
            class="lm22-grid lm22-number-row"
        >

            <span></span>

            <span></span>

            <strong
                id="lm22TopT"
                class="lm22-number"
            ></strong>

            <strong
                id="lm22TopO"
                class="lm22-number"
            ></strong>

        </div>


        <!-- ANGKA BAWAH -->

        <div
            class="lm22-grid lm22-number-row"
        >

            <span></span>

            <span
                class="lm22-times"
            >
                ×
            </span>

            <strong
                id="lm22BottomT"
                class="lm22-number"
            ></strong>

            <strong
                id="lm22BottomO"
                class="lm22-number"
            ></strong>

        </div>


        <div
            class="lm22-rule"
        ></div>


        <!-- ==========================================
             STEP 1
             digit satuan pengali
             ========================================== -->

        <div class="lm22-label">
            Step 1
        </div>


        <div
            class="lm22-grid lm22-work-row"
        >

            <span></span>

            <span
                id="lm22R1Lead"
                class="lm22-auto"
            ></span>

            <input
                id="lm22R1T"
                class="lm22-input"
                type="text"
                inputmode="numeric"
                maxlength="1"
                autocomplete="off"
                disabled
                aria-label="Baris pertama puluhan"
            >

            <input
                id="lm22R1O"
                class="lm22-input"
                type="text"
                inputmode="numeric"
                maxlength="1"
                autocomplete="off"
                aria-label="Baris pertama satuan"
            >

        </div>


        <!-- ==========================================
             STEP 2
             digit puluhan pengali
             ========================================== -->

        <div
            id="lm22Step2"
            class="lm22-phase lm22-locked"
        >

            <div class="lm22-label">
                Step 2
            </div>


            <div
                class="lm22-grid lm22-work-row"
            >

                <span
                    id="lm22R2Lead"
                    class="lm22-auto"
                ></span>

                <input
                    id="lm22R2H"
                    class="lm22-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Baris kedua ratusan"
                >

                <input
                    id="lm22R2T"
                    class="lm22-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Baris kedua puluhan"
                >

                <span
                    class="lm22-zero"
                >
                    0
                </span>

            </div>

        </div>


        <!-- ==========================================
             STEP 3
             PENJUMLAHAN
             ========================================== -->

        <div
            id="lm22Add"
            class="lm22-add lm22-locked"
        >

            <div class="lm22-label">
                Step 3 • Jumlahkan
            </div>


            <div
                class="lm22-grid lm22-add-carries"
                aria-hidden="true"
            >

                <span
                    id="lm22C1000"
                    class="lm22-add-carry hidden"
                ></span>

                <span
                    id="lm22C100"
                    class="lm22-add-carry hidden"
                ></span>

                <span
                    id="lm22C10"
                    class="lm22-add-carry hidden"
                ></span>

                <span></span>

            </div>


            <!-- BARIS HASIL 1 -->

            <div
                class="lm22-grid lm22-source-row"
            >

                <span
                    id="lm22A1K"
                ></span>

                <span
                    id="lm22A1H"
                ></span>

                <span
                    id="lm22A1T"
                ></span>

                <span
                    id="lm22A1O"
                ></span>

            </div>


            <!-- BARIS HASIL 2 -->

            <div
                class="
                    lm22-grid
                    lm22-source-row
                    lm22-source-row-2
                "
            >

                <span
                    id="lm22A2K"
                ></span>

                <span
                    id="lm22A2H"
                ></span>

                <span
                    id="lm22A2T"
                ></span>

                <span
                    id="lm22A2O"
                ></span>

            </div>


            <div
                class="lm22-add-rule"
            ></div>


            <!-- HASIL PENJUMLAHAN -->

            <div
                class="lm22-grid lm22-sum-row"
            >

                <input
                    id="lm22SumK"
                    class="lm22-input lm22-sum"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Hasil ribuan"
                >

                <input
                    id="lm22SumH"
                    class="lm22-input lm22-sum"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Hasil ratusan"
                >

                <input
                    id="lm22SumT"
                    class="lm22-input lm22-sum"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Hasil puluhan"
                >

                <input
                    id="lm22SumO"
                    class="lm22-input lm22-sum"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    autocomplete="off"
                    disabled
                    aria-label="Hasil satuan"
                >

            </div>

        </div>

    `;


    // ==================================================
    // INSERT BOARD
    // ==================================================

    const learningNote =
        columnPractice.querySelector(
            ".column-learning-note"
        );


    columnPractice.insertBefore(
        board,
        learningNote
    );


    // ==================================================
    // DOM SHORTCUT
    // ==================================================

    const $ =
        id =>
            document.getElementById(
                id
            );


    const el = {

        arrow:
            $("lm22Arrow"),

        arrowPath:
            $("lm22ArrowPath"),

        arrowHead:
            $("lm22ArrowHead"),


        carry:
            $("lm22Carry"),

        carryValue:
            $("lm22CarryValue"),


        topT:
            $("lm22TopT"),

        topO:
            $("lm22TopO"),

        bottomT:
            $("lm22BottomT"),

        bottomO:
            $("lm22BottomO"),


        r1Lead:
            $("lm22R1Lead"),

        r1T:
            $("lm22R1T"),

        r1O:
            $("lm22R1O"),


        step2:
            $("lm22Step2"),


        r2Lead:
            $("lm22R2Lead"),

        r2H:
            $("lm22R2H"),

        r2T:
            $("lm22R2T"),


        add:
            $("lm22Add"),


        a1K:
            $("lm22A1K"),

        a1H:
            $("lm22A1H"),

        a1T:
            $("lm22A1T"),

        a1O:
            $("lm22A1O"),


        a2K:
            $("lm22A2K"),

        a2H:
            $("lm22A2H"),

        a2T:
            $("lm22A2T"),

        a2O:
            $("lm22A2O"),


        c1000:
            $("lm22C1000"),

        c100:
            $("lm22C100"),

        c10:
            $("lm22C10"),


        sumK:
            $("lm22SumK"),

        sumH:
            $("lm22SumH"),

        sumT:
            $("lm22SumT"),

        sumO:
            $("lm22SumO")

    };


    const multInputs = [

        el.r1O,

        el.r1T,

        el.r2T,

        el.r2H

    ];


    const sumsLTR = [

        el.sumK,

        el.sumH,

        el.sumT,

        el.sumO

    ];


    const allInputs = [

        ...multInputs,

        ...sumsLTR

    ];


    // ==================================================
    // STYLE
    // ==================================================

    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

        .lm22-board {
            position: relative;
            width: 340px;
            box-sizing: border-box;
            margin: 0 auto;
            padding: 20px 22px 24px;

            border:
                1px solid
                #e4e8f0;

            border-radius:
                22px;

            background:
                #ffffff;

            box-shadow:
                0 12px 34px
                rgba(
                    23,
                    32,
                    51,
                    0.07
                );
        }


        .lm22-board.hidden {
            display: none !important;
        }


        .lm22-grid {
            width: 248px;
            margin: 0 auto;

            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    52px
                );

            column-gap:
                10px;

            align-items:
                center;

            justify-items:
                center;
        }


        .lm22-number-row {
            min-height: 47px;
        }


        .lm22-number {
            width: 52px;
            min-height: 44px;

            display: flex;

            align-items:
                center;

            justify-content:
                center;

            color:
                #172033;

            font-size:
                38px;

            font-weight:
                850;

            line-height:
                1;

            font-variant-numeric:
                tabular-nums;

            transition:
                0.18s;
        }


        .lm22-times {
            font-size:
                27px;

            font-weight:
                850;

            color:
                #566175;
        }


        .lm22-active-number {
            color:
                #2457e6
                !important;

            transform:
                scale(
                    1.08
                );
        }


        .lm22-rule,
        .lm22-add-rule {
            width:
                248px;

            height:
                3px;

            margin:
                8px auto 10px;

            border-radius:
                999px;

            background:
                #172033;
        }


        .lm22-label {
            width:
                248px;

            margin:
                8px auto 5px;

            color:
                #6b7689;

            font-size:
                10px;

            font-weight:
                800;

            letter-spacing:
                0.05em;

            text-transform:
                uppercase;

            text-align:
                left;
        }


        .lm22-work-row {
            min-height:
                54px;
        }


        .lm22-input {
            width:
                52px;

            height:
                48px;

            box-sizing:
                border-box;

            padding:
                5px;

            border:
                2px solid
                #d9deea;

            border-radius:
                11px;

            outline:
                none;

            background:
                #ffffff;

            color:
                #172033;

            text-align:
                center;

            font-family:
                inherit;

            font-size:
                27px;

            font-weight:
                850;

            line-height:
                1;

            font-variant-numeric:
                tabular-nums;

            caret-color:
                #2457e6;

            transition:
                0.16s;
        }


        .lm22-input:focus {
            border-color:
                #4f5cff;

            box-shadow:
                0 0 0 4px
                rgba(
                    79,
                    92,
                    255,
                    0.11
                );

            transform:
                translateY(
                    -1px
                );
        }


        .lm22-input.lm22-correct {
            border-color:
                #36a569;

            background:
                #effbf4;

            color:
                #167744;
        }


        .lm22-input:disabled {
            opacity:
                0.34;
        }


        .lm22-input.lm22-correct:disabled {
            opacity:
                1;
        }


        .lm22-phase,
        .lm22-add {
            transition:
                opacity
                0.18s;
        }


        .lm22-locked {
            opacity:
                0.28;

            pointer-events:
                none;
        }


        .lm22-auto,
        .lm22-zero {
            width:
                52px;

            min-height:
                48px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border-radius:
                11px;

            font-size:
                27px;

            font-weight:
                850;

            line-height:
                1;

            font-variant-numeric:
                tabular-nums;
        }


        .lm22-auto {
            color:
                #b45309;
        }


        .lm22-auto:empty {
            visibility:
                hidden;
        }


        .lm22-zero {
            border:
                1px dashed
                #d3d9e4;

            background:
                #f5f7fa;

            color:
                #8a94a6;
        }


        /* CARRY PERKALIAN */

        .lm22-carry {
            position:
                absolute;

            z-index:
                12;

            top:
                16px;

            right:
                12px;

            min-width:
                46px;

            min-height:
                45px;

            padding:
                5px 7px;

            box-sizing:
                border-box;

            display:
                flex;

            flex-direction:
                column;

            align-items:
                center;

            justify-content:
                center;

            border:
                1.5px solid
                #f4a51c;

            border-radius:
                13px;

            background:
                #fff7dc;

            color:
                #b45309;

            box-shadow:
                0 6px 16px
                rgba(
                    245,
                    158,
                    11,
                    0.18
                );

            animation:
                lm22CarryPop
                0.24s
                ease-out;
        }


        .lm22-carry.hidden {
            display:
                none !important;
        }


        .lm22-carry span {
            font-size:
                7px;

            font-weight:
                850;

            text-transform:
                uppercase;
        }


        .lm22-carry strong {
            margin-top:
                2px;

            font-size:
                21px;

            font-weight:
                900;
        }


        @keyframes lm22CarryPop {

            from {
                opacity:
                    0;

                transform:
                    translateY(
                        4px
                    )
                    scale(
                        0.82
                    );
            }

            to {
                opacity:
                    1;

                transform:
                    none;
            }

        }


        /* PANAH */

        .lm22-arrow {
            position:
                absolute;

            z-index:
                11;

            inset:
                0;

            width:
                100%;

            height:
                220px;

            overflow:
                visible;

            pointer-events:
                none;
        }


        .lm22-arrow.hidden {
            opacity:
                0;
        }


        .lm22-arrow-path {
            fill:
                none;

            stroke:
                #f59e0b;

            stroke-width:
                1.65;

            stroke-linecap:
                round;

            stroke-linejoin:
                round;

            stroke-dasharray:
                1;

            stroke-dashoffset:
                1;

            vector-effect:
                non-scaling-stroke;
        }


        .lm22-arrow-head {
            fill:
                none;

            stroke:
                #f59e0b;

            stroke-width:
                1.65;

            stroke-linecap:
                round;

            stroke-linejoin:
                round;

            opacity:
                0;

            vector-effect:
                non-scaling-stroke;
        }


        .lm22-arrow.lm22-draw
        .lm22-arrow-path {

            animation:
                lm22Draw
                0.44s
                cubic-bezier(
                    0.22,
                    0.8,
                    0.32,
                    1
                )
                forwards;
        }


        .lm22-arrow.lm22-draw
        .lm22-arrow-head {

            animation:
                lm22Head
                0.1s
                ease-out
                0.36s
                forwards;
        }


        @keyframes lm22Draw {

            from {
                stroke-dashoffset:
                    1;

                opacity:
                    0.35;
            }

            to {
                stroke-dashoffset:
                    0;

                opacity:
                    1;
            }

        }


        @keyframes lm22Head {

            from {
                opacity:
                    0;
            }

            to {
                opacity:
                    1;
            }

        }


        /* STEP 3 */

        .lm22-add {
            margin-top:
                14px;

            padding-top:
                10px;

            border-top:
                1px dashed
                #dfe4ec;
        }


        .lm22-add-carries {
            min-height:
                25px;

            margin-bottom:
                2px;
        }


        .lm22-add-carry {
            min-width:
                22px;

            height:
                22px;

            padding:
                0 5px;

            box-sizing:
                border-box;

            display:
                inline-flex;

            align-items:
                center;

            justify-content:
                center;

            border:
                1px solid
                #f4a51c;

            border-radius:
                999px;

            background:
                #fff7dc;

            color:
                #b45309;

            font-size:
                13px;

            font-weight:
                900;
        }


        .lm22-add-carry.hidden {
            visibility:
                hidden !important;
        }


        .lm22-source-row {
            min-height:
                37px;

            color:
                #172033;

            font-size:
                27px;

            font-weight:
                800;

            line-height:
                1;

            font-variant-numeric:
                tabular-nums;
        }


        .lm22-source-row-2 {
            position:
                relative;
        }


        .lm22-source-row-2::before {
            content:
                "+";

            position:
                absolute;

            left:
                -2px;

            color:
                #566175;

            font-size:
                22px;

            font-weight:
                850;
        }


        .lm22-add-rule {
            margin-top:
                3px;

            margin-bottom:
                8px;
        }


        .lm22-sum-row {
            min-height:
                52px;
        }


        .lm22-hidden-col {
            visibility:
                hidden !important;

            pointer-events:
                none !important;
        }


        .lm22-current {
            border-color:
                #4f5cff
                !important;

            box-shadow:
                0 0 0 4px
                rgba(
                    79,
                    92,
                    255,
                    0.09
                );
        }


        @media (
            max-width:
            600px
        ) {

            .lm22-board {
                width:
                    294px;

                padding:
                    17px 12px 20px;

                border-radius:
                    18px;
            }


            .lm22-grid,
            .lm22-rule,
            .lm22-add-rule,
            .lm22-label {

                width:
                    224px;
            }


            .lm22-grid {
                grid-template-columns:
                    repeat(
                        4,
                        48px
                    );

                column-gap:
                    8px;
            }


            .lm22-number {
                width:
                    48px;

                font-size:
                    35px;
            }


            .lm22-input,
            .lm22-auto,
            .lm22-zero {

                width:
                    48px;

                height:
                    46px;

                min-height:
                    46px;

                font-size:
                    25px;
            }


            .lm22-carry {
                top:
                    10px;

                right:
                    7px;
            }


            .lm22-arrow {
                height:
                    210px;
            }

        }


        @media (
            max-width:
            390px
        ) {

            .lm22-board {
                width:
                    278px;
            }

        }

    `;


    document.head.appendChild(
        style
    );


    // ==================================================
    // RENDER NUMBER
    // ==================================================

    function renderNumber(
        value,
        spans
    ) {

        const text =
            String(
                value
            )
            .padStart(
                4,
                " "
            );


        spans.forEach(
            (
                span,
                i
            ) => {

                span.textContent =
                    text[i] === " "
                        ? ""
                        : text[i];

            }
        );
    }


    // ==================================================
    // HELP
    // ==================================================

    function setHelp() {

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
                "Kerjakan satu digit dari kanan ke kiri. Carry muncul otomatis.";
        }


        if (note) {

            note.textContent =
                "Baris kedua bergeser satu tempat ke kiri, lalu jumlahkan kedua baris.";
        }
    }


    // ==================================================
    // RENDER QUESTION
    // ==================================================

    renderColumnQuestion =
        function (
            question
        ) {

            if (
                !is2x2()
            ) {

                board.classList.add(
                    "hidden"
                );


                existingBoard.classList.remove(
                    "hidden"
                );


                prev.render(
                    question
                );


                return;
            }


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


            existingBoard
                .classList
                .add(
                    "hidden"
                );


            board
                .classList
                .remove(
                    "hidden"
                );


            const x =
                analyze(

                    Number(
                        question.a
                    ),

                    Number(
                        question.b
                    )

                );


            columnTopNumber.textContent =
                formatNumber(
                    question.a
                );


            columnBottomNumber.textContent =
                formatNumber(
                    question.b
                );


            el.topT.textContent =
                x.aT;


            el.topO.textContent =
                x.aO;


            el.bottomT.textContent =
                x.bT;


            el.bottomO.textContent =
                x.bO;


            renderNumber(

                x.row1,

                [
                    el.a1K,
                    el.a1H,
                    el.a1T,
                    el.a1O
                ]

            );


            renderNumber(

                x.row2,

                [
                    el.a2K,
                    el.a2H,
                    el.a2T,
                    el.a2O
                ]

            );


            const hidden =
                4
                -
                x.finalLength;


            sumsLTR.forEach(
                (
                    input,
                    i
                ) => {

                    input.classList.toggle(

                        "lm22-hidden-col",

                        i < hidden

                    );
                }
            );


            clearValues();

            resetLocks();

            setHelp();

            setTarget(
                "r1o",
                x
            );
        };


    // ==================================================
    // RESET INPUT
    // ==================================================

    resetQuestionInputs =
        function () {

            if (
                !is2x2()
            ) {

                return prev.reset();
            }


            answerFeedback.textContent =
                "";


            answerFeedback.className =
                "answer-feedback";


            clearClasses();
        };


    // ==================================================
    // CLEAR CURRENT
    // ==================================================

    clearCurrentInputValues =
        function () {

            if (
                !is2x2()
            ) {

                return prev.clear();
            }


            answerInput.value =
                "";


            columnStep1Input.value =
                "";


            columnStep2Input.value =
                "";


            columnFinalInput.value =
                "";


            clearValues();

            resetLocks();


            const x =
                currentExpected();


            if (x) {

                setTarget(
                    "r1o",
                    x
                );
            }
        };


    // ==================================================
    // ENGINE COMPATIBILITY
    // ==================================================

    if (
        prev.getInputs
    ) {

        getColumnInputs =
            function () {

                if (
                    !is2x2()
                ) {

                    return prev.getInputs();
                }


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
    }


    if (
        prev.hasAny
    ) {

        hasAnyColumnInput =
            function () {

                if (
                    !is2x2()
                ) {

                    return prev.hasAny();
                }


                return allInputs.some(
                    input =>
                        input
                            .value
                            .trim()
                        !==
                        ""
                );
            };
    }


    if (
        prev.inputsCorrect
    ) {

        columnInputsAreCorrect =
            function (
                inputs,
                expected
            ) {

                if (
                    !is2x2()
                ) {

                    return prev.inputsCorrect(
                        inputs,
                        expected
                    );
                }


                return complete(
                    expected
                );
            };
    }


    if (
        prev.refresh
    ) {

        refreshColumnLiveMarkers =
            function () {

                if (
                    !is2x2()
                ) {

                    return prev.refresh();
                }


                restoreFromEngine();
            };
    }


    // ==================================================
    // FOCUS
    // ==================================================

    focusCurrentInput =
        function () {

            if (
                !is2x2()
            ) {

                return prev.focus();
            }


            if (
                !answerLocked
            ) {

                focusNext();
            }
        };


    // ==================================================
    // DISABLE
    // ==================================================

    disableColumnInputs =
        function () {

            if (
                !is2x2()
            ) {

                return prev.disable();
            }


            allInputs.forEach(
                input => {

                    input.disabled =
                        true;
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

    function handleInput(
        event
    ) {

        if (
            !is2x2()
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


        const x =
            currentExpected();


        if (!x) {

            return;
        }


        const input =
            event.currentTarget;


        input.value =
            digits(
                input.value
            );


        input.classList.remove(
            "lm22-correct"
        );


        if (
            input ===
            el.r1O
        ) {

            stepR1O(
                x
            );


        } else if (
            input ===
            el.r1T
        ) {

            stepR1T(
                x
            );


        } else if (
            input ===
            el.r2T
        ) {

            stepR2T(
                x
            );


        } else if (
            input ===
            el.r2H
        ) {

            stepR2H(
                x
            );


        } else {

            stepAdd(
                x,
                input
            );
        }


        syncEngine(
            x
        );


        savePracticeState();
    }


    // ==================================================
    // STEP 1 - SATUAN
    // ==================================================

    function stepR1O(
        x
    ) {

        if (
            !eq(
                el.r1O,
                x.r1O
            )
        ) {

            el.r1T.value =
                "";


            el.r1T.disabled =
                true;


            el.r1Lead.textContent =
                "";


            clearStep2AndAdd();

            hideCarry();


            setTarget(
                "r1o",
                x
            );


            return;
        }


        correct(
            el.r1O
        );


        el.r1O.disabled =
            true;


        showCarry(
            x.r1c1
        );


        el.r1T.disabled =
            false;


        setTarget(
            "r1t",
            x
        );


        moveFocus(

            el.r1T,

            () =>
                eq(
                    el.r1O,
                    x.r1O
                )

        );
    }


    // ==================================================
    // STEP 1 - PULUHAN
    // ==================================================

    function stepR1T(
        x
    ) {

        if (
            !eq(
                el.r1O,
                x.r1O
            )
        ) {

            el.r1T.value =
                "";


            focus(
                el.r1O
            );


            return;
        }


        if (
            !eq(
                el.r1T,
                x.r1T
            )
        ) {

            el.r1Lead.textContent =
                "";


            clearStep2AndAdd();


            showCarry(
                x.r1c1
            );


            setTarget(
                "r1t",
                x
            );


            return;
        }


        correct(
            el.r1T
        );


        el.r1T.disabled =
            true;


        // Jika hasil paling kiri masih memiliki carry,
        // muncul otomatis.

        el.r1Lead.textContent =
            x.r1c2 > 0
                ? String(
                    x.r1c2
                )
                : "";


        if (
            x.r1c2 > 0
        ) {

            showCarry(
                x.r1c2
            );


        } else {

            hideCarry();
        }


        unlockStep2();


        setTarget(
            "r2t",
            x
        );


        moveFocus(

            el.r2T,

            () =>
                row1Done(
                    x
                )

        );
    }


    // ==================================================
    // STEP 2 - SATUAN ANGKA ATAS
    // hasil berada di kolom puluhan
    // ==================================================

    function stepR2T(
        x
    ) {

        if (
            !row1Done(
                x
            )
        ) {

            el.r2T.value =
                "";


            focusNext();

            return;
        }


        if (
            !eq(
                el.r2T,
                x.r2T
            )
        ) {

            el.r2H.value =
                "";


            el.r2H.disabled =
                true;


            el.r2Lead.textContent =
                "";


            lockAdd();

            hideCarry();


            setTarget(
                "r2t",
                x
            );


            return;
        }


        correct(
            el.r2T
        );


        el.r2T.disabled =
            true;


        showCarry(
            x.r2c1
        );


        el.r2H.disabled =
            false;


        setTarget(
            "r2h",
            x
        );


        moveFocus(

            el.r2H,

            () =>
                eq(
                    el.r2T,
                    x.r2T
                )

        );
    }


    // ==================================================
    // STEP 2 - DIGIT DEPAN
    // ==================================================

    function stepR2H(
        x
    ) {

        if (
            !eq(
                el.r2T,
                x.r2T
            )
        ) {

            el.r2H.value =
                "";


            focus(
                el.r2T
            );


            return;
        }


        if (
            !eq(
                el.r2H,
                x.r2H
            )
        ) {

            lockAdd();


            showCarry(
                x.r2c1
            );


            setTarget(
                "r2h",
                x
            );


            return;
        }


        correct(
            el.r2H
        );


        el.r2H.disabled =
            true;


        el.r2Lead.textContent =
            x.r2c2 > 0
                ? String(
                    x.r2c2
                )
                : "";


        if (
            x.r2c2 > 0
        ) {

            showCarry(
                x.r2c2
            );


        } else {

            hideCarry();
        }


        unlockAdd(
            x
        );


        setTimeout(
            () => {

                if (
                    !answerLocked
                    &&
                    row2Done(
                        x
                    )
                ) {

                    focusNext();
                }

            },
            MOVE_DELAY
        );
    }


    // ==================================================
    // STEP 3 - PENJUMLAHAN
    // ==================================================

    function stepAdd(
        x,
        input
    ) {

        if (
            !row2Done(
                x
            )
        ) {

            input.value =
                "";


            focusNext();

            return;
        }


        const active =
            addInputs(
                x
            );


        const idx =
            active.indexOf(
                input
            );


        if (
            idx < 0
        ) {

            return;
        }


        // Wajib dari kanan ke kiri.

        for (
            let i = 0;
            i < idx;
            i++
        ) {

            if (
                !eq(
                    active[i],
                    x.add[i].write
                )
            ) {

                input.value =
                    "";


                focus(
                    active[i]
                );


                return;
            }
        }


        const step =
            x.add[
                idx
            ];


        if (
            !eq(
                input,
                step.write
            )
        ) {

            clearAddAfter(
                x,
                idx + 1
            );


            showCarryForAddCurrent(
                x,
                idx
            );


            setAddInstruction(
                step
            );


            return;
        }


        correct(
            input
        );


        input.disabled =
            true;


        if (
            step.carryOut > 0

            &&

            idx + 1 <
            active.length
        ) {

            showAddCarry(

                idx + 1,

                step.carryOut

            );


        } else {

            hideAddCarries();
        }


        // ==============================================
        // PINDAH KE KOLOM BERIKUTNYA
        // ==============================================

        if (
            idx <
            active.length - 1
        ) {

            const next =
                active[
                    idx + 1
                ];


            next.disabled =
                false;


            setAddInstruction(
                x.add[
                    idx + 1
                ]
            );


            moveFocus(

                next,

                () =>
                    eq(
                        input,
                        step.write
                    )

            );


            return;
        }


        // ==============================================
        // SELESAI
        // ==============================================

        if (
            addDone(
                x
            )
        ) {

            hideAddCarries();


            methodText.textContent =
                `Hasilnya ${x.final}.`;


            if (
                carryNote
            ) {

                carryNote.textContent =
                    "Semua langkah sudah benar.";
            }


            scheduleSubmit();
        }
    }


    // ==================================================
    // ENTER
    // ==================================================

    function handleKeydown(
        event
    ) {

        if (
            !is2x2()

            ||

            event.key !==
            "Enter"
        ) {

            return;
        }


        event.preventDefault();

        event.stopImmediatePropagation();


        if (
            !answerLocked
        ) {

            focusNext();
        }
    }


    // ==================================================
    // TARGET DIGIT
    // ==================================================

    function setTarget(
        target,
        x
    ) {

        [
            el.topT,
            el.topO,
            el.bottomT,
            el.bottomO
        ]
        .forEach(
            node => {

                node.classList.remove(
                    "lm22-active-number"
                );
            }
        );


        if (
            target ===
            "r1o"
        ) {

            el.bottomO
                .classList
                .add(
                    "lm22-active-number"
                );


            el.topO
                .classList
                .add(
                    "lm22-active-number"
                );


            methodText.textContent =
                `Step 1: ${x.bO} × ${x.aO}`;


            if (
                carryNote
            ) {

                carryNote.textContent =
                    "Tulis satu digit hasil paling belakang.";
            }


        } else if (
            target ===
            "r1t"
        ) {

            el.bottomO
                .classList
                .add(
                    "lm22-active-number"
                );


            el.topT
                .classList
                .add(
                    "lm22-active-number"
                );


            methodText.textContent =
                x.r1c1 > 0

                    ? `Step 1: ${x.bO} × ${x.aT} + ${x.r1c1}`

                    : `Step 1: ${x.bO} × ${x.aT}`;


        } else if (
            target ===
            "r2t"
        ) {

            el.bottomT
                .classList
                .add(
                    "lm22-active-number"
                );


            el.topO
                .classList
                .add(
                    "lm22-active-number"
                );


            methodText.textContent =
                `Step 2: ${x.bT} × ${x.aO}`;


            if (
                carryNote
            ) {

                carryNote.textContent =
                    "Baris kedua bergeser satu tempat ke kiri. Nol kanan muncul otomatis.";
            }


        } else {

            el.bottomT
                .classList
                .add(
                    "lm22-active-number"
                );


            el.topT
                .classList
                .add(
                    "lm22-active-number"
                );


            methodText.textContent =
                x.r2c1 > 0

                    ? `Step 2: ${x.bT} × ${x.aT} + ${x.r2c1}`

                    : `Step 2: ${x.bT} × ${x.aT}`;
        }


        drawArrow(
            target
        );
    }


    // ==================================================
    // PANAH
    // ==================================================

    function drawArrow(
        target
    ) {

        const paths = {

            r1o: [

                "M 250 119 C 250 98, 250 75, 250 53",

                "M 244 60 L 250 52 L 256 60"

            ],


            r1t: [

                "M 250 119 C 231 95, 211 73, 188 53",

                "M 190 62 L 187 52 L 198 55"

            ],


            r2t: [

                "M 188 119 C 207 95, 228 73, 250 53",

                "M 240 55 L 251 52 L 247 63"

            ],


            r2h: [

                "M 188 119 C 188 98, 188 75, 188 53",

                "M 182 60 L 188 52 L 194 60"

            ]

        };


        const [
            path,
            head
        ] =
            paths[
                target
            ];


        el.arrowPath.setAttribute(
            "d",
            path
        );


        el.arrowHead.setAttribute(
            "d",
            head
        );


        el.arrow.classList.remove(
            "hidden",
            "lm22-draw"
        );


        // restart animation
        void el.arrow
            .getBoundingClientRect();


        el.arrow.classList.add(
            "lm22-draw"
        );
    }


    function hideArrow() {

        el.arrow.classList.add(
            "hidden"
        );


        el.arrow.classList.remove(
            "lm22-draw"
        );
    }


    // ==================================================
    // CARRY PERKALIAN
    // ==================================================

    function showCarry(
        value
    ) {

        if (
            !Number(
                value
            )

            ||

            Number(
                value
            ) <= 0
        ) {

            return hideCarry();
        }


        el.carryValue.textContent =
            String(
                value
            );


        el.carry.classList.remove(
            "hidden"
        );


        if (
            carryNote
        ) {

            carryNote.textContent =
                `Simpan ${value}, lalu tambahkan pada perkalian berikutnya.`;
        }
    }


    function hideCarry() {

        el.carryValue.textContent =
            "";


        el.carry.classList.add(
            "hidden"
        );
    }


    // ==================================================
    // UNLOCK STEP 2
    // ==================================================

    function unlockStep2() {

        hideCarry();


        el.step2
            .classList
            .remove(
                "lm22-locked"
            );


        el.r2T.disabled =
            false;


        el.r2H.disabled =
            true;
    }


    // ==================================================
    // UNLOCK ADDITION
    // ==================================================

    function unlockAdd(
        x
    ) {

        hideCarry();

        hideArrow();


        [
            el.topT,
            el.topO,
            el.bottomT,
            el.bottomO
        ]
        .forEach(
            node => {

                node.classList.remove(
                    "lm22-active-number"
                );
            }
        );


        el.add
            .classList
            .remove(
                "lm22-locked"
            );


        clearAddInputs();

        hideAddCarries();


        const active =
            addInputs(
                x
            );


        if (
            active[0]
        ) {

            active[0].disabled =
                false;


            active[0]
                .classList
                .add(
                    "lm22-current"
                );
        }


        setAddInstruction(
            x.add[0]
        );


        if (
            carryNote
        ) {

            carryNote.textContent =
                "Jumlahkan dari kanan ke kiri. Carry akan muncul otomatis bila diperlukan.";
        }
    }


    // ==================================================
    // ADD INSTRUCTION
    // ==================================================

    function setAddInstruction(
        step
    ) {

        if (!step) {

            return;
        }


        methodText.textContent =
            step.carryIn > 0

                ? `Step 3: ${step.d1} + ${step.d2} + simpanan ${step.carryIn}`

                : `Step 3: ${step.d1} + ${step.d2}`;
    }


    // ==================================================
    // ACTIVE SUM INPUTS
    // kanan -> kiri
    // ==================================================

    function addInputs(
        x
    ) {

        return [

            el.sumO,

            el.sumT,

            el.sumH,

            el.sumK

        ]
        .slice(
            0,
            x.finalLength
        );
    }


    // ==================================================
    // CARRY PENJUMLAHAN
    // ==================================================

    function showAddCarry(
        nextIdx,
        value
    ) {

        hideAddCarries();


        const target =

            nextIdx === 1

                ? el.c10

                : nextIdx === 2

                    ? el.c100

                    : nextIdx === 3

                        ? el.c1000

                        : null;


        if (
            !target

            ||

            !Number(
                value
            )
        ) {

            return;
        }


        target.textContent =
            String(
                value
            );


        target.classList.remove(
            "hidden"
        );
    }


    function showCarryForAddCurrent(
        x,
        idx
    ) {

        if (
            idx <= 0
        ) {

            return hideAddCarries();
        }


        const step =
            x.add[
                idx
            ];


        if (
            step
            ?.carryIn
            > 0
        ) {

            showAddCarry(
                idx,
                step.carryIn
            );


        } else {

            hideAddCarries();
        }
    }


    function hideAddCarries() {

        [
            el.c1000,
            el.c100,
            el.c10
        ]
        .forEach(
            node => {

                node.textContent =
                    "";


                node.classList.add(
                    "hidden"
                );
            }
        );
    }


    // ==================================================
    // CLEAR ADDITION
    // ==================================================

    function clearAddInputs() {

        sumsLTR.forEach(
            input => {

                input.value =
                    "";


                input.disabled =
                    true;


                input.classList.remove(
                    "lm22-correct",
                    "lm22-current"
                );
            }
        );
    }


    function clearAddAfter(
        x,
        start
    ) {

        const active =
            addInputs(
                x
            );


        for (
            let i = start;
            i < active.length;
            i++
        ) {

            active[i].value =
                "";


            active[i].disabled =
                true;


            active[i]
                .classList
                .remove(
                    "lm22-correct",
                    "lm22-current"
                );
        }


        active.forEach(
            input => {

                input.classList.remove(
                    "lm22-current"
                );
            }
        );


        if (
            start - 1 >= 0

            &&

            start - 1 <
            active.length
        ) {

            active[
                start - 1
            ]
            .classList
            .add(
                "lm22-current"
            );
        }
    }


    // ==================================================
    // LOCK
    // ==================================================

    function lockAdd() {

        el.add
            .classList
            .add(
                "lm22-locked"
            );


        clearAddInputs();

        hideAddCarries();
    }


    function clearStep2AndAdd() {

        el.r2T.value =
            "";


        el.r2H.value =
            "";


        el.r2Lead.textContent =
            "";


        el.r2T.disabled =
            true;


        el.r2H.disabled =
            true;


        el.step2
            .classList
            .add(
                "lm22-locked"
            );


        lockAdd();
    }


    // ==================================================
    // CLEAR VALUES
    // ==================================================

    function clearValues() {

        allInputs.forEach(
            input => {

                input.value =
                    "";
            }
        );


        el.r1Lead.textContent =
            "";


        el.r2Lead.textContent =
            "";


        clearClasses();

        hideCarry();

        hideAddCarries();

        hideArrow();


        [
            el.topT,
            el.topO,
            el.bottomT,
            el.bottomO
        ]
        .forEach(
            node => {

                node.classList.remove(
                    "lm22-active-number"
                );
            }
        );
    }


    function clearClasses() {

        allInputs.forEach(
            input => {

                input.classList.remove(
                    "lm22-correct",
                    "lm22-current"
                );
            }
        );
    }


    // ==================================================
    // RESET LOCKS
    // ==================================================

    function resetLocks() {

        el.r1O.disabled =
            false;


        el.r1T.disabled =
            true;


        el.r2T.disabled =
            true;


        el.r2H.disabled =
            true;


        el.step2
            .classList
            .add(
                "lm22-locked"
            );


        el.add
            .classList
            .add(
                "lm22-locked"
            );


        sumsLTR.forEach(
            input => {

                input.disabled =
                    true;
            }
        );
    }


    // ==================================================
    // COMPLETION CHECK
    // ==================================================

    function row1Done(
        x
    ) {

        return (

            eq(
                el.r1O,
                x.r1O
            )

            &&

            eq(
                el.r1T,
                x.r1T
            )

        );
    }


    function row2Done(
        x
    ) {

        return (

            eq(
                el.r2T,
                x.r2T
            )

            &&

            eq(
                el.r2H,
                x.r2H
            )

        );
    }


    function addDone(
        x
    ) {

        return addInputs(
            x
        )
        .every(
            (
                input,
                idx
            ) =>

                eq(
                    input,
                    x.add[
                        idx
                    ].write
                )
        );
    }


    function complete(
        x
    ) {

        return (

            row1Done(
                x
            )

            &&

            row2Done(
                x
            )

            &&

            addDone(
                x
            )

        );
    }


    // ==================================================
    // TYPED VALUES
    // ==================================================

    function typedRow1() {

        if (
            !el.r1O.value

            &&

            !el.r1T.value
        ) {

            return "";
        }


        return (
            `${el.r1Lead.textContent.trim()}`
            +
            `${el.r1T.value}`
            +
            `${el.r1O.value}`
        );
    }


    function typedRow2() {

        if (
            !el.r2T.value

            &&

            !el.r2H.value
        ) {

            return "";
        }


        return (
            `${el.r2Lead.textContent.trim()}`
            +
            `${el.r2H.value}`
            +
            `${el.r2T.value}`
            +
            `0`
        );
    }


    function typedFinal(
        x
    ) {

        const active =
            addInputs(
                x
            );


        if (
            active.some(
                input =>
                    input.value === ""
            )
        ) {

            return "";
        }


        return active

            .slice()

            .reverse()

            .map(
                input =>
                    input.value
            )

            .join("");
    }


    // ==================================================
    // SYNC ENGINE
    // ==================================================

    function syncEngine(
        x
    ) {

        columnStep1Input.value =
            typedRow1();


        columnStep2Input.value =
            typedRow2();


        columnFinalInput.value =
            typedFinal(
                x
            );
    }


    // ==================================================
    // RESTORE
    // ==================================================

    function restoreFromEngine() {

        const x =
            currentExpected();


        if (!x) {

            return;
        }


        const r1 =
            String(
                columnStep1Input
                    .value
                ||
                ""
            );


        const r2s =
            String(
                columnStep2Input
                    .value
                ||
                ""
            );


        const fin =
            String(
                columnFinalInput
                    .value
                ||
                ""
            );


        clearValues();

        resetLocks();


        // ==============================================
        // RESTORE ROW 1
        // ==============================================

        if (
            r1.length >= 1
        ) {

            el.r1O.value =
                r1.slice(
                    -1
                );
        }


        if (
            r1.length >= 2
        ) {

            el.r1T.value =
                r1.slice(
                    -2,
                    -1
                );
        }


        if (
            r1.length >= 3
        ) {

            el.r1Lead.textContent =
                r1.slice(
                    0,
                    -2
                );
        }


        if (
            !eq(
                el.r1O,
                x.r1O
            )
        ) {

            setTarget(
                "r1o",
                x
            );


            return;
        }


        correct(
            el.r1O
        );


        el.r1O.disabled =
            true;


        el.r1T.disabled =
            false;


        if (
            !eq(
                el.r1T,
                x.r1T
            )
        ) {

            showCarry(
                x.r1c1
            );


            setTarget(
                "r1t",
                x
            );


            return;
        }


        correct(
            el.r1T
        );


        el.r1T.disabled =
            true;


        el.r1Lead.textContent =
            x.r1c2 > 0

                ? String(
                    x.r1c2
                )

                : "";


        unlockStep2();


        // ==============================================
        // RESTORE ROW 2
        // ==============================================

        const raw2 =
            r2s.endsWith(
                "0"
            )

                ? r2s.slice(
                    0,
                    -1
                )

                : r2s;


        if (
            raw2.length >= 1
        ) {

            el.r2T.value =
                raw2.slice(
                    -1
                );
        }


        if (
            raw2.length >= 2
        ) {

            el.r2H.value =
                raw2.slice(
                    -2,
                    -1
                );
        }


        if (
            raw2.length >= 3
        ) {

            el.r2Lead.textContent =
                raw2.slice(
                    0,
                    -2
                );
        }


        if (
            !eq(
                el.r2T,
                x.r2T
            )
        ) {

            setTarget(
                "r2t",
                x
            );


            return;
        }


        correct(
            el.r2T
        );


        el.r2T.disabled =
            true;


        el.r2H.disabled =
            false;


        if (
            !eq(
                el.r2H,
                x.r2H
            )
        ) {

            showCarry(
                x.r2c1
            );


            setTarget(
                "r2h",
                x
            );


            return;
        }


        correct(
            el.r2H
        );


        el.r2H.disabled =
            true;


        el.r2Lead.textContent =
            x.r2c2 > 0

                ? String(
                    x.r2c2
                )

                : "";


        unlockAdd(
            x
        );


        // ==============================================
        // RESTORE FINAL
        // ==============================================

        if (
            fin
        ) {

            const digitsRTL =
                fin
                    .split("")
                    .reverse();


            const active =
                addInputs(
                    x
                );


            for (
                let i = 0;

                i <
                Math.min(
                    active.length,
                    digitsRTL.length
                );

                i++
            ) {

                active[i].value =
                    digitsRTL[i];


                if (
                    eq(
                        active[i],
                        x.add[
                            i
                        ].write
                    )
                ) {

                    correct(
                        active[i]
                    );


                    active[i].disabled =
                        true;


                } else {

                    break;
                }
            }
        }


        focusNext();
    }


    // ==================================================
    // NEXT FOCUS
    // ==================================================

    function focusNext() {

        const x =
            currentExpected();


        if (!x) {

            return;
        }


        // ==============================================
        // ROW 1 SATUAN
        // ==============================================

        if (
            !eq(
                el.r1O,
                x.r1O
            )
        ) {

            el.r1O.disabled =
                false;


            setTarget(
                "r1o",
                x
            );


            return focus(
                el.r1O
            );
        }


        // ==============================================
        // ROW 1 PULUHAN
        // ==============================================

        if (
            !eq(
                el.r1T,
                x.r1T
            )
        ) {

            el.r1T.disabled =
                false;


            showCarry(
                x.r1c1
            );


            setTarget(
                "r1t",
                x
            );


            return focus(
                el.r1T
            );
        }


        // ==============================================
        // ROW 2
        // ==============================================

        unlockStep2();


        if (
            !eq(
                el.r2T,
                x.r2T
            )
        ) {

            el.r2T.disabled =
                false;


            setTarget(
                "r2t",
                x
            );


            return focus(
                el.r2T
            );
        }


        if (
            !eq(
                el.r2H,
                x.r2H
            )
        ) {

            el.r2H.disabled =
                false;


            showCarry(
                x.r2c1
            );


            setTarget(
                "r2h",
                x
            );


            return focus(
                el.r2H
            );
        }


        // ==============================================
        // ADDITION
        // ==============================================

        el.add
            .classList
            .remove(
                "lm22-locked"
            );


        hideCarry();

        hideArrow();


        [
            el.topT,
            el.topO,
            el.bottomT,
            el.bottomO
        ]
        .forEach(
            node => {

                node.classList.remove(
                    "lm22-active-number"
                );
            }
        );


        const active =
            addInputs(
                x
            );


        for (
            let idx = 0;

            idx <
            active.length;

            idx++
        ) {

            if (
                !eq(
                    active[idx],
                    x.add[
                        idx
                    ].write
                )
            ) {

                active[idx].disabled =
                    false;


                active.forEach(
                    input => {

                        input.classList.remove(
                            "lm22-current"
                        );
                    }
                );


                active[idx]
                    .classList
                    .add(
                        "lm22-current"
                    );


                showCarryForAddCurrent(
                    x,
                    idx
                );


                setAddInstruction(
                    x.add[
                        idx
                    ]
                );


                return focus(
                    active[
                        idx
                    ]
                );
            }
        }
    }


    // ==================================================
    // SUBMIT
    // ==================================================

    submitColumnAnswer =
        function () {

            if (
                !is2x2()
            ) {

                return prev.submit();
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


            const x =
                analyze(

                    Number(
                        question.a
                    ),

                    Number(
                        question.b
                    )

                );


            const hasAny =
                allInputs.some(
                    input =>
                        input
                            .value
                            .trim()
                        !==
                        ""
                );


            if (
                !hasAny
            ) {

                return submitTimeout();
            }


            const ok =
                complete(
                    x
                );


            const finalValue =
                typedFinal(
                    x
                );


            answerLocked =
                true;


            clearTimer();


            clearTimeout(
                delayedSubmit
            );


            delayedSubmit =
                null;


            disableColumnInputs();

            hideCarry();

            hideAddCarries();

            hideArrow();


            let status;


            if (
                ok
            ) {

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
                        x.final
                    )}`;


                answerFeedback.className =
                    "answer-feedback feedback-wrong";
            }


            const responseTime =
                typeof getResponseTime ===
                    "function"

                    ? getResponseTime()

                    : Math.max(

                        0,

                        Date.now()
                        -
                        Number(
                            questionStartedAt
                            ||
                            Date.now()
                        )

                    );


            answers.push({

                a:
                    question.a,

                b:
                    question.b,

                user_answer:
                    finalValue,

                steps: {

                    partial_1:
                        typedRow1(),

                    partial_2:
                        typedRow2(),

                    final:
                        finalValue

                },

                response_time_ms:
                    responseTime,

                client_status:
                    status

            });


            liveCorrect.textContent =
                String(
                    correctCount
                );


            if (
                typeof closeCurrentQuestionState ===
                "function"
            ) {

                closeCurrentQuestionState();


            } else {

                questionStartedAt =
                    0;


                questionDeadline =
                    0;
            }


            savePracticeState();


            setTimeout(

                nextQuestion,

                ok
                    ? 1000
                    : 1200

            );
        };


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


                    const x =
                        currentExpected();


                    if (
                        x

                        &&

                        complete(
                            x
                        )
                    ) {

                        syncEngine(
                            x
                        );


                        submitColumnAnswer();
                    }

                },
                SUBMIT_DELAY
            );
    }


    // ==================================================
    // CURRENT EXPECTED
    // ==================================================

    function currentExpected() {

        const question =
            questions[
                currentQuestionIndex
            ];


        return question

            ? analyze(

                Number(
                    question.a
                ),

                Number(
                    question.b
                )

            )

            : null;
    }


    // ==================================================
    // HELPERS
    // ==================================================

    function eq(
        input,
        value
    ) {

        return (

            input.value !== ""

            &&

            Number(
                input.value
            )
            ===
            Number(
                value
            )

        );
    }


    function correct(
        input
    ) {

        input.classList.add(
            "lm22-correct"
        );


        input.classList.remove(
            "lm22-current"
        );
    }


    function digits(
        value
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
            1
        );
    }


    function focus(
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


    function moveFocus(
        input,
        condition
    ) {

        setTimeout(
            () => {

                if (
                    !answerLocked

                    &&

                    condition()
                ) {

                    focus(
                        input
                    );
                }

            },
            MOVE_DELAY
        );
    }


    // ==================================================
    // EVENT LISTENERS
    // ==================================================

    allInputs.forEach(
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
