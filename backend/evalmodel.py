#!/usr/bin/env python3

import yaml
import textwrap
import os
from segservice import database
from segservice.model import SmartSegmenter, only_full_match

# Pretty-print with colors
GREEN = '\033[92m'
RED = '\033[91m'
BOLD = '\033[36m' + '\033[1m'
END = '\033[0m'
TEST_NAME = './test.sqlite'

print_map = True

with open('data/raw_page_data.dat') as file:
    data_stream = file.read().strip()

os.system("rm -rf {}".format(TEST_NAME))
database.init(TEST_NAME)
# TODO: refactor to format data stream, then you don't need a test database
database.insert_page_data(data_stream)
products = yaml.load(open('data/test_segs.yaml'))
all_maps = []
segmenter = SmartSegmenter(database.get_training_data())
for product_line in products:
    for selected_phrase in product_line['segs']:
        user_selection = selected_phrase['segment']['id']
        answers = selected_phrase['segment']['answers']
        # Add the entire record as an answer, always
        if answers is None:
            answers = []
        answers.append(product_line['phrase'])
        smart_segs = only_full_match(
            segmenter.get_smart_segmentations(product_line['phrase'],
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

        if print_map:
            ll = 60
            i = 0
            print(BOLD + "\nAnswers".ljust(ll) + "\tSegmentation".ljust(ll) + "\tP@K" + END)
            for exp, actual in zip(smart_segs, answers):
                print("{}{}\t{}\t{:.2f}".format(GREEN if actual == exp else RED,
                                            actual.ljust(ll)[:ll],
                                            exp.ljust(ll)[:ll],
                                            precision_at_k[i]) + END)
                i += 1

        map_float = sum(precision_at_k) / len(precision_at_k)
        all_maps.append(map_float)
        p_len, i_len = (60, 20)
        print(BOLD + "Product".ljust(p_len) + "\tInput".ljust(i_len) + "\tRecall\tPrec.\tMAP" + END)

        full_product = textwrap.fill(product_line['phrase'], p_len)
        first_nl = full_product.index("\n") if "\n" in full_product else len(full_product)

        product_first_line = full_product[:first_nl].ljust(p_len).replace(user_selection, BOLD + user_selection + END)
        product_rest = full_product[first_nl:].replace(user_selection, BOLD + user_selection + END)
        print("{}\t{}\t{}\t{}\t{:.2f}".format(product_first_line,
                user_selection.ljust(i_len)[:i_len],
                recall, precision, map_float) + product_rest)

print("Overall Mean Average Precision: {:.4f}".format(sum(all_maps)/len(all_maps)))
print(all_maps)
