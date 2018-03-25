import $ from 'jquery';

console.log('OPTIONS SCRIPT WORKS!');

function getTextRow(phrase, score) {
  return (
    `<tr>
      <td>
          <label>${phrase}</label>
          ${score}
      </td>
      <td>
        <label>
          <input type="radio" name="type" id="type_cmd">
          yes
        </label>
        <label>
          <input type="radio" name="type" id="type_cmd2">
          no
        </label>
      </td>
    </tr>`
  );
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse({error: "background script does not support requests from the extension at this time"});
    }

    console.log(request);
    if (request.segments) {

    }
  }
);

var smartSegments = {
  selectedPhrase: "VivoBook",
  highlightedSegment: "ASUS VivoBook F510UA FHD Laptop, Intel Core i5-8250U, 8GB RAM, 1TB HDD, USB-C, NanoEdge Display, Fingerprint, Windows 10",
  segmentations: [
    {
      phrase: "ASUS VivoBook",
      score: 0.8
    },
    {
      phrase: "VivoBook F510UA",
      score: 0.7
    },
    {
      phrase: "ASUS VivoBook F510UA FHD Laptop",
      score: 0.6
    },
    {
      phrase: "ASUS VivoBook F510UA FHD Laptop, Intel Core i5-8250U, 8GB RAM, 1TB HDD, USB-C, NanoEdge Display, Fingerprint, Windows 10",
      score: 0.3
    },
  ]
};

// chrome.runtime.openOptionsPage();
var payload = { segments : smartSegments };

$(document).ready(function() {
  payload.segments.segmentations.forEach(function(segment) {
    debugger;
    $('.segments_results_table').append(getTextRow(segment.phrase, segment.score));
  });

  console.log(payload);
});
