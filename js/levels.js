// ======================================================
// ELEMENT
// ======================================================

const levelList =
    document.getElementById(
        "levelList"
    );

const topicName =
    document.getElementById(
        "topicName"
    );

const stageName =
    document.getElementById(
        "stageName"
    );

const headingTitle =
    document.getElementById(
        "headingTitle"
    );

const backButton =
    document.getElementById(
        "backButton"
    );


// ======================================================
// URL PARAMETERS
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


// ======================================================
// START
// ======================================================

initialize();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    // ------------------------------
    // SESSION
    // ------------------------------

    const validSession =
        await checkSession();


    if (!validSession) {

        return;

    }


    // ------------------------------
    // PARAMETER
    // ------------------------------

    if (
        !subjectCode ||
        !topicCode ||
        !Number.isInteger(stageNumber) ||
        stageNumber <= 0
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    // ------------------------------
    // BACK
    // ------------------------------

    backButton.addEventListener(
        "click",
        () => {

            const url =
                "./stages.html" +
                "?subject=" +
                encodeURIComponent(
                    subjectCode
                ) +
                "&topic=" +
                encodeURIComponent(
                    topicCode
                );


            window.location.href =
                url;

        }
    );


    // ------------------------------
    // LOAD
    // ------------------------------

    await loadLevels();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    const mode =
        sessionStorage.getItem(
            "login_mode"
        );


    if (mode === "guest") {

        return true;

    }


    if (mode !== "student") {

        goToLogin();

        return false;

    }


    const token =
        sessionStorage.getItem(
            "student_session_token"
        );


    if (!token) {

        sessionStorage.clear();

        goToLogin();

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
                        token
                }
            );


        if (
            error ||
            !data ||
            data.length === 0
        ) {

            sessionStorage.clear();

            goToLogin();

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

        goToLogin();

        return false;

    }

}


// ======================================================
// LOAD LEVELS
// ======================================================

async function loadLevels() {

    try {

        // ------------------------------
        // SUBJECT
        // ------------------------------

        const {
            data: subject,
            error: subjectError
        } =
            await window.db
                .from("subjects")
                .select(`
                    id,
                    code,
                    name
                `)
                .eq(
                    "code",
                    subjectCode
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (subjectError) {

            throw subjectError;

        }


        // ------------------------------
        // TOPIC
        // ------------------------------

        const {
            data: topic,
            error: topicError
        } =
            await window.db
                .from("topics")
                .select(`
                    id,
                    code,
                    name
                `)
                .eq(
                    "subject_id",
                    subject.id
                )
                .eq(
                    "code",
                    topicCode
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (topicError) {

            throw topicError;

        }


        // ------------------------------
        // STAGE
        // ------------------------------

        const {
            data: stage,
            error: stageError
        } =
            await window.db
                .from("stages")
                .select(`
                    id,
                    stage_number,
                    name
                `)
                .eq(
                    "topic_id",
                    topic.id
                )
                .eq(
                    "stage_number",
                    stageNumber
                )
                .eq(
                    "is_active",
                    true
                )
                .single();


        if (stageError) {

            throw stageError;

        }


        // ------------------------------
        // HEADER
        // ------------------------------

        topicName.textContent =
            topic.name.toUpperCase();


        stageName.textContent =
            stage.name;


        headingTitle.textContent =
            stage.name;


        // ------------------------------
        // LEVEL
        // ------------------------------

        const {
            data: levels,
            error: levelError
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
                    config,
                    sort_order
                `)
                .eq(
                    "stage_id",
                    stage.id
                )
                .eq(
                    "is_active",
                    true
                )
                .order(
                    "sort_order",
                    {
                        ascending: true
                    }
                );


        if (levelError) {

            throw levelError;

        }


        renderLevels(
            levels
        );

    }

    catch (error) {

        console.error(
            "Load levels error:",
            error
        );


        levelList.innerHTML = `
            <div class="error-card">
                Tidak dapat memuat level.
            </div>
        `;

    }

}


// ======================================================
// RENDER LEVELS
// ======================================================

function renderLevels(levels) {

    levelList.innerHTML =
        "";


    // ------------------------------
    // EMPTY
    // ------------------------------

    if (
        !levels ||
        levels.length === 0
    ) {

        levelList.innerHTML = `
            <div class="empty-card">
                Belum ada level tersedia.
            </div>
        `;

        return;

    }


    // ------------------------------
    // LOOP
    // ------------------------------

    levels.forEach(
        level => {

            const card =
                document.createElement(
                    "button"
                );


            card.type =
                "button";


            card.className =
                "level-card";


            // ------------------------------
            // HEADER
            // ------------------------------

            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "level-header";


            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "level-number";


            number.textContent =
                level.level_number;


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "time-badge";


            time.textContent =
                `${level.time_limit_seconds} detik`;


            header.appendChild(
                number
            );


            header.appendChild(
                time
            );


            // ------------------------------
            // TITLE
            // ------------------------------

            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                level.name;


            // ------------------------------
            // INFO
            // ------------------------------

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "level-info";


            const questionInfo =
                document.createElement(
                    "span"
                );


            questionInfo.textContent =
                `${level.question_count} soal`;


            const passingInfo =
                document.createElement(
                    "span"
                );


            passingInfo.textContent =
                `Lulus ${level.passing_score}%`;


            info.appendChild(
                questionInfo
            );


            info.appendChild(
                passingInfo
            );


            // ------------------------------
            // START
            // ------------------------------

            const start =
                document.createElement(
                    "div"
                );


            start.className =
                "start-label";


            start.textContent =
                "Mulai →";


            // ------------------------------
            // CARD
            // ------------------------------

            card.appendChild(
                header
            );


            card.appendChild(
                title
            );


            card.appendChild(
                info
            );


            card.appendChild(
                start
            );


            // ------------------------------
            // CLICK
            // ------------------------------

            card.addEventListener(
                "click",
                () => {

                    // Simpan data level untuk
                    // tahap practice berikutnya.

                    sessionStorage.setItem(
                        "selected_level_id",
                        level.id
                    );


                    sessionStorage.setItem(
                        "selected_level_number",
                        String(
                            level.level_number
                        )
                    );


                    sessionStorage.setItem(
                        "selected_stage_number",
                        String(
                            stageNumber
                        )
                    );


                    sessionStorage.setItem(
                        "selected_subject_code",
                        subjectCode
                    );


                    sessionStorage.setItem(
                        "selected_topic_code",
                        topicCode
                    );


                    alert(
                        `${level.name} siap. ` +
                        `Engine latihan akan dibuat ` +
                        `pada tahap berikutnya.`
                    );

                }
            );


            levelList.appendChild(
                card
            );

        }
    );

}


// ======================================================
// NAVIGATION
// ======================================================

function goToLogin() {

    window.location.href =
        "./index.html";

}
