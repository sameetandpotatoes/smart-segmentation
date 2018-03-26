import $ from 'jquery';
import cheerio from 'cheerio';

const buttonClassName = 'smart-seg-btn';
const marginButtonX = 5;
const marginButtonY = 2;

/* Cleans raw text with a pipeline of replacing mal-formatted input */
function cleanText(rawText) {
  return (
    rawText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n")
           .replace(/ +(?= )/g,'') // Remove more than 2 spaces:
           .replace(/&nbsp;/gi," ") // Remove html-encoded characters
           .replace(/&amp;/gi,"&")
           .replace(/&quot;/gi,'"')
           .replace(/&lt;/gi,'<')
           .replace(/&gt;/gi,'>')
  );
}

/* Creates a segmentation button withot assigning it a location */
function createSegmentButton() {
  var a = document.createElement('a');
  var linkText = document.createTextNode('Segment this!');
  a.className = buttonClassName;
  a.style.position = 'absolute';
  a.href = "?#";
  a.appendChild(linkText);
  return a;
}

function getSelectedTextFromEvent(e) {
  const selectedText = (document.all)
    ? document.selection.createRange().text
    : document.getSelection();
  if (!(selectedText && selectedText.toString() !== "")) {
    return;
  }

  console.log("Selected text: " + selectedText);
  const highlightedSegment = selectedText.baseNode.data;
  const startSelect = selectedText.baseOffset;
  const lengthSelect = selectedText.toString().length;

  // Find the first space after the highlighted segment
  var distanceFromSelectToNextSpace =
    highlightedSegment.substring(startSelect + lengthSelect,
                                 highlightedSegment.length)
                      .indexOf(" ");
  if (distanceFromSelectToNextSpace == -1) {
    // Go to end of string, will round to entire string
    distanceFromSelectToNextSpace = highlightedSegment.length;
  }

  // Find the last space before the start of the select.
  // TODO find last punctuation actually?
  var roundedBackWord =
    highlightedSegment.substring(0, startSelect + 1).lastIndexOf(" ");
  if (roundedBackWord == -1) {
    roundedBackWord = 0;
  }

  var selectedPhrase =
    highlightedSegment.substring(roundedBackWord, startSelect + lengthSelect + distanceFromSelectToNextSpace)
                      .trim();
  console.log("Selected phrase: " + selectedPhrase);

  var segmentButton = createSegmentButton();
  segmentButton.style.top = (e.pageY + marginButtonY) + "px";
  segmentButton.style.left = (e.pageX + marginButtonX) + "px";

  return {
    selectedText: selectedText.toString(), // Calling toString actually returns the text that was highlighted by the user
    selectedPhrase: selectedPhrase,
    highlightedSegment: highlightedSegment,
    segmentButton: segmentButton
  };
}

function getTextOnCurrentPage() {
  // Cheerio seems to work better than jQuery for getting text, so using that here
	const $ = cheerio.load(document.body.innerHTML);
  // We only care about text in the following HTML tags:
  const TEXT_TAGS = ['ul', 'span', 'a', 'p'];
  var textElements = TEXT_TAGS.map(tag => cleanText($(tag, 'body').text()));
  // Put a space between different elements of the list. We can split on consecutive spaces later.
  return (
    textElements.join(" ")
                .replace(/<img[^>]*>/g, '')
                .replace( /([a-z])([A-Z])/g, "$1 $2")
  );
}

export { buttonClassName, getSelectedTextFromEvent, getTextOnCurrentPage };
