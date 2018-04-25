import $ from 'jquery';
import { getTextOnCurrentPage } from './modules/textUtils.js';
import { enableRightClickListener } from './modules/rightClickListener';
import { startSegmentation, testSegmentation } from './modules/segmentingUI';

document.testSegmentation = testSegmentation;

let currentTextOnPage = getTextOnCurrentPage();

let requestedInfo = null;
let targetDOMElement = null;
let startSegmentationTimer = 'Segmentation Request to Raw Results';

function sendPayloadToBackend(payload, callback) {
    chrome.runtime.sendMessage(payload, callback);
}

function prettyPrintSegmentations(segmentations) {
    console.log("Global Segmentations");
    segmentations.global.forEach(function(element, index) {
        console.log((index + 1) + ":\t" + element['formatted_phrase']);
    });

    console.log("\nLocal Segmentations");
    segmentations.local.forEach(function(element, index) {
        console.log((index + 1) + ":\t" + element['formatted_phrase']);
    });
}

function onReceiveSegmentations(segmentations) {
    console.timeEnd(startSegmentationTimer);
    prettyPrintSegmentations(segmentations);
    startSegmentation(targetDOMElement, segmentations.global, function(segmentation) {
        console.log("Recording feedback about segmentation: " + segmentation);
        sendPayloadToBackend({feedback: true,
            userSelection: requestedInfo['userSelection'],
            segmentation: segmentation
        }, function(response) {
        });
    });
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
            onReceiveSegmentations(response.segmentations);
        });
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.requestInfo) {
            console.time(startSegmentationTimer);
            sendResponse(requestedInfo);
        } else if (request.segmentations) {
            onReceiveSegmentations(request.segmentations);
        }
    }
);

enableRightClickListener(handleSegmentation);

let currentUrl = window.location.href;
sendPayloadToBackend({cleanedText: currentTextOnPage, currentPage: currentUrl},
    function(response) {
        // empty
        console.log(response);
    }
);
