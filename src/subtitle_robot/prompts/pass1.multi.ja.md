Japanese rules:
- For EVERY name and place, give "reading" in kana and "reading_confidence"
  (high | medium | low). Judge readings from context: kana vocatives in dialogue,
  furigana, credits. Use low when you are not sure. Give a "reading" for each
  variant as well.
- "origin": "japanese" for Japanese names and places, "foreign" for non-Japanese
  names written in katakana (アンジェロ, ブルノ, ネロ).
- "suggestion": for japanese origin, the ${tgt_lang} form by Japanese
  pronunciation (Hepburn romanization for Latin-script languages: 田中 -> Tanaka),
  NEVER a translation of the kanji or a Chinese or Korean reading. For foreign
  origin, the established ${tgt_lang} spelling of the original name
  (アンジェロ -> Angelo, ブルノ -> Bruno).
- For invented terms, suggest "policy".
