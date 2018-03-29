

def get_smart_segmentations(phrases, selected_phrase):
    ordered_segs = []
    for phrase in phrases:
        ordered_segs.append({
            'phrase': phrase,
            'score': 0.8
        })
    return sorted(ordered_segs, key=lambda x: x['score'])
