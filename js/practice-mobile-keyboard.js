// ============================================================
// LATIHAN SISWA
// MOBILE KEYBOARD HELPER V2 - STABLE
//
// Tujuan:
// - mencegah viewport HP naik-turun saat input berpindah
// - Tingkat 10-15 tidak memakai auto-scroll keyboard
// - Tingkat 1-9 tetap dibantu bila input tertutup keyboard
//
// Penting:
// input bersusun sudah memakai focus({preventScroll:true})
// sehingga tidak perlu helper scroll tambahan.
// ============================================================

let isAdjustingInput =
    false;
const MOBILE_MAX_WIDTH =
    700;


let keyboardScrollTimer =
    null;


const practiceParams =
    new URLSearchParams(
        window.location.search
    );


const practiceStage =
    Number(
        practiceParams.get(
            "stage"
        )
    );


const columnPracticeMode =

    Number.isInteger(
        practiceStage
    )

    &&

    practiceStage >= 10

    &&

    practiceStage <= 15;


// ============================================================
// CLASS STABIL UNTUK COLUMN MODE
// ============================================================

if (columnPracticeMode) {

    document.documentElement
        .classList
        .add(
            "column-mobile-stable"
        );
}


// ============================================================
// CSS STABILISASI
// ============================================================

const keyboardStyle =
    document.createElement(
        "style"
    );


keyboardStyle.textContent = `

    @media (max-width: 700px) {

        html.column-mobile-stable,
        html.column-mobile-stable body {

            scroll-behavior:
                auto
                !important;
        }


        html.column-mobile-stable
        #columnQuestionArea {

            scroll-margin-top:
                8px;
        }


        html.column-mobile-stable
        .column-practice {

            scroll-margin-top:
                8px;
        }


        html.column-mobile-stable
        .lm22-input,

        html.column-mobile-stable
        .column-step-input {

            scroll-margin-top:
                90px;

            scroll-margin-bottom:
                80px;
        }

    }

`;


document.head.appendChild(
    keyboardStyle
);


// ============================================================
// START
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMobileKeyboardHelper,
        {
            once: true
        }
    );


} else {

    initializeMobileKeyboardHelper();
}


// ============================================================
// INITIALIZE
// ============================================================

function initializeMobileKeyboardHelper() {

    // ========================================================
    // TINGKAT 10-15
    //
    // Jangan lakukan auto-scroll sama sekali.
    // Engine bersusun sudah mengatur fokus sendiri dengan
    // preventScroll:true.
    // ========================================================

    if (columnPracticeMode) {

        return;
    }


    // ========================================================
    // TINGKAT 1-9
    // ========================================================

    const answerInput =
        document.getElementById(
            "answerInput"
        );


    if (!answerInput) {

        return;
    }


    answerInput.addEventListener(
        "focus",
        handleDirectInputFocus
    );


    // Hanya resize.
    //
    // Jangan dengarkan visualViewport "scroll",
    // karena event tersebut bisa terpicu oleh scroll yang
    // kita lakukan sendiri dan menghasilkan loop gerakan.
/*
if (
    window.visualViewport
) {

    window.visualViewport
        .addEventListener(
            "resize",
            handleViewportResize
        );
}
*/

// ============================================================
// FOCUS DIRECT INPUT
// ============================================================

function handleDirectInputFocus(
    event
) {

    scheduleInputVisibility(
        event.currentTarget
    );
}


// ============================================================
// VIEWPORT RESIZE
// ============================================================

function handleViewportResize() {

    if (columnPracticeMode) {

        return;
    }


    const activeElement =
        document.activeElement;


    if (
        !activeElement

        ||

        activeElement.id !==
        "answerInput"
    ) {

        return;
    }


    scheduleInputVisibility(
        activeElement
    );
}


// ============================================================
// SCHEDULE
// ============================================================

function scheduleInputVisibility(
    input
) {

    if (
        !input

        ||

        window.innerWidth >
        MOBILE_MAX_WIDTH
    ) {

        return;
    }


    window.clearTimeout(
        keyboardScrollTimer
    );


    keyboardScrollTimer =
        window.setTimeout(
            () => {

                ensureInputVisible(
                    input
                );

            },
            250
        );
}


// ============================================================
// ENSURE INPUT VISIBLE
// ============================================================

function ensureInputVisible(
    input
) {

    if (
        !input

        ||

        columnPracticeMode

        ||

        window.innerWidth >
        MOBILE_MAX_WIDTH
    ) {

        return;
    }


    const rect =
        input.getBoundingClientRect();


    const viewportHeight =
        getVisibleViewportHeight();


    // ========================================================
    // BATAS BAWAH
    // ========================================================

    const bottomSafeArea =
        60;


    const maximumBottom =
        viewportHeight
        -
        bottomSafeArea;


    if (
        rect.bottom >
        maximumBottom
    ) {

        const amount =
            rect.bottom
            -
            maximumBottom
            +
            15;


        // Penting:
        // jangan pakai smooth.
        // Smooth + keyboard resize dapat menyebabkan
        // viewport bergerak bolak-balik.

        window.scrollBy({

            top:
                amount,

            left:
                0,

            behavior:
                "auto"

        });


        return;
    }


    // ========================================================
    // BATAS ATAS
    // ========================================================

    const topSafeArea =
        95;


    if (
        rect.top <
        topSafeArea
    ) {

        window.scrollBy({

            top:
                rect.top
                -
                topSafeArea,

            left:
                0,

            behavior:
                "auto"

        });
    }
}


// ============================================================
// VISIBLE VIEWPORT
// ============================================================

function getVisibleViewportHeight() {

    if (
        window.visualViewport

        &&

        Number.isFinite(
            window.visualViewport.height
        )
    ) {

        return window
            .visualViewport
            .height;
    }


    return window.innerHeight;
}


// ============================================================
// CLEANUP
// ============================================================

window.addEventListener(
    "pagehide",
    () => {

        window.clearTimeout(
            keyboardScrollTimer
        );


        if (
            window.visualViewport
        ) {

            window.visualViewport
                .removeEventListener(
                    "resize",
                    handleViewportResize
                );
        }

    }
);
