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

// When a user wants to segment, they ask for data from content.js,
// and then load segmentation mode
var segmentItem = {
"id": "segmentItem",
"title": "Enter Segmentation Mode",
"contexts": ["all"], // TODO make it only available for right-click? Not sure of options right now
};
chrome.contextMenus.create(segmentItem);

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    // Get the segmentation data from the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            sendRequestToBackend('/segments', response, function(data) {
                // TODO show segmentations in modal or something
                console.log(data);
            });
        });
    });
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (!sender.tab) {
      sendResponse("background script does not support requests from the extension at this time");
    }
    // sender.tab is true so it came from the content script
    if (request.cleanedText) {
      sendRequestToBackend('/frequencies', request, function(data) {
        sendResponse('Sent text to backend!');
      });
    }
    // Needed because sendResponse (the callback) is used asynchronously
    return true;
});
