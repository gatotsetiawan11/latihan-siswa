// ======================================================
// LATIHAN SISWA
// PRACTICE REPORT LINK V1
//
// Fungsi:
// - Menampilkan tombol "Lihat Analisis Belajar"
//   hanya untuk siswa yang login
// - Guest tidak melihat tombol laporan
// - Tombol muncul pada layar hasil latihan
// - Membawa parameter Tingkat dan Level ke report.html
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initializePracticeReportLink
);


// ======================================================
// STATE
// ======================================================

let reportLinkObserver =
    null;


// ======================================================
// INITIALIZE
// ======================================================

function initializePracticeReportLink() {

    // ==================================================
    // GET ELEMENT
    // ==================================================

    const analysisButton =
        document.getElementById(
            "analysisButton"
        );


    const resultScreen =
        document.getElementById(
            "resultScreen"
        );


    // ==================================================
    // ELEMENT TIDAK ADA
    // ==================================================

    if (
        !analysisButton
    ) {

        console.warn(
            "analysisButton tidak ditemukan."
        );

        return;

    }


    // ==================================================
    // DEFAULT HIDDEN
    // ==================================================

    hideAnalysisButton(
        analysisButton
    );


    // ==================================================
    // CEK LOGIN MODE
    // ==================================================

    const loginMode =
        sessionStorage.getItem(
            "login_mode"
        );


    const sessionToken =
        sessionStorage.getItem(
            "student_session_token"
        );


    // ==================================================
    // GUEST / TIDAK LOGIN
    // ==================================================

    if (
        loginMode !== "student" ||
        !sessionToken
    ) {

        hideAnalysisButton(
            analysisButton
        );

        return;

    }


    // ==================================================
    // BUTTON CLICK
    // ==================================================

    analysisButton.addEventListener(
        "click",
        openLearningReport
    );


    // ==================================================
    // RESULT SCREEN TIDAK DITEMUKAN
    //
    // Sebagai fallback, tombol tetap bisa ditampilkan.
    // ==================================================

    if (
        !resultScreen
    ) {

        showAnalysisButton(
            analysisButton
        );

        return;

    }


    // ==================================================
    // CEK KONDISI AWAL
    // ==================================================

    updateAnalysisButtonVisibility(
        analysisButton,
        resultScreen
    );


    // ==================================================
    // OBSERVE RESULT SCREEN
    //
    // practice.js mengubah layar latihan menjadi
    // layar hasil setelah Level selesai.
    // Observer membuat tombol muncul saat itu terjadi.
    // ==================================================

    reportLinkObserver =
        new MutationObserver(
            () => {

                updateAnalysisButtonVisibility(
                    analysisButton,
                    resultScreen
                );

            }
        );


    reportLinkObserver.observe(
        resultScreen,
        {
            attributes:
                true,

            attributeFilter: [
                "class",
                "hidden",
                "style"
            ]
        }
    );

}


// ======================================================
// UPDATE VISIBILITY
// ======================================================

function updateAnalysisButtonVisibility(
    analysisButton,
    resultScreen
) {

    const resultVisible =
        isElementVisible(
            resultScreen
        );


    if (
        resultVisible
    ) {

        showAnalysisButton(
            analysisButton
        );

    } else {

        hideAnalysisButton(
            analysisButton
        );

    }

}


// ======================================================
// CHECK ELEMENT VISIBILITY
// ======================================================

function isElementVisible(
    element
) {

    if (
        !element
    ) {

        return false;

    }


    // ==================================================
    // HIDDEN ATTRIBUTE
    // ==================================================

    if (
        element.hidden === true
    ) {

        return false;

    }


    // ==================================================
    // HIDDEN CLASS
    // ==================================================

    if (
        element.classList.contains(
            "hidden"
        )
    ) {

        return false;

    }


    // ==================================================
    // INLINE DISPLAY
    // ==================================================

    if (
        element.style.display ===
        "none"
    ) {

        return false;

    }


    return true;

}


// ======================================================
// SHOW BUTTON
// ======================================================

function showAnalysisButton(
    button
) {

    if (
        !button
    ) {

        return;

    }


    button.hidden =
        false;


    button.classList.remove(
        "hidden"
    );

}


// ======================================================
// HIDE BUTTON
// ======================================================

function hideAnalysisButton(
    button
) {

    if (
        !button
    ) {

        return;

    }


    button.hidden =
        true;


    button.classList.add(
        "hidden"
    );

}


// ======================================================
// OPEN LEARNING REPORT
// ======================================================

function openLearningReport() {

    // ==================================================
    // SECURITY GUARD
    // ==================================================

    const loginMode =
        sessionStorage.getItem(
            "login_mode"
        );


    const sessionToken =
        sessionStorage.getItem(
            "student_session_token"
        );


    if (
        loginMode !== "student" ||
        !sessionToken
    ) {

        return;

    }


    // ==================================================
    // URL PRACTICE PARAMETERS
    // ==================================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const stage =
        params.get(
            "stage"
        );


    const level =
        params.get(
            "level"
        );


    // ==================================================
    // REPORT URL
    // ==================================================

    const reportParams =
        new URLSearchParams();


    if (
        stage
    ) {

        reportParams.set(
            "stage",
            stage
        );

    }


    if (
        level
    ) {

        reportParams.set(
            "level",
            level
        );

    }


    // ==================================================
    // NAVIGATE
    // ==================================================

    const query =
        reportParams.toString();


    window.location.href =
        query
            ? `report.html?${query}`
            : "report.html";

}


// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "pagehide",
    () => {

        if (
            reportLinkObserver
        ) {

            reportLinkObserver.disconnect();


            reportLinkObserver =
                null;

        }

    }
);
