import $ from 'jquery';
import { getSelectedTextFromEvent } from './textUtils';

function enableSelectionListener(sendSegEvent) {
  document.onmouseup = function(e) {
    let { phrase: phrase, segment: segment } = getSelectedTextFromEvent(e);
    if (phrase !== null && phrase !== "" && segment !== null) {
      sendSegEvent(phrase, segment);
    }
  };

  if (!document.all) {
    document.captureEvents(Event.MOUSEUP);
  }
}

export { enableSelectionListener };
