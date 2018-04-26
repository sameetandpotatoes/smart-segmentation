import $ from 'jquery';
import cheerio from 'cheerio';

// Cleans raw text with a pipeline of replacing mal-formatted input
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
  const nia = nonInlineAncestors(elt);
  for (const ancestorElt of nia) {
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
  return nia[nia.length - 1] || elt;
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

function getRecordTextFromEvent(e) {
  return getTextFromElement(recordContaining(e.path[1])).trim();
}

function wrapHTMLString(s) {
    var el = document.createElement('div');
    el.innerHTML = s;

    var wrapContent = (function() {
        var oSpan = document.createElement('span');
        oSpan.className = 'ss-id';

        var fn = function(id) {
            var el = (typeof id == 'string') ? document.getElementById(id) : id;
            var node, nodes = el && el.childNodes;
            var span;

            for (var i=0, iLen=nodes.length; i<iLen; i++) {
                node = nodes[i];
                if (node.tagName === "SCRIPT") {
                    continue;
                }
                switch(node.nodeType) {
                    case Node.TEXT_NODE:
                        const delimiter = " ";
                        var words = node.nodeValue.split(delimiter);
                        var parentNode = node.parentNode;
                        // Remove current text node, add a span and a text node for each word
                        parentNode.removeChild(node);
                        words.forEach(function(word, index, array) {
                            span = oSpan.cloneNode(false);
                            span.appendChild(
                                document.createTextNode(index == array.length - 1
                                                        ? word
                                                        : word + delimiter)
                            );
                            parentNode.appendChild(span);
                        });
                        break;
                    default:
                        fn(node);
                }
            }
        };
        return fn;
    }());

    wrapContent(el);
    return el.innerHTML;
}

function getRightClickedTextFromEvent(e) {
  const selectedText = getRecordTextFromEvent(e);
  if (!(selectedText && selectedText.toString() !== "")) {
    return {
      phrase: null,
      segment: null
    };
  }
  const userSelection = (document.selection && document.selection.createRange().text) ||
                        (window.getSelection && window.getSelection().toString());
  return {
    phrase: userSelection.toString(),
    segment: selectedText.toString()
  };
}

function getSelectedTextFromEvent(e) {
  const selectedText = getRecordTextFromEvent(e);
  if (!(selectedText && selectedText.toString() !== "")) {
    return {
      phrase: null,
      segment: null
    };
  }

  const userSelection = (document.all)
    ? document.selection.createRange().text
    : document.getSelection();

  return {
    phrase: userSelection.toString(),
    segment: selectedText.toString()
  };
}

function getTextOnCurrentPage() {
  return getTextFromElement(document.body).trim();
}

export {
  copyToClipboard, wrapHTMLString, recordContaining,
  getRightClickedTextFromEvent, getSelectedTextFromEvent,
  getRecordTextFromEvent, getTextOnCurrentPage
};
