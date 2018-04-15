import string
import re
from collections import Counter
from gensim.models.phrases import Phraser
from gensim.models import Phrases
from stop_words import get_stop_words

class SmartSegmenter:
    def __init__(self, data):
        self.sentence_stream = data

    def get_phrases(self, sentence, words):
        stop_words = get_stop_words('english')
        bigram = Phrases(self.sentence_stream, min_count=1,
                        delimiter=b' ', common_terms = stop_words)
        trigram = Phrases(bigram[self.sentence_stream], min_count=1,
                        delimiter=b' ', common_terms = stop_words)
        quadgram = Phrases(trigram[self.sentence_stream], min_count=1,
                        delimiter=b' ', common_terms = stop_words)
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

    def get_phrases_from_sentence(self, sentence, debug=False):
        words = sentence.lower().split()

        # Remove non-ascii characters so strings can be printed
        sentence = sentence.encode('utf-8').decode()
        sent = sentence.lower().split()
        all_phrases = self.get_phrases(sentence, sent)
        if debug:
            print(all_phrases)
        return all_phrases

    def eval_phrase(self, segmentation_result, user_selected, record_text, match_phrases, nonmatch_phrases):
        phrase = segmentation_result['phrase']
        num_words_in_phrase = len(phrase.split(" "))
        phrase_len = len(phrase)

        if phrase in match_phrases: # full match
            segmentation_result['type'] = 'full_match'
            K = 100.0
        elif any([partial in phrase for partial in user_selected.lower().split(" ")]): # partial match
            # TODO improve so it's based on how many matches / length of matches, etc.
            segmentation_result['type'] = 'partial_match'
            K = 1.5
        else: # no match
            K = 0
            segmentation_result['type'] = 'no_match'
            pass

        if record_text.lower() == phrase:
            score = K
        else:
            score = K + (0.01 * phrase_len) / (num_words_in_phrase ** 1.15)

        begin_phrase = record_text.lower().find(phrase)
        segmentation_result['formatted_phrase'] = record_text[begin_phrase:begin_phrase + phrase_len]
        segmentation_result['score'] = "{:.2f}".format(score)
        return score

    def get_smart_segmentations(self, sentence, user_selected, full_line):
        segmentations = self.get_phrases_from_sentence(sentence)
        # segmentations are all in lowercase we need to lowercase the
        # user_selected phrase too
        lower_selected_phrase = user_selected.lower()
        match_phrases = [p for p in segmentations if lower_selected_phrase in p]
        nonmatch_phrases = [p for p in segmentations if lower_selected_phrase not in p]

        ordered_segs = []
        for phrase in segmentations:
            ordered_segs.append({
                'phrase': phrase,
                'score': 0
            })
        return sorted(ordered_segs,
                      key=lambda x: self.eval_phrase(x, user_selected, full_line,
                                                     match_phrases, nonmatch_phrases),
                      reverse=True)

def only_full_match(segmentations):
    return [s['formatted_phrase'] for s in segmentations if s['type'] == 'full_match']
