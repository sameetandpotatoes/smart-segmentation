

def get_smart_segmentations(phrases, selected_phrase, full_line):
    cleaned_phrases = []
    for phrase in phrases:
        cleaned_phrases.append(phrase.encode("utf-8").decode())
    selected_phrase = selected_phrase.encode("utf-8").decode() # fixed platform non-ascii encoding issues
    full_line = full_line.encode("utf-8").decode()


    print("Phrases: \n{}".format(cleaned_phrases))
    print("Selected Phrases: \n{}".format(selected_phrase))
    print("Full line: \n{}".format(full_line))
    lower_selected_phrase = selected_phrase.lower()
    good_phrases = [p for p in cleaned_phrases if lower_selected_phrase in p]
    filtered_phrases = [p for p in cleaned_phrases if lower_selected_phrase not in p]
    print("Good phrases: \n{}".format(good_phrases))
    print("Filtered phrases: \n{}".format(filtered_phrases))
    print("Index of selected")
    ordered_segs = []
    for phrase in cleaned_phrases:
        ordered_segs.append({
            'phrase': phrase,
            'score': 0.8
        })
    return sorted(ordered_segs, key=lambda x: x['score'])
