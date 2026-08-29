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
// URL PARAMETER
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
        !topicCode
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    // ------------------------------
    // BACK BUTTON
    // ------------------------------

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


    // ------------------------------
    // LOAD
    // ------------------------------

    await loadStages();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    const mode =
        sessionStorage.getItem(
            "login_mode"
        );


    // Guest boleh.
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
                    p_token: token
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
// LOAD STAGES
// ======================================================

async function loadStages() {

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
        // PAGE HEADER
        // ------------------------------

        subjectName.textContent =
            subject.name.toUpperCase();


        topicName.textContent =
            topic.name;


        headingTitle.textContent =
            topic.name;


        // ------------------------------
        // STAGES
        // ------------------------------

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


        renderStages(
            stages
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

function renderStages(stages) {

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


    stages.forEach(
        stage => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "learning-card";


            // ------------------------------
            // NUMBER
            // ------------------------------

            const number =
                document.createElement(
                    "div"
                );


            number.className =
                "stage-number";


            number.textContent =
                stage.stage_number;


            // ------------------------------
            // CONTENT
            // ------------------------------

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


            content.appendChild(
                title
            );


            content.appendChild(
                description
            );


            // ------------------------------
            // ARROW
            // ------------------------------

            const arrow =
                document.createElement(
                    "div"
                );


            arrow.className =
                "card-arrow";


            arrow.textContent =
                "›";


            // ------------------------------
            // APPEND
            // ------------------------------

            button.appendChild(
                number
            );


            button.appendChild(
                content
            );


            button.appendChild(
                arrow
            );


            // ------------------------------
            // CLICK
            // ------------------------------

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


            stageList.appendChild(
                button
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
