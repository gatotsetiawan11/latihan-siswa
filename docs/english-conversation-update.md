# English Conversation AI — Update

Perubahan implementasi pada versi ini:

- Memperbaiki alur hands-free setelah greeting. `beginAutoListening()` sekarang dijalankan setelah status `busy` dilepas.
- Menghapus hard-code judul `Introduction` dari halaman conversation; judul mengambil `levels.name`.
- Jumlah giliran mengambil `config.max_turns`, `config.turn_count`, lalu fallback ke `question_count`.
- Passing score mengambil `levels.passing_score`.
- Nama karakter dan parameter speech fallback dapat diatur lewat `levels.config`.
- Kartu level English menampilkan jumlah `giliran` dan `Percakapan AI`, bukan `detik` dan `soal`.
- Guest yang memilih English Conversation diarahkan ke login karena Edge Function membutuhkan sesi siswa/admin.
- Menambahkan panduan konfigurasi materi di `docs/english-conversation-config.md`.

Catatan: source code Supabase Edge Function `english-conversation` belum terdapat di repository ini. Agar materi benar-benar dinamis sampai ke prompt AI, Edge Function harus membaca `levels.config` berdasarkan `level_id` sebagai source of truth.
