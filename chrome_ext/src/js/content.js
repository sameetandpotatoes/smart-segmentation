import $ from 'jquery';
import handlers from './modules/handlers';
import msg from './modules/msg';
import {
  getTextOnCurrentPage,
  getSelectedTextFromEvent } from './modules/text_utils';

console.log("Current page: " + window.location.href);
msg.init('ct', handlers.create('ct'));

// TODO send this to backend via background.js?
var currentTextOnPage = getTextOnCurrentPage();

document.onmouseup = getSelectedTextFromEvent;
if (!document.all) document.captureEvents(Event.MOUSEUP);
