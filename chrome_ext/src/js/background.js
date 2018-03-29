import $ from 'jquery';
import { copyToClipboard } from './modules/textUtils';

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

            var notifOptions = {
              type: 'basic',
              iconUrl: 'https://cdn.business2community.com/wp-content/uploads/2018/01/segmentation_1515384711.png',
              title: 'Copied text',
              message: "Copied '" + info.selectionText + "' to the clipboard!"
            };
            chrome.notifications.create('selectionNotif', notifOptions);

            // TODO send feedback back to backend
          });

        sendResponse({ segments: data });
      });
    } else if (request.feedback) {
      // TODO implement
    }
    // Needed because sendResponse (the callback) is used asynchronously now
    return true;
});
