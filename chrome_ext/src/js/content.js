import $ from 'jquery';
import { getTextOnCurrentPage } from './modules/textUtils.js';
import { enableRightClickListener } from './modules/rightClickListener';
import { startSegmentation, testSegmentation } from './modules/segmentingUI';

document.testSegmentation = testSegmentation;

let currentTextOnPage = getTextOnCurrentPage();

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
        pageText: currentTextOnPage,
        userSelection: selection,
        recordText: record
    };
    targetDOMElement = targetNode;
    if (activateSegmentationMode) {
        // Tell background to initiate segmentation mode
        sendPayloadToBackend({activateSegmentation: true}, function(response) {
            let strs = response.segmentations.global.map(x => x.formatted_phrase);
            console.log(strs);
            startSegmentation(targetDOMElement, strs);
        });
    }
}

chrome.runtime.onMessage.addListener(
    function(backend, sender, sendResponse) {
        if (backend.requestInfo) {
            sendResponse(requestedInfo);
        } else if (backend.segmentations) {
            console.log(backend);
            let strs = backend.segmentations.global.map(x => x.formatted_phrase);
            console.log(strs);
            startSegmentation(targetDOMElement, strs);
        }
    }
);

enableRightClickListener(handleSegmentation);

let currentUrl = window.location.href;
sendPayloadToBackend({cleanedText: currentTextOnPage, currentPage: currentUrl},
    function(response) {
        // empty
        console.log("Sent text to backend!");
    }
);
