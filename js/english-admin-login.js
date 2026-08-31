document.addEventListener(
    "DOMContentLoaded",
    initializeEnglishAdminLogin
);

const form =
    document.getElementById(
        "englishAdminLoginForm"
    );

const usernameInput =
    document.getElementById(
        "englishAdminUsername"
    );

const passwordInput =
    document.getElementById(
        "englishAdminPassword"
    );

const messageBox =
    document.getElementById(
        "englishAdminLoginMessage"
    );

const loginButton =
    document.getElementById(
        "englishAdminLoginButton"
    );

const DEMO_URL =
    "./english-conversation.html" +
    "?subject=english" +
    "&topic=english_conversation" +
    "&stage=1" +
    "&level=1" +
    "&demo=admin";


async function initializeEnglishAdminLogin() {

    if (
        !form ||
        !usernameInput ||
        !passwordInput ||
        !messageBox ||
        !loginButton
    ) {

        console.error(
            "Elemen login demo Bahasa Inggris tidak lengkap."
        );

        return;

    }


    // Jika admin sudah mempunyai session valid,
    // langsung masuk latihan, bukan dashboard admin.
    const existingToken =
        sessionStorage.getItem(
            "admin_session_token"
        );


    if (
        existingToken
    ) {

        setLoading(
            true
        );


        const valid =
            await validateAdminSession(
                existingToken
            );


        if (
            valid
        ) {

            window.location.href =
                DEMO_URL;

            return;

        }


        clearAdminOnlySession();


        setLoading(
            false
        );

    }


    form.addEventListener(
        "submit",
        handleLogin
    );


    usernameInput.focus();

}


async function validateAdminSession(
    token
) {

    try {

        if (
            !window.db
        ) {

            return false;

        }


        const {
            data,
            error
        } =
            await window.db.rpc(
                "validate_english_admin_session",
                {
                    p_token:
                        token
                }
            );


        if (
            error
        ) {

            console.error(
                "Demo admin session validation:",
                error
            );

            return false;

        }


        return data === true;


    } catch (error) {

        console.error(
            "Demo admin session check:",
            error
        );


        return false;

    }

}


async function handleLogin(
    event
) {

    event.preventDefault();


    clearMessage();


    const username =
        usernameInput.value
            .trim()
            .toLowerCase();


    const password =
        passwordInput.value;


    if (
        username === ""
    ) {

        showMessage(
            "Username admin harus diisi."
        );

        usernameInput.focus();

        return;

    }


    if (
        password === ""
    ) {

        showMessage(
            "Password harus diisi."
        );

        passwordInput.focus();

        return;

    }


    setLoading(
        true
    );


    try {

        if (
            !window.db
        ) {

            throw new Error(
                "Supabase client tidak tersedia."
            );

        }


        const {
            data,
            error
        } =
            await window.db.rpc(
                "admin_login",
                {
                    p_username:
                        username,

                    p_password:
                        password
                }
            );


        if (
            error
        ) {

            throw error;

        }


        const result =
            normalizeRpcSingleResult(
                data
            );


        if (
            !result ||
            result.success !== true
        ) {

            const code =
                result?.error_code ||
                "INVALID_CREDENTIALS";


            if (
                code ===
                "ACCOUNT_LOCKED"
            ) {

                showMessage(
                    "Akun admin sedang terkunci sementara."
                );

            } else {

                showMessage(
                    "Username atau password admin salah."
                );

            }


            return;

        }


        if (
            !result.session_token
        ) {

            throw new Error(
                "Server tidak mengembalikan session token."
            );

        }


        /*
         * Bersihkan session siswa/guest sebelumnya,
         * lalu simpan hanya session admin.
         */
        sessionStorage.clear();


        sessionStorage.setItem(
            "admin_session_token",
            result.session_token
        );


        sessionStorage.setItem(
            "admin_display_name",
            result.display_name ||
            "Administrator"
        );


        passwordInput.value =
            "";


        // Tujuan khusus: latihan Bahasa Inggris.
        // Tidak pernah menuju admin.html.
        window.location.href =
            DEMO_URL;


    } catch (error) {

        console.error(
            "English admin demo login:",
            error
        );


        showMessage(
            getFriendlyError(
                error
            )
        );


    } finally {

        setLoading(
            false
        );

    }

}


function normalizeRpcSingleResult(
    data
) {

    if (
        Array.isArray(
            data
        )
    ) {

        return data[0] || null;

    }


    if (
        data &&
        typeof data === "object"
    ) {

        return data;

    }


    return null;

}


function setLoading(
    loading
) {

    usernameInput.disabled =
        loading;

    passwordInput.disabled =
        loading;

    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "Memeriksa..."
            : "Masuk ke Conversation";

}


function clearAdminOnlySession() {

    sessionStorage.removeItem(
        "admin_session_token"
    );

    sessionStorage.removeItem(
        "admin_display_name"
    );

}


function clearMessage() {

    messageBox.textContent =
        "";

}


function showMessage(
    text
) {

    messageBox.textContent =
        text;

}


function getFriendlyError(
    error
) {

    const text =
        String(
            error?.message ||
            ""
        ).toLowerCase();


    if (
        text.includes(
            "failed to fetch"
        ) ||
        text.includes(
            "network"
        )
    ) {

        return "Tidak dapat terhubung ke server.";

    }


    return "Login belum dapat diproses. Coba lagi.";

}
