from gensim.models.phrases import Phraser
from gensim.models import Phrases
import string
from stop_words import get_stop_words

def clean_data(raw_page_text):
    # TODO implement
    return raw_page_text

def get_phrases_from_sentence(raw_page_text, sentence):
    reduced_page_text = clean_data(raw_page_text)
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]
    words = sentence.lower().split()
    all_segmentations = get_phrases(sentence, sentence_stream, words)

    sentence = sentence.encode("utf-8").decode() # fixed platform non-ascii encoding issues
    sent = sentence.lower().split()
    all_segmentations = get_phrases(sentence, sentence_stream, sent)

    # Remove duplicates by converting to a set before returning
    return list(set(all_segmentations))

def get_phrases(sentence, sentence_stream, words):
    stop_words = get_stop_words('english')
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ', common_terms = stop_words)
    # TODO refactor to be n-gram
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ', common_terms = stop_words)
    quadgram = Phrases(trigram[sentence_stream], min_count=1, threshold=0.001, delimiter=b' ', common_terms = stop_words)
    all_segmentations = []

    bigrams_ = [b for b in bigram[words] if b.count(' ') >= 1]
    trigrams_ = [t for t in trigram[bigram[words]] if t.count(' ') >= 2]
    quadgrams_ = [t for t in quadgram[trigram[words]] if t.count(' ') >= 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)

    # Finally, a segmentation should contain the sentence itself.
    all_segmentations += [sentence.lower()]

    # Here for debugging purposes, remove when finalized
    return all_segmentations
