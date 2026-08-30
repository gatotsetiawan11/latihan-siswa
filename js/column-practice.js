// ======================================================
// LATIHAN SISWA
// COLUMN MULTIPLICATION PRACTICE
// REVISI: 2 DIGIT x 1 DIGIT
//
// Fitur:
// - Soal selalu 2 digit x 1 digit
// - Wajib dari belakang
// - Ada panah bantuan ke digit aktif
// - Carry otomatis muncul kecil jika diperlukan
// - Fokus input bergerak otomatis
// ======================================================

(function () {

    // ==================================================
    // STATE
    // ==================================================

    let currentProblem = null;
    let currentStep = 1;
    let inputLock = false;

    const state = {
        total: 10,
        index: 1,
        correct: 0
    };

    // ==================================================
    // DOM
    // ==================================================

    const root =
        document.getElementById("columnPracticeRoot");

    if (!root) {
        return;
    }

    // ==================================================
    // RENDER BASE UI
    // ==================================================

    root.innerHTML = `
        <section class="column-math-shell">

            <div class="column-math-topbar">
                <div class="column-math-progress">
                    <strong id="columnQuestionCounter">Soal 1 / 10</strong>
                    <span id="columnCorrectCounter">Benar 0</span>
                </div>
            </div>

            <div class="column-help-box">
                <div id="columnInstructionText" class="column-help-text">
                    Kerjakan dari belakang. Mulai dari 1 angka paling kanan.
                </div>
            </div>

            <div class="column-board">

                <div class="column-arrow-layer">
                    <div id="columnGuideArrow" class="column-guide-arrow hidden">
                        <span class="arrow-line"></span>
                        <span class="arrow-head"></span>
                    </div>
                </div>

                <div class="column-problem-grid">

                    <div class="column-empty-cell"></div>
                    <div id="topTensDigit" class="column-digit top-digit"></div>
                    <div id="topOnesDigit" class="column-digit top-digit active-digit"></div>

                    <div class="column-empty-cell"></div>
                    <div class="column-operator">×</div>
                    <div id="bottomDigit" class="column-digit bottom-digit"></div>

                    <div class="column-carry-cell"></div>
                    <div id="carryDisplay" class="column-carry-display"></div>
                    <div class="column-carry-cell"></div>

                    <div class="column-line" aria-hidden="true"></div>
                    <div class="column-line" aria-hidden="true"></div>
                    <div class="column-line" aria-hidden="true"></div>

                    <div class="column-empty-cell"></div>

                    <input
                        id="answerStep2"
                        class="column-answer-input"
                        type="tel"
                        inputmode="numeric"
                        maxlength="1"
                        autocomplete="off"
                        disabled
                    >

                    <input
                        id="answerStep1"
                        class="column-answer-input"
                        type="tel"
                        inputmode="numeric"
                        maxlength="1"
                        autocomplete="off"
                    >

                </div>
            </div>

            <div id="columnFeedback" class="column-feedback">
                Ketik 1 angka. Fokus akan pindah otomatis ke langkah berikutnya.
            </div>

        </section>
    `;

    const questionCounter =
        document.getElementById("columnQuestionCounter");

    const correctCounter =
        document.getElementById("columnCorrectCounter");

    const instructionText =
        document.getElementById("columnInstructionText");

    const topTensDigit =
        document.getElementById("topTensDigit");

    const topOnesDigit =
        document.getElementById("topOnesDigit");

    const bottomDigit =
        document.getElementById("bottomDigit");

    const carryDisplay =
        document.getElementById("carryDisplay");

    const guideArrow =
        document.getElementById("columnGuideArrow");

    const answerStep1 =
        document.getElementById("answerStep1");

    const answerStep2 =
        document.getElementById("answerStep2");

    const feedback =
        document.getElementById("columnFeedback");

    // ==================================================
    // START
    // ==================================================

    bindEvents();
    loadNextProblem();

    // ==================================================
    // EVENTS
    // ==================================================

    function bindEvents() {

        answerStep1.addEventListener(
            "input",
            handleStep1Input
        );

        answerStep2.addEventListener(
            "input",
            handleStep2Input
        );

        answerStep1.addEventListener(
            "keydown",
            handleNumericKeyOnly
        );

        answerStep2.addEventListener(
            "keydown",
            handleNumericKeyOnly
        );

    }

    function handleNumericKeyOnly(event) {

        const allowedKeys = [
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Tab"
        ];

        if (allowedKeys.includes(event.key)) {
            return;
        }

        if (!/^\d$/.test(event.key)) {
            event.preventDefault();
        }

    }

    // ==================================================
    // PROBLEM GENERATOR
    // ==================================================

    function generateProblem() {

        const a =
            randomInt(10, 99);

        const b =
            randomInt(2, 9);

        const tens =
            Math.floor(a / 10);

        const ones =
            a % 10;

        const firstProduct =
            ones * b;

        const firstDigit =
            firstProduct % 10;

        const carry =
            Math.floor(firstProduct / 10);

        const secondValue =
            (tens * b) + carry;

        return {
            a,
            b,
            tens,
            ones,
            firstProduct,
            firstDigit,
            carry,
            secondValue
        };

    }

    function randomInt(min, max) {
        return Math.floor(
            Math.random() * (max - min + 1)
        ) + min;
    }

    // ==================================================
    // LOAD NEXT
    // ==================================================

    function loadNextProblem() {

        inputLock = false;
        currentStep = 1;
        currentProblem = generateProblem();

        renderProblem();
        resetInputs();
        updateHeader();
        setStep1State();

        window.setTimeout(
            () => {
                answerStep1.focus();
                answerStep1.select();
            },
            120
        );

    }

    function renderProblem() {

        topTensDigit.textContent =
            String(currentProblem.tens);

        topOnesDigit.textContent =
            String(currentProblem.ones);

        bottomDigit.textContent =
            String(currentProblem.b);

        carryDisplay.textContent = "";

        feedback.textContent =
            "Mulai dari belakang: " +
            currentProblem.b +
            " × " +
            currentProblem.ones;

    }

    function resetInputs() {

        answerStep1.value = "";
        answerStep2.value = "";

        answerStep1.disabled = false;
        answerStep2.disabled = true;

        answerStep1.classList.remove("correct", "wrong");
        answerStep2.classList.remove("correct", "wrong");

        carryDisplay.classList.remove("show-carry");

    }

    function updateHeader() {

        questionCounter.textContent =
            "Soal " +
            state.index +
            " / " +
            state.total;

        correctCounter.textContent =
            "Benar " +
            state.correct;

    }

    // ==================================================
    // STEP STATES
    // ==================================================

    function setStep1State() {

        currentStep = 1;

        topTensDigit.classList.remove("active-digit");
        topOnesDigit.classList.add("active-digit");
        bottomDigit.classList.add("active-digit");

        instructionText.textContent =
            "Langkah 1: hitung " +
            currentProblem.b +
            " × " +
            currentProblem.ones +
            ". Tulis angka belakangnya.";

        showArrowToOnes();

    }

    function setStep2State() {

        currentStep = 2;

        topOnesDigit.classList.remove("active-digit");
        topTensDigit.classList.add("active-digit");

        instructionText.textContent =
            currentProblem.carry > 0
                ? "Langkah 2: hitung " + currentProblem.b + " × " + currentProblem.tens + ", lalu tambah simpanan " + currentProblem.carry + "."
                : "Langkah 2: hitung " + currentProblem.b + " × " + currentProblem.tens + ".";

        showArrowToTens();

        answerStep2.disabled = false;
        answerStep2.focus();
        answerStep2.select();

    }

    // ==================================================
    // STEP 1
    // ==================================================

    function handleStep1Input() {

        if (inputLock) {
            return;
        }

        const typed =
            sanitizeSingleDigit(
                answerStep1.value
            );

        answerStep1.value = typed;

        if (typed === "") {
            return;
        }

        const userDigit =
            Number(typed);

        if (
            userDigit ===
            currentProblem.firstDigit
        ) {

            answerStep1.classList.remove("wrong");
            answerStep1.classList.add("correct");

            if (currentProblem.carry > 0) {
                showCarry(currentProblem.carry);
            }

            feedback.textContent =
                currentProblem.b +
                " × " +
                currentProblem.ones +
                " = " +
                currentProblem.firstProduct +
                ". Tulis " +
                currentProblem.firstDigit +
                ", simpan " +
                currentProblem.carry +
                ".";

            inputLock = true;

            window.setTimeout(
                () => {
                    inputLock = false;
                    setStep2State();
                },
                700
            );

        } else {

            answerStep1.classList.remove("correct");
            answerStep1.classList.add("wrong");

            feedback.textContent =
                "Belum tepat. Mulai dari " +
                currentProblem.b +
                " × " +
                currentProblem.ones +
                " dulu.";

            keepFocus(answerStep1);
        }

    }

    // ==================================================
    // STEP 2
    // ==================================================

    function handleStep2Input() {

        if (inputLock) {
            return;
        }

        const typed =
            sanitizeSingleDigit(
                answerStep2.value
            );

        answerStep2.value = typed;

        if (typed === "") {
            return;
        }

        const userDigit =
            Number(typed);

        if (
            userDigit ===
            currentProblem.secondValue
        ) {

            answerStep2.classList.remove("wrong");
            answerStep2.classList.add("correct");

            state.correct += 1;
            updateHeader();

            const step2Text =
                currentProblem.carry > 0
                    ? currentProblem.b + " × " + currentProblem.tens + " + " + currentProblem.carry + " = " + currentProblem.secondValue
                    : currentProblem.b + " × " + currentProblem.tens + " = " + currentProblem.secondValue;

            feedback.textContent =
                "Benar. " + step2Text + ".";

            hideArrow();

            inputLock = true;

            window.setTimeout(
                () => {
                    moveNextQuestion();
                },
                900
            );

        } else {

            answerStep2.classList.remove("correct");
            answerStep2.classList.add("wrong");

            feedback.textContent =
                currentProblem.carry > 0
                    ? "Coba lagi. Hitung " + currentProblem.b + " × " + currentProblem.tens + ", lalu tambah " + currentProblem.carry + "."
                    : "Coba lagi. Hitung " + currentProblem.b + " × " + currentProblem.tens + ".";

            keepFocus(answerStep2);
        }

    }

    // ==================================================
    // MOVE NEXT
    // ==================================================

    function moveNextQuestion() {

        inputLock = false;

        if (state.index >= state.total) {

            instructionText.textContent =
                "Selesai.";

            feedback.textContent =
                "Latihan selesai. Benar " +
                state.correct +
                " dari " +
                state.total +
                " soal.";

            answerStep1.disabled = true;
            answerStep2.disabled = true;
            hideArrow();

            return;
        }

        state.index += 1;
        loadNextProblem();

    }

    // ==================================================
    // HELPERS
    // ==================================================

    function sanitizeSingleDigit(value) {

        const digits =
            String(value || "")
                .replace(/\D/g, "")
                .slice(0, 1);

        return digits;

    }

    function keepFocus(inputEl) {

        window.setTimeout(
            () => {
                inputEl.focus();
                inputEl.select();
            },
            40
        );

    }

    function showCarry(value) {

        carryDisplay.textContent =
            String(value);

        carryDisplay.classList.add("show-carry");

    }

    function showArrowToOnes() {

        guideArrow.classList.remove("hidden");
        guideArrow.classList.remove("to-tens");
        guideArrow.classList.add("to-ones");

    }

    function showArrowToTens() {

        guideArrow.classList.remove("hidden");
        guideArrow.classList.remove("to-ones");
        guideArrow.classList.add("to-tens");

    }

    function hideArrow() {

        guideArrow.classList.add("hidden");

    }

})();
