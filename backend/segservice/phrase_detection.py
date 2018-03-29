from gensim.models.phrases import Phraser
from gensim.models import Phrases
import pickle

def clean_data(raw_page_text):
    # TODO implement
    return raw_page_text

def get_phrases_from_sentence(raw_page_text, sentence):
    reduced_page_text = clean_data(raw_page_text)
    lines = reduced_page_text.split('\n')
    sentence_stream = [line.lower().split() for line in lines]
    with open('test_file', 'wb+') as f:
        f.write(pickle.dumps(sentence_stream))
    bigram = Phrases(sentence_stream, min_count=1, delimiter=b' ')
    trigram = Phrases(bigram[sentence_stream], min_count=1, delimiter=b' ')
    quadgram = Phrases(trigram[sentence_stream], min_count=1, threshold=0.001, delimiter=b' ')

    all_segmentations = []

    sent = sentence.split()
    bigrams_ = [b for b in bigram[sent] if b.count(' ') == 1]
    trigrams_ = [t for t in trigram[bigram[sent]] if t.count(' ') == 2]
    quadgrams_ = [t for t in quadgram[trigram[sent]] if t.count(' ') == 3]
    all_segmentations.extend(bigrams_)
    all_segmentations.extend(trigrams_)
    all_segmentations.extend(quadgrams_)
    print("Bigrams: \n{}".format(bigrams_))
    print("Trigrams: \n{}".format(trigrams_))
    print("Quadgrams: \n{}".format(quadgrams_))
    return all_segmentations
