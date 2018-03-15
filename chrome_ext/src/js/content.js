import $ from 'jquery';
import handlers from './modules/handlers';
import msg from './modules/msg';

/*
  Content-script is called per page, this is where we get text page data and
  send it to backend
*/

console.log('CONTENT SCRIPT WORKS!');

msg.init('ct', handlers.create('ct'));

console.log('jQuery version:', $().jquery);

function getAllTextOnPage() {
  var textContent = $('body').text();
  textContent=textContent.replace(/<br>/gi, "\n");
  textContent=textContent.replace(/<br\s\/>/gi, "\n");
  textContent=textContent.replace(/<br\/>/gi, "\n");
  //-- remove P and A tags but preserve what's inside of them
  textContent=textContent.replace(/<p.*>/gi, "\n");
  textContent=textContent.replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1)");
  //-- remove all else
  // textContent=textContent.replace(/<(?:.|\s)*?>/g, "");
  //-- get rid of more than 2 multiple line breaks:
  textContent=textContent.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n");
  //-- get rid of more than 2 spaces:
  textContent=textContent.replace(/ +(?= )/g,'');

  //-- get rid of html-encoded characters:
  textContent=textContent.replace(/&nbsp;/gi," ");
  textContent=textContent.replace(/&amp;/gi,"&");
  textContent=textContent.replace(/&quot;/gi,'"');
  textContent=textContent.replace(/&lt;/gi,'<');
  textContent=textContent.replace(/&gt;/gi,'>');

  return textContent;
}

console.log("Current page: " + window.location.href);
var textCurrentPage = getAllTextOnPage();
