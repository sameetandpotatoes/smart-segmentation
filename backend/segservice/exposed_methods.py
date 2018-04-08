from datetime import datetime
import operator
from flask import request, jsonify
from segservice import app
from segservice.phrase_detection import get_phrases_from_sentence
from segservice.model import get_smart_segmentations

@app.method('/frequencies')
def add_frequencies(req_data):
    # TODO unused for now, will be used to store words per domain in mongo
    return 'OK'

class SegmentRequest:
    @classmethod
    def from_request_data(cls, req_data):
        return cls(req_data)
    
    def __init__(self, req_data):
        super().__init__()
        self._req_data = req_data
    
    def _cleaned_req_value(self, req_data_key):
        return self._req_data[req_data_key].encode('ascii', errors="ignore").decode()
    
    @property
    def full_line(self):
        if not hasattr(self, '_full_line'):
            self._full_line = self._cleaned_req_value('recordText')
        return self._full_line
    
    @property
    def page_text(self):
        if not hasattr(self, '_page_text'):
            self._full_line = self._cleaned_req_value('text')
        return self._page_text
    
    @property
    def user_selection(self):
        if not hasattr(self, '_user_selection'):
            self._user_selection = self._cleaned_req_value('userSelection')
        return self._user_selection

@app.method('/segments')
def get_segmentations(input: SegmentRequest):
    segmentations = get_phrases_from_sentence(input.page_text, input.full_line)
    selected_phrase = input.user_selection
    smart_segs = get_smart_segmentations(segmentations, selected_phrase, input.full_line)

    return {
        'userSelection': selected_phrase,
        'recordText': input.full_line,
        'segmentations': smart_segs
    }

# This is for a health check and uses app.route instead of app.method
@app.route("/is-up")
def health_response():
    return "Service is up at {}.\n".format(
        app.now().strftime("%H:%M:%S %Z on %b %-d, %Y")
    )
