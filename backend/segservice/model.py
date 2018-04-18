import string
import re
from collections import Counter
from gensim.models.phrases import Phraser
from gensim.models import Phrases
from stop_words import get_stop_words
from segservice.database import clean_data, number_replacement


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

    def get_phrases_from_sentence(self, sentence, debug=True):
        words = sentence.lower().split()

        sentence, num_list = clean_data(sentence)
        sent = sentence.lower().split()
        all_phrases = self.get_phrases(sentence, sent)
        if debug:
            print(all_phrases)
        return all_phrases, num_list

    def reconstruct_original_phrase(self, record_text, phrase):
        phrase_list = phrase.split('####')
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
                if start_idx is not 0:
                    start_idx += 1  # add back 1 only if the last one was not a digit
                next_part_of_phrase = rt_lower[start_idx:end_idx]
            else:
                start_idx = rt_lower.index(f)
                end_idx = start_idx + len(f)
                # Copy string over up to the number
                next_part_of_phrase = rt_lower[start_idx: end_idx]
                # Find the first part of second string after the number
                next_idx = rt_lower[end_idx:].index(s)
                # Add all numbers to the phrase
                next_part_of_phrase += rt_lower[end_idx:end_idx + next_idx]
            idx += len(next_part_of_phrase)
            og_phrase += next_part_of_phrase
            # reset rt_lower to after the string
            rt_lower = rt_lower[rt_lower.find(next_part_of_phrase) + len(next_part_of_phrase):]
        # If there were no numbers in the phrase, og_phrase is empty so reset it
        return phrase if og_phrase == "" else og_phrase.strip()

    def eval_phrase(self, segmentation_result, user_selected, record_text, match_phrases, nonmatch_phrases, nums_list):
        phrase = segmentation_result['phrase']

        # Other approach
        cleaned_record_text, _ = clean_data(record_text)
        split_nums = cleaned_record_text.split('####')
        phrase_index = cleaned_record_text.find(phrase)
        shift, num_list_index = calculate_shift(nums_list, split_nums, phrase_index)
        phrase_list = phrase.split('####')
        original_phrase = phrase_list[0]
        for index, val in enumerate(phrase_list):
            if index is not len(phrase_list) - 1:
                original_phrase += nums_list[num_list_index]
                num_list_index += 1
                original_phrase += phrase_list[index + 1]

        original_phrase = self.reconstruct_original_phrase(record_text, phrase)
        num_words_in_phrase = len(original_phrase.split(" "))
        phrase_len = len(original_phrase)

        begin_phrase = record_text.lower().find(original_phrase)
        phrase_num_signs = cleaned_record_text.lower().find(phrase)
        shift, _ = calculate_shift(nums_list, split_nums, phrase_num_signs)

        if phrase in match_phrases:  # full match
            segmentation_result['type'] = 'full_match'
            K = 100.0
        elif any([partial in original_phrase for partial in user_selected.lower().split(" ")]):  # partial match
            # TODO discuss - should be removed since partial matches are impossible
            segmentation_result['type'] = 'partial_match'
            K = 1.5
        else:  # no match
            K = 0
            segmentation_result['type'] = 'no_match'
            pass

        if record_text.lower() == original_phrase:
            score = K
        else:
            score = K + (0.01 * phrase_len) / (num_words_in_phrase ** 1.15)

        # Calling the other approach
        approach_two = record_text[(phrase_num_signs - shift):(phrase_num_signs - shift + phrase_len)]

        segmentation_result['formatted_phrase'] = record_text[begin_phrase:begin_phrase + phrase_len]
        segmentation_result['score'] = "{:.2f}".format(score)
        return score

    def get_smart_segmentations(self, sentence, user_selected, full_line):
        segmentations, num_list = self.get_phrases_from_sentence(sentence)
        # segmentations are all in lowercase we need to lowercase the
        # user_selected phrase too
        user_selected, _ = clean_data(user_selected)
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
                                                     match_phrases, nonmatch_phrases, num_list),
                      reverse=True)


def only_full_match(segmentations):
    return [s['formatted_phrase'] for s in segmentations if s['type'] == 'full_match']


def calculate_shift(nums_list, split_nums, max_index):
    shift = 0
    num_list_index = 0
    num_seen = len(split_nums[0])
    for i, _ in enumerate(nums_list):
        if num_seen >= max_index:
            break
        num_seen += 4
        num_seen += len(split_nums[i + 1])
        shift = shift + (4 - len(nums_list[i]))
        num_list_index += 1
    return shift, num_list_index
