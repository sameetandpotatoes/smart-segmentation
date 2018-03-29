from gensim.models.phrases import Phraser
from gensim.models import Phrases
import string

def clean_data(raw_page_text):
    # TODO implement
    return raw_page_text

def get_phrases_from_sentence(raw_page_text, sentence):
    reduced_page_text = clean_data(raw_page_text)
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]
    # TODO filter out inner lists that only contain one element,
    # or maybe merge them with other one-element lists
    # Ex: [ ... ['$'], ['100'], ['.00'] ... ]
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ')
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ')
    quadgram = Phrases(trigram[sentence_stream], min_count=1, threshold=0.001, delimiter=b' ')

    all_segmentations = []
    sent = sentence.lower().split()
    bigrams_ = [b for b in bigram[sent] if b.count(' ') >= 1]
    trigrams_ = [t for t in trigram[bigram[sent]] if t.count(' ') >= 2]
    quadgrams_ = [t for t in quadgram[trigram[sent]] if t.count(' ') >= 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)

    # Finally, a segmentation should contain the sentence itself.
    all_segmentations += [sentence.lower()]

    remove_punct = str.maketrans('','',string.punctuation)
    all_segmentations = [seg.translate(remove_punct) for seg in all_segmentations]

    # Here for debugging purposes, remove when finalized
    print("Bigrams: \n{}".format(bigrams_))
    print("Trigrams: \n{}".format(trigrams_))
    print("Quadgrams: \n{}".format(quadgrams_))

    # Remove duplicates by converting to a set before returning
    return list(set(all_segmentations))
