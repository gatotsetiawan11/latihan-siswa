// ======================================================
// LATIHAN SISWA
// PRACTICE NAVIGATION FIX V1
//
// Memperbaiki:
// - Ulangi Latihan
// - Keluar dari Latihan
// - Lanjut
//
// Penyebab:
// practice.js menyimpan state lagi pada beforeunload.
// File ini memastikan state benar-benar dibuang setelah
// navigasi/reload yang disengaja.
// ======================================================


(() => {

    let discardPracticeStateOnUnload =
        false;


    // ==================================================
    // FINAL CLEANUP
    // ==================================================

    window.addEventListener(
        "pagehide",
        () => {

            if (
                discardPracticeStateOnUnload
                !== true
            ) {
                return;
            }


            try {

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Final practice cleanup error:",
                    error
                );

            }

        }
    );


    // ==================================================
    // REPLACE BUTTON
    //
    // Clone digunakan supaya event listener lama dari
    // practice.js tidak ikut berjalan.
    // ==================================================

    function replaceButton(
        buttonId,
        clickHandler
    ) {

        const oldButton =
            document.getElementById(
                buttonId
            );


        if (!oldButton) {

            console.warn(
                `Button ${buttonId} tidak ditemukan.`
            );

            return;

        }


        const newButton =
            oldButton.cloneNode(
                true
            );


        oldButton.replaceWith(
            newButton
        );


        newButton.addEventListener(
            "click",
            clickHandler
        );

    }


    // ==================================================
    // RETRY
    // ==================================================

    replaceButton(
        "retryButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Retry cleanup error:",
                    error
                );

            }


            window.location.reload();

        }
    );


    // ==================================================
    // CONTINUE
    // ==================================================

    replaceButton(
        "continueButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Continue cleanup error:",
                    error
                );

            }


            goBackToLevels();

        }
    );


    // ==================================================
    // QUIT
    // ==================================================

    replaceButton(
        "quitButton",
        () => {

            discardPracticeStateOnUnload =
                true;


            try {

                clearTimer();

                clearTimeout(
                    delayedSubmit
                );

                clearSavedPracticeState();

            } catch (error) {

                console.error(
                    "Quit cleanup error:",
                    error
                );

            }


            goBackToLevels();

        }
    );

})();
