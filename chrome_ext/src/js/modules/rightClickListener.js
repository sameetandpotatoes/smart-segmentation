import $ from 'jquery';
import { wrapHTMLString,
    getRecordTextFromEvent,
    getRightClickedTextFromEvent } from './textUtils';

function enableRightClickListener(sendSegEvent) {
    document.oncontextmenu = function(e) {
        let wordSelected = $(e.target).text().trim();
        let segment = getRecordTextFromEvent(e);

        if (wordSelected.split(" ").length != 1) {
            var s = window.getSelection();
            var range = s.getRangeAt(0);
            var node = s.anchorNode;
            while(range.startOffset != 0 && range.toString().indexOf(' ') != 0) {
                range.setStart(node,(range.startOffset -1));
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

        // TODO remove punctuation from wordSelected
        console.log(wordSelected);
        console.log(segment);
        if (wordSelected !== "" && segment !== null) {
          sendSegEvent(wordSelected, segment);
        }
    }
}

$(document).ready(function() {
    $('a').each(function() {
        if (this.innerHTML !== "") {
            this.innerHTML = wrapHTMLString(this.innerHTML);
        }
    });
});

export { enableRightClickListener };
