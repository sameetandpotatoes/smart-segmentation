import $ from 'jquery';
import {
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/textUtils';

// TODO uncomment when we have a storage model implemented so we can store text
// let currentTextOnPage = getTextOnCurrentPage();
// chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
//   console.log(response);
// });

document.onmouseup = function(e) {
  let { phrase: phrase, segment: segment } = getSelectedTextFromEvent(e);
  if (phrase !== null && segment !== null) {
    let currentTextOnPage = getTextOnCurrentPage();
    chrome.runtime.sendMessage({text: currentTextOnPage,
                                selectedPhrase: phrase,
                                highlightedSegment: segment}, function(response) {
      console.log(response);
    });
  }
};

if (!document.all) {
  document.captureEvents(Event.MOUSEUP);
}

// A function handler that adds spans to all links so that right-clicking works as expected.
// TODO uncomment when it is less buggy
// $('a').hover(
//   function() {
//     var words = this.text.split(" ");
//     function isEmpty(element, index, array) {
//       return element === "";
//     }
//     // If we already hovered over this, don't delete this again
//     if (this.classList.contains('modified') || words.every(isEmpty)) {
//       return;
//     }
//
//     var newText = "";
//     $.each(words, function(j, val) {
//       if (val !== "") {
//         newText = newText + "<span class='smart-seg'>" + val + "</span> ";
//       }
//     });
//
//     var t = $(this);
//     t.addClass('modified');
//     // Hide all children
//
//     var noChildren = t.children().length == 0;
//     if (noChildren) {
//       this.innerHTML = newText;
//     } else {
//       t.children().css('display', 'none');
//       this.innerHTML += newText;
//     }
//   }, function() {
//     var t = $(this);
//     let contentText = this.text;
//     // Remove all spans created by this process
//     $('span.smart-seg', t).remove();
//
//     var noChildren = t.children().length == 0;
//     if (noChildren) {
//       this.innerHTML = contentText;
//     } else {
//       // Show children again
//       t.children().css('display', 'block');
//     }
//     t.removeClass('modified');
//   }
// );

// Event handler for right-click
document.oncontextmenu = function(e) {
   var sel = (document.selection && document.selection.createRange().text) ||
             (window.getSelection && window.getSelection().toString());
   console.log(sel);
   console.log(e.target);
   // Some logic will have to be done here to determine which is the user right-clicked word
   // and which is the full selection (based on whether a link was right-clicked or not)
}
