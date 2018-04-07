import sys, os
sys.path.append(os.path.abspath(os.path.join('..', '')))
from phrase_detection import get_phrases_from_sentence
from model import get_smart_segmentations, only_full_match
import yaml
import IPython

with open('raw_page_data.dat') as file:
    data_stream = file.read().strip()

try:
    products = yaml.load(open('test_segs.yaml'))
except yaml.YAMLError as e:
    print("Parsing YAML string failed")
    print("Reason:", e.reason)
    print("At position: {0} with encoding {1}".format(e.position, e.encoding))
    print("Invalid char code:", e.character)
    exit(1)

p_len, i_len = (50, 20)

print("Product".ljust(p_len) + "\tInput".ljust(i_len) + "\tRecall\tPrec.\tMAP")
for product_line in products:
    segmentations = get_phrases_from_sentence(data_stream, product_line['phrase'])
    for selected_phrase in product_line['segs']:
        user_selection = selected_phrase['segment']['id']
        answers = selected_phrase['segment']['answers']
        # Add the entire record as an answer, always
        if answers is None:
            answers = []
        answers.append(product_line['phrase'])
        smart_segs = only_full_match(get_smart_segmentations(segmentations,
                                                             user_selection,
                                                             product_line['phrase']))
        assert(len(answers) > 0 and len(smart_segs) > 0)
        num_in_answers = sum([exp in answers for exp in smart_segs if answers is not None])
        num_correct = sum([exp == actual for exp, actual in zip(smart_segs, answers)])
        recall = "{:.2f}".format(num_in_answers / len(answers))
        precision = "{:.2f}".format(num_correct / len(answers))

        print("{}\t{}\t{}\t{}\t{}".format(product_line['phrase'].ljust(p_len)[:p_len],
                                          user_selection.ljust(i_len)[:i_len],
                                          recall, precision, "N/A"))
