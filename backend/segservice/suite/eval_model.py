import sys, os
sys.path.append(os.path.abspath(os.path.join('..', '')))
from phrase_detection import get_phrases_from_sentence
from model import get_smart_segmentations
import yaml

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
    print("### PRODUCT ###: {}".format(product_line['phrase']))
    segmentations = get_phrases_from_sentence(data_stream, product_line['phrase'])
    for selected_phrase in product_line['segs']:
        print("INPUT: {}".format(selected_phrase))
        smart_segs = get_smart_segmentations(segmentations, selected_phrase, product_line['phrase'])
        print("OUTPUT (top 10)")
        for ss in smart_segs[:10]:
            print("- ({0: 6.2f}) P: {1}".format(float(ss['score']), ss['formatted_phrase']))
    print()
