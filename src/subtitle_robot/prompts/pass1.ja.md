Japanese rules:
- For EVERY name and place, give "reading" in kana and "reading_confidence"
  (high | medium | low). Judge readings from context: kana vocatives in dialogue,
  furigana, credits. Use low when you are not sure. Give a "reading" for each
  variant as well.
- "origin": "japanese" for Japanese names and places (the Hangul spelling will be
  generated from the reading by code), "foreign" for non-Japanese names written in
  katakana (アンジェロ, ブルノ, ネロ).
- "ko_suggestion": for japanese origin, Hangul by Japanese pronunciation
  (田中 -> 타나카), NEVER the Korean hanja reading (전중). For foreign origin, the
  established Korean spelling of the original name (アンジェロ -> 안젤로,
  ブルノ -> 브루노).
- For invented terms, suggest "policy".
