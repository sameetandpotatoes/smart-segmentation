import $ from 'jquery';
import { getRightClickedTextFromEvent } from './textUtils';

function enableRightClickListener(sendSegEvent) {
  document.oncontextmenu = function(e) {
    let { phrase: phrase, segment: segment } = getRightClickedTextFromEvent(e);
    if (phrase !== null && segment !== null) {
      sendSegEvent(phrase, segment);
    }
  }
}

$('a').hover(
  function() {
    var words = this.text.split(" ");
    function isEmpty(element, index, array) {
      return element === "";
    }
    // If we already hovered over this, don't delete this again
    if (this.classList.contains('modified') || words.every(isEmpty)) {
      return;
    }

    var newText = "";
    $.each(words, function(j, val) {
      if (val !== "") {
        newText = newText + "<span class='smart-seg'>" + val + "</span> ";
      }
    });

    var t = $(this);
    t.addClass('modified');
    // TODO go down to the TextNode that contains the text, and change HTML there.
    // Hide all children

    var noChildren = t.children().length == 0;
    if (noChildren) {
      this.innerHTML = newText;
    } else {
      t.children().css('display', 'none');
      this.innerHTML += newText;
    }
  }, function() {
    var t = $(this);
    let contentText = this.text;
    // Remove all spans created by this process
    $('span.smart-seg', t).remove();

    var noChildren = t.children().length == 0;
    if (noChildren) {
      this.innerHTML = contentText;
    } else {
      // Show children again
      t.children().css('display', 'block');
    }
    t.removeClass('modified');
  }
);

export { enableRightClickListener };
