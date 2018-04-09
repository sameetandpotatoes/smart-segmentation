import $ from 'jquery';
import { copyToClipboard } from './modules/textUtils';
import { createNotif } from './modules/notificationGenerator.js';

const BACKEND_URL = (process.env.NODE_ENV === 'development')
    ? "http://localhost:5000"
    : "https://smartseg.ga";

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

function getSegmentationInfoFromPage() {
    // Get the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // Query the tab, the response will be the segmentation data
        chrome.tabs.sendMessage(tabs[0].id, {}, function(response) {
            // Forward the data to the backend
            sendRequestToBackend('/segments', response, function(data) {
                console.log(data);
                // TODO @rtweeks2 activate segmentation mode
            });
        });
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
    getSegmentationInfoFromPage();
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (!sender.tab) {
            sendResponse("background script does not support requests from the extension at this time");
        }

        if (request.cleanedText) {
            sendRequestToBackend('/frequencies', request, function(data) {
                sendResponse('Sent text to backend!');
            });
        } else if (request.activateSegmentation) {
            getSegmentationInfoFromPage();
            sendResponse('Entering segmentation mode!');
        }
        // Needed because sendResponse (the callback) is used asynchronously
        return true;
    }
);
