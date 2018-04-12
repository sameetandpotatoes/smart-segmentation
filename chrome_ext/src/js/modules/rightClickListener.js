import $ from 'jquery';
import {
    wrapHTMLString, recordContaining,
    getRecordTextFromEvent,
    getRightClickedTextFromEvent } from './textUtils';

let keysPressed = {}; // Map of key codes to booleans
const ctrlKeyCode = 17;
const altKeyCode = 18;

function enableRightClickListener(sendSegEvent) {
    document.onkeydown = document.onkeyup = function(e) {
        keysPressed[e.keyCode] = e.type == 'keydown';
    }
    document.oncontextmenu = function(e) {
        var activateSegmentationMode = keysPressed[ctrlKeyCode] && keysPressed[altKeyCode];
        keysPressed[ctrlKeyCode] = false;
        keysPressed[altKeyCode] = false;

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

            while(range.endOffset < node.length && range.toString().indexOf(' ') == -1 && range.toString().trim() != '') {
                range.setEnd(node, range.endOffset + 1);
            }
            var str = range.toString().trim();
            wordSelected = str;
        }
        // Remove punctuation from string in case that was part of the word
        wordSelected = wordSelected.replace(/[^A-Za-z0-9_]/g, "");
        console.log(wordSelected);
        console.log(segment);


        if (wordSelected !== "" && segment !== null) {
            sendSegEvent(wordSelected, segment, recordContaining(e.target),
                        activateSegmentationMode);
        } else {
            // If word clicked was not whole word, register it as a normal right click
            return true;
        }
        // Just register it as a normal right-click
        if (!activateSegmentationMode) {
            return true;
        }
        // Don't show context menu if Ctrl + Alt + Right-click is pressed
        e.preventDefault();
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
