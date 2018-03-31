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
    sent = sentence.lower().split()
    # all_segmentations = get_phrases_original(sentence, sentence_stream, sent)
    all_segmentations = get_phrases_test(sentence, sentence_stream, sent)

    sentence = sentence.encode("utf-8").decode() # fixed platform non-ascii encoding issues
    sent = sentence.lower().split()
    all_segmentations = get_phrases_original(sentence, sentence_stream, sent)

    # Remove duplicates by converting to a set before returning
    return list(set(all_segmentations))

def get_phrases_test(sentence, sentence_stream, sent):
    stop_words = get_stop_words('english')
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ', common_terms = stop_words)
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ')
    quadgram = Phrases(trigram[sentence_stream], min_count=1, threshold=0.001, delimiter=b' ')
    all_segmentations = []
    bigrams_ = [b for b in bigram[sent] if b.count(' ') >= 1]
    trigrams_ = [t for t in trigram[bigram[sent]] if t.count(' ') >= 2]
    quadgrams_ = [t for t in quadgram[trigram[sent]] if t.count(' ') >= 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)

    # Finally, a segmentation should contain the sentence itself.
    all_segmentations += [sentence.lower()]

    # remove_punct = str.maketrans('','',string.punctuation)
    # all_segmentations = [seg.translate(remove_punct) for seg in all_segmentations]

    # Here for debugging purposes, remove when finalized
    print("Bigrams: \n{}".format(bigrams_))
    print("Trigrams: \n{}".format(trigrams_))
    print("Quadgrams: \n{}".format(quadgrams_))

    return all_segmentations


def get_phrases_original(sentence, sentence_stream, sent):
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ')
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ')
    quadgram = Phrases(trigram[sentence_stream], min_count=1, threshold=0.001, delimiter=b' ')
    all_segmentations = []
    bigrams_ = [b for b in bigram[sent] if b.count(' ') >= 1]
    trigrams_ = [t for t in trigram[bigram[sent]] if t.count(' ') >= 2]
    quadgrams_ = [t for t in quadgram[trigram[sent]] if t.count(' ') >= 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)

    # Finally, a segmentation should contain the sentence itself.
    all_segmentations += [sentence.lower()]
    return all_segmentations
