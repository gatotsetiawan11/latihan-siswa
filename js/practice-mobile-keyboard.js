// ======================================================
// LATIHAN SISWA
// MOBILE KEYBOARD HELPER V1
//
// Tujuan:
// - Menjaga soal dan kolom jawaban tetap terlihat
//   ketika keyboard HP terbuka.
// - Tidak mengganggu desktop.
// - Tidak memaksa scroll saat siswa belum mengetik.
// ======================================================


document.addEventListener(
    "DOMContentLoaded",
    initializeMobileKeyboardHelper
);


// ======================================================
// CONFIG
// ======================================================

const MOBILE_MAX_WIDTH =
    700;


// ======================================================
// STATE
// ======================================================

let keyboardScrollTimer =
    null;


// ======================================================
// INITIALIZE
// ======================================================

function initializeMobileKeyboardHelper() {

    const inputs = [

        document.getElementById(
            "answerInput"
        ),

        document.getElementById(
            "columnStep1Input"
        ),

        document.getElementById(
            "columnStep2Input"
        ),

        document.getElementById(
            "columnFinalInput"
        )

    ].filter(Boolean);


    if (
        inputs.length === 0
    ) {

        return;

    }


    inputs.forEach(
        input => {

            input.addEventListener(
                "focus",
                () => {

                    scheduleInputVisibility(
                        input
                    );

                }
            );


            input.addEventListener(
                "input",
                () => {

                    /*
                     * Tidak perlu scroll pada setiap digit.
                     * Hanya cek apabila input hampir tertutup.
                     */

                    ensureInputVisible(
                        input
                    );

                }
            );

        }
    );


    // ==================================================
    // VISUAL VIEWPORT
    //
    // Di browser mobile, ukuran visualViewport mengecil
    // ketika keyboard tampil.
    // ==================================================

    if (
        window.visualViewport
    ) {

        window.visualViewport.addEventListener(
            "resize",
            handleViewportChange
        );


        window.visualViewport.addEventListener(
            "scroll",
            handleViewportChange
        );

    }

}


// ======================================================
// VIEWPORT CHANGE
// ======================================================

function handleViewportChange() {

    const activeElement =
        document.activeElement;


    if (
        !isPracticeInput(
            activeElement
        )
    ) {

        return;

    }


    scheduleInputVisibility(
        activeElement
    );

}


// ======================================================
// SCHEDULE
// ======================================================

function scheduleInputVisibility(
    input
) {

    if (
        window.innerWidth >
        MOBILE_MAX_WIDTH
    ) {

        return;

    }


    window.clearTimeout(
        keyboardScrollTimer
    );


    /*
     * Keyboard biasanya membutuhkan beberapa ratus
     * milidetik untuk selesai membuka.
     */

    keyboardScrollTimer =
        window.setTimeout(
            () => {

                ensureInputVisible(
                    input
                );

            },
            320
        );

}


// ======================================================
// ENSURE INPUT VISIBLE
// ======================================================

function ensureInputVisible(
    input
) {

    if (
        !input ||
        window.innerWidth >
            MOBILE_MAX_WIDTH
    ) {

        return;

    }


    const rect =
        input.getBoundingClientRect();


    const viewportHeight =
        getVisibleViewportHeight();


    /*
     * Sisakan ruang antara input dengan keyboard.
     */

    const bottomSafeArea =
        70;


    const maximumVisibleBottom =
        viewportHeight -
        bottomSafeArea;


    // ==================================================
    // INPUT TERLALU BAWAH
    // ==================================================

    if (
        rect.bottom >
        maximumVisibleBottom
    ) {

        const scrollAmount =
            rect.bottom -
            maximumVisibleBottom;


        window.scrollBy({
            top:
                scrollAmount +
                25,

            behavior:
                "smooth"
        });


        return;

    }


    // ==================================================
    // INPUT TERLALU ATAS
    //
    // Hindari juga input masuk ke bawah browser toolbar.
    // ==================================================

    const topSafeArea =
        120;


    if (
        rect.top <
        topSafeArea
    ) {

        window.scrollBy({
            top:
                rect.top -
                topSafeArea,

            behavior:
                "smooth"
        });

    }

}


// ======================================================
// VISIBLE VIEWPORT HEIGHT
// ======================================================

function getVisibleViewportHeight() {

    if (
        window.visualViewport &&
        Number.isFinite(
            window.visualViewport.height
        )
    ) {

        return window.visualViewport.height;

    }


    return window.innerHeight;

}


// ======================================================
// CHECK PRACTICE INPUT
// ======================================================

function isPracticeInput(
    element
) {

    if (
        !element
    ) {

        return false;

    }


    return (

        element.id ===
            "answerInput"

        ||

        element.id ===
            "columnStep1Input"

        ||

        element.id ===
            "columnStep2Input"

        ||

        element.id ===
            "columnFinalInput"

    );

}


// ======================================================
// CLEANUP
// ======================================================

window.addEventListener(
    "pagehide",
    () => {

        window.clearTimeout(
            keyboardScrollTimer
        );


        if (
            window.visualViewport
        ) {

            window.visualViewport.removeEventListener(
                "resize",
                handleViewportChange
            );


            window.visualViewport.removeEventListener(
                "scroll",
                handleViewportChange
            );

        }

    }
);
