import string
import re
from collections import Counter
from gensim.models import Phrases
from stop_words import get_stop_words
from segservice.database import clean_data, number_replacement, clean_data_no_nums


class SmartSegmenter:
    def __init__(self, data):
        self.sentence_stream = data

    def get_phrases(self, sentence, words):
        stop_words = get_stop_words('english')
        bigram = Phrases(self.sentence_stream, min_count=1,
                         delimiter=b' ', common_terms=stop_words)
        trigram = Phrases(bigram[self.sentence_stream], min_count=1,
                          delimiter=b' ', common_terms=stop_words)
        quadgram = Phrases(trigram[self.sentence_stream], min_count=1,
                           delimiter=b' ', common_terms=stop_words)
        all_segmentations = []

        bigrams_ = [b for b in bigram[words] if b.count(' ') >= 1]
        trigrams_ = [t for t in trigram[bigram[words]] if t.count(' ') >= 2]
        quadgrams_ = [t for t in quadgram[trigram[words]] if t.count(' ') >= 3]
        all_segmentations.extend(bigrams_)
        all_segmentations.extend(trigrams_)
        all_segmentations.extend(quadgrams_)

        # Split on the most common punctuation in the record too
        delimiters = re.findall(r'[^\w#]', sentence)
        frequent_delimiters = Counter(delimiters).most_common(2)
        common_delimiter, _ = frequent_delimiters[0]
        # We don't want space if there's something else, but if there's nothing else then split on spaces
        if common_delimiter == ' ' and len(frequent_delimiters) == 2:
            common_delimiter, _ = frequent_delimiters[1]

            split_on_delimit = r"(\s+" + re.escape(common_delimiter) + "\s?)|(\s?" + re.escape(
                common_delimiter) + "\s+)"

            for new_seg in set(re.split(split_on_delimit, sentence.lower())):
                if new_seg is not None and common_delimiter is not new_seg.strip()[0]:
                    all_segmentations.append(new_seg)
        all_segmentations = [s.strip(common_delimiter).strip(string.whitespace) for s in all_segmentations]
        unique_segmentations = list(set(all_segmentations))

        # Finally, a segmentation should contain the record text itself.
        unique_segmentations.append(sentence.lower())
        return unique_segmentations

    def get_phrases_from_sentence(self, sentence):
        words = sentence.lower().split()

        sentence = clean_data(sentence)
        sent = sentence.lower().split()
        all_phrases = self.get_phrases(sentence, sent)
        return all_phrases

    def reconstruct_original_phrase(self, record_text, phrase):
        phrase_list = phrase.split(number_replacement)
        og_phrase = ""
        # Match the exact phrase in the rt lower to prevent getting anything before
        rt_lower_og = record_text.lower()
        rt_lower = re.sub(r'\d+', number_replacement, record_text.lower())
        # Add buffer to go back based on how many hashtags were entered
        record_before_phrase = rt_lower[0:rt_lower.index(phrase)]
        num_hashtags_before_phrase = record_before_phrase.count("#")
        rt_lower_start = rt_lower_og[rt_lower.index(phrase) - num_hashtags_before_phrase:]
        rt_lower = rt_lower_start
        idx = 0
        for i, f in enumerate(phrase_list):
            # Get next element in list if it exists, to determine how many numbers there are
            s = "" if i + 1 >= len(phrase_list) else phrase_list[i + 1]
            next_part_of_phrase = ""
            if f == "":
                end_idx = rt_lower.index(s)
                start_idx = end_idx - 1
                while start_idx > 0 and rt_lower[start_idx].isdigit():
                    start_idx -= 1
                if start_idx is not 0: # Add back 1 only if the last one was not a digit
                    start_idx += 1
                if end_idx is 0:
                    while end_idx < len(rt_lower) and rt_lower[end_idx].isdigit():
                        end_idx += 1
                    # Don't add back 1 since substring is non-inclusive at the end
                next_part_of_phrase = rt_lower[start_idx:end_idx]
            else:
                start_idx = rt_lower.index(f)
                end_idx = start_idx + len(f)
                # Copy string over up to the number
                next_part_of_phrase = rt_lower[start_idx:end_idx]
                # Find the first part of second string after the number
                next_idx = rt_lower[end_idx:].index(s)
                # Add all numbers to the phrase
                next_part_of_phrase += rt_lower[end_idx:end_idx+next_idx]
            idx += len(next_part_of_phrase)
            og_phrase += next_part_of_phrase
            # reset rt_lower to after the string
            rt_lower = rt_lower[rt_lower.find(next_part_of_phrase) + len(next_part_of_phrase):]
        return og_phrase.strip()

    def eval_phrase(self, phrase, user_selected, record_text):
        original_phrase = self.reconstruct_original_phrase(record_text, phrase)
        num_words_in_phrase = len(original_phrase.split(" "))
        phrase_len = len(original_phrase)
        begin_phrase = record_text.lower().find(original_phrase)

        K = 100
        if record_text.lower() == original_phrase:
            score = K
        elif original_phrase == user_selected.lower():
            score = float("inf")
        else:
            score = K + (0.01 * phrase_len) / (num_words_in_phrase ** 1.15)

        # Add in the formatted phrase to the dict
        formatted_phrase = record_text[begin_phrase:begin_phrase + phrase_len]
        # Round score to 4 decimal places
        score = "{:.4f}".format(score)
        return formatted_phrase, score

    def get_smart_segmentations(self, sentence, user_selected, full_line):
        segmentations = self.get_phrases_from_sentence(sentence)
        # What the word selected is the "best" segmentation, always
        user_selected_seg = clean_data(user_selected).lower()
        segmentations.append(user_selected_seg)
        ordered_segs = []
        longest_phrase = full_line.count(" ") + 1

        for phrase in segmentations:
            formatted_phrase, score = self.eval_phrase(phrase, user_selected, full_line)
            ordered_segs.append({
                'phrase': phrase,
                'formatted_phrase': formatted_phrase,
                'phrase_length': formatted_phrase.count(" ") + 1,
                'score': score
            })
        ordered_segs = sorted(ordered_segs, key=lambda x: (abs(longest_phrase - x['phrase_length']), x['score']), reverse=True)
        return [s for s in ordered_segs if user_selected in s['formatted_phrase']]
