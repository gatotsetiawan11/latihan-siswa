const loginMode =
    sessionStorage.getItem(
        "login_mode"
    );

const sessionToken =
    sessionStorage.getItem(
        "student_session_token"
    );


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


initialize();


async function initialize() {

    if (!loginMode) {

        goLogin();

        return;

    }


    if (loginMode === "guest") {

        showGuest();

        return;

    }


    if (loginMode === "student") {

        await validateStudent();

        return;

    }


    goLogin();

}


async function validateStudent() {

    if (!sessionToken) {

        goLogin();

        return;

    }


    try {

        const { data, error } =
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

            return;

        }


        const student =
            data[0];


        headerName.textContent =
            student.full_name;


        studentName.textContent =
            student.full_name;


        studentClass.textContent =
            student.class_name
                ? `Kelas ${student.class_name}`
                : "";

    }

    catch (error) {

        console.error(error);

        sessionStorage.clear();

        goLogin();

    }

}


function showGuest() {

    headerName.textContent =
        "Guest";


    studentWelcome.classList.add(
        "hidden"
    );


    guestNotice.classList.remove(
        "hidden"
    );

}


mathButton.addEventListener(
    "click",
    () => {

        alert(
            "Selanjutnya kita membuat Matematika."
        );

    }
);


logoutButton.addEventListener(
    "click",
    logout
);


async function logout() {

    if (
        loginMode === "student" &&
        sessionToken
    ) {

        try {

            await window.db.rpc(
                "logout_student",
                {
                    p_token:
                        sessionToken
                }
            );

        }

        catch (error) {

            console.error(error);

        }

    }


    sessionStorage.clear();

    goLogin();

}


function goLogin() {

    window.location.href =
        "./index.html";

}
