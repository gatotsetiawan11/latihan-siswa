// ======================================================
// LATIHAN SISWA
// QUESTION COLOR CUE V1
//
// Memberi 2 warna bergantian berdasarkan nomor soal.
//
// Soal ganjil:
// question-tone-a
//
// Soal genap:
// question-tone-b
//
// Tidak mengubah logic Practice Engine.
// ======================================================


(() => {

    const practiceStage =
        document.querySelector(
            ".practice-stage"
        );


    const questionProgress =
        document.getElementById(
            "questionProgress"
        );


    if (
        !practiceStage ||
        !questionProgress
    ) {

        console.warn(
            "Question color cue: elemen latihan tidak ditemukan."
        );

        return;

    }


    let lastQuestionNumber =
        null;


    // ==================================================
    // GET QUESTION NUMBER
    // ==================================================

    function getQuestionNumber() {

        const text =
            questionProgress.textContent
                .trim();


        /*
         * Contoh:
         *
         * Soal 1 / 10
         */

        const match =
            text.match(
                /(\d+)\s*\/\s*(\d+)/
            );


        if (!match) {

            return null;

        }


        return Number(
            match[1]
        );

    }


    // ==================================================
    // APPLY COLOR
    // ==================================================

    function applyQuestionColor() {

        const questionNumber =
            getQuestionNumber();


        if (
            !Number.isFinite(
                questionNumber
            )
        ) {

            return;

        }


        /*
         * Jangan animasikan ulang kalau sebenarnya
         * nomor soal belum berubah.
         */

        if (
            questionNumber ===
            lastQuestionNumber
        ) {

            return;

        }


        lastQuestionNumber =
            questionNumber;


        practiceStage.classList.remove(
            "question-tone-a",
            "question-tone-b",
            "question-changing"
        );


        /*
         * Ganjil = A
         * Genap  = B
         */

        if (
            questionNumber % 2 === 1
        ) {

            practiceStage.classList.add(
                "question-tone-a"
            );

        } else {

            practiceStage.classList.add(
                "question-tone-b"
            );

        }


        /*
         * Restart animasi kecil.
         */

        void practiceStage.offsetWidth;


        practiceStage.classList.add(
            "question-changing"
        );


        window.setTimeout(
            () => {

                practiceStage.classList.remove(
                    "question-changing"
                );

            },
            300
        );

    }


    // ==================================================
    // WATCH QUESTION CHANGE
    // ==================================================

    const observer =
        new MutationObserver(
            applyQuestionColor
        );


    observer.observe(
        questionProgress,
        {
            childList: true,
            characterData: true,
            subtree: true
        }
    );


    // Warna soal pertama
    applyQuestionColor();

})();
