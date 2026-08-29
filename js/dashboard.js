// ======================================================
// LATIHAN SISWA
// DASHBOARD V2
//
// Perubahan:
// - Tidak menampilkan class_name / "Kelas 2"
// - Menambahkan tombol Laporan Belajar
// - Laporan hanya tersedia untuk siswa
// - Guest tetap dapat mencoba latihan
// ======================================================


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


const guestNotice =
    document.getElementById(
        "guestNotice"
    );


const studentReportSection =
    document.getElementById(
        "studentReportSection"
    );


const reportButton =
    document.getElementById(
        "reportButton"
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

    // ==================================================
    // TIDAK ADA SESSION
    // ==================================================

    if (!loginMode) {

        goToLogin();

        return;

    }


    // ==================================================
    // GUEST
    // ==================================================

    if (
        loginMode === "guest"
    ) {

        showGuestDashboard();

        return;

    }


    // ==================================================
    // STUDENT
    // ==================================================

    if (
        loginMode === "student"
    ) {

        await validateStudentSession();

        return;

    }


    // ==================================================
    // MODE TIDAK DIKENAL
    // ==================================================

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


        // ==================================================
        // NAMA SISWA
        //
        // class_name sengaja TIDAK ditampilkan.
        // ==================================================

        headerName.textContent =
            student.full_name ||
            "Siswa";


        studentName.textContent =
            student.full_name ||
            "Siswa";


        // ==================================================
        // TAMPILKAN LAPORAN
        // ==================================================

        studentReportSection.classList.remove(
            "hidden"
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );


        sessionStorage.clear();

        goToLogin();

    }

}


// ======================================================
// GUEST DASHBOARD
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


    /*
     * Guest tidak memiliki data progress
     * sehingga tombol laporan tidak ditampilkan.
     */

    studentReportSection.classList.add(
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
// LAPORAN BELAJAR
// ======================================================

if (reportButton) {

    reportButton.addEventListener(
        "click",
        () => {

            /*
             * Guard tambahan.
             * Hanya siswa dengan session aktif
             * yang boleh masuk halaman laporan.
             */

            const currentMode =
                sessionStorage.getItem(
                    "login_mode"
                );


            const currentToken =
                sessionStorage.getItem(
                    "student_session_token"
                );


            if (
                currentMode !== "student" ||
                !currentToken
            ) {

                return;

            }


            window.location.href =
                "./report.html";

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

logoutButton.addEventListener(
    "click",
    logout
);


// ======================================================
// LOGOUT FUNCTION
// ======================================================

async function logout() {

    const currentMode =
        sessionStorage.getItem(
            "login_mode"
        );


    const currentToken =
        sessionStorage.getItem(
            "student_session_token"
        );


    // ==================================================
    // STUDENT
    // ==================================================

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


        } catch (error) {

            /*
             * Walaupun server logout gagal,
             * browser tetap harus dibersihkan.
             */

            console.error(
                "Logout error:",
                error
            );

        }

    }


    // ==================================================
    // HAPUS SESSION BROWSER
    // ==================================================

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
