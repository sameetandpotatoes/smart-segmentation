import $ from 'jquery';
import {
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/textUtils';

function setUpModal(segments) {
  $('#myModal').remove();

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
      `<div id="myModal" class="modal">
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

  var modal = document.getElementById('myModal');
  // Get the button that opens the modal

  // Get the <span> element that closes the modal
  var span = document.getElementsByClassName("close")[0]
  ;
  // When the user clicks on <span> (x), close the modal
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
  if ($(e.target).hasClass('smart-seg-btn')) {
    e.preventDefault();
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
  $('.smart-seg-btn').remove();
  document.body.appendChild(segmentButton);

  $('.smart-seg-btn').click(function(e) {
    e.preventDefault();
    $('.smart-seg-btn').remove();
    chrome.runtime.sendMessage({selectedPhrase: phrase, highlightedSegment: segment}, function(response) {
      setUpModal(response.segments);
    });
  });
};

if (!document.all) {
  document.captureEvents(Event.MOUSEUP);
}
