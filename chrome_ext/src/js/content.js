import $ from 'jquery';
import { getTextOnCurrentPage } from './modules/textUtils.js';
// import { enableSelectionListener } from './modules/selectionListener';
import { enableRightClickListener } from './modules/rightClickListener';

let currentTextOnPage = null;

// Takes a phrase and a segment and sends it to the backend
function sendSegEventToBackend(selection, record) {
  if (currentTextOnPage === null) {
    currentTextOnPage = getTextOnCurrentPage();
  }
  chrome.runtime.sendMessage({text: currentTextOnPage,
                              userSelection: selection,
                              recordText: record}, function(response) {
    console.log(response);
  });
}

enableRightClickListener(sendSegEventToBackend);

// TODO uncomment when we have a storage model implemented so we can store text and not send it per request
// let currentTextOnPage = getTextOnCurrentPage();
// chrome.runtime.sendMessage({cleanedText: currentTextOnPage, currentPage: currentUrl}, function(response) {
//   console.log(response);
// });
