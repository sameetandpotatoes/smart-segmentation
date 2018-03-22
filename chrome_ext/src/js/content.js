import $ from 'jquery';
import {
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/text_utils';

const currentUrl = window.location.href;
console.log("Current page: " + currentUrl);

// TODO send this to backend via background.js?
var currentTextOnPage = getTextOnCurrentPage();
console.log(currentTextOnPage);
chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
  console.log(response);
});

document.onmouseup = function(e) {
  let { selectedText: selection,
        selectedPhrase: phrase,
        highlightedSegment: segment,
        segmentButton: segmentButton } = getSelectedTextFromEvent(e);

  // Remove previous segment button, add this one
  $('.btn-segment').remove();

  segmentButton.onclick = function(e) {
    chrome.runtime.sendMessage({selectedPhrase: phrase, highlightedSegment: segment}, function(response) {

    });
  }
  document.body.appendChild(segmentButton);
};
if (!document.all) document.captureEvents(Event.MOUSEUP);
