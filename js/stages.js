// ======================================================
// ELEMENT
// ======================================================

const stageList =
    document.getElementById(
        "stageList"
    );

const subjectName =
    document.getElementById(
        "subjectName"
    );

const topicName =
    document.getElementById(
        "topicName"
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


    if (
        !subjectCode ||
        !topicCode
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "./topics.html?subject=" +
                encodeURIComponent(
                    subjectCode
                );

        }
    );


    await loadStages();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    if (
        loginMode === "guest"
    ) {

        return true;

    }


    if (
        loginMode !== "student"
    ) {

        goLogin();

        return false;

    }


    if (!sessionToken) {

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
// LOAD STAGES
// ======================================================

async function loadStages() {

    try {

        // ==================================================
        // SUBJECT
        // ==================================================

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


        // ==================================================
        // TOPIC
        // ==================================================

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


        // ==================================================
        // HEADER
        // ==================================================

        subjectName.textContent =
            subject.name.toUpperCase();


        topicName.textContent =
            topic.name;


        headingTitle.textContent =
            topic.name;


        // ==================================================
        // STAGES
        // ==================================================

        const {
            data: stages,
            error: stageError
        } =
            await window.db
                .from("stages")
                .select(`
                    id,
                    stage_number,
                    name,
                    description,
                    sort_order
                `)
                .eq(
                    "topic_id",
                    topic.id
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


        if (stageError) {

            throw stageError;

        }


        // ==================================================
        // STUDENT PROGRESS
        // ==================================================

        let progress =
            [];


        if (
            loginMode === "student"
        ) {

            const progressRpc =
                topicCode === "addition"
                    ? "get_student_addition_topic_progress"
                    : topicCode === "subtraction"
                        ? "get_student_subtraction_topic_progress"
                        : "get_student_topic_progress";


            const {
                data,
                error
            } =
                await window.db.rpc(
                    progressRpc,
                    {

                        p_token:
                            sessionToken,

                        p_topic_id:
                            topic.id

                    }
                );


            if (error) {

                throw error;

            }


            progress =
                data || [];

        }


        renderStages(
            stages,
            progress
        );

    }

    catch (error) {

        console.error(
            "Load stages error:",
            error
        );


        stageList.innerHTML = `
            <div class="error-card">
                Tidak dapat memuat tingkat.
            </div>
        `;

    }

}


// ======================================================
// RENDER STAGES
// ======================================================

function renderStages(
    stages,
    progress
) {

    stageList.innerHTML =
        "";


    if (
        !stages ||
        stages.length === 0
    ) {

        stageList.innerHTML = `
            <div class="empty-card">
                Belum ada tingkat tersedia.
            </div>
        `;

        return;

    }


    // ==================================================
    // PROGRESS MAP
    // ==================================================

    const progressMap =
        new Map();


    progress.forEach(
        item => {

            progressMap.set(
                item.stage_id,
                item
            );

        }
    );


    // ==================================================
    // STAGE LOOP
    // ==================================================

    stages.forEach(
        (
            stage,
            index
        ) => {

            const currentProgress =
                progressMap.get(
                    stage.id
                );


            const completed =
                currentProgress
                    ?.is_completed
                === true;


            let unlocked =
                false;


            // ==========================================
            // GUEST
            // ==========================================

            if (
                loginMode === "guest"
            ) {

                unlocked =
                    true;

            }


            // ==========================================
            // TINGKAT PERTAMA
            // ==========================================

            else if (
                index === 0
            ) {

                unlocked =
                    true;

            }


            // ==========================================
            // TINGKAT BERIKUTNYA
            // ==========================================

            else {

                const previousStage =
                    stages[
                        index - 1
                    ];


                const previousProgress =
                    progressMap.get(
                        previousStage.id
                    );


                unlocked =
                    previousProgress
                        ?.is_completed
                    === true;

            }


            // Tingkat yang sudah selesai
            // tetap dapat dibuka.
            if (completed) {

                unlocked =
                    true;

            }


            createStageCard(
                stage,
                currentProgress,
                unlocked,
                completed
            );

        }
    );

}


// ======================================================
// CREATE STAGE CARD
// ======================================================

function createStageCard(
    stage,
    progress,
    unlocked,
    completed
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "learning-card stage-card";


    if (completed) {

        button.classList.add(
            "stage-completed"
        );

    }


    if (!unlocked) {

        button.classList.add(
            "stage-locked"
        );


        button.disabled =
            true;

    }


    // ==================================================
    // NUMBER
    // ==================================================

    const number =
        document.createElement(
            "div"
        );


    number.className =
        "stage-number";


    number.textContent =
        stage.stage_number;


    // ==================================================
    // CONTENT
    // ==================================================

    const content =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h3"
        );


    title.textContent =
        stage.name;


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        stage.description ||
        "Mulai tingkat ini.";


    const progressText =
        document.createElement(
            "div"
        );


    progressText.className =
        "stage-progress";


    // ==================================================
    // PROGRESS TEXT
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        progressText.textContent =
            "Mode Guest • semua level terbuka";

    }

    else if (completed) {

        progressText.textContent =
            "✓ Semua level telah lulus";

    }

    else if (!unlocked) {

        progressText.textContent =
            "🔒 Selesaikan tingkat sebelumnya";

    }

    else if (
        progress &&
        Number(
            progress.total_levels
        ) > 0
    ) {

        progressText.textContent =
            `${
                progress.completed_levels
            } dari ${
                progress.total_levels
            } level selesai`;

    }

    else {

        progressText.textContent =
            "Belum dimulai";

    }


    content.appendChild(
        title
    );


    content.appendChild(
        description
    );


    content.appendChild(
        progressText
    );


    // ==================================================
    // ARROW
    // ==================================================

    const arrow =
        document.createElement(
            "div"
        );


    arrow.className =
        "card-arrow";


    arrow.textContent =
        unlocked
            ? "›"
            : "🔒";


    // ==================================================
    // APPEND
    // ==================================================

    button.appendChild(
        number
    );


    button.appendChild(
        content
    );


    button.appendChild(
        arrow
    );


    // ==================================================
    // CLICK
    // ==================================================

    if (unlocked) {

        button.addEventListener(
            "click",
            () => {

                const url =
                    "./levels.html" +

                    "?subject=" +
                    encodeURIComponent(
                        subjectCode
                    ) +

                    "&topic=" +
                    encodeURIComponent(
                        topicCode
                    ) +

                    "&stage=" +
                    encodeURIComponent(
                        stage.stage_number
                    );


                window.location.href =
                    url;

            }
        );

    }


    stageList.appendChild(
        button
    );

}


// ======================================================
// LOGIN
// ======================================================

function goLogin() {

    window.location.href =
        "./index.html";

}
