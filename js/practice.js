// ======================================================
// PRACTICE ENGINE V2
//
// Mendukung:
// - Tingkat 1–5 balanced multiplication
// - Tingkat 6 random position
// - Tingkat 7 adaptive weakness
// - Tingkat 8 mastery
// - freeze/resume soal ketika refresh
// ======================================================


// ======================================================
// DOM
// ======================================================

const practiceLoading =
    document.getElementById(
        "practiceLoading"
    );

const practiceGame =
    document.getElementById(
        "practiceGame"
    );

const resultScreen =
    document.getElementById(
        "resultScreen"
    );

const practiceTopic =
    document.getElementById(
        "practiceTopic"
    );

const practiceLevel =
    document.getElementById(
        "practiceLevel"
    );

const questionProgress =
    document.getElementById(
        "questionProgress"
    );

const questionProgressBar =
    document.getElementById(
        "questionProgressBar"
    );

const liveCorrect =
    document.getElementById(
        "liveCorrect"
    );

const timerCircle =
    document.getElementById(
        "timerCircle"
    );

const timerValue =
    document.getElementById(
        "timerValue"
    );

const questionText =
    document.getElementById(
        "questionText"
    );

const answerInput =
    document.getElementById(
        "answerInput"
    );

const answerFeedback =
    document.getElementById(
        "answerFeedback"
    );

const quitButton =
    document.getElementById(
        "quitButton"
    );


// ======================================================
// RESULT DOM
// ======================================================

const resultIcon =
    document.getElementById(
        "resultIcon"
    );

const resultTitle =
    document.getElementById(
        "resultTitle"
    );

const resultMessage =
    document.getElementById(
        "resultMessage"
    );

const resultAccuracy =
    document.getElementById(
        "resultAccuracy"
    );

const resultCorrect =
    document.getElementById(
        "resultCorrect"
    );

const resultWrong =
    document.getElementById(
        "resultWrong"
    );

const resultTimeout =
    document.getElementById(
        "resultTimeout"
    );

const resultAverage =
    document.getElementById(
        "resultAverage"
    );

const bestScoreBox =
    document.getElementById(
        "bestScoreBox"
    );

const retryButton =
    document.getElementById(
        "retryButton"
    );

const continueButton =
    document.getElementById(
        "continueButton"
    );


// ======================================================
// URL
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const subjectCode =
    params.get(
        "subject"
    );


const topicCode =
    params.get(
        "topic"
    );


const stageNumber =
    Number(
        params.get(
            "stage"
        )
    );


const levelNumber =
    Number(
        params.get(
            "level"
        )
    );


const levelId =
    params.get(
        "id"
    );


// ======================================================
// SESSION
// ======================================================

const loginMode =
    sessionStorage.getItem(
        "login_mode"
    );


const sessionToken =
    sessionStorage.getItem(
        "student_session_token"
    );


// ======================================================
// SAVED STATE
// ======================================================

const practiceStateKey =
    levelId
        ? `practice_v2_${levelId}`
        : null;


// ======================================================
// STATE
// ======================================================

let levelData =
    null;


let questions =
    [];


let answers =
    [];


let currentQuestionIndex =
    0;


let correctCount =
    0;


let wrongCount =
    0;


let timeoutCount =
    0;


let timerInterval =
    null;


let delayedSubmit =
    null;


let questionStartedAt =
    0;


let questionDeadline =
    0;


let answerLocked =
    false;


// ======================================================
// START
// ======================================================

initialize();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    // ==================================================
    // SESSION
    // ==================================================

    const validSession =
        await checkSession();


    if (!validSession) {

        return;

    }


    // ==================================================
    // URL VALIDATION
    // ==================================================

    if (
        !subjectCode ||
        !topicCode ||
        !levelId ||
        !Number.isInteger(
            stageNumber
        ) ||
        stageNumber <= 0 ||
        !Number.isInteger(
            levelNumber
        ) ||
        levelNumber <= 0
    ) {

        goBackToLevels();

        return;

    }


    // ==================================================
    // STUDENT ACCESS
    // ==================================================

    if (
        loginMode === "student"
    ) {

        const access =
            await checkLevelAccess();


        if (!access) {

            showLockedLevelMessage();

            return;

        }

    }


    // ==================================================
    // EVENTS
    // ==================================================

    setupEvents();


    // ==================================================
    // LOAD LEVEL
    // ==================================================

    await loadLevel();

}


// ======================================================
// SETUP EVENTS
// ======================================================

function setupEvents() {

    // ==================================================
    // QUIT
    // ==================================================

    quitButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            goBackToLevels();

        }
    );


    // ==================================================
    // RETRY
    // ==================================================

    retryButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            window.location.reload();

        }
    );


    // ==================================================
    // RESULT → LEVEL LIST
    // ==================================================

    continueButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            goBackToLevels();

        }
    );


    // ==================================================
    // ANSWER INPUT
    // ==================================================

    answerInput.addEventListener(
        "input",
        handleAnswerInput
    );


    // ==================================================
    // ENTER
    // ==================================================

    answerInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Enter"
            ) {

                return;

            }


            event.preventDefault();


            if (
                answerLocked
            ) {

                return;

            }


            if (
                answerInput.value
                    .trim()
                === ""
            ) {

                return;

            }


            submitAnswer();

        }
    );

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        return true;

    }


    // ==================================================
    // STUDENT
    // ==================================================

    if (
        loginMode !== "student" ||
        !sessionToken
    ) {

        sessionStorage.clear();

        goLogin();

        return false;

    }


    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_student_session",
                {
                    p_token:
                        sessionToken
                }
            );


        if (
            error ||
            !data ||
            data.length === 0
        ) {

            sessionStorage.clear();

            goLogin();

            return false;

        }


        return true;

    }

    catch (error) {

        console.error(
            "Session error:",
            error
        );


        sessionStorage.clear();

        goLogin();

        return false;

    }

}


// ======================================================
// CHECK LEVEL ACCESS
// ======================================================

async function checkLevelAccess() {

    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "student_can_access_level",
                {

                    p_token:
                        sessionToken,

                    p_level_id:
                        levelId

                }
            );


        if (error) {

            console.error(
                "Access error:",
                error
            );


            return false;

        }


        return data === true;

    }

    catch (error) {

        console.error(
            "Access error:",
            error
        );


        return false;

    }

}


// ======================================================
// LOCKED MESSAGE
// ======================================================

function showLockedLevelMessage() {

    practiceLoading.innerHTML = `

        <div
            style="
                font-size: 36px;
                margin-bottom: 15px;
            "
        >
            🔒
        </div>

        <strong
            style="
                display: block;
                font-size: 20px;
                margin-bottom: 8px;
                color: #172033;
            "
        >
            Level masih terkunci
        </strong>

        <p
            style="
                margin: 0 0 22px;
                line-height: 1.6;
            "
        >
            Selesaikan level sebelumnya
            terlebih dahulu.
        </p>

        <button
            id="lockedBackButton"
            class="button button-primary"
            type="button"
        >
            Kembali ke Daftar Level
        </button>

    `;


    document
        .getElementById(
            "lockedBackButton"
        )
        .addEventListener(
            "click",
            goBackToLevels
        );

}


// ======================================================
// LOAD LEVEL
// ======================================================

async function loadLevel() {

    try {

        const {
            data,
            error
        } =
            await window.db
                .from(
                    "levels"
                )
                .select(`
                    id,
                    level_number,
                    name,
                    time_limit_seconds,
                    question_count,
                    passing_score,
                    config
                `)
                .eq(
                    "id",
                    levelId
                )
                .eq(
                    "level_number",
                    levelNumber
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (error) {

            throw error;

        }


        levelData =
            data;


        // ==================================================
        // ENGINE TYPE
        // ==================================================

        if (
            !levelData.config ||
            levelData.config
                .exercise_type
            !== "multiplication"
        ) {

            throw new Error(
                "Engine latihan ini belum didukung."
            );

        }


        // ==================================================
        // HEADER
        // ==================================================

        practiceTopic.textContent =
            "PERKALIAN";


        practiceLevel.textContent =
            `Tingkat ${stageNumber} • ${levelData.name}`;


        // ==================================================
        // COBA RESTORE
        // ==================================================

        const savedState =
            loadSavedPracticeState();


        if (savedState) {

            restoreSavedState(
                savedState
            );


            showGame();


            if (
                currentQuestionIndex >=
                questions.length
            ) {

                await finishPractice();

                return;

            }


            startQuestion(
                true,
                savedState
            );


            return;

        }


        // ==================================================
        // SESSION BARU
        // ==================================================

        questions =
            await prepareQuestions();


        if (
            questions.length !==
            Number(
                levelData.question_count
            )
        ) {

            throw new Error(
                "Jumlah soal tidak sesuai."
            );

        }


        answers =
            [];


        currentQuestionIndex =
            0;


        correctCount =
            0;


        wrongCount =
            0;


        timeoutCount =
            0;


        savePracticeState();


        showGame();


        startQuestion(
            false
        );

    }

    catch (error) {

        console.error(
            "Load practice error:",
            error
        );


        practiceLoading.textContent =
            "Tidak dapat menyiapkan latihan.";

    }

}


// ======================================================
// SHOW GAME
// ======================================================

function showGame() {

    practiceLoading.classList.add(
        "hidden"
    );


    resultScreen.classList.add(
        "hidden"
    );


    practiceGame.classList.remove(
        "hidden"
    );

}


// ======================================================
// PREPARE QUESTIONS
// ======================================================

async function prepareQuestions() {

    const config =
        levelData.config;


    const adaptive =
        config.adaptive === true;


    // ==================================================
    // ADAPTIVE
    // ==================================================

    if (
        adaptive &&
        loginMode === "student"
    ) {

        const weakFacts =
            await loadWeakFacts();


        return generateAdaptiveQuestions(
            levelData,
            weakFacts
        );

    }


    // ==================================================
    // NORMAL / GUEST
    // ==================================================

    return generateBalancedQuestions(

        levelData,

        Number(
            levelData.question_count
        ),

        new Set()

    );

}


// ======================================================
// LOAD WEAK FACTS
// ======================================================

async function loadWeakFacts() {

    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "get_student_multiplication_weakness",
                {

                    p_token:
                        sessionToken,

                    p_limit:
                        30

                }
            );


        if (error) {

            throw error;

        }


        return Array.isArray(
            data
        )
            ? data
            : [];

    }

    catch (error) {

        // Adaptive gagal tidak boleh
        // membuat latihan gagal total.

        console.error(
            "Weakness analysis error:",
            error
        );


        return [];

    }

}


// ======================================================
// GENERATE ADAPTIVE QUESTIONS
// ======================================================

function generateAdaptiveQuestions(
    level,
    weakFacts
) {

    const config =
        level.config;


    const total =
        Number(
            level.question_count
        );


    const ratio =
        Math.min(

            1,

            Math.max(

                0,

                Number(
                    config
                    .adaptive_weak_ratio
                    ?? 0.7
                )

            )

        );


    const weakTarget =
        Math.round(
            total *
            ratio
        );


    const result =
        [];


    const usedKeys =
        new Set();


    // ==================================================
    // AMBIL FAKTA LEMAH
    // ==================================================

    const candidates =
        Array.isArray(
            weakFacts
        )
            ? [...weakFacts]
            : [];


    // Jangan sepenuhnya urut agar sesi
    // tidak selalu identik.

    const topCandidates =
        candidates.slice(
            0,
            Math.max(
                weakTarget * 2,
                10
            )
        );


    shuffleArray(
        topCandidates
    );


    for (
        const fact
        of topCandidates
    ) {

        if (
            result.length >=
            weakTarget
        ) {

            break;

        }


        const a =
            Number(
                fact.a
            );


        const b =
            Number(
                fact.b
            );


        if (
            !factAllowedByConfig(
                a,
                b,
                config
            )
        ) {

            continue;

        }


        const key =
            canonicalKey(
                a,
                b
            );


        if (
            usedKeys.has(
                key
            )
        ) {

            continue;

        }


        const question =
            makeQuestionFromFact(
                a,
                b,
                config
            );


        if (!question) {

            continue;

        }


        usedKeys.add(
            key
        );


        result.push(
            question
        );

    }


    // ==================================================
    // ISI SISANYA DENGAN BALANCED RANDOM
    // ==================================================

    const remaining =
        total -
        result.length;


    if (
        remaining > 0
    ) {

        const additional =
            generateBalancedQuestions(

                level,

                remaining,

                usedKeys

            );


        additional.forEach(
            question => {

                usedKeys.add(
                    canonicalKey(
                        question.a,
                        question.b
                    )
                );


                result.push(
                    question
                );

            }
        );

    }


    // ==================================================
    // FALLBACK JIKA DATA WEAK BELUM CUKUP
    // ==================================================

    if (
        result.length <
        total
    ) {

        const additional =
            generateBalancedQuestions(

                level,

                total -
                result.length,

                usedKeys

            );


        additional.forEach(
            question => {

                usedKeys.add(
                    canonicalKey(
                        question.a,
                        question.b
                    )
                );


                result.push(
                    question
                );

            }
        );

    }


    // Campur soal lemah dan soal umum.

    shuffleArray(
        result
    );


    return result.slice(
        0,
        total
    );

}


// ======================================================
// BALANCED GENERATOR
// ======================================================

function generateBalancedQuestions(
    level,
    targetCount,
    excludedKeys
) {

    const config =
        level.config;


    const multipliers =
        getMultipliers(
            config
        );


    const min =
        Number(
            config.min_operand
            ?? 1
        );


    const max =
        Number(
            config.max_operand
            ?? 10
        );


    const pools =
        new Map();


    // ==================================================
    // BUAT POOL SETIAP MULTIPLIER
    // ==================================================

    multipliers.forEach(
        multiplier => {

            const pool =
                [];


            for (
                let operand = min;
                operand <= max;
                operand++
            ) {

                pool.push({

                    multiplier:
                        multiplier,

                    operand:
                        operand

                });

            }


            shuffleArray(
                pool
            );


            pools.set(
                multiplier,
                pool
            );

        }
    );


    const result =
        [];


    const used =
        new Set(
            excludedKeys
            || []
        );


    // ==================================================
    // ROUND ROBIN MULTIPLIERS
    // ==================================================

    let safety =
        0;


    while (
        result.length <
        targetCount
    ) {

        let addedSomething =
            false;


        for (
            const multiplier
            of multipliers
        ) {

            if (
                result.length >=
                targetCount
            ) {

                break;

            }


            const pool =
                pools.get(
                    multiplier
                );


            while (
                pool &&
                pool.length > 0
            ) {

                const candidate =
                    pool.shift();


                const key =
                    canonicalKey(

                        candidate.multiplier,

                        candidate.operand

                    );


                if (
                    used.has(
                        key
                    )
                ) {

                    continue;

                }


                const question =
                    makeBaseQuestion(

                        candidate.multiplier,

                        candidate.operand,

                        config

                    );


                if (!question) {

                    continue;

                }


                used.add(
                    key
                );


                result.push(
                    question
                );


                addedSomething =
                    true;


                break;

            }

        }


        safety++;


        if (
            !addedSomething ||
            safety > 100
        ) {

            break;

        }

    }


    shuffleArray(
        result
    );


    return result;

}


// ======================================================
// BASE QUESTION
// ======================================================

function makeBaseQuestion(
    multiplier,
    operand,
    config
) {

    let a =
        Number(
            multiplier
        );


    let b =
        Number(
            operand
        );


    // ==================================================
    // RANDOM POSITION
    // ==================================================

    if (
        config.random_position
        === true
    ) {

        if (
            Math.random()
            < 0.5
        ) {

            [
                a,
                b
            ] =
            [
                b,
                a
            ];

        }

    }


    return {

        a:
            a,

        b:
            b,

        answer:
            a * b

    };

}


// ======================================================
// QUESTION FROM WEAK FACT
// ======================================================

function makeQuestionFromFact(
    factA,
    factB,
    config
) {

    const multipliers =
        getMultipliers(
            config
        );


    let a =
        Number(
            factA
        );


    let b =
        Number(
            factB
        );


    // ==================================================
    // POSISI NORMAL
    //
    // Jika random_position false,
    // multiplier harus di depan.
    // ==================================================

    if (
        config.random_position
        !== true
    ) {

        if (
            multipliers.includes(
                a
            )
        ) {

            // sudah benar

        }

        else if (
            multipliers.includes(
                b
            )
        ) {

            [
                a,
                b
            ] =
            [
                b,
                a
            ];

        }

        else {

            return null;

        }

    }


    // ==================================================
    // RANDOM POSITION
    // ==================================================

    else {

        if (
            Math.random()
            < 0.5
        ) {

            [
                a,
                b
            ] =
            [
                b,
                a
            ];

        }

    }


    return {

        a:
            a,

        b:
            b,

        answer:
            a * b

    };

}


// ======================================================
// FACT ALLOWED
// ======================================================

function factAllowedByConfig(
    a,
    b,
    config
) {

    const multipliers =
        getMultipliers(
            config
        );


    const min =
        Number(
            config.min_operand
            ?? 1
        );


    const max =
        Number(
            config.max_operand
            ?? 10
        );


    const aMultiplier =
        multipliers.includes(
            a
        );


    const bMultiplier =
        multipliers.includes(
            b
        );


    const aRange =
        a >= min &&
        a <= max;


    const bRange =
        b >= min &&
        b <= max;


    if (
        config.random_position
        === true
    ) {

        return (

            (
                aMultiplier &&
                bRange
            )

            ||

            (
                bMultiplier &&
                aRange
            )

        );

    }


    return (

        aMultiplier &&
        bRange

    )

    ||

    (

        bMultiplier &&
        aRange

    );

}


// ======================================================
// MULTIPLIERS
// ======================================================

function getMultipliers(
    config
) {

    if (
        !Array.isArray(
            config.multipliers
        )
    ) {

        return [
            1,
            2,
            5
        ];

    }


    return config
        .multipliers
        .map(
            value =>
                Number(
                    value
                )
        )
        .filter(
            value =>
                Number.isInteger(
                    value
                )
        );

}


// ======================================================
// CANONICAL KEY
//
// 2 × 7 dan 7 × 2
// memiliki key yang sama.
// ======================================================

function canonicalKey(
    a,
    b
) {

    const low =
        Math.min(
            Number(a),
            Number(b)
        );


    const high =
        Math.max(
            Number(a),
            Number(b)
        );


    return `${low}x${high}`;

}


// ======================================================
// SHUFFLE
// ======================================================

function shuffleArray(
    array
) {

    for (
        let i =
            array.length - 1;

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
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }


    return array;

}


// ======================================================
// START QUESTION
// ======================================================

function startQuestion(
    resume,
    savedState = null
) {

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    answerLocked =
        false;


    answerInput.disabled =
        false;


    answerFeedback.textContent =
        "";


    answerFeedback.className =
        "answer-feedback";


    const question =
        questions[
            currentQuestionIndex
        ];


    if (!question) {

        finishPractice();

        return;

    }


    // ==================================================
    // QUESTION
    // ==================================================

    questionText.textContent =
        `${question.a} × ${question.b}`;


    questionProgress.textContent =
        `${
            currentQuestionIndex + 1
        } / ${
            questions.length
        }`;


    questionProgressBar.style.width =
        `${
            (
                currentQuestionIndex
                /
                questions.length
            )
            *
            100
        }%`;


    liveCorrect.textContent =
        String(
            correctCount
        );


    // ==================================================
    // RESUME SETELAH REFRESH
    // ==================================================

    if (
        resume &&
        savedState
    ) {

        answerInput.value =
            savedState.current_input
            || "";


        questionStartedAt =
            Number(
                savedState
                    .question_started_at
                || 0
            );


        questionDeadline =
            Number(
                savedState
                    .question_deadline_at
                || 0
            );


        if (
            !questionStartedAt ||
            !questionDeadline
        ) {

            createNewQuestionTimer();

        }

    }

    // ==================================================
    // SOAL BARU
    // ==================================================

    else {

        answerInput.value =
            "";


        createNewQuestionTimer();

    }


    // ==================================================
    // TIMER UI
    // ==================================================

    updateTimer();


    if (
        Date.now() <
        questionDeadline
    ) {

        timerInterval =
            setInterval(
                updateTimer,
                50
            );

    }

    else {

        setTimeout(
            handleTimerEnd,
            0
        );

    }


    // ==================================================
    // SAVE
    // ==================================================

    savePracticeState();


    // ==================================================
    // FOCUS
    // ==================================================

    setTimeout(
        () => {

            answerInput.focus({
                preventScroll:
                    true
            });

        },
        30
    );

}


// ======================================================
// NEW TIMER
// ======================================================

function createNewQuestionTimer() {

    const duration =
        Number(
            levelData
                .time_limit_seconds
        );


    questionStartedAt =
        Date.now();


    questionDeadline =
        questionStartedAt
        +
        (
            duration *
            1000
        );


    timerCircle.classList.remove(
        "timer-warning"
    );

}


// ======================================================
// TIMER
// ======================================================

function updateTimer() {

    if (
        answerLocked
    ) {

        return;

    }


    const now =
        Date.now();


    const remainingMs =
        Math.max(
            0,
            questionDeadline -
            now
        );


    const remainingSeconds =
        remainingMs /
        1000;


    timerValue.textContent =
        remainingSeconds

            .toFixed(1)

            .replace(
                ".0",
                ""
            );


    // ==================================================
    // WARNING
    // ==================================================

    if (

        remainingSeconds <=

        Number(
            levelData
                .time_limit_seconds
        )

        *

        0.30

    ) {

        timerCircle.classList.add(
            "timer-warning"
        );

    }

    else {

        timerCircle.classList.remove(
            "timer-warning"
        );

    }


    // ==================================================
    // TIMEOUT
    // ==================================================

    if (
        remainingMs <= 0
    ) {

        handleTimerEnd();

    }

}


// ======================================================
// ANSWER INPUT
// ======================================================

function handleAnswerInput() {

    if (
        answerLocked
    ) {

        return;

    }


    // ==================================================
    // NUMERIC ONLY
    // ==================================================

    answerInput.value =
        answerInput.value
            .replace(
                /\D/g,
                ""
            );


    savePracticeState();


    clearTimeout(
        delayedSubmit
    );


    const value =
        answerInput.value
            .trim();


    if (
        value === ""
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


    const correctText =
        String(
            question.answer
        );


    // ==================================================
    // BENAR:
    // proses cepat.
    // ==================================================

    if (
        value ===
        correctText
    ) {

        delayedSubmit =
            setTimeout(
                submitAnswer,
                90
            );


        return;

    }


    // ==================================================
    // SALAH:
    //
    // Jangan langsung submit hanya
    // karena anak baru mengetik digit pertama.
    // ==================================================

    if (
        value.length >
        correctText.length
    ) {

        delayedSubmit =
            setTimeout(
                submitAnswer,
                120
            );


        return;

    }


    if (
        value.length ===
        correctText.length
    ) {

        delayedSubmit =
            setTimeout(
                submitAnswer,
                450
            );

    }

}


// ======================================================
// TIMER END
// ======================================================

function handleTimerEnd() {

    if (
        answerLocked
    ) {

        return;

    }


    clearTimer();


    const value =
        answerInput.value
            .trim();


    // ==================================================
    // ADA INPUT → TETAP DINILAI
    // ==================================================

    if (
        value !== ""
    ) {

        submitAnswer();

        return;

    }


    // ==================================================
    // KOSONG → TIMEOUT
    // ==================================================

    submitTimeout();

}


// ======================================================
// SUBMIT ANSWER
// ======================================================

function submitAnswer() {

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


    answerLocked =
        true;


    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    answerInput.disabled =
        true;


    const userValue =
        answerInput.value
            .trim();


    const userNumber =
        Number(
            userValue
        );


    const responseTime =
        Math.max(

            0,

            Date.now()
            -
            questionStartedAt

        );


    const correct =
        userNumber ===
        question.answer;


    // ==================================================
    // RESULT
    // ==================================================

    if (correct) {

        correctCount++;


        answerFeedback.textContent =
            "✓ Benar";


        answerFeedback.className =
            "answer-feedback feedback-correct";

    }

    else {

        wrongCount++;


        answerFeedback.textContent =
            `✕ Jawaban yang benar ${question.answer}`;


        answerFeedback.className =
            "answer-feedback feedback-wrong";

    }


    // ==================================================
    // STORE
    // ==================================================

    answers.push({

        a:
            question.a,

        b:
            question.b,

        user_answer:
            userValue,

        response_time_ms:
            responseTime

    });


    liveCorrect.textContent =
        String(
            correctCount
        );


    savePracticeState();


    setTimeout(
        nextQuestion,
        550
    );

}


// ======================================================
// SUBMIT TIMEOUT
// ======================================================

function submitTimeout() {

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


    answerLocked =
        true;


    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    answerInput.disabled =
        true;


    timeoutCount++;


    const responseTime =
        Math.max(

            0,

            Date.now()
            -
            questionStartedAt

        );


    answers.push({

        a:
            question.a,

        b:
            question.b,

        user_answer:
            "",

        response_time_ms:
            responseTime

    });


    answerFeedback.textContent =
        `Waktu habis • Jawaban ${question.answer}`;


    answerFeedback.className =
        "answer-feedback feedback-timeout";


    savePracticeState();


    setTimeout(
        nextQuestion,
        650
    );

}


// ======================================================
// NEXT QUESTION
// ======================================================

function nextQuestion() {

    currentQuestionIndex++;


    questionStartedAt =
        0;


    questionDeadline =
        0;


    savePracticeState();


    if (
        currentQuestionIndex >=
        questions.length
    ) {

        finishPractice();

        return;

    }


    startQuestion(
        false
    );

}


// ======================================================
// FINISH PRACTICE
// ======================================================

async function finishPractice() {

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    practiceGame.classList.add(
        "hidden"
    );


    resultScreen.classList.add(
        "hidden"
    );


    practiceLoading.classList.remove(
        "hidden"
    );


    practiceLoading.textContent =
        "Menghitung hasil...";


    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        const result =
            calculateGuestResult();


        clearSavedPracticeState();


        showResult(
            result
        );


        return;

    }


    // ==================================================
    // STUDENT
    // ==================================================

    try {

        const {
            data,
            error
        } =
            await window.db.rpc(
                "submit_multiplication_practice",
                {

                    p_token:
                        sessionToken,

                    p_level_id:
                        levelId,

                    p_answers:
                        answers

                }
            );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Hasil tidak diterima server."
            );

        }


        clearSavedPracticeState();


        showResult(
            data[0]
        );

    }

    catch (error) {

        console.error(
            "Submit error:",
            error
        );


        practiceLoading.innerHTML = `

            <strong
                style="
                    display:block;
                    margin-bottom:8px;
                    color:#172033;
                "
            >
                Hasil belum dapat disimpan
            </strong>

            <p
                style="
                    margin:0 0 20px;
                    line-height:1.6;
                "
            >
                Data latihan masih disimpan
                sementara di browser.
                Muat ulang halaman untuk mencoba
                mengirimkannya kembali.
            </p>

            <button
                id="submitBackButton"
                class="button button-secondary"
                type="button"
            >
                Kembali ke Daftar Level
            </button>

        `;


        document
            .getElementById(
                "submitBackButton"
            )
            .addEventListener(
                "click",
                () => {

                    clearSavedPracticeState();

                    goBackToLevels();

                }
            );

    }

}


// ======================================================
// GUEST RESULT
// ======================================================

function calculateGuestResult() {

    const total =
        questions.length;


    const accuracy =
        total > 0

            ? (
                correctCount /
                total
            )
            * 100

            : 0;


    const responseTimes =
        answers

            .filter(
                answer =>
                    answer.user_answer
                    !== ""
            )

            .map(
                answer =>
                    Number(
                        answer
                            .response_time_ms
                    )
            )

            .filter(
                value =>

                    Number.isFinite(
                        value
                    )

                    &&

                    value > 0

            );


    let average =
        null;


    if (
        responseTimes.length > 0
    ) {

        average =
            Math.round(

                responseTimes.reduce(
                    (
                        total,
                        value
                    ) =>
                        total + value,
                    0
                )

                /

                responseTimes.length

            );

    }


    return {

        correct_count:
            correctCount,

        wrong_count:
            wrongCount,

        timeout_count:
            timeoutCount,

        accuracy:
            Number(
                accuracy.toFixed(
                    2
                )
            ),

        average_response_time_ms:
            average,

        passed:
            accuracy >=
            Number(
                levelData
                    .passing_score
            ),

        best_score:
            null,

        attempts:
            null

    };

}


// ======================================================
// SHOW RESULT
// ======================================================

function showResult(
    result
) {

    practiceLoading.classList.add(
        "hidden"
    );


    practiceGame.classList.add(
        "hidden"
    );


    resultScreen.classList.remove(
        "hidden"
    );


    const passed =
        result.passed === true;


    const accuracy =
        Number(
            result.accuracy
            || 0
        );


    // ==================================================
    // PASS
    // ==================================================

    if (passed) {

        resultIcon.textContent =
            "✓";


        resultIcon.className =
            "result-icon result-pass";


        resultTitle.textContent =
            "Level Lulus!";


        if (
            loginMode === "student"
        ) {

            resultMessage.textContent =
                "Level berikutnya sekarang dapat dibuka.";

        }

        else {

            resultMessage.textContent =
                "Hasil Guest tidak disimpan.";

        }

    }

    // ==================================================
    // FAIL
    // ==================================================

    else {

        resultIcon.textContent =
            "↻";


        resultIcon.className =
            "result-icon result-fail";


        resultTitle.textContent =
            "Belum Lulus";


        resultMessage.textContent =
            `Diperlukan minimal ${levelData.passing_score}% untuk membuka level berikutnya.`;

    }


    // ==================================================
    // STATS
    // ==================================================

    resultAccuracy.textContent =
        `${accuracy.toFixed(0)}%`;


    resultCorrect.textContent =
        String(
            result.correct_count
            || 0
        );


    resultWrong.textContent =
        String(
            result.wrong_count
            || 0
        );


    resultTimeout.textContent =
        String(
            result.timeout_count
            || 0
        );


    if (
        result.average_response_time_ms
        !== null

        &&

        result.average_response_time_ms
        !== undefined
    ) {

        resultAverage.textContent =
            `${
                (
                    Number(
                        result
                            .average_response_time_ms
                    )
                    /
                    1000
                )
                .toFixed(1)
            } dtk`;

    }

    else {

        resultAverage.textContent =
            "-";

    }


    // ==================================================
    // BEST SCORE
    // ==================================================

    if (
        loginMode === "student"

        &&

        result.best_score
        !== null

        &&

        result.best_score
        !== undefined
    ) {

        bestScoreBox.classList.remove(
            "hidden"
        );


        bestScoreBox.textContent =
            `Skor terbaik: ${
                Number(
                    result.best_score
                )
                .toFixed(0)
            }% • Percobaan ${
                result.attempts
            }`;

    }

    else {

        bestScoreBox.classList.add(
            "hidden"
        );

    }

}


// ======================================================
// SAVE PRACTICE STATE
// ======================================================

function savePracticeState() {

    if (
        !practiceStateKey ||
        questions.length === 0
    ) {

        return;

    }


    try {

        const state = {

            version:
                2,

            level_id:
                levelId,

            questions:
                questions,

            answers:
                answers,

            current_question_index:
                currentQuestionIndex,

            current_input:
                answerInput
                    ? answerInput.value
                    : "",

            question_started_at:
                questionStartedAt,

            question_deadline_at:
                questionDeadline

        };


        sessionStorage.setItem(

            practiceStateKey,

            JSON.stringify(
                state
            )

        );

    }

    catch (error) {

        console.error(
            "Save practice state error:",
            error
        );

    }

}


// ======================================================
// LOAD PRACTICE STATE
// ======================================================

function loadSavedPracticeState() {

    if (!practiceStateKey) {

        return null;

    }


    const raw =
        sessionStorage.getItem(
            practiceStateKey
        );


    if (!raw) {

        return null;

    }


    try {

        const state =
            JSON.parse(
                raw
            );


        if (
            state.version !== 2 ||
            state.level_id !== levelId ||
            !Array.isArray(
                state.questions
            ) ||
            !Array.isArray(
                state.answers
            )
        ) {

            clearSavedPracticeState();

            return null;

        }


        if (
            state.questions.length !==
            Number(
                levelData
                    .question_count
            )
        ) {

            clearSavedPracticeState();

            return null;

        }


        return state;

    }

    catch (error) {

        console.error(
            "Restore state error:",
            error
        );


        clearSavedPracticeState();


        return null;

    }

}


// ======================================================
// RESTORE
// ======================================================

function restoreSavedState(
    state
) {

    questions =
        state.questions;


    answers =
        state.answers;


    // Jangan percaya index browser secara buta.
    // Jumlah jawaban yang sudah tersimpan
    // menjadi referensi utama.

    currentQuestionIndex =
        Math.min(

            answers.length,

            questions.length

        );


    recalculateLocalCounts();


    questionStartedAt =
        Number(
            state.question_started_at
            || 0
        );


    questionDeadline =
        Number(
            state.question_deadline_at
            || 0
        );

}


// ======================================================
// RECALCULATE COUNTS
// ======================================================

function recalculateLocalCounts() {

    correctCount =
        0;


    wrongCount =
        0;


    timeoutCount =
        0;


    answers.forEach(
        answer => {

            const value =
                String(
                    answer.user_answer
                    ?? ""
                )
                .trim();


            if (
                value === ""
            ) {

                timeoutCount++;

                return;

            }


            const correct =
                Number(
                    answer.a
                )
                *
                Number(
                    answer.b
                );


            if (
                Number(value)
                === correct
            ) {

                correctCount++;

            }

            else {

                wrongCount++;

            }

        }
    );

}


// ======================================================
// CLEAR SAVED STATE
// ======================================================

function clearSavedPracticeState() {

    if (!practiceStateKey) {

        return;

    }


    sessionStorage.removeItem(
        practiceStateKey
    );

}


// ======================================================
// CLEAR TIMER
// ======================================================

function clearTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;

    }

}


// ======================================================
// BACK
// ======================================================

function goBackToLevels() {

    clearTimer();


    clearTimeout(
        delayedSubmit
    );


    if (
        !subjectCode ||
        !topicCode ||
        !stageNumber
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    window.location.href =

        "./levels.html"

        +

        "?subject=" +
        encodeURIComponent(
            subjectCode
        )

        +

        "&topic=" +
        encodeURIComponent(
            topicCode
        )

        +

        "&stage=" +
        encodeURIComponent(
            stageNumber
        );

}


// ======================================================
// LOGIN
// ======================================================

function goLogin() {

    window.location.href =
        "./index.html";

}


// ======================================================
// REFRESH / CLOSE
//
// Jangan hapus state.
// Simpan agar set soal tidak berubah.
// ======================================================

window.addEventListener(
    "beforeunload",
    () => {

        clearTimer();


        clearTimeout(
            delayedSubmit
        );


        savePracticeState();

    }
);
