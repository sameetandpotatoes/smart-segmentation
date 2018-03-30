import $ from 'jquery';
import { copyToClipboard } from './modules/textUtils';
import { createNotif } from './modules/notificationGenerator.js';

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
      createNotif('Segmentations created', 'Right click to view segmentations');
      $.ajax({
        method: "POST",
        url: getUrl('/segments'),
        data: JSON.stringify(request),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).done(function(data) {
        chrome.contextMenus.removeAll(function() {
          // After previous options were removed, add the new segmentations
          data.segmentations.forEach(function(segment, index) {
            var segmentItem = {
              "id": "segmentItem " + index,
              "title": segment.phrase + " (" + segment.score + ")",
              "contexts": ["selection"], // Only enabled for text selection (also through right-click)
            };
            chrome.contextMenus.create(segmentItem);
          });

          // Add a listener
          chrome.contextMenus.onClicked.addListener(function(info, tab) {
            console.log("Should be copying " + info.selectionText);
            copyToClipboard(info.selectionText);
            createNotif('Copied text', "Copied '" + info.selectionText + "' to the clipboard!");

            // TODO send feedback back to backend
          });
          sendResponse({ segments: data });
        });
      });
    } else if (request.feedback) {
      // TODO implement
    }
    // Needed because sendResponse (the callback) is used asynchronously now
    return true;
});
