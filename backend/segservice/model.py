def eval_phrase(segmentation_result, user_selected, record_text, match_phrases, nonmatch_phrases):
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

    score = K + (0.01 * phrase_len) / (num_words_in_phrase ** 1.15)

    begin_phrase = record_text.lower().find(phrase)
    segmentation_result['formatted_phrase'] = record_text[begin_phrase:begin_phrase + phrase_len]
    segmentation_result['score'] = "{:.2f}".format(score)
    return score

def get_smart_segmentations(segmentations, user_selected, full_line):
    # segmentations are all in lowercase we need to lowercase the user_selected phrase too
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
                  key=lambda x: eval_phrase(x, user_selected, full_line,
                                            match_phrases, nonmatch_phrases),
                  reverse=True)
