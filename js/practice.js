// ======================================================
// PRACTICE ENGINE V3
//
// Mendukung:
//
// 1. multiplication
// 2. place_value_multiplication
// 3. multi_digit_multiplication
//
// Tingkat 1 - 13
//
// Fitur:
// - balanced random
// - random position
// - adaptive weakness
// - multi digit
// - no duplicate question
// - timer
// - auto submit
// - refresh-safe question set
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

        ? `practice_v3_${levelId}`

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


    setupEvents();


    await loadLevel();

}


// ======================================================
// EVENTS
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
    // CONTINUE
    // ==================================================

    continueButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            goBackToLevels();

        }
    );


    // ==================================================
    // ANSWER
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


            if (answerLocked) {

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
// SESSION
// ======================================================

async function checkSession() {

    if (
        loginMode === "guest"
    ) {

        return true;

    }


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
// LEVEL ACCESS
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
// LOCKED
// ======================================================

function showLockedLevelMessage() {

    practiceLoading.innerHTML = `

        <div
            style="
                font-size:36px;
                margin-bottom:15px;
            "
        >
            🔒
        </div>

        <strong
            style="
                display:block;
                margin-bottom:8px;
                color:#172033;
                font-size:20px;
            "
        >
            Level masih terkunci
        </strong>

        <p
            style="
                margin:0 0 22px;
                line-height:1.6;
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
        // ENGINE SUPPORT
        // ==================================================

        const supportedTypes = [

            "multiplication",

            "place_value_multiplication",

            "multi_digit_multiplication"

        ];


        if (
            !levelData.config ||
            !supportedTypes.includes(
                levelData.config
                    .exercise_type
            )
        ) {

            throw new Error(
                "Jenis latihan belum didukung."
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
        // RESTORE
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
        // NEW SESSION
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
                "Jumlah soal gagal dibuat."
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
// QUESTION DISPATCHER
// ======================================================

async function prepareQuestions() {

    const type =
        levelData.config
            .exercise_type;


    // ==================================================
    // BASIC MULTIPLICATION
    // ==================================================

    if (
        type ===
        "multiplication"
    ) {

        if (
            levelData.config
                .adaptive === true

            &&

            loginMode === "student"
        ) {

            const weakFacts =
                await loadWeakFacts();


            return generateAdaptiveQuestions(

                levelData,

                weakFacts

            );

        }


        return generateBalancedQuestions(

            levelData,

            Number(
                levelData.question_count
            ),

            new Set()

        );

    }


    // ==================================================
    // PLACE VALUE
    // ==================================================

    if (
        type ===
        "place_value_multiplication"
    ) {

        return generatePlaceValueQuestions(
            levelData
        );

    }


    // ==================================================
    // MULTI DIGIT
    // ==================================================

    if (
        type ===
        "multi_digit_multiplication"
    ) {

        return generateMultiDigitQuestions(
            levelData
        );

    }


    return [];

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

        console.error(
            "Weakness error:",
            error
        );


        return [];

    }

}


// ======================================================
// BASIC ADAPTIVE
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


    const candidates =
        Array.isArray(
            weakFacts
        )
            ? weakFacts.slice(
                0,
                Math.max(
                    weakTarget * 2,
                    10
                )
            )
            : [];


    shuffleArray(
        candidates
    );


    for (
        const fact
        of candidates
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


        result.push(
            ...additional
        );

    }


    shuffleArray(
        result
    );


    return result.slice(
        0,
        total
    );

}


// ======================================================
// BASIC BALANCED
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

                    multiplier,

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


    let safety =
        0;


    while (
        result.length <
        targetCount
    ) {

        let added =
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


                used.add(
                    key
                );


                result.push(
                    question
                );


                added =
                    true;


                break;

            }

        }


        safety++;


        if (
            !added ||
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
// PLACE VALUE GENERATOR
//
// contoh:
// 30 × 8
// 7 × 400
// ======================================================

function generatePlaceValueQuestions(
    level
) {

    const config =
        level.config;


    const values =
        Array.isArray(
            config.first_factor_values
        )
            ? config.first_factor_values
                .map(
                    Number
                )
                .filter(
                    Number.isFinite
                )
            : [];


    const secondMin =
        Number(
            config.second_factor_min
            ?? 2
        );


    const secondMax =
        Number(
            config.second_factor_max
            ?? 9
        );


    const target =
        Number(
            level.question_count
        );


    const candidates =
        [];


    for (
        const first
        of values
    ) {

        for (
            let second =
                secondMin;

            second <=
                secondMax;

            second++
        ) {

            candidates.push({

                first,

                second

            });

        }

    }


    shuffleArray(
        candidates
    );


    const result =
        [];


    const used =
        new Set();


    for (
        const candidate
        of candidates
    ) {

        if (
            result.length >=
            target
        ) {

            break;

        }


        const baseKey =
            `${candidate.first}x${candidate.second}`;


        if (
            used.has(
                baseKey
            )
        ) {

            continue;

        }


        used.add(
            baseKey
        );


        let a =
            candidate.first;


        let b =
            candidate.second;


        if (
            config.random_position
            === true

            &&

            Math.random() < 0.5
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


        result.push({

            a,

            b,

            answer:
                a * b

        });

    }


    return result;

}


// ======================================================
// MULTI DIGIT GENERATOR
// ======================================================

function generateMultiDigitQuestions(
    level
) {

    const config =
        level.config;


    const minA =
        Number(
            config.min_a
        );


    const maxA =
        Number(
            config.max_a
        );


    const minB =
        Number(
            config.min_b
        );


    const maxB =
        Number(
            config.max_b
        );


    const target =
        Number(
            level.question_count
        );


    if (
        !Number.isInteger(minA) ||
        !Number.isInteger(maxA) ||
        !Number.isInteger(minB) ||
        !Number.isInteger(maxB)
    ) {

        return [];

    }


    const result =
        [];


    const used =
        new Set();


    let safety =
        0;


    while (
        result.length <
        target

        &&

        safety <
        5000
    ) {

        safety++;


        let a =
            randomInteger(
                minA,
                maxA
            );


        let b =
            randomInteger(
                minB,
                maxB
            );


        // ==================================================
        // OPTIONAL RANDOM POSITION
        // ==================================================

        if (
            config.random_position
            === true

            &&

            Math.random() <
            0.5
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


        const key =
            `${a}x${b}`;


        if (
            used.has(
                key
            )
        ) {

            continue;

        }


        used.add(
            key
        );


        result.push({

            a,

            b,

            answer:
                a * b

        });

    }


    return result;

}


// ======================================================
// RANDOM INTEGER
// ======================================================

function randomInteger(
    min,
    max
) {

    return Math.floor(

        Math.random()

        *

        (
            max -
            min +
            1
        )

    )

    +

    min;

}


// ======================================================
// BASIC QUESTION
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


    if (
        config.random_position
        === true

        &&

        Math.random() <
        0.5
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


    return {

        a,

        b,

        answer:
            a * b

    };

}


// ======================================================
// WEAK FACT QUESTION
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


    if (
        config.random_position
        !== true
    ) {

        if (
            multipliers.includes(
                a
            )
        ) {

            // posisi sudah benar

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

    else if (
        Math.random() <
        0.5
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


    return {

        a,

        b,

        answer:
            a * b

    };

}


// ======================================================
// FACT VALIDATION
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

        return [];

    }


    return config.multipliers

        .map(
            Number
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
    // TEXT
    // ==================================================

    questionText.textContent =
        `${formatNumber(
            question.a
        )} × ${formatNumber(
            question.b
        )}`;


    // ==================================================
    // PROGRESS
    // ==================================================

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
    // RESTORE CURRENT QUESTION
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


        // Jika refresh terjadi saat feedback
        // setelah jawaban sebelumnya sudah disimpan,
        // timer lama tidak boleh diwariskan.

        if (
            !questionStartedAt ||
            !questionDeadline
        ) {

            answerInput.value =
                "";


            createNewQuestionTimer();

        }

    }

    else {

        answerInput.value =
            "";


        createNewQuestionTimer();

    }


    // ==================================================
    // TIMER
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
// FORMAT NUMBER
// ======================================================

function formatNumber(
    value
) {

    return Number(
        value
    ).toLocaleString(
        "id-ID"
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


    const warningLimit =
        Number(
            levelData
                .time_limit_seconds
        )

        *

        0.30;


    if (
        remainingSeconds <=
        warningLimit
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


    if (
        remainingMs <=
        0
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
    // ANGKA SAJA
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
    // JAWABAN TEPAT:
    // proses cukup cepat.
    // ==================================================

    if (
        value ===
        correctText
    ) {

        delayedSubmit =
            setTimeout(
                submitAnswer,
                120
            );


        return;

    }


    // ==================================================
    // TERLALU BANYAK DIGIT:
    // sudah pasti salah.
    // ==================================================

    if (
        value.length >
        correctText.length
    ) {

        delayedSubmit =
            setTimeout(
                submitAnswer,
                180
            );


        return;

    }


    // ==================================================
    // JUMLAH DIGIT SUDAH SAMA
    //
    // Untuk jawaban multi-digit beri jeda
    // lebih panjang agar siswa tidak dianggap
    // selesai hanya karena berhenti sesaat.
    // ==================================================

    if (
        value.length ===
        correctText.length
    ) {

        const delay =
            correctText.length >= 4

                ? 900

                : correctText.length === 3

                    ? 750

                    : 600;


        delayedSubmit =
            setTimeout(
                submitAnswer,
                delay
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


    // Ada jawaban:
    // tetap dinilai.

    if (
        value !== ""
    ) {

        submitAnswer();

        return;

    }


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
            `✕ Jawaban yang benar ${formatNumber(
                question.answer
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
            userValue,

        response_time_ms:
            responseTime

    });


    liveCorrect.textContent =
        String(
            correctCount
        );


    // ==================================================
    // PENTING:
    //
    // Jawaban sudah selesai.
    // Jangan simpan deadline soal lama sebagai deadline
    // soal berikutnya apabila browser direfresh
    // saat feedback sedang tampil.
    // ==================================================

    questionStartedAt =
        0;


    questionDeadline =
        0;


    answerInput.value =
        "";


    savePracticeState();


    setTimeout(
        nextQuestion,
        550
    );

}


// ======================================================
// TIMEOUT
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
        `Waktu habis • Jawaban ${formatNumber(
            question.answer
        )}`;


    answerFeedback.className =
        "answer-feedback feedback-timeout";


    questionStartedAt =
        0;


    questionDeadline =
        0;


    answerInput.value =
        "";


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

    currentQuestionIndex =
        answers.length;


    if (
        currentQuestionIndex >=
        questions.length
    ) {

        finishPractice();

        return;

    }


    savePracticeState();


    startQuestion(
        false
    );

}


// ======================================================
// FINISH
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
                Data latihan masih tersimpan
                sementara di browser.
                Muat ulang halaman untuk mencoba kembali.
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
                    String(
                        answer.user_answer
                        ?? ""
                    )
                    .trim()
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
// RESULT
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


    if (passed) {

        resultIcon.textContent =
            "✓";


        resultIcon.className =
            "result-icon result-pass";


        resultTitle.textContent =
            "Level Lulus!";


        resultMessage.textContent =

            loginMode === "student"

                ? "Level berikutnya sekarang dapat dibuka."

                : "Hasil Guest tidak disimpan.";

    }

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
// SAVE STATE
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
                3,

            level_id:
                levelId,

            exercise_type:
                levelData
                    ?.config
                    ?.exercise_type
                || null,

            questions:
                questions,

            answers:
                answers,

            current_question_index:
                answers.length,

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
            "Save state error:",
            error
        );

    }

}


// ======================================================
// LOAD STATE
// ======================================================

function loadSavedPracticeState() {

    if (
        !practiceStateKey
    ) {

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
            state.version !== 3 ||
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


        if (
            state.exercise_type !==
            levelData
                .config
                .exercise_type
        ) {

            clearSavedPracticeState();

            return null;

        }


        return state;

    }

    catch (error) {

        console.error(
            "Load state error:",
            error
        );


        clearSavedPracticeState();


        return null;

    }

}


// ======================================================
// RESTORE STATE
// ======================================================

function restoreSavedState(
    state
) {

    questions =
        state.questions;


    answers =
        state.answers;


    currentQuestionIndex =
        Math.min(

            answers.length,

            questions.length

        );


    recalculateLocalCounts();


    questionStartedAt =
        Number(
            state
                .question_started_at
            || 0
        );


    questionDeadline =
        Number(
            state
                .question_deadline_at
            || 0
        );

}


// ======================================================
// LOCAL COUNTS
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


            const correctAnswer =
                Number(
                    answer.a
                )

                *

                Number(
                    answer.b
                );


            if (
                Number(value)
                ===
                correctAnswer
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
// CLEAR STATE
// ======================================================

function clearSavedPracticeState() {

    if (
        !practiceStateKey
    ) {

        return;

    }


    sessionStorage.removeItem(
        practiceStateKey
    );

}


// ======================================================
// TIMER CLEANUP
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
