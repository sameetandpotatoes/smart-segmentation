import $ from 'jquery';
import { getTextOnCurrentPage } from './modules/textUtils.js';
import { enableRightClickListener } from './modules/rightClickListener';

let currentTextOnPage = null;

let savedInfo = null;

function sendPayloadToBackend(payload) {
    chrome.runtime.sendMessage(payload, function(response) {
        console.log(response);
    });
}

// Takes a phrase and a segment and sends it to the backend
function handleSegmentation(selection, record, activateSegmentationMode) {
    if (currentTextOnPage === null) {
        currentTextOnPage = getTextOnCurrentPage();
    }
    // Save the info so that when the backend asks for it, it can provide this
    savedInfo = {
        text: currentTextOnPage,
        userSelection: selection,
        recordText: record
    };
    if (activateSegmentationMode) {
        // Tell background to initiate segmentation mode
        sendPayloadToBackend({activateSegmentation: true});
    }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      sendResponse(savedInfo)
  }
);

enableRightClickListener(handleSegmentation);

// TODO uncomment when we have a storage model implemented so we can store text and not send it per request
// let currentTextOnPage = getTextOnCurrentPage();
// sendPayloadToBackend({cleanedText: currentTextOnPage, currentPage: currentUrl});
