from datetime import datetime
import operator
from flask import request, jsonify
from segservice import app

@app.route('/frequencies', methods=['POST'])
def add_frequencies():
    req_data = request.get_json(force=True)
    # TODO store counts, remove common words, etc.
    return jsonify("OK")

@app.route('/segments', methods=['POST'])
def get_segmentations():
    req_data = request.get_json(force=True)
    # Fetch sentence stream from backend? Initialize gensim, return results
    return jsonify({
        "selectedPhrase": "VivoBook",
        "highlightedSegment": "ASUS VivoBook F510UA FHD Laptop, Intel Core i5-8250U, 8GB RAM, 1TB HDD, USB-C, NanoEdge Display, Fingerprint, Windows 10",
        "segmentations": [
          {
            "phrase": "ASUS VivoBook",
            "score": 0.8
          },
          {
            "phrase": "VivoBook F510UA",
            "score": 0.7
          },
          {
            "phrase": "ASUS VivoBook F510UA FHD Laptop",
            "score": 0.6
          },
          {
            "phrase": "ASUS VivoBook F510UA FHD Laptop, Intel Core i5-8250U, 8GB RAM, 1TB HDD, USB-C, NanoEdge Display, Fingerprint, Windows 10",
            "score": 0.3
          }
        ]
    })

# This is for a health check and uses app.route instead of app.method
@app.route("/is-up")
def health_response():
    return "Service is up at {}.\n".format(
        app.now().strftime("%H:%M:%S %Z on %b %-d, %Y")
    )
