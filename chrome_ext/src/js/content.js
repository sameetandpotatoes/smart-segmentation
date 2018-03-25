import $ from 'jquery';
import {
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/text_utils';

const currentUrl = window.location.href;
console.log("Current page: " + currentUrl);

var currentTextOnPage = getTextOnCurrentPage();
chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
  console.log(response);
});

document.onmouseup = function(e) {
  if ($(e.target).hasClass('btn-segment')) {
    e.preventDefault();
    // // Remove the button if we click elsewhere
    // $('.btn-segment').remove();
    return;
  }

  let { selectedText: selectedText,
        selectedPhrase: phrase,
        highlightedSegment: segment,
        segmentButton: segmentButton } = getSelectedTextFromEvent(e);

  // TODO perhaps do some error checking to make sure that text is highlighted
  console.log(selectedText);
  console.log(phrase);
  console.log(segment);
  console.log(segmentButton);

  // Remove previous segment button, add this one
  $('.btn-segment').remove();
  document.body.appendChild(segmentButton);

  $('.btn-segment').click(function(e) {
    e.preventDefault();
    $('.btn-segment').remove();
    chrome.runtime.sendMessage({selectedPhrase: phrase, highlightedSegment: segment}, function(response) {

    });
  });
};

if (!document.all) {
  document.captureEvents(Event.MOUSEUP);
}
