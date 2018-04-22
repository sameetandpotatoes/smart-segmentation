import $ from 'jquery';
import { copyToClipboard } from './modules/textUtils';
import { createNotif } from './modules/notificationGenerator.js';

const BACKEND_URL = (process.env.NODE_ENV === 'development')
    ? "http://localhost:5000"
    : "https://smartseg.ga";
let visitedURLS = [];

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

function sendRequestToContent(payload, callback) {
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Query the tab, the response will be the segmentation data
        chrome.tabs.sendMessage(tabs[0].id, payload, callback);
    });
}

function getSegmentationInfoFromPage(callback) {
    sendRequestToContent({requestInfo: true}, function(response) {
        // Forward the data to the backend
        sendRequestToBackend('/segments', response, callback);
    });
}

// When a user wants to segment, they ask for data from content.js,
// and then load segmentation mode
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        "id": "segmentItem",
        "title": "Enter Segmentation Mode",
        "contexts": ["all"], // TODO make it only available for right-click? Not sure of options right now
    });
});
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    getSegmentationInfoFromPage(function(data) {
        // Forward back to content.js
        sendRequestToContent(data);
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (!sender.tab) {
            sendResponse("background script does not support requests from the extension at this time");
        }

        // Don't add URLs twice to a given session to stop bloating the database of skewed data
        if (request.cleanedText && !visitedURLS.includes(request.currentPage)) {
            visitedURLS.append(request.currentPage);
            sendRequestToBackend('/frequencies', request, function(data) {
                sendResponse('Sent text to backend!');
            });
        } else if (request.activateSegmentation) {
            getSegmentationInfoFromPage(function(data) {
                sendResponse(data);
            });
        } else if (request.feedback) {
            sendRequestToBackend('/feedback', request, function(data) {
                sendResponse('Sent feedback to backend!');
            })
        }
        // Needed because sendResponse (the callback) is used asynchronously
        return true;
    }
);
