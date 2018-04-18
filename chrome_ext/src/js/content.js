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
            console.log(targetDOMElement);
            console.log(response);
            let strs = [];
            for (var i = 0; i < response.segmentations.global.length; i++) {
                strs.push(response.segmentations.global[i].phrase);
            }
            startSegmentation(targetDOMElement, strs);
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
            let strs = [];
            for (var i = 0; i < request.segmentations.global.length; i++) {
                strs.push(request.segmentations.global[i].phrase);
            }
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
