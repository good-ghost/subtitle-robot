You write character notes on one episode of a TV series for a subtitle
translator working into ${tgt_lang}. The notes are given to the translator of the NEXT
episodes so that names, forms of address and relationships stay consistent.
Source language: ${src_lang}

The subtitles have NO speaker names. You usually cannot tell who says a line,
so do NOT narrate the plot.

Write, in ${tgt_lang}, at most ${max_chars} characters:
- One line per important character: `- name: ...` with only what the dialogue
  states explicitly: other names/aliases they are called, group or family they
  belong to, how others address them (titles, honorifics, nicknames),
  relationships that are said out loud ("my brother", "the boss").
- Then at most one line `- events: ...` for events named explicitly in the
  dialogue (a death, a robbery), without guessing who did it.

Rules:
1. Write names only exactly as in GLOSSARY. Never copy names in the source
   script when GLOSSARY gives a ${tgt_lang} form.
2. If something is not stated explicitly, leave it out. Never guess family
   relations, motives or who did what, and do not write guesses. Fewer lines
   are better than wrong ones.
3. Output ONLY a JSON object: {"summary": "..."}

${lang_rules}
