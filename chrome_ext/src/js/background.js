import $ from 'jquery';
import { copyToClipboard } from './modules/textUtils';
import { createNotif } from './modules/notificationGenerator.js';

console.log('BACKGROUND SCRIPT WORKS!');
const BACKEND_URL = (process.env.NODE_ENV === 'development') ? "http://localhost:5000" : "https://smartseg.ga";

function getUrl(sub_url) {
  return BACKEND_URL + sub_url;
}

function sendRequestToBackend(subUrl, request, callback) {
  $.ajax({
    method: 'POST',
    url: getUrl(subUrl),
    data: JSON.stringify(request),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }).done(callback);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse({error: "background script does not support requests from the extension at this time"});
    }
    // sender.tab is true so it came from the content script
    if (request.cleanedText) {
      sendRequestToBackend('/frequencies', request, function(data) {
        sendResponse('Sent text to backend!');
      });
    } else if (request.recordText) {
      createNotif('Segmentations created', 'Right click to view segmentations');

      sendRequestToBackend('/segments', request, function(data) {
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

          chrome.contextMenus.onClicked.addListener(function(info, tab) {
            copyToClipboard(info.selectionText);
            createNotif('Copied text', "Copied '" + info.selectionText + "' to the clipboard!");
            // TODO implement send feedback to backend
          });
          sendResponse({ segments: data });
        });
      });
    }
    // Needed because sendResponse (the callback) is used asynchronously now
    return true;
});
