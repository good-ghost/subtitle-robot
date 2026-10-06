import pytest

from subtitle_robot.io.langdetect import (
    LATIN_FUNCTION_WORDS,
    LanguageDetectionError,
    block_language,
    detect_language,
    resolve_source_language,
    script_counts,
)

JA = ["本当によく降るわね", "洗濯物が乾かないんだよ", "全然", "Day 1"]
EN = ["I don't know where it came from,", "but Starbuck was all freaked out.", "[barking]"]


def test_detects_japanese_and_english() -> None:
    assert detect_language(JA).lang == "ja"
    assert detect_language(EN).lang == "en"


def test_undecidable_and_empty() -> None:
    assert detect_language(["", "♪"]).lang is None
    assert detect_language(["123", "♪ ♪"]).lang is None


def test_resolve_forced_and_auto() -> None:
    assert resolve_source_language(EN, "ja") == "ja"  # 강제 지정이 감지보다 우선
    assert resolve_source_language(EN, "auto") == "en"
    with pytest.raises(LanguageDetectionError, match="--src"):
        resolve_source_language(["♪", "123"], "auto")


# 언어마다 직접 쓴 짧은 대사 (WI-8.004 수락 기준). 자막 한 편보다 훨씬 짧아도 맞혀야 한다
SAMPLES: dict[str, list[str]] = {
    "ko": ["오늘은 비가 오네요", "빨래가 안 말라요", "우산 가져왔어?", "아니, 깜빡했어"],
    "ja": ["本当によく降るわね", "洗濯物が乾かないんだよ", "傘持ってきた？", "ううん、忘れた"],
    "zh": ["今天又下雨了", "衣服都晒不干", "你带伞了吗？", "没有，我忘了"],
    "ru": ["Сегодня опять дождь.", "Бельё совсем не сохнет.", "Ты взял зонт?", "Нет, забыл."],
    "uk": [
        "Сьогодні знову дощ.",
        "Білизна зовсім не сохне.",
        "Ти взяв парасольку?",
        "Ні, забув її.",
    ],
    "el": ["Σήμερα βρέχει πάλι.", "Τα ρούχα δεν στεγνώνουν.", "Πήρες ομπρέλα;", "Όχι, την ξέχασα."],
    "ar": ["إنها تمطر مرة أخرى اليوم.", "الغسيل لا يجف أبدا.", "هل أحضرت مظلة؟", "لا، نسيت."],
    "he": ["היום שוב יורד גשם.", "הכביסה לא מתייבשת.", "הבאת מטריה?", "לא, שכחתי."],
    "th": ["วันนี้ฝนตกอีกแล้ว", "ผ้าไม่แห้งเลย", "เอาร่มมาไหม", "ไม่ ลืมไปแล้ว"],
    "hi": ["आज फिर बारिश हो रही है।", "कपड़े सूख नहीं रहे।", "क्या तुम छाता लाए?", "नहीं, भूल गया।"],
    "en": [
        "It's raining again today.",
        "The laundry won't dry at all.",
        "Did you bring your umbrella?",
        "No, I forgot it. What about you?",
        "I have one in the car, don't worry.",
        "That is good. Are you coming with me?",
    ],
    "fr": [
        "Il pleut encore aujourd'hui.",
        "Le linge ne sèche pas du tout.",
        "Tu as pris ton parapluie ?",
        "Non, je l'ai oublié. Et vous ?",
        "C'est pas grave, j'en ai une dans la voiture.",
        "Oui, mais je viens avec toi.",
    ],
    "de": [
        "Es regnet heute schon wieder.",
        "Die Wäsche wird einfach nicht trocken.",
        "Hast du deinen Schirm dabei?",
        "Nein, ich habe ihn vergessen.",
        "Das ist nicht schlimm, wir haben einen im Auto.",
        "Aber ich komme auch mit.",
    ],
    "es": [
        "Hoy está lloviendo otra vez.",
        "La ropa no se seca nada.",
        "¿Trajiste el paraguas?",
        "No, yo lo olvidé. ¿Y ella?",
        "Tengo uno aquí en el coche, pero es muy pequeño.",
        "Sí, eso está bien.",
    ],
    "it": [
        "Oggi piove di nuovo.",
        "Il bucato non si asciuga.",
        "Hai preso l'ombrello?",
        "No, l'ho dimenticato. E lei?",
        "Questo è un problema, perché sono senza.",
        "Anche io ho dimenticato il mio, che cosa facciamo?",
    ],
    "pt": [
        "Hoje está chovendo de novo.",
        "A roupa não seca de jeito nenhum.",
        "Você trouxe o guarda-chuva?",
        "Não, eu esqueci. E ela?",
        "Tenho uma aqui no carro, isso vai ajudar.",
        "Sim, muito bem, ele vai gostar.",
    ],
    "nl": [
        "Het regent vandaag weer.",
        "De was wil niet drogen.",
        "Heb jij je paraplu bij je?",
        "Nee, ik ben hem vergeten.",
        "Dat is niet erg, maar wat doen we nu?",
        "Hij heeft er wel een in de auto.",
    ],
    "sv": [
        "Det regnar igen i dag.",
        "Tvätten torkar inte alls.",
        "Har du tagit med paraplyet?",
        "Nej, jag glömde det. Vad gör vi?",
        "Hon har också ett i bilen.",
        "Varför är det alltid så här? Inget fungerar.",
    ],
    "da": [
        "Det regner igen i dag.",
        "Vasketøjet bliver ikke tørt.",
        "Har du taget en paraply med?",
        "Nej, jeg glemte den. Hvad med dig?",
        "Mig? Jeg har noget i bilen.",
        "Efter regnen blev det koldt, og nogen frøs.",
    ],
    "pl": [
        "Dzisiaj znowu pada.",
        "Pranie w ogóle nie schnie.",
        "Czy wziąłeś parasol?",
        "Nie, zapomniałem. A co z tobą?",
        "Tak, ale tylko jeden. Już mnie to męczy.",
        "Jak to się stało? To jest dziwne.",
    ],
    "tr": [
        "Bugün yine yağmur yağıyor.",
        "Çamaşırlar hiç kurumuyor.",
        "Şemsiyeni getirdin mi?",
        "Hayır, unuttum. Ya sen?",
        "Evet, ben bir tane getirdim ama küçük.",
        "Bu çok iyi, bir şey değil.",
    ],
    "id": [
        "Hari ini hujan lagi.",
        "Cucian tidak kering juga.",
        "Kamu bawa payung?",
        "Tidak, aku lupa. Apa kamu ada?",
        "Saya ada satu di mobil, untuk kita.",
        "Itu bagus, ini akan membantu dengan hujan yang deras.",
    ],
    "vi": [
        "Hôm nay lại mưa rồi.",
        "Quần áo không khô được.",
        "Anh có mang ô không?",
        "Không, tôi quên rồi. Còn em?",
        "Tôi có một cái trong xe này.",
        "Được, người đi trước đó là gì?",
    ],
}


@pytest.mark.parametrize("lang", sorted(SAMPLES))
def test_detects_languages_from_samples(lang: str) -> None:
    assert detect_language(SAMPLES[lang]).lang == lang


def test_latin_without_clear_winner_is_english() -> None:
    """라틴 문자인데 기능어로 정할 수 없으면 0.6.0 전처럼 영어로 본다."""
    assert detect_language(["Okay.", "Bravo!", "Taxi, hotel, pizza."]).lang == "en"


def test_function_word_lists_do_not_overlap() -> None:
    seen: dict[str, str] = {}
    for lang, words in LATIN_FUNCTION_WORDS.items():
        for word in words:
            assert word not in seen, f"{word}: {seen.get(word)} 와 {lang}"
            seen[word] = lang


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        # M0 일본어 샘플 앞부분의 중국어 제작진 메모
        ("{\\fs50\\an5}Day 1\n殺人之夜", "zh"),
        ("Bathtub gin:美國禁酒時期,非法入口的酒無法滿足市場需求", "zh"),
        ("本字幕由✿花語&千夏字幕組✿共同製作", "zh"),
        # 짧은 한자 대사는 일본어로 둔다
        ("全然", "unknown"),
        ("大丈夫?", "unknown"),
        ("本当によく降るわね", "ja"),
        ("- ケーキ美味しいのに\n- しょうがないだろ（笑）", "ja"),
        ("빨래가 안 말라요", "ko"),
        ("I love you.", "en"),
        ("3.5", "unknown"),
        ("<i>♪</i>", "unknown"),
    ],
)
def test_block_language(text: str, expected: str) -> None:
    assert block_language(text) == expected


def test_script_counts_ignore_tags() -> None:
    counts = script_counts("<i>Hi</i>{\\an8}あ漢한")

    assert (counts.latin, counts.kana, counts.kanji, counts.hangul) == (2, 1, 1, 1)
