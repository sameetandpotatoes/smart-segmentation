import $ from 'jquery';
import cheerio from 'cheerio';

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

/* Copies text to the clipboard */
function copyToClipboard(text) {
  const input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.opacity = 0;
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('Copy');
  document.body.removeChild(input);
};

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
  const $elt = $(elt), eltRect = elt.getBoundingClientRect();
  for (const ancestorElt of nonInlineAncestors(elt)) {
    const ancestorRect = ancestorElt.getBoundingClientRect();
    if (
      eltRect.top < ancestorRect.top ||
      eltRect.left < ancestorRect.left ||
      eltRect.bottom > ancestorRect.bottom ||
      eltRect.right > ancestorRect.right
    ) {
      continue;
    }
    const ancestorArea = eltArea(ancestorElt);
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
  const selectedText = getTextFromElement(recordContaining(e.target)).trim();
  if (!(selectedText && selectedText.toString() !== "")) {
    return null;
  }

  var selectedPhrase =
    highlightedSegment.substring(roundedBackWord, startSelect + lengthSelect + distanceFromSelectToNextSpace)
                      .trim();

  return {
    phrase: selectedPhrase,
    segment: highlightedSegment
  };
}

function getTextOnCurrentPage() {
  return getTextFromElement(document.body).trim();
}

function getTextFromElement(elt) {
  const eltStyle = getComputedStyle(elt);
  switch (eltStyle.display) {
    case 'none':
    case 'table-column-group':
    case 'table-column':
      return '';
  }
  if (eltStyle.visibility != 'visible') {
    return '';
  }

  const ariaLabel = elt.attributes['aria-label'];
  if (ariaLabel) {
    return ' ' + onlyAsciiContent(ariaLabel.value) + ' ';
  }
  if ((elt.attributes['aria-hidden'] || {}).value == 'true') {
    return '';
  }

  const parts = [];
  for (const child of elt.childNodes) {
    switch (child.nodeType) {
      case elt.TEXT_NODE:
        parts.push(onlyAsciiContent(child.nodeValue));
        break;

      case elt.ELEMENT_NODE:
        if (elt.tagName == 'BR') {
          parts.push(' ');
        } else {
          let childText = getTextFromElement(child);
          if (childText) {
            parts.push(childText);
          }
        }
        break;
    }
  }

  if (eltStyle.display != 'inline') {
    parts.unshift(' ');
    parts.push(' ');
  }

  return parts.join('').replace(/\s{2,}/g, ' ');
}

function onlyAsciiContent(s) {
  return s.replace(/[^\x00-\x7F]/g, "");
}

export {
  copyToClipboard, getSelectedTextFromEvent, getTextOnCurrentPage
};
