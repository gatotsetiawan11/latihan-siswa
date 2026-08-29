// ======================================================
// ELEMENT
// ======================================================

const headerName =
    document.getElementById(
        "headerName"
    );

const studentWelcome =
    document.getElementById(
        "studentWelcome"
    );

const studentName =
    document.getElementById(
        "studentName"
    );

const studentClass =
    document.getElementById(
        "studentClass"
    );

const guestNotice =
    document.getElementById(
        "guestNotice"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const mathButton =
    document.getElementById(
        "mathButton"
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

initializeDashboard();


// ======================================================
// INITIALIZE
// ======================================================

async function initializeDashboard() {

    // Tidak ada session.
    if (!loginMode) {

        goToLogin();

        return;

    }


    // ------------------------------
    // GUEST
    // ------------------------------

    if (loginMode === "guest") {

        showGuestDashboard();

        return;

    }


    // ------------------------------
    // STUDENT
    // ------------------------------

    if (loginMode === "student") {

        await validateStudentSession();

        return;

    }


    // Mode tidak dikenal.
    sessionStorage.clear();

    goToLogin();

}


// ======================================================
// VALIDATE STUDENT SESSION
// ======================================================

async function validateStudentSession() {

    if (!sessionToken) {

        sessionStorage.clear();

        goToLogin();

        return;

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


        if (error) {

            console.error(
                "Session error:",
                error
            );

            sessionStorage.clear();

            goToLogin();

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            sessionStorage.clear();

            goToLogin();

            return;

        }


        const student =
            data[0];


        // ------------------------------
        // TAMPILKAN DATA SISWA
        // ------------------------------

        headerName.textContent =
            student.full_name;


        studentName.textContent =
            student.full_name;


        if (student.class_name) {

            studentClass.textContent =
                `Kelas ${student.class_name}`;

        }

        else {

            studentClass.textContent =
                "";

        }

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        sessionStorage.clear();

        goToLogin();

    }

}


// ======================================================
// GUEST
// ======================================================

function showGuestDashboard() {

    headerName.textContent =
        "Guest";


    studentWelcome.classList.add(
        "hidden"
    );


    guestNotice.classList.remove(
        "hidden"
    );

}


// ======================================================
// MATEMATIKA
// ======================================================

mathButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./topics.html?subject=math";

    }
);


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
    "click",
    logout
);


async function logout() {

    const currentMode =
        sessionStorage.getItem(
            "login_mode"
        );


    const currentToken =
        sessionStorage.getItem(
            "student_session_token"
        );


    // ------------------------------
    // STUDENT
    // ------------------------------

    if (
        currentMode === "student" &&
        currentToken
    ) {

        try {

            await window.db.rpc(
                "logout_student",
                {
                    p_token:
                        currentToken
                }
            );

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }


    // ------------------------------
    // HAPUS SESSION BROWSER
    // ------------------------------

    sessionStorage.clear();


    goToLogin();

}


// ======================================================
// NAVIGATION
// ======================================================

function goToLogin() {

    window.location.href =
        "./index.html";

}
