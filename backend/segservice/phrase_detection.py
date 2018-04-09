import string
import re
from collections import Counter
from gensim.models.phrases import Phraser
from gensim.models import Phrases
from stop_words import get_stop_words

def clean_data(raw_page_text):
    translator = str.maketrans('', '', string.punctuation)
    page_no_punct = raw_page_text.translate(translator)
    # TODO regex to replace consecutive numbers with hashtag, but then it should join it with the next word
    # return re.sub(r'\d+', '#', page_no_punct)
    return page_no_punct

def get_phrases_from_sentence(raw_page_text, sentence, debug=False):
    reduced_page_text = clean_data(raw_page_text)
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]
    words = sentence.lower().split()

    # Remove non-ascii characters so strings can be printed
    sentence = sentence.encode('utf-8').decode()
    sent = sentence.lower().split()
    all_phrases = get_phrases(sentence, sentence_stream, sent)
    if debug:
        print(all_phrases)
    return all_phrases

def get_phrases(sentence, sentence_stream, words):
    stop_words = get_stop_words('english')
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ', common_terms = stop_words)
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ', common_terms = stop_words)
    quadgram = Phrases(trigram[sentence_stream], min_count=1, delimiter=b' ', common_terms = stop_words)
    all_segmentations = []

    bigrams_ = [b for b in bigram[words] if b.count(' ') >= 1]
    trigrams_ = [t for t in trigram[bigram[words]] if t.count(' ') >= 2]
    quadgrams_ = [t for t in quadgram[trigram[words]] if t.count(' ') >= 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)

    # Split on the most common punctuation in the record too
    delimiters = re.findall(r'\W', sentence)
    frequent_delimiters = Counter(delimiters).most_common(2)
    common_delimiter, _ = frequent_delimiters[0]
    # We don't want space if there's something else, but if there's nothing else then split on spaces
    if common_delimiter == ' ' and len(frequent_delimiters) == 2:
        common_delimiter, _ = frequent_delimiters[1]

        split_on_delimit = r"(\s+" + re.escape(common_delimiter) + "\s?)|(\s?" + re.escape(common_delimiter) + "\s+)"

        for new_seg in set(re.split(split_on_delimit, sentence.lower())):
            if new_seg is not None and common_delimiter is not new_seg.strip()[0]:
                all_segmentations.append(new_seg)
    all_segmentations = [s.strip(common_delimiter).strip(string.whitespace) for s in all_segmentations]
    unique_segmentations = list(set(all_segmentations))

    # Finally, a segmentation should contain the record text itself.
    unique_segmentations.append(sentence.lower())
    return unique_segmentations
