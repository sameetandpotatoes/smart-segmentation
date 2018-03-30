import $ from 'jquery';

console.log('BACKGROUND SCRIPT WORKS!');
const BACKEND_URL = (process.env.NODE_ENV === 'development') ? "http://localhost:5000" : "https://smartseg.ga";

function getUrl(sub_url) {
  return BACKEND_URL + sub_url;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse({error: "background script does not support requests from the extension at this time"});
    }
    // sender.tab is true so it came from the content script
    if (request.cleanedText) {
      $.ajax({
        method: "POST",
        url: getUrl('/frequencies'),
        data: JSON.stringify(request),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).done(function(data) {
        console.log(data);
        sendResponse({error: null, success: 'Sent text to backend!'});
      });
    } else if (request.highlightedSegment) {
      $.ajax({
        method: "POST",
        url: getUrl('/segments'),
        data: JSON.stringify(request),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).done(function(data) {
        console.log(data);
        sendResponse({ segments: data });
      });
    } else if (request.feedback) {
      // TODO implement
    }
    // Needed because sendResponse (the callback) is used asynchronously now
    return true;
});
