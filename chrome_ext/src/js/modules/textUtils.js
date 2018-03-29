import $ from 'jquery';
import cheerio from 'cheerio';

const buttonIdName = 'smart-seg-btn';
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
  a.id = buttonIdName;
  a.style.position = 'absolute';
  a.href = "?#";
  a.appendChild(linkText);
  return a;
}

// Construct a DOM-descending list of all non-inline ancestors of the given
// element
function nonInlineAncestors(elt) {
  const result = [];
  while (elt != null && elt.tagName != 'BODY') {
    const eltDisplay = getComputedStyle(elt).display;
    switch (eltDisplay) {
      case 'inline':
        // Ignore this element
        break;
      
      default:
        result.unshift(elt);
        break;
    }
    
    elt = elt.parentNode;
  }
  return result;
}

function eltArea(elt) {
  return elt.offsetWidth * elt.offsetHeight;
}

function occupiedSpace(selector) {
  var step = $(selector);
  step = step.filter(
    function() {return $(this).closest(selector).not(this).length == 0;}
  );
  step = step.map(
    function() {return eltArea(this);}
  ).get();
  step = step.reduce(
    function(accum, item) {return accum + item;},
    0
  );
  return step;
}

// Return best known element equal to or containing the given element which
// represents one of several "records" on the page; default to the given
// element if no such record is found.
function recordContaining(elt) {
  const $elt = $(elt);
  for (const ancestorElt of nonInlineAncestors(elt)) {
    let bestClass, maxArea = 0, ancestorArea = eltArea(ancestorElt);
    for (const curClass of Array.from(ancestorElt.classList)) {
      // Only look at classes for elements that are the tightest fit around
      // elt:
      if ($elt.closest('.' + curClass)[0] !== ancestorElt) {
        continue;
      }
      
      const classArea = occupiedSpace('.' + curClass);
      if (ancestorArea * 8 <= classArea) {
        // curClass is probably the "record class": it is on a block element
        // and the total real estate of that kind of block is at least 8 times
        // larger than the real estate of ancestorElt.
        return ancestorElt;
      }
    }
  }
  return elt;
}

function getSelectedTextFromEvent(e) {
  const selectedText = getTextFromElement(recordContaining(e.target));
  if (!(selectedText && selectedText.toString() !== "")) {
    return null;
  }

  const highlightedSegment = document.getSelection().baseNode.data;

  var selectedPhrase = selectedText.trim();
  console.log("Selected phrase: " + selectedPhrase);

  var segmentButton = createSegmentButton();
  segmentButton.style.top = (e.pageY + marginButtonY) + "px";
  segmentButton.style.left = (e.pageX + marginButtonX) + "px";
  segmentButton.dataset.phrase = selectedPhrase;
  segmentButton.dataset.segment = highlightedSegment;

  return segmentButton;
}

function getTextOnCurrentPage() {
  return getTextFromElement(document.body);
}

function getTextFromElement(elt) {
  // Cheerio seems to work better than jQuery for getting text, so using that here
	const $ = cheerio.load(elt.innerHTML);
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

export { buttonIdName, getSelectedTextFromEvent, getTextOnCurrentPage };
