import sys, os
sys.path.append(os.path.abspath(os.path.join('..', '')))
from phrase_detection import get_phrases_from_sentence
from model import get_smart_segmentations, only_full_match
import yaml
import IPython

GREEN = '\033[92m'
RED = '\033[91m'
BOLD = '\033[36m' + '\033[1m'
END = '\033[0m'

print_map = True

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
        num_in_answers = 0
        num_correct = 0
        precision_at_k = [0] * len(answers)
        i = 0
        for exp, actual in zip(smart_segs, answers):
            if exp in answers:
                num_in_answers += 1
            if exp == actual:
                num_correct += 1
            precision_at_k[i] = num_correct / (i + 1)
            i += 1

        recall = "{:.2f}".format(num_in_answers / len(answers))
        precision = "{:.2f}".format(num_correct / len(answers))

        # TODO print map values
        if print_map:
            ll = 50
            i = 0
            print(BOLD + "\nAnswers".ljust(ll) + "\tSegmentation".ljust(ll) + "\tP@K" + END)
            for exp, actual in zip(smart_segs, answers):
                print("{}{}\t{}\t{:.2f}".format(GREEN if actual == exp else RED,
                                            actual.ljust(ll)[:ll],
                                            exp.ljust(ll)[:ll],
                                            precision_at_k[i]) + END)
                i += 1

        map = "{:.2f}".format(sum(precision_at_k) / len(precision_at_k))

        p_len, i_len = (50, 20)
        print(BOLD + "Product".ljust(p_len) + "\tInput".ljust(i_len) + "\tRecall\tPrec.\tMAP" + END)
        print("{}\t{}\t{}\t{}\t{}".format(product_line['phrase'].ljust(p_len)[:p_len],
                                          user_selection.ljust(i_len)[:i_len],
                                          recall, precision, map))
