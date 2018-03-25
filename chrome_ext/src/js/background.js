console.log('BACKGROUND SCRIPT WORKS!');

/*
  This file exists in the entire chrome extension lifecycle.

  I think this is where we want to communicate with backend, and do long-running
  tasks.

  We can use msg system to send messages to content
*/

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse({error: "background script does not support requests from the extension at this time"});
    }
    // sender.tab true so it came from the content script

    if (request.cleanedText) {
      // TODO make API request to backend to give data
      sendResponse({error: null, success: 'Sent text to backend!'});
    } else if (request.highlightedSegment) {
      console.log(request);
      // TODO define API to segmentation
      // Input: the beginning phrase to segment, the entire phrase it came from

      // TODO send response to popup.html and fill it with this info.
      // Response: original phrase, entire phrase, list of tuples of possible segments and their "heuristic", in sorted order
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

      chrome.runtime.openOptionsPage();
      chrome.runtime.sendMessage({ segments: smartSegments }, function(response) {

      });
    } else if (request.feedback) {
      // Input: List of segmentation choices and any user input given (bad/good), original phrase
      // Response: ok, or something
    }
});
