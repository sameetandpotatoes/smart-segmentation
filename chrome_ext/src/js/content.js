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
      `<div id="${modalClassName}" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <span class="close">&times;</span>
            <h2>Modal Header</h2>
          </div>
          <table class="modal-body">
          </table>
          <div class="modal-footer">
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
  let span = document.getElementsByClassName("close")[0];

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
    $('.modal-body').append(getTextRow(segment.phrase, segment.score));
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
  // if ($(e.target).hasClass(buttonClassName)) {
  //   e.preventDefault();
  //   return;
  // }
  if (event.target !== $('.' + buttonClassName) && justHighlighted) {
    $('.' + buttonClassName).remove();
    justHighlighted = false;
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
