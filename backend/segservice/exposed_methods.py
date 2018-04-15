from datetime import datetime
import operator
from flask import request, jsonify
from segservice import app
from segservice.model import SmartSegmenter
from segservice import database
from segservice.database import format_data

@app.method('/frequencies')
def add_frequencies(req_data):
    database.insert_page_data(req_data['cleanedText'])
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
    def page_text(self):
        if not hasattr(self, '_page_text'):
            self._page_text = self._cleaned_req_value('pageText')
        return self._page_text

    @property
    def full_line(self):
        if not hasattr(self, '_full_line'):
            self._full_line = self._cleaned_req_value('recordText')
        return self._full_line

    @property
    def user_selection(self):
        if not hasattr(self, '_user_selection'):
            self._user_selection = self._cleaned_req_value('userSelection')
        return self._user_selection

def get_smart_segmentations(data, input):
    return SmartSegmenter(data).get_smart_segmentations(input.full_line, input.user_selection, input.full_line)

@app.method('/segments')
def get_segmentations(input: SegmentRequest):
    return {
        'userSelection': input.user_selection,
        'recordText': input.full_line,
        'segmentations': {
            'global': get_smart_segmentations(database.get_training_data(), input),
            'local': get_smart_segmentations(format_data(input.page_text), input)
        }
    }

# This is for a health check and uses app.route instead of app.method
@app.route("/is-up")
def health_response():
    return "Service is up at {}.\n".format(
        app.now().strftime("%H:%M:%S %Z on %b %-d, %Y")
    )
