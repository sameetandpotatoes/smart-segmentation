import $ from 'jquery';
import { getTextOnCurrentPage } from './modules/textUtils.js';
import { enableRightClickListener } from './modules/rightClickListener';

let currentTextOnPage = null;

let requestedInfo = null;
let targetDOMElement = null;

function sendPayloadToBackend(payload, callback) {
    chrome.runtime.sendMessage(payload, callback);
}

// Takes a phrase and a segment and sends it to the backend
function handleSegmentation(selection, record, targetNode, activateSegmentationMode) {
    if (currentTextOnPage === null) {
        currentTextOnPage = getTextOnCurrentPage();
    }
    // Save the info so that when the backend asks for it, it can provide this
    requestedInfo = {
        text: currentTextOnPage,
        userSelection: selection,
        recordText: record
    };
    targetDOMElement = targetNode;
    if (activateSegmentationMode) {
        // Tell background to initiate segmentation mode
        sendPayloadToBackend({activateSegmentation: true}, function(response) {
            console.log(targetDOMElement);
            console.log(response);
            // TODO @rtweeks2 start segmentation mode
        });
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.requestInfo) {
            sendResponse(requestedInfo);
        } else if (request.segmentations) {
            console.log(targetDOMElement);
            console.log(request);
            // TODO @rtweeks2 start segmentation mode
        }
    }
);

enableRightClickListener(handleSegmentation);

// TODO uncomment when we have a storage model implemented so we can store text and not send it per request
currentTextOnPage = getTextOnCurrentPage();
let currentUrl = window.location.href;
sendPayloadToBackend({cleanedText: currentTextOnPage, currentPage: currentUrl},
    function(response) {
        // empty
    }
);
