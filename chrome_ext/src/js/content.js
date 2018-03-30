import $ from 'jquery';
import {
  buttonIdName,
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/textUtils';

const modalIdName = 'myModal';

function setUpModal(segments) {
  $('#' + modalIdName).remove();

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
      `<div id="${modalIdName}" class="smart-seg-modal">
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

  let modal = document.getElementById(modalIdName);
  // Get the <span> element that closes the modal
  let span = document.getElementsByClassName("smart-seg-close")[0];

  // Close the modal on click
  span.onclick = function() {
    modal.style.display = "none";
  }

  segments.segmentations.forEach(function(segment) {
    $('.smart-seg-modal-body').append(getTextRow(segment.phrase, segment.score));
  });

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
  modal.style.display = "block";
}

const currentUrl = window.location.href;
console.log("Current page: " + currentUrl);

var currentTextOnPage = getTextOnCurrentPage();
// TODO uncomment when we have a storage model implemented so we can store text
// chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
//   console.log(response);
// });

document.onmouseup = function(e) {
  let button = document.getElementById(buttonIdName);
  if (button) {
    if (e.target == button) {
      e.preventDefault();
      chrome.runtime.sendMessage({text: currentTextOnPage,
                                  selectedPhrase: button.dataset.phrase,
                                  highlightedSegment: button.dataset.segment}, function(response) {
        console.log(response);
        // setUpModal(response.segments);
      });
    }
    $('#' + buttonIdName).remove();
    return;
  }

  let segmentButton = getSelectedTextFromEvent(e);
  if (segmentButton !== null) {
    document.body.appendChild(segmentButton);
  }
};

$('a').hover(
  function() {
    if (this.classList.contains('modified')) {
      return;
    }
    var words = this.text.split(" ");
    var newText = "";
    $.each(words, function(j, val) {
      if (val !== "") {
        newText = newText + "<span>" + val + "</span> ";
      }
    });

    var t = $(this);
    t.addClass('modified');
    // Hide all children
    t.children().css('display', 'none');
    this.innerHTML += newText;
  }, function() {
    var t = $(this);
    $('span', t).remove();
    t.children().css('display', 'inherit');
    t.removeClass('modified');
  }
);

document.oncontextmenu = function(e) {
  console.log(e.pageX + " "  + e.pageY);
  console.log(e.clientX + " "  + e.clientY);
  var sel = (document.selection && document.selection.createRange().text) ||
             (window.getSelection && window.getSelection().toString());
  var range = document.caretRangeFromPoint(e.clientX, e.clientY);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  console.log(document.elementFromPoint(e.pageX, e.pageY));
  console.log(sel);
  console.log(e.target);
}

if (!document.all) {
  document.captureEvents(Event.MOUSEUP);
}
