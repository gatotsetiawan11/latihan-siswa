# English Conversation AI — Konfigurasi Materi

Modul `english-conversation.html` sekarang membaca identitas dan aturan dasar latihan langsung dari record `levels`. Tujuannya agar satu halaman conversation dapat dipakai untuk banyak materi, bukan hanya `Introduction`.

## Field level yang sudah dipakai frontend

- `name`: judul materi yang tampil di layar.
- `question_count`: fallback jumlah giliran percakapan.
- `passing_score`: target nilai kelulusan.
- `config`: JSON untuk konfigurasi khusus English Conversation.

## Konfigurasi `config` yang dikenali frontend

Contoh:

```json
{
  "exercise_type": "ai_conversation",
  "description": "Practice introducing yourself using short English sentences.",
  "assistant_name": "Alex",
  "max_turns": 6,
  "learning_goal": "Student can say their name, age, school, and one hobby.",
  "difficulty": "beginner",
  "speech_language": "en-US",
  "speech_rate": 0.9,
  "speech_pitch": 1.08,
  "fallback_greeting": "Hello! What is your name?"
}
```

`max_turns` dapat diganti dengan `turn_count`. Jika keduanya tidak ada, frontend menggunakan `question_count`. Nilai giliran dibatasi 1–20 untuk mencegah konfigurasi yang tidak wajar.

## Field yang sebaiknya dipakai Edge Function AI

Edge Function `english-conversation` sebaiknya membaca `levels.config` sendiri berdasarkan `level_id` dan menjadikan database sebagai source of truth. Jangan mempercayai prompt/instruksi materi yang dikirim dari browser. Field yang disarankan untuk engine materi:

```json
{
  "exercise_type": "ai_conversation",
  "description": "Teks singkat untuk siswa.",
  "assistant_name": "Alex",
  "max_turns": 6,
  "learning_goal": "Kompetensi yang harus dicapai siswa.",
  "scenario": "Situasi percakapan, misalnya meeting a new friend.",
  "assistant_role": "Peran karakter AI.",
  "opening_instruction": "Tujuan untuk pembukaan percakapan.",
  "required_targets": ["name", "age", "hobby"],
  "vocabulary": ["name", "years old", "school", "hobby"],
  "grammar_focus": ["I am ...", "My name is ...", "I like ..."],
  "difficulty": "beginner",
  "feedback_language": "id",
  "speech_language": "en-US",
  "speech_rate": 0.9,
  "speech_pitch": 1.08
}
```

## Kontrak respons AI saat ini

Frontend mengharapkan response JSON dari action `start` / `reply` dengan bentuk utama:

```json
{
  "ok": true,
  "assistant_text": "...",
  "relevant": true,
  "feedback": "...",
  "correction": "...",
  "should_end": false,
  "session_feedback": "..."
}
```

Untuk action `tts`, frontend mengharapkan `ok`, `audio_base64`, dan `mime_type`. Jika TTS backend gagal, browser akan memakai `speechSynthesis` sebagai fallback.

## Rekomendasi aturan pedagogi backend

1. Satu giliran = satu pertanyaan pendek.
2. Bahasa AI sederhana sesuai `difficulty`.
3. Jangan langsung memberikan jawaban yang harus diucapkan siswa; beri petunjuk bila siswa kesulitan.
4. `relevant` menilai apakah respons menjawab pertanyaan, bukan sekadar grammar sempurna.
5. `correction` berisi versi kalimat yang lebih baik dan tetap pendek.
6. `should_end` hanya `true` jika target giliran/kompetensi sudah tercapai atau batas percakapan selesai.
7. Prompt materi, target kompetensi, dan aturan evaluasi harus berasal dari database berdasarkan `level_id`.

## Blueprint materi awal

Struktur berikut cocok untuk tahap beginner dan bisa dimasukkan sebagai level terpisah:

| Level | Materi | Target utama |
| --- | --- | --- |
| 1 | Introduction | name, age, school, hobby |
| 2 | Greetings & Feelings | greeting, mood, simple reason |
| 3 | My Family | family members, simple descriptions |
| 4 | Likes & Dislikes | like/don't like + nouns/activities |
| 5 | Daily Activities | simple present for routines |
| 6 | At School | classroom objects and simple requests |

Setiap level dapat memakai halaman yang sama; yang berubah adalah data `levels` dan `config`, sedangkan Edge Function membentuk percakapan dari konfigurasi tersebut.
