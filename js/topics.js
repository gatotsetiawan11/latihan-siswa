// ======================================================
// ELEMENT
// ======================================================

const topicList =
    document.getElementById(
        "topicList"
    );

const pageTitle =
    document.getElementById(
        "pageTitle"
    );

const subjectLabel =
    document.getElementById(
        "subjectLabel"
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


// ======================================================
// START
// ======================================================

initialize();


// ======================================================
// INITIALIZE
// ======================================================

async function initialize() {

    // ------------------------------
    // VALIDASI SESSION
    // ------------------------------

    const validSession =
        await checkSession();


    if (!validSession) {

        return;

    }


    // ------------------------------
    // SUBJECT HARUS ADA
    // ------------------------------

    if (!subjectCode) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    // ------------------------------
    // LOAD TOPIK
    // ------------------------------

    await loadTopics();

}


// ======================================================
// CHECK SESSION
// ======================================================

async function checkSession() {

    const mode =
        sessionStorage.getItem(
            "login_mode"
        );


    // ------------------------------
    // GUEST
    // ------------------------------

    if (mode === "guest") {

        return true;

    }


    // ------------------------------
    // HARUS STUDENT
    // ------------------------------

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
// LOAD TOPICS
// ======================================================

async function loadTopics() {

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
        // PAGE TITLE
        // ------------------------------

        pageTitle.textContent =
            subject.name;


        subjectLabel.textContent =
            subject.name.toUpperCase();


        // ------------------------------
        // TOPICS
        // ------------------------------

        const {
            data: topics,
            error: topicError
        } =
            await window.db
                .from("topics")
                .select(`
                    id,
                    code,
                    name,
                    description,
                    sort_order
                `)
                .eq(
                    "subject_id",
                    subject.id
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


        if (topicError) {

            throw topicError;

        }


        renderTopics(
            subject,
            topics
        );

    }

    catch (error) {

        console.error(
            "Load topics error:",
            error
        );


        topicList.innerHTML = `
            <div class="error-card">
                Tidak dapat memuat topik.
            </div>
        `;

    }

}


// ======================================================
// RENDER TOPICS
// ======================================================

function renderTopics(
    subject,
    topics
) {

    topicList.innerHTML =
        "";


    // ------------------------------
    // EMPTY
    // ------------------------------

    if (
        !topics ||
        topics.length === 0
    ) {

        topicList.innerHTML = `
            <div class="empty-card">
                Belum ada topik tersedia.
            </div>
        `;

        return;

    }


    // ------------------------------
    // LOOP
    // ------------------------------

    topics.forEach(
        topic => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "learning-card";


            // ------------------------------
            // ICON
            // ------------------------------

            let symbol =
                "•";


            if (
                topic.code ===
                "multiplication"
            ) {

                symbol =
                    "×";

            }


            if (
                topic.code ===
                "addition"
            ) {

                symbol =
                    "+";

            }


            if (
                topic.code ===
                "subtraction"
            ) {

                symbol =
                    "−";

            }


            if (
                topic.code ===
                "english_conversation"
            ) {

                symbol =
                    "A";

            }


            // ------------------------------
            // ICON ELEMENT
            // ------------------------------

            const icon =
                document.createElement(
                    "div"
                );


            icon.className =
                "learning-icon";


            icon.textContent =
                symbol;


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
                topic.name;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                topic.description ||
                "Mulai latihan.";


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
            // CARD
            // ------------------------------

            button.appendChild(
                icon
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
                        "./stages.html" +
                        "?subject=" +
                        encodeURIComponent(
                            subject.code
                        ) +
                        "&topic=" +
                        encodeURIComponent(
                            topic.code
                        );


                    window.location.href =
                        url;

                }
            );


            topicList.appendChild(
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
