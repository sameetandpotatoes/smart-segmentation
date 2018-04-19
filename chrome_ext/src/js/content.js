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

function onReceiveSegmentations(segmentations) {
    console.timeEnd(startSegmentationTimer);
    $('.loader').hide();
    $('body').removeClass('noscroll');
    let strs = segmentations.global.map(x => x['formatted_phrase']);
    startSegmentation(targetDOMElement, strs);
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
            $('.loader').show();
            $('body').addClass('noscroll');
            // TODO prevent scrolling
        } else if (request.segmentations) {
            onReceiveSegmentations(request.segmentations);
        }
    }
);

enableRightClickListener(handleSegmentation);

// Add loader to screen
$('body').after("<div class='loader'></div>");

let currentUrl = window.location.href;
sendPayloadToBackend({cleanedText: currentTextOnPage, currentPage: currentUrl},
    function(response) {
        // empty
        console.log("Sent text to backend!");
    }
);
