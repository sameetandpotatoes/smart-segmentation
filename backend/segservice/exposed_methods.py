from datetime import datetime
import operator
from flask import request, jsonify
from segservice import app
from segservice.phrase_detection import get_phrases_from_sentence
from segservice.model import get_smart_segmentations

@app.route('/frequencies', methods=['POST'])
def add_frequencies():
    req_data = request.get_json(force=True)
    # TODO unused for now, will be used to store words per domain in mongo
    return jsonify('OK')

@app.route('/segments', methods=['POST'])
def get_segmentations():
    req_data = request.get_json(force=True)
    full_line = req_data['recordText']
    segmentations = get_phrases_from_sentence(req_data['text'], full_line)
    selected_phrase = req_data['userSelection']
    smart_segs = get_smart_segmentations(segmentations, selected_phrase, full_line)

    return jsonify({
        'userSelection': selected_phrase,
        'recordText': full_line,
        'segmentations': smart_segs
    })

# This is for a health check and uses app.route instead of app.method
@app.route("/is-up")
def health_response():
    return "Service is up at {}.\n".format(
        app.now().strftime("%H:%M:%S %Z on %b %-d, %Y")
    )
