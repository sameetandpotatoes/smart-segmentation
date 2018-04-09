import $ from 'jquery';
import { wrapHTMLString,
    getRecordTextFromEvent,
    getRightClickedTextFromEvent } from './textUtils';

var keysPressed = {}; // Map of key codes to booleans
document.onkeydown = document.onkeyup = function(e) {
    keysPressed[e.keyCode] = e.type == 'keydown';
}
const ctrlKeyCode = 17;
const altKeyCode = 18;

function enableRightClickListener(sendSegEvent) {
    document.oncontextmenu = function(e) {
        let wordSelected = $(e.target).text().trim();
        let segment = getRecordTextFromEvent(e);

        if (wordSelected.split(" ").length != 1) {
            var s = window.getSelection();
            var range = s.getRangeAt(0);
            var node = s.anchorNode;
            while(range.startOffset != 0 && range.toString().indexOf(' ') != 0) {
                range.setStart(node,(range.startOffset - 1));
            }
            if (range.startOffset != 0) {
                range.setStart(node, range.startOffset + 1);
            }

            do {
               range.setEnd(node, range.endOffset + 1);
            } while(range.toString().indexOf(' ') == -1 && range.toString().trim() != '' &&
                    range.endOffset < node.length);
            var str = range.toString().trim();
            wordSelected = str;
        }
        // Remove punctuation from string in case that was part of the word
        wordSelected = wordSelected.replace(/[^A-Za-z0-9_]/g, "");
        console.log(wordSelected);
        console.log(segment);

        // If it was not a Ctrl+Alt+RightClick, then return true as normal
        var activateSegmentationMode = keysPressed[ctrlKeyCode] && keysPressed[altKeyCode];
        if (wordSelected !== "" && segment !== null) {
          sendSegEvent(wordSelected, segment, activateSegmentationMode);
        }

        if (!activateSegmentationMode) {
            // Just register it as a normal right-click
            return true;
        }
        e.preventDefault();
        // TODO figure out how to not highlight user word either.
    }
}

$(document).ready(function() {
    $('a').each(function() {
        if (this.innerHTML !== "") {
            // Wrap each link so that spans are on the lowest level above text node
            this.innerHTML = wrapHTMLString(this.innerHTML);
        }
    });
});

export { enableRightClickListener };
