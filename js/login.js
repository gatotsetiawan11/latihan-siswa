const nisnInput =
    document.getElementById("nisn");

const loginButton =
    document.getElementById("loginButton");

const guestButton =
    document.getElementById("guestButton");

const message =
    document.getElementById("loginMessage");


nisnInput.addEventListener(
    "input",
    () => {

        nisnInput.value =
            nisnInput.value.replace(
                /\D/g,
                ""
            );

    }
);


nisnInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            loginStudent();
        }

    }
);


loginButton.addEventListener(
    "click",
    loginStudent
);


async function loginStudent() {

    const nisn =
        nisnInput.value.trim();


    clearMessage();


    if (!/^\d{10}$/.test(nisn)) {

        showError(
            "NISN harus terdiri dari 10 digit."
        );

        return;

    }


    setLoading(true);


    try {

        const { data, error } =
            await window.db.rpc(
                "login_student",
                {
                    p_nisn: nisn
                }
            );


        if (error) {

            console.error(error);

            showError(
                "Terjadi kesalahan saat login."
            );

            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            showError(
                "NISN tidak terdaftar atau tidak aktif."
            );

            return;

        }


        const student = data[0];


        sessionStorage.clear();


        sessionStorage.setItem(
            "login_mode",
            "student"
        );


        sessionStorage.setItem(
            "student_session_token",
            student.session_token
        );


        window.location.href =
            "./dashboard.html";

    }

    catch (error) {

        console.error(error);

        showError(
            "Tidak dapat terhubung ke server."
        );

    }

    finally {

        setLoading(false);

    }

}


guestButton.addEventListener(
    "click",
    () => {

        sessionStorage.clear();

        sessionStorage.setItem(
            "login_mode",
            "guest"
        );

        window.location.href =
            "./dashboard.html";

    }
);


function showError(text) {

    message.textContent = text;

    message.className =
        "message message-error";

}


function clearMessage() {

    message.textContent = "";

    message.className =
        "message";

}


function setLoading(value) {

    loginButton.disabled = value;

    nisnInput.disabled = value;


    loginButton.textContent =
        value
            ? "Memeriksa..."
            : "Masuk";

}
