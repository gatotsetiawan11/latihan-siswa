// ======================================================
// PRACTICE ENGINE V4
//
// Mendukung:
// - multiplication
// - place_value_multiplication
// - multi_digit_multiplication
//
// Input mode:
// - direct
// - column_steps
//
// Tingkat 1 - 13
// ======================================================


// ======================================================
// DOM UTAMA
// ======================================================

const practiceLoading =
    document.getElementById("practiceLoading");

const practiceGame =
    document.getElementById("practiceGame");

const resultScreen =
    document.getElementById("resultScreen");

const practiceTopic =
    document.getElementById("practiceTopic");

const practiceLevel =
    document.getElementById("practiceLevel");

const questionProgress =
    document.getElementById("questionProgress");

const questionProgressBar =
    document.getElementById("questionProgressBar");

const liveCorrect =
    document.getElementById("liveCorrect");

const timerCircle =
    document.getElementById("timerCircle");

const timerValue =
    document.getElementById("timerValue");

const answerFeedback =
    document.getElementById("answerFeedback");

const quitButton =
    document.getElementById("quitButton");


// ======================================================
// DIRECT MODE
// ======================================================

const directQuestionArea =
    document.getElementById("directQuestionArea");

const questionText =
    document.getElementById("questionText");

const answerInput =
    document.getElementById("answerInput");


// ======================================================
// COLUMN MODE
// ======================================================

const columnQuestionArea =
    document.getElementById("columnQuestionArea");

const columnTopNumber =
    document.getElementById("columnTopNumber");

const columnBottomNumber =
    document.getElementById("columnBottomNumber");

const columnStep1Label =
    document.getElementById("columnStep1Label");

const columnStep2Label =
    document.getElementById("columnStep2Label");

const columnStep1Input =
    document.getElementById("columnStep1Input");

const columnStep2Input =
    document.getElementById("columnStep2Input");

const columnFinalInput =
    document.getElementById("columnFinalInput");


// ======================================================
// RESULT
// ======================================================

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const resultAccuracy =
    document.getElementById("resultAccuracy");

const resultCorrect =
    document.getElementById("resultCorrect");

const resultWrong =
    document.getElementById("resultWrong");

const resultTimeout =
    document.getElementById("resultTimeout");

const resultAverage =
    document.getElementById("resultAverage");

const bestScoreBox =
    document.getElementById("bestScoreBox");

const retryButton =
    document.getElementById("retryButton");

const continueButton =
    document.getElementById("continueButton");


// ======================================================
// URL
// ======================================================

const params =
    new URLSearchParams(window.location.search);

const subjectCode =
    params.get("subject");

const topicCode =
    params.get("topic");

const stageNumber =
    Number(params.get("stage"));

const levelNumber =
    Number(params.get("level"));

const levelId =
    params.get("id");


// ======================================================
// LOGIN SESSION
// ======================================================

const loginMode =
    sessionStorage.getItem("login_mode");

const sessionToken =
    sessionStorage.getItem(
        "student_session_token"
    );


// ======================================================
// PRACTICE STATE
// ======================================================

const practiceStateKey =
    levelId
        ? `practice_v4_${levelId}`
        : null;


// ======================================================
// GAME STATE
// ======================================================

let levelData = null;

let questions = [];

let answers = [];

let currentQuestionIndex = 0;

let correctCount = 0;

let wrongCount = 0;

let timeoutCount = 0;

let timerInterval = null;

let delayedSubmit = null;

let questionStartedAt = 0;

let questionDeadline = 0;

let answerLocked = false;


// ======================================================
// START
// ======================================================

initialize();



// ======================================================
// PRACTICE HELP (IPAS / MATEMATIKA)
// ======================================================

function updatePracticeHelp() {

    const main =
        document.getElementById("practiceHelpMain");

    const note =
        document.getElementById("practiceHelpNote");

    if (!main || !note) {
        return;
    }

    if (subjectCode === "ipas") {

        main.textContent =
            "Pilih jawaban yang benar.";

        note.textContent =
            "Klik salah satu pilihan A, B, C, atau D.";

    } else {

        main.innerHTML =
            `
            Tekan
            <strong class="enter-key">
                Enter / Selesai
            </strong>
            untuk mengirim jawaban.
            `;

        note.textContent =
            "Jika belum benar, jawaban masih dapat diperbaiki sampai waktu habis.";
    }
}

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
        !Number.isInteger(stageNumber) ||
        stageNumber <= 0 ||
        !Number.isInteger(levelNumber) ||
        levelNumber <= 0
    ) {

        goBackToLevels();

        return;
    }


    // ==================================================
    // STUDENT ACCESS
    // ==================================================

    if (loginMode === "student") {

        const access =
            await checkLevelAccess();

        if (!access) {

            showLockedLevelMessage();

            return;
        }
    }


    setupEvents();

    await loadLevel();
    updatePracticeHelp();
}


// ======================================================
// EVENTS
// ======================================================

function setupEvents() {

    quitButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            goBackToLevels();
        }
    );


    retryButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            window.location.reload();
        }
    );


    continueButton.addEventListener(
        "click",
        () => {

            clearSavedPracticeState();

            goBackToLevels();
        }
    );


    // ==================================================
    // DIRECT INPUT
    // ==================================================

    answerInput.addEventListener(
        "input",
        handleDirectInput
    );


    answerInput.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (answerLocked) {
                return;
            }

            if (
                answerInput.value.trim()
                === ""
            ) {
                return;
            }

            submitDirectAnswer();
        }
    );


    // ==================================================
    // COLUMN INPUT
    // ==================================================

    columnStep1Input.addEventListener(
        "input",
        () => {
            handleColumnInput(
                columnStep1Input,
                1
            );
        }
    );


    columnStep2Input.addEventListener(
        "input",
        () => {
            handleColumnInput(
                columnStep2Input,
                2
            );
        }
    );


    columnFinalInput.addEventListener(
        "input",
        () => {
            handleColumnInput(
                columnFinalInput,
                3
            );
        }
    );


    // ==================================================
    // ENTER COLUMN
    // ==================================================

    columnStep1Input.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (answerLocked) {
                return;
            }

            if (
                columnStep1Input.value.trim()
                === ""
            ) {
                return;
            }

            columnStep2Input.focus();
        }
    );


    columnStep2Input.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (answerLocked) {
                return;
            }

            if (
                columnStep2Input.value.trim()
                === ""
            ) {
                return;
            }

            columnFinalInput.focus();
        }
    );


    columnFinalInput.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            if (answerLocked) {
                return;
            }

            if (!hasAnyColumnInput()) {
                return;
            }

            submitColumnAnswer();
        }
    );
}


// ======================================================
// SESSION
// ======================================================

async function checkSession() {

    if (loginMode === "guest") {
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

    } catch (error) {

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
// ACCESS LEVEL
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

    } catch (error) {

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
                .from("levels")
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


        levelData = data;


        const supportedTypes = [
            "multiplication",
            "place_value_multiplication",
            "multi_digit_multiplication",
            "ipas"
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


        const inputMode =
            getInputMode();


        if (
            ![
                "direct",
                "column_steps"
            ].includes(inputMode)
        ) {

            throw new Error(
                "Mode input belum didukung."
            );
        }


        if (
            inputMode === "column_steps" &&
            levelData.config
                .exercise_type !==
                "multi_digit_multiplication"
        ) {

            throw new Error(
                "Mode bersusun hanya dapat digunakan untuk perkalian multi-digit."
            );
        }


        if (subjectCode === "ipas") {

            practiceTopic.textContent =
                "IPAS";

            updatePracticeHelp();

        } else {

            practiceTopic.textContent =
                "PERKALIAN";

        }


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


        answers = [];

        currentQuestionIndex = 0;

        correctCount = 0;

        wrongCount = 0;

        timeoutCount = 0;


        savePracticeState();

        showGame();

        startQuestion(false);

    } catch (error) {

        console.error(
            "Load practice error:",
            error
        );


        practiceLoading.textContent =
            "Tidak dapat menyiapkan latihan.";
    }
}


// ======================================================
// INPUT MODE
// ======================================================

function getInputMode() {

    return (
        levelData
            ?.config
            ?.input_mode
        ||
        "direct"
    );
}


function isColumnMode() {

    return (
        getInputMode() ===
        "column_steps"
    );
}


// ======================================================
// SHOW GAME
// ======================================================

function showGame() {

    practiceLoading
        .classList
        .add("hidden");

    resultScreen
        .classList
        .add("hidden");

    practiceGame
        .classList
        .remove("hidden");
}


// ======================================================
// PREPARE QUESTIONS
// ======================================================

async function prepareQuestions() {

    const type =
        levelData.config
            .exercise_type;


    // ==================================================
    // BASIC MULTIPLICATION
    // ==================================================

    if (type === "multiplication") {

        if (
            levelData.config
                .adaptive === true &&
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


    if (type === "ipas") {
        return generateIPASQuestions(levelData);
    }


    return [];
}


// ======================================================
// WEAK FACTS
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


        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Weakness error:",
            error
        );

        return [];
    }
}


// ======================================================
// ADAPTIVE QUESTIONS
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
            total * ratio
        );

    const result = [];

    const usedKeys =
        new Set();


    const candidates =
        Array.isArray(weakFacts)
            ? weakFacts.slice(
                0,
                Math.max(
                    weakTarget * 2,
                    10
                )
            )
            : [];


    shuffleArray(candidates);


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
            Number(fact.a);

        const b =
            Number(fact.b);


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
            usedKeys.has(key)
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


        usedKeys.add(key);

        result.push(question);
    }


    const remaining =
        total -
        result.length;


    if (remaining > 0) {

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


    shuffleArray(result);


    return result.slice(
        0,
        total
    );
}


// ======================================================
// BASIC BALANCED GENERATOR
// ======================================================

function generateBalancedQuestions(
    level,
    targetCount,
    excludedKeys
) {

    const config =
        level.config;

    const multipliers =
        getMultipliers(config);

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

            const pool = [];


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


            shuffleArray(pool);

            pools.set(
                multiplier,
                pool
            );
        }
    );


    const result = [];

    const used =
        new Set(
            excludedKeys || []
        );

    let safety = 0;


    while (
        result.length <
        targetCount
    ) {

        let added = false;


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
                    used.has(key)
                ) {
                    continue;
                }


                const question =
                    makeBaseQuestion(
                        candidate.multiplier,
                        candidate.operand,
                        config
                    );


                used.add(key);

                result.push(question);

                added = true;

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


    shuffleArray(result);

    return result;
}


// ======================================================
// PLACE VALUE GENERATOR
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
            ? config
                .first_factor_values
                .map(Number)
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


    const candidates = [];


    for (
        const first
        of values
    ) {

        for (
            let second = secondMin;
            second <= secondMax;
            second++
        ) {

            candidates.push({
                first,
                second
            });
        }
    }


    shuffleArray(candidates);


    const result = [];

    const used =
        new Set();


    for (
        const candidate
        of candidates
    ) {

        if (
            result.length >= target
        ) {
            break;
        }


        const key =
            `${candidate.first}x${candidate.second}`;


        if (
            used.has(key)
        ) {
            continue;
        }


        used.add(key);


        let a =
            candidate.first;

        let b =
            candidate.second;


        if (
            config.random_position
                === true &&
            Math.random() < 0.5
        ) {

            [a, b] =
                [b, a];
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
        Number(config.min_a);

    const maxA =
        Number(config.max_a);

    const minB =
        Number(config.min_b);

    const maxB =
        Number(config.max_b);

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


    const result = [];

    const used =
        new Set();

    let safety = 0;


    while (
        result.length < target &&
        safety < 5000
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


        if (
            config.random_position
                === true &&
            Math.random() < 0.5
        ) {

            [a, b] =
                [b, a];
        }


        const key =
            `${a}x${b}`;


        if (
            used.has(key)
        ) {
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
}



// ======================================================
// IPAS GENERATOR
// ======================================================

function generateIPASQuestions(level) {

    const bank = [
        {
            question_text: "Organ yang berfungsi memompa darah adalah?",
            options:{a:"Jantung",b:"Paru-paru",c:"Mata",d:"Telinga"},
            answer:"a"
        },
        {
            question_text: "Manusia bernapas menggunakan?",
            options:{a:"Tangan",b:"Paru-paru",c:"Kaki",d:"Rambut"},
            answer:"b"
        },
        {
            question_text: "Bagian tumbuhan yang menyerap air adalah?",
            options:{a:"Bunga",b:"Daun",c:"Akar",d:"Buah"},
            answer:"c"
        },
        {
            question_text: "Air yang membeku berubah menjadi?",
            options:{a:"Es",b:"Uap",c:"Asap",d:"Angin"},
            answer:"a"
        },
        {
            question_text: "Hewan yang mengalami metamorfosis sempurna adalah?",
            options:{a:"Kupu-kupu",b:"Kucing",c:"Sapi",d:"Ikan"},
            answer:"a"
        },
        {
            question_text: "Mata digunakan untuk?",
            options:{a:"Mendengar",b:"Melihat",c:"Berjalan",d:"Bernapas"},
            answer:"b"
        },
        {
            question_text: "Sumber energi utama bagi bumi adalah?",
            options:{a:"Bulan",b:"Bintang",c:"Matahari",d:"Batu"},
            answer:"c"
        },
        {
            question_text: "Benda yang bentuknya tetap disebut benda?",
            options:{a:"Gas",b:"Cair",c:"Padat",d:"Uap"},
            answer:"c"
        },
        {
            question_text: "Contoh makhluk hidup adalah?",
            options:{a:"Batu",b:"Air",c:"Kucing",d:"Meja"},
            answer:"c"
        },
        {
            question_text: "Telinga berfungsi untuk?",
            options:{a:"Melihat",b:"Mendengar",c:"Mencium",d:"Merasa"},
            answer:"b"
        }
    ];

    shuffleArray(bank);

    return bank.slice(
        0,
        Number(level.question_count)
    );
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
        Number(multiplier);

    let b =
        Number(operand);


    if (
        config.random_position
            === true &&
        Math.random() < 0.5
    ) {

        [a, b] =
            [b, a];
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
        getMultipliers(config);


    let a =
        Number(factA);

    let b =
        Number(factB);


    if (
        config.random_position
        !== true
    ) {

        if (
            multipliers.includes(a)
        ) {

            // posisi sudah benar

        } else if (
            multipliers.includes(b)
        ) {

            [a, b] =
                [b, a];

        } else {

            return null;
        }

    } else if (
        Math.random() < 0.5
    ) {

        [a, b] =
            [b, a];
    }


    return {
        a,
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
        getMultipliers(config);

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
        multipliers.includes(a);

    const bMultiplier =
        multipliers.includes(b);

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


    return config
        .multipliers
        .map(Number)
        .filter(
            value =>
                Number.isInteger(value)
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
                (i + 1)
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
    resume = false,
    savedState = null
) {

    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    answerLocked = false;


    resetQuestionInputs();


    const question =
        questions[
            currentQuestionIndex
        ];


    if (!question) {

        finishPractice();

        return;
    }


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
        String(correctCount);


    // ==================================================
    // RENDER MODE
    // ==================================================

    if (isColumnMode()) {

        renderColumnQuestion(
            question
        );

    } else {

        renderDirectQuestion(
            question
        );
    }


    // ==================================================
    // RESTORE ACTIVE QUESTION
    // ==================================================

    let restoredActiveQuestion =
        false;


    if (
        resume &&
        savedState
    ) {

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
            questionStartedAt > 0 &&
            questionDeadline > 0
        ) {

            restoredActiveQuestion =
                true;


            if (isColumnMode()) {

                const savedInputs =
                    savedState.column_inputs
                    || {};


                columnStep1Input.value =
                    sanitizeStoredValue(
                        savedInputs.partial_1
                    );

                columnStep2Input.value =
                    sanitizeStoredValue(
                        savedInputs.partial_2
                    );

                columnFinalInput.value =
                    sanitizeStoredValue(
                        savedInputs.final
                    );


                refreshColumnLiveMarkers();

            } else {

                answerInput.value =
                    sanitizeStoredValue(
                        savedState
                            .current_input
                    );
            }
        }
    }


    // ==================================================
    // NEW TIMER
    // ==================================================

    if (!restoredActiveQuestion) {

        clearCurrentInputValues();

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

    } else {

        setTimeout(
            handleTimerEnd,
            0
        );
    }


    savePracticeState();


    // ==================================================
    // FOCUS
    // ==================================================

  clearTimeout(window.__practiceFocusTimer);

if (!isMobileDevice()) {
    window.__practiceFocusTimer = setTimeout(() => {
        focusCurrentInput();
    }, 40);
}


// ======================================================
// RESET INPUTS
// ======================================================

function resetQuestionInputs() {

    answerFeedback.textContent =
        "";

    answerFeedback.className =
        "answer-feedback";


    answerInput.disabled =
        false;

    columnStep1Input.disabled =
        false;

    columnStep2Input.disabled =
        false;

    columnFinalInput.disabled =
        false;


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
}


// ======================================================
// CLEAR INPUT VALUES
// ======================================================

function clearCurrentInputValues() {

    answerInput.value = "";

    columnStep1Input.value = "";

    columnStep2Input.value = "";

    columnFinalInput.value = "";


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
}


// ======================================================
// DIRECT QUESTION
// ======================================================

function renderDirectQuestion(
    question
) {

    directQuestionArea
        .classList
        .remove("hidden");

    columnQuestionArea
        .classList
        .add("hidden");


    if (question.question_text) {

        questionText.innerHTML = `
            <div class="ipas-question-text" style="font-size:28px;line-height:1.4;font-weight:700;margin-bottom:24px;">
                ${question.question_text}
            </div>

            <div class="ipas-options" style="display:flex;flex-direction:column;gap:12px;text-align:left;">
                <button type="button" class="ipas-option" data-answer="a" style="font-size:22px;padding:16px 20px;text-align:left;">
                    A. ${question.options.a}
                </button>

                <button type="button" class="ipas-option" data-answer="b" style="font-size:22px;padding:16px 20px;text-align:left;">
                    B. ${question.options.b}
                </button>

                <button type="button" class="ipas-option" data-answer="c" style="font-size:22px;padding:16px 20px;text-align:left;">
                    C. ${question.options.c}
                </button>

                <button type="button" class="ipas-option" data-answer="d" style="font-size:22px;padding:16px 20px;text-align:left;">
                    D. ${question.options.d}
                </button>
            </div>
        `;

        answerInput.value = "";

        const buttons =
            questionText.querySelectorAll(".ipas-option");

        buttons.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (answerLocked) {
                        return;
                    }

                    buttons.forEach(item => {
                        item.classList.remove("active");
                    });

                    button.classList.add("active");

                    answerInput.value =
                        button.dataset.answer;

                    savePracticeState();

                    setTimeout(
                        submitDirectAnswer,
                        150
                    );
                }
            );

        });

        answerInput.classList.add("hidden");

        return;
    }


    questionText.textContent =
        `${formatNumber(
            question.a
        )} × ${formatNumber(
            question.b
        )}`;
}


// ======================================================
// COLUMN QUESTION
// ======================================================

function renderColumnQuestion(
    question
) {

    directQuestionArea
        .classList
        .add("hidden");

    columnQuestionArea
        .classList
        .remove("hidden");


    const expected =
        getColumnExpected(
            question
        );


    columnTopNumber.textContent =
        formatNumber(
            question.a
        );


    columnBottomNumber.textContent =
        formatNumber(
            question.b
        );


    columnStep1Label.textContent =
        `${formatNumber(
            question.a
        )} × ${expected.unitsDigit}`;


    columnStep2Label.textContent =
        `${formatNumber(
            question.a
        )} × ${formatNumber(
            expected.tensValue
        )}`;
}


// ======================================================
// COLUMN EXPECTED RESULTS
// ======================================================

function getColumnExpected(
    question
) {

    const b =
        Number(
            question.b
        );


    const unitsDigit =
        b % 10;


    const tensValue =
        Math.floor(
            b / 10
        )
        *
        10;


    return {

        unitsDigit,

        tensValue,

        partial1:
            Number(question.a)
            *
            unitsDigit,

        partial2:
            Number(question.a)
            *
            tensValue,

        final:
            Number(question.a)
            *
            Number(question.b)
    };
}


// ======================================================
// FORMAT NUMBER
// ======================================================

function formatNumber(
    value
) {

    return Number(value)
        .toLocaleString(
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
// UPDATE TIMER
// ======================================================

function updateTimer() {

    if (answerLocked) {
        return;
    }


    const remainingMs =
        Math.max(
            0,
            questionDeadline
            -
            Date.now()
        );


    const remainingSeconds =
        remainingMs / 1000;


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

    } else {

        timerCircle.classList.remove(
            "timer-warning"
        );
    }


    if (
        remainingMs <= 0
    ) {

        handleTimerEnd();
    }
}


// ======================================================
// DIRECT INPUT
// ======================================================

function handleDirectInput() {

    if (answerLocked) {
        return;
    }


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
        answerInput.value.trim();


    if (value === "") {
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
    // EXACT CORRECT
    // ==================================================

    if (
        value ===
        correctText
    ) {

        delayedSubmit =
            setTimeout(
                submitDirectAnswer,
                120
            );

        return;
    }


    // ==================================================
    // TOO MANY DIGITS
    // ==================================================

    if (
        value.length >
        correctText.length
    ) {

        delayedSubmit =
            setTimeout(
                submitDirectAnswer,
                180
            );

        return;
    }


    // ==================================================
    // SAME DIGIT LENGTH
    // ==================================================

    if (
        value.length ===
        correctText.length
    ) {

        let delay = 600;


        if (
            correctText.length === 3
        ) {

            delay = 750;

        } else if (
            correctText.length >= 4
        ) {

            delay = 900;
        }


        delayedSubmit =
            setTimeout(
                submitDirectAnswer,
                delay
            );
    }
}


// ======================================================
// COLUMN INPUT
// ======================================================

function handleColumnInput(
    input,
    stepNumber
) {

    if (answerLocked) {
        return;
    }


    input.value =
        input.value
            .replace(
                /\D/g,
                ""
            );


    input.classList.remove(
        "step-correct",
        "step-wrong"
    );


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


    const expectedValue =
        stepNumber === 1
            ? expected.partial1
            : stepNumber === 2
                ? expected.partial2
                : expected.final;


    if (
        input.value !== "" &&
        Number(input.value)
        ===
        expectedValue
    ) {

        input.classList.add(
            "step-correct"
        );
    }


    savePracticeState();


    clearTimeout(
        delayedSubmit
    );


    const inputs =
        getColumnInputs();


    if (
        !inputs.partial1 ||
        !inputs.partial2 ||
        !inputs.final
    ) {
        return;
    }


    // ==================================================
    // ALL CORRECT
    // ==================================================

    if (
        columnInputsAreCorrect(
            inputs,
            expected
        )
    ) {

        delayedSubmit =
            setTimeout(
                submitColumnAnswer,
                180
            );

        return;
    }


    // ==================================================
    // ALL APPEAR COMPLETE
    // ==================================================

    const completeLengths =
        inputs.partial1.length >=
            String(
                expected.partial1
            ).length
        &&
        inputs.partial2.length >=
            String(
                expected.partial2
            ).length
        &&
        inputs.final.length >=
            String(
                expected.final
            ).length;


    if (completeLengths) {

        delayedSubmit =
            setTimeout(
                submitColumnAnswer,
                1000
            );
    }
}


// ======================================================
// COLUMN INPUT HELPERS
// ======================================================

function getColumnInputs() {

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
}


function hasAnyColumnInput() {

    const values =
        getColumnInputs();


    return (
        values.partial1 !== "" ||
        values.partial2 !== "" ||
        values.final !== ""
    );
}


function columnInputsAreCorrect(
    inputs,
    expected
) {

    return (
        Number(inputs.partial1)
            === expected.partial1
        &&
        Number(inputs.partial2)
            === expected.partial2
        &&
        Number(inputs.final)
            === expected.final
    );
}


// ======================================================
// LIVE COLUMN MARKERS
// ======================================================

function refreshColumnLiveMarkers() {

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


    const mapping = [

        {
            input:
                columnStep1Input,
            correct:
                expected.partial1
        },

        {
            input:
                columnStep2Input,
            correct:
                expected.partial2
        },

        {
            input:
                columnFinalInput,
            correct:
                expected.final
        }
    ];


    mapping.forEach(
        item => {

            item.input
                .classList
                .remove(
                    "step-correct",
                    "step-wrong"
                );


            if (
                item.input.value !== "" &&
                Number(
                    item.input.value
                )
                ===
                item.correct
            ) {

                item.input
                    .classList
                    .add(
                        "step-correct"
                    );
            }
        }
    );
}


// ======================================================
// TIMER END
// ======================================================

function handleTimerEnd() {

    if (answerLocked) {
        return;
    }


    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    if (isColumnMode()) {

        if (
            hasAnyColumnInput()
        ) {

            submitColumnAnswer();

        } else {

            submitTimeout();
        }

        return;
    }


    if (
        answerInput.value.trim()
        !== ""
    ) {

        submitDirectAnswer();

    } else {

        submitTimeout();
    }
}


// ======================================================
// DIRECT SUBMIT
// ======================================================

function submitDirectAnswer() {

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


    const userValue =
        answerInput.value.trim();


    if (userValue === "") {

        submitTimeout();

        return;
    }


    answerLocked = true;


    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    answerInput.disabled =
        true;


    const responseTime =
        getResponseTime();


    const correct =
        subjectCode === "ipas"
            ? String(userValue)
                .toLowerCase()
                .trim()
                ===
              String(question.answer)
                .toLowerCase()
                .trim()
            : Number(userValue)
                ===
              question.answer;


    let status;


    if (correct) {

        status = "correct";

        correctCount++;


        answerFeedback.textContent =
            "✓ Benar";

        answerFeedback.className =
            "answer-feedback feedback-correct";

    } else {

        status = "wrong";

        wrongCount++;


        if (subjectCode === "ipas") {

            answerFeedback.textContent =
                `✕ Jawaban yang benar ${
                    String(question.answer)
                        .toUpperCase()
                }`;

        } else {

            answerFeedback.textContent =
                `✕ Jawaban yang benar ${formatNumber(
                    question.answer
                )}`;

        }

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
            responseTime,

        client_status:
            status
    });


    liveCorrect.textContent =
        String(correctCount);


    closeCurrentQuestionState();

    savePracticeState();


    setTimeout(
        nextQuestion,
        600
    );
}


// ======================================================
// COLUMN SUBMIT
// ======================================================

function submitColumnAnswer() {

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


    if (
        !hasAnyColumnInput()
    ) {

        submitTimeout();

        return;
    }


    answerLocked = true;


    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    disableColumnInputs();


    const values =
        getColumnInputs();


    const expected =
        getColumnExpected(
            question
        );


    const step1Correct =
        values.partial1 !== ""
        &&
        Number(values.partial1)
            === expected.partial1;


    const step2Correct =
        values.partial2 !== ""
        &&
        Number(values.partial2)
            === expected.partial2;


    const finalCorrect =
        values.final !== ""
        &&
        Number(values.final)
            === expected.final;


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

    applyColumnResultClass(
        columnFinalInput,
        finalCorrect
    );


    let status;


    if (fullyCorrect) {

        status = "correct";

        correctCount++;


        answerFeedback.textContent =
            "✓ Semua langkah benar";

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


    answers.push({

        a:
            question.a,

        b:
            question.b,

        user_answer:
            values.final,

        steps: {

            partial_1:
                values.partial1,

            partial_2:
                values.partial2,

            final:
                values.final
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
        1000
    );
}


// ======================================================
// COLUMN RESULT CLASS
// ======================================================

function applyColumnResultClass(
    input,
    correct
) {

    input.classList.remove(
        "step-correct",
        "step-wrong"
    );


    input.classList.add(
        correct
            ? "step-correct"
            : "step-wrong"
    );
}


// ======================================================
// DISABLE COLUMN
// ======================================================

function disableColumnInputs() {

    columnStep1Input.disabled =
        true;

    columnStep2Input.disabled =
        true;

    columnFinalInput.disabled =
        true;
}


// ======================================================
// TIMEOUT
// ======================================================

function submitTimeout() {

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


    answerLocked = true;


    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    timeoutCount++;


    if (isColumnMode()) {

        disableColumnInputs();


        answers.push({

            a:
                question.a,

            b:
                question.b,

            user_answer:
                "",

            steps: {

                partial_1:
                    "",

                partial_2:
                    "",

                final:
                    ""
            },

            response_time_ms:
                getResponseTime(),

            client_status:
                "timeout"
        });


        answerFeedback.textContent =
            `Waktu habis • Hasil ${formatNumber(
                question.answer
            )}`;

    } else {

        answerInput.disabled =
            true;


        answers.push({

            a:
                question.a,

            b:
                question.b,

            user_answer:
                "",

            response_time_ms:
                getResponseTime(),

            client_status:
                "timeout"
        });


        answerFeedback.textContent =
            `Waktu habis • Jawaban ${formatNumber(
                question.answer
            )}`;
    }


    answerFeedback.className =
        "answer-feedback feedback-timeout";


    closeCurrentQuestionState();

    savePracticeState();


    setTimeout(
        nextQuestion,
        800
    );
}


// ======================================================
// RESPONSE TIME
// ======================================================

function getResponseTime() {

    if (
        !questionStartedAt
    ) {
        return 0;
    }


    return Math.max(
        0,
        Date.now()
        -
        questionStartedAt
    );
}


// ======================================================
// CLOSE CURRENT QUESTION
// ======================================================

function closeCurrentQuestionState() {

    questionStartedAt = 0;

    questionDeadline = 0;
}


// ======================================================
// NEXT
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

    startQuestion(false);
}


// ======================================================
// FINISH
// ======================================================

async function finishPractice() {

    clearTimer();

    clearTimeout(
        delayedSubmit
    );


    practiceGame
        .classList
        .add("hidden");

    resultScreen
        .classList
        .add("hidden");

    practiceLoading
        .classList
        .remove("hidden");


    practiceLoading.textContent =
        "Menghitung hasil...";


    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode ===
        "guest"
    ) {

        const result =
            calculateGuestResult();


        clearSavedPracticeState();

        showResult(result);

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

    } catch (error) {

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
                Jangan tutup halaman jika ingin
                mencoba mengirim kembali.
            </p>

            <button
                id="retrySaveButton"
                class="button button-primary"
                type="button"
            >
                Coba Simpan Lagi
            </button>

            <button
                id="submitBackButton"
                class="button button-secondary"
                type="button"
                style="margin-left:8px;"
            >
                Kembali
            </button>
        `;


        document
            .getElementById(
                "retrySaveButton"
            )
            .addEventListener(
                "click",
                finishPractice
            );


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
                correctCount
                /
                total
            )
            *
            100
            : 0;


    const responseTimes =
        answers
            .filter(
                answer =>
                    answer.client_status
                    !== "timeout"
            )
            .map(
                answer =>
                    Number(
                        answer.response_time_ms
                    )
            )
            .filter(
                value =>
                    Number.isFinite(value)
                    &&
                    value > 0
            );


    let average = null;


    if (
        responseTimes.length > 0
    ) {

        average =
            Math.round(
                responseTimes.reduce(
                    (
                        totalValue,
                        value
                    ) =>
                        totalValue
                        +
                        value,
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
                accuracy.toFixed(2)
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

    practiceLoading
        .classList
        .add("hidden");

    practiceGame
        .classList
        .add("hidden");

    resultScreen
        .classList
        .remove("hidden");


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

    } else {

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
        result
            .average_response_time_ms
        !== null
        &&
        result
            .average_response_time_ms
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

    } else {

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

        bestScoreBox
            .classList
            .remove("hidden");


        bestScoreBox.textContent =
            `Skor terbaik: ${
                Number(
                    result.best_score
                )
                .toFixed(0)
            }% • Percobaan ${
                result.attempts
            }`;

    } else {

        bestScoreBox
            .classList
            .add("hidden");
    }
}


// ======================================================
// FOCUS
// ======================================================

function isMobileDevice() {
    return window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 768;
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || window.matchMedia("(pointer: coarse)").matches
        || navigator.maxTouchPoints > 0;
}
    
function focusCurrentInput() {
    if (isMobileDevice()) {
        return;
    }

    if (answerLocked) {
        return;
    }

    if (!isColumnMode()) {
        if (answerInput.classList.contains("hidden")) {
            return;
        }

        if (document.activeElement !== answerInput) {
            answerInput.focus({ preventScroll: true });
        }

        return;
    }

    if (columnStep1Input.value.trim() === "") {
        columnStep1Input.focus({ preventScroll: true });
        return;
    }

    if (columnStep2Input.value.trim() === "") {
        columnStep2Input.focus({ preventScroll: true });
        return;
    }

    columnFinalInput.focus({ preventScroll: true });
}


// ======================================================
// SANITIZE STORED VALUE
// ======================================================

function sanitizeStoredValue(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /\D/g,
        ""
    );
}


// ======================================================
// SAVE STATE
// ======================================================

function savePracticeState() {

    if (
        !practiceStateKey ||
        questions.length === 0 ||
        !levelData
    ) {
        return;
    }


    try {

        const activeQuestion =
            questionStartedAt > 0
            &&
            questionDeadline > 0;


        const state = {

            version:
                4,

            level_id:
                levelId,

            exercise_type:
                levelData
                    .config
                    .exercise_type,

            input_mode:
                getInputMode(),

            questions,

            answers,

            current_question_index:
                answers.length,

            current_input:
                activeQuestion
                    ? answerInput.value
                    : "",

            column_inputs:
                activeQuestion
                    ? {
                        partial_1:
                            columnStep1Input
                                .value,

                        partial_2:
                            columnStep2Input
                                .value,

                        final:
                            columnFinalInput
                                .value
                    }
                    : {
                        partial_1:
                            "",

                        partial_2:
                            "",

                        final:
                            ""
                    },

            question_started_at:
                questionStartedAt,

            question_deadline_at:
                questionDeadline
        };


        sessionStorage.setItem(
            practiceStateKey,
            JSON.stringify(state)
        );

    } catch (error) {

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
            JSON.parse(raw);


        if (
            state.version !== 4 ||
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
            state.questions.length
            !==
            Number(
                levelData
                    .question_count
            )
        ) {

            clearSavedPracticeState();

            return null;
        }


        if (
            state.exercise_type
            !==
            levelData
                .config
                .exercise_type
        ) {

            clearSavedPracticeState();

            return null;
        }


        if (
            state.input_mode
            !==
            getInputMode()
        ) {

            clearSavedPracticeState();

            return null;
        }


        return state;

    } catch (error) {

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
// RECALCULATE COUNTS
// ======================================================

function recalculateLocalCounts() {

    correctCount = 0;

    wrongCount = 0;

    timeoutCount = 0;


    answers.forEach(
        answer => {

            if (
                answer.client_status
                === "correct"
            ) {

                correctCount++;

                return;
            }


            if (
                answer.client_status
                === "wrong"
            ) {

                wrongCount++;

                return;
            }


            if (
                answer.client_status
                === "timeout"
            ) {

                timeoutCount++;

                return;
            }


            // ==========================================
            // FALLBACK
            // ==========================================

            if (answer.steps) {

                const questionAnswer =
                    Number(answer.a)
                    *
                    Number(answer.b);


                const b =
                    Number(answer.b);

                const units =
                    b % 10;

                const tens =
                    Math.floor(
                        b / 10
                    )
                    *
                    10;


                const step1 =
                    Number(answer.a)
                    *
                    units;

                const step2 =
                    Number(answer.a)
                    *
                    tens;


                const anyValue =
                    String(
                        answer.steps.partial_1
                        ?? ""
                    ).trim()
                    !== ""
                    ||
                    String(
                        answer.steps.partial_2
                        ?? ""
                    ).trim()
                    !== ""
                    ||
                    String(
                        answer.steps.final
                        ?? ""
                    ).trim()
                    !== "";


                if (!anyValue) {

                    timeoutCount++;

                    return;
                }


                const correct =
                    Number(
                        answer.steps.partial_1
                    )
                    === step1
                    &&
                    Number(
                        answer.steps.partial_2
                    )
                    === step2
                    &&
                    Number(
                        answer.steps.final
                    )
                    === questionAnswer;


                if (correct) {
                    correctCount++;
                } else {
                    wrongCount++;
                }


                return;
            }


            const value =
                String(
                    answer.user_answer
                    ?? ""
                )
                .trim();


            if (value === "") {

                timeoutCount++;

                return;
            }


            const correctAnswer =
                Number(answer.a)
                *
                Number(answer.b);


            if (
                Number(value)
                ===
                correctAnswer
            ) {

                correctCount++;

            } else {

                wrongCount++;
            }
        }
    );
}


// ======================================================
// CLEAR SAVED STATE
// ======================================================

function clearSavedPracticeState() {

    if (practiceStateKey) {

        sessionStorage.removeItem(
            practiceStateKey
        );
    }


    // Bersihkan state lama V3 juga.

    if (levelId) {

        sessionStorage.removeItem(
            `practice_v3_${levelId}`
        );
    }
}


// ======================================================
// CLEAR TIMER
// ======================================================

function clearTimer() {

    if (timerInterval) {

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
        "?subject="
        +
        encodeURIComponent(
            subjectCode
        )
        +
        "&topic="
        +
        encodeURIComponent(
            topicCode
        )
        +
        "&stage="
        +
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
