import cheerio from 'cheerio';
import handlers from './modules/handlers';
import msg from './modules/msg';

console.log("Current page: " + window.location.href);
msg.init('ct', handlers.create('ct'));

function cleanText(textContent) {
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

function getTextOnCurrentPage() {
	const $ = cheerio.load(document.body.innerHTML);
  const TEXT_TAGS = ['ul', 'span', 'a', 'p'];

  var textElements = TEXT_TAGS.map(tag => cleanText($(tag, 'body').text()));
  var completeTextOnPageRaw = textElements.join("");
  // TODO perhaps some more parsing / cleaning can be done here.
  var completeTextNoImgTag = completeTextOnPageRaw.replace(/<img[^>]*>/g, '');
  return completeTextNoImgTag;
}

console.log(getTextOnCurrentPage());
