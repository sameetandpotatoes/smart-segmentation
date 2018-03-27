import $ from 'jquery';
import {
  buttonClassName,
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/textUtils';

const modalClassName = 'myModal';
let justHighlighted = false;

function setUpModal(segments) {
  $('#' + modalClassName).remove();

  function getTextRow(phrase, score) {
    return (
      `<tr>
        <td>
            <label>${phrase}</label>
            ${score}
        </td>
        <td>
          <label>
            <input type="radio" name="type" id="type_cmd">
            yes
          </label>
          <label>
            <input type="radio" name="type" id="type_cmd2">
            no
          </label>
        </td>
      </tr>`
    );
  }

  function getModalText() {
    return (
      `<div id="${modalClassName}" class="smart-seg-modal">
        <div class="smart-seg-modal-content">
          <div class="smart-seg-modal-header">
            <span class="smart-seg-close">&times;</span>
            <h2>Modal Header</h2>
          </div>
          <table class="smart-seg-modal-body">
          </table>
          <div class="smart-seg-modal-footer">
            <h3>Modal Footer</h3>
          </div>
        </div>
      </div>`
    );
  }
  document.body.innerHTML += getModalText();

  let modal = document.getElementById(modalClassName);
  // Get the button that opens the modal

  // Get the <span> element that closes the modal
  let span = document.getElementsByClassName("smart-seg-close")[0];

  // Close the modal on click
  span.onclick = function() {
    modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }

  segments.segmentations.forEach(function(segment) {
    $('.smart-seg-modal-body').append(getTextRow(segment.phrase, segment.score));
  });

  modal.style.display = "block";
}

const currentUrl = window.location.href;
console.log("Current page: " + currentUrl);

var currentTextOnPage = getTextOnCurrentPage();
chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
  console.log(response);
});

document.onmouseup = function(e) {
  // TODO fix so that clicking elsewhere removes the button.
  if ($(e.target).hasClass(buttonClassName)) {
    e.preventDefault();
    return;
  }

  let { selectedText: selectedText,
        selectedPhrase: phrase,
        highlightedSegment: segment,
        segmentButton: segmentButton } = getSelectedTextFromEvent(e);

  if (selectedText == null || phrase == null ||
      segment == null || segmentButton == null) {
    return;
  }

  // Remove previous segment button, add this one
  $('.' + buttonClassName).remove();
  document.body.appendChild(segmentButton);
  justHighlighted = true;

  $('.' + buttonClassName).click(function(e) {
    e.preventDefault();
    $('.' + buttonClassName).remove();
    chrome.runtime.sendMessage({selectedPhrase: phrase, highlightedSegment: segment}, function(response) {
      setUpModal(response.segments);
    });
  });
};

if (!document.all) {
  document.captureEvents(Event.MOUSEUP);
}
