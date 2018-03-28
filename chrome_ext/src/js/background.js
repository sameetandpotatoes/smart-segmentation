console.log('BACKGROUND SCRIPT WORKS!');

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse({error: "background script does not support requests from the extension at this time"});
    }
    // sender.tab is true so it came from the content script

    if (request.cleanedText) {
      // TODO make API request to backend to give data
      sendResponse({error: null, success: 'Sent text to backend!'});
    } else if (request.highlightedSegment) {

      // TODO make API request - this is hardcoded response data
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
          }
        ]
      };

      sendResponse({ segments: smartSegments });
    } else if (request.feedback) {
      // TODO implement
    }
});
