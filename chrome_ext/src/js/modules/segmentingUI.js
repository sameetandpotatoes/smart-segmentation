import $ from 'jquery';
import { recordContaining } from './textUtils';

const messageBoxId = 'bef24728-3c13-11e8-bf71-6a0002d3c710';
$(`<div>&shy;<style>
  #${messageBoxId} {
    position: absolute;
    background-color: #fffee4;
    border: 3px ridge silver;
    font-size: 8pt;
    opacity: 0.85;
    color: #000;
    display: block;
    font-family: Arial,Helvetica,sans-serif;
    line-height: 1.3;
    text-size-adjust: 100%;
  }

  #${messageBoxId} ul {
    margin: 9px 0 9px 0;
    padding: 0 12px 0 30px;
  }
</style></div>`).appendTo(document.body);
$(`<div id="${messageBoxId}">
  <ul>
    <li>Up or down arrow to select different length segmentations</li>
    <li>Left or right arrow to move between segmentations of equal length</li>
    <li>SPACE to copy to clipboard</li>
    <li>ENTER to copy to clipboard and dismiss</li>
    <li>ESC to dismiss</li>
  </ul>
</div>`).css({
  visibility: 'hidden'
}).appendTo(document.body);

const thisJob = {
  // This property contains the current list of segmentation objects
  segmentations: [],

  // This property indexes into *segmentations* for the currently selected one
  currentSegmentationIndex: 0,

  // This property indicates the record node in which we locate the segment
  recordNode: null,

  // This property is a callback (unless false-y) that gets called with the
  // segmentation copied by the user
  onselection: null
};
const SegmentationMoves = Object.freeze({ next_length: {}, previous_length: {}, next: {}, previous: {} });
var segmentations = [];


var currentSegmentationIndex = 0;

function getMessageBoxJQ() {
  return $('#' + messageBoxId);
}

function keydownHandler(e) {
  // This functionality is only applied when the UI is visible
  if (getMessageBoxJQ().css('visibility') !== 'visible') {
    return;
  }

  switch (e.key) {
    case "ArrowUp":
      selectSegment(SegmentationMoves.previous_length);
      break;
    case "ArrowDown":
      selectSegment(SegmentationMoves.next_length);
      break;
    case "ArrowLeft":
      selectSegment(SegmentationMoves.previous);
      break;
    case "ArrowRight":
      selectSegment(SegmentationMoves.next);
      break;
    case " ":
      copySelected();
      break;
    case "Enter":
      copySelected();
      dismissUI();
      break;
    case "Escape":
      dismissUI();
      break;
  }
  e.preventDefault();
}

document.addEventListener('keydown', keydownHandler, {capture: true});

function selectSegment(which) {
  let {currentSegmentationIndex: segIndex, segmentations} = thisJob;
  let currSegmentationLength = segmentations[segIndex]['phrase_length'];
  let unequalLengthForNextPrev;
  switch (which) {
    case SegmentationMoves.next:
      segIndex += 1;
      break;
    case SegmentationMoves.previous:
      segIndex -= -1;
      break;
    case SegmentationMoves.next_length:
      segIndex += 1;
      while (segIndex < segmentations.length && segmentations[segIndex]['phrase_length'] == currSegmentationLength) {
          segIndex += 1;
      }
      break;
    case SegmentationMoves.previous_length:
      segIndex -= 1;
      while (segIndex >= 0 && segmentations[segIndex]['phrase_length'] == currSegmentationLength) {
        segIndex -= 1;
      }
      break;
  }
  // validate segIndex
  let outOfBounds = segIndex < 0 || segIndex >= segmentations.length;
  let leftOrRight = which == SegmentationMoves.next || which == SegmentationMoves.previous;
  if (outOfBounds || (leftOrRight && segmentations[segIndex]['phrase_length'] != currSegmentationLength)) {
      return;
  }

  thisJob.currentSegmentationIndex = segIndex;
  selectCurrentSegment();
}

const leadingWhitePattern = /^\s+/, whiteGlobalPattern = /\s+/g;

function strStartingUnit(str, startPos = 0) {
  // This is acceptable because Javascript is not multithreaded and there are
  // no callbacks between these two lines
  whiteGlobalPattern.lastIndex = startPos;
  const lw = leadingWhitePattern.test(str[startPos]) ? whiteGlobalPattern.exec(str) : null;

  if (lw) {
    return {s: ' ', l: lw[0].length};
  } else {
    return {s: str[startPos], l: 1};
  }
}

function kmpFailure(str) {
  var failureTable = Array(str.length).fill(-1);
  var i = 1, candidate = 0;

  while (i < str.length) {
    var iUnit = strStartingUnit(str, i), cUnit = strStartingUnit(str, candidate);

    if (iUnit.s === cUnit.s) {
      failureTable[i] = failureTable[candidate];
      i += iUnit.l;
      candidate += cUnit.l;
    } else {
      failureTable[i] = candidate;
      candidate = failureTable[candidate];
      cUnit = strStartingUnit(str, candidate);
      while (candidate >= 0 && iUnit.s != cUnit.s) {
        candidate = failureTable[candidate];
        cUnit = strStartingUnit(str, candidate);
      }
      i += iUnit.l;
      candidate += cUnit.l;
    }
  }

  failureTable[i] = candidate;

  return failureTable;
}

function elementIsVisible(elt) {
  const eltStyle = getComputedStyle(elt);
  switch (eltStyle.display) {
    case 'none':
    case 'table-column-group':
    case 'table-column':
      return false;
  }
  if (eltStyle.visibility != 'visible') {
    return false;
  }
  return true;
}

class CurrentSegmentSelecter {
  constructor() {
    // Normalize spaces in this value so we can count align this.domLocations more easily on failure
    const givenSegment = getCurrentSegment();
    this.textSegment = givenSegment.replace(/\s+/m, ' ');
    this.selRange = document.createRange();
    this.position = {node: thisJob.recordNode, index: 0};
    this.nodeStack = [];
    this.curChar = 0;
    this.lastMatchWasSpace = false;

    this.failureTable = kmpFailure(this.textSegment);
    this.domLocations = Array(this.textSegment.length);
  }

  popFromNodeStack() {
    let poppedNode = (this.position.node = this.nodeStack.pop());
    if (poppedNode && poppedNode.nextSibling) {
      this.nodeStack.push(poppedNode.nextSibling);
    }
  }

  moveToNextNode() {
    this.position.index = 0;
    delete this.position.elementalContent;
    delete this.position.textContent;
    this.popFromNodeStack();
  }

  canSearch() {
    return this.position.node && this.curChar < this.textSegment.length;
  }

  searchStep() {
    const {node, index} = this.position;
    let {textContent} = this.position;
    var skipElement = true;
    switch (node.nodeType) {
      case node.TEXT_NODE:
        if (typeof textContent === 'undefined') {
          textContent = this.position.textContent = node.nodeValue;
        }
        if (textContent.length <= index) {
          // Move to next node
          this.moveToNextNode();
        } else if (index === 0 && this.lastMatchWasSpace && leadingWhitePattern.test(textContent)) {
          // Consume leading space as part of trailing space of last match
          this.position.index = leadingWhitePattern.exec(textContent).length;
        } else if (textContent.charCodeAt(index) > 0x7F) {
          // Server drops all non-ASCII characters
          this.position.index += 1;
        } else {
          this.lastMatchWasSpace = false;
          const wUnit = strStartingUnit(this.textSegment, this.curChar),
            sUnit = strStartingUnit(textContent, index);
          if (wUnit.s === sUnit.s) {
            this.domLocations[this.curChar] = Object.assign({}, this.position);
            this.position.index += sUnit.l;
            this.curChar += wUnit.l;
            this.lastMatchWasSpace = wUnit.s === ' ';
          } else {
            this.matchFailed(() => {this.position.index += sUnit.l;});
          }
        }
        break;

      case node.ELEMENT_NODE:
        if (node.tagName == 'BR') {
          if (!this.lastMatchWasSpace) {
            // Match BR against whitespace
            skipElement = false;
            const wUnit = strStartingUnit(this.textSegment, this.curChar);
            if (wUnit.s === ' ') {
              this.domLocations[this.curChar] = {node: node, index: node.childNodes.length};
              this.moveToNextNode();
              this.curChar += wUnit.l;
              this.lastMatchWasSpace = true;
            } else {
              this.matchFailed(() => {this.moveToNextNode();});
            }
          }
        } else if (this.position.elementalContent) {
          if (this.position.elementalContent.length <= this.position.index) {
            // Continue with skipping this element -- search has progressed
            if (this.position.skipChildren) {
              delete this.position.skipChildren;
              this.moveToNextNode();
              skipElement = false;
            }
          } else if (this.position.index === 0 && this.lastMatchWasSpace) {
            // Consume this as part of trailing space of last match
            this.position.index = 1;
            skipElement = false;
          } else {
            skipElement = false;
            this.lastMatchWasSpace = false;
            const wUnit = strStartingUnit(this.textSegment, this.curChar),
              sUnit = strStartingUnit(this.position.elementalContent, this.position.index);
            if (wUnit.s === sUnit.s) {
              this.domLocations[this.curChar] = {node: this.position.node, index: 0};
              this.position.index += sUnit.l;
              this.curChar += wUnit.l;
              this.lastMatchWasSpace = wUnit.s === ' ';
            } else {
              this.matchFailed(() => {this.position.index += sUnit.l;});
            }
          }
        } else if (elementIsVisible(node)) {
          const ariaLabel = node.attributes['aria-label'];
          if (ariaLabel) {
            this.position.elementalContent = ' ' + ariaLabel.value + ' ';
            this.position.skipChildren = true;
            skipElement = false;
          } else if ((node.attributes['aria-hidden'] || {}).value == 'true') {
            // We should not descend to the children of this element
            skipElement = false;
            this.moveToNextNode();
          } else {
            const eltStyle = getComputedStyle(node);
            if (eltStyle.display != 'inline') {
              if (this.lastMatchWasSpace) {
                // We can fold the space represented by the "blockness" of this element into that, so allow "skipping" this element
              } else {
                // We need to consume whitespace from this.textSegment or fail the match AND...
                skipElement = false;
                this.position.elementalContent = ' ';
              }

              // Arrange that, when this node is "exited", we consume whitespace from this.textSegment _again_ (unless this.lastMatchWasSpace at that point)
              this.nodeStack.push({nodeType: 'blockExit', forElement: node});
            }
          }
        }
        if (skipElement) {
          if (node.childNodes[1]) {
            this.nodeStack.push(node.childNodes[1]);
          }
          if (node.childNodes[0]) {
            this.position.node = node.childNodes[0];
            delete this.position.elementalContent;
            this.position.index = 0;
          } else {
            this.moveToNextNode();
          }
        }
        break;

      case 'blockExit':
        // Special case for possibly consuming whitespace when exiting block node
        if (this.lastMatchWasSpace) {
          this.moveToNextNode();
        } else {
          // Match leaving block element against whitespace
          skipElement = false;
          const wUnit = strStartingUnit(this.textSegment, this.curChar);
          if (wUnit.s === ' ') {
            this.domLocations[this.curChar] = {node: node.forElement, index: node.forElement.childNodes.length};
            this.moveToNextNode();
            this.curChar += wUnit.l;
            this.lastMatchWasSpace = true;
          } else {
            this.matchFailed(() => {this.moveToNextNode();});
          }
        }
        break;

      default:
        this.moveToNextNode();
        break;
    }
  }

  matchFailed(onSkipThis) {
    const failTo = this.failureTable[this.curChar];
    this.domLocations.splice(0, failTo,
      ...this.domLocations.slice(this.curChar - failTo, this.curChar));
    this.curChar = failTo;
    if (this.curChar < 0) {
      this.curChar = 0;
      onSkipThis();
    }
  }

  applySelection() {
    if (this.curChar < this.textSegment.length) {
      console.log('[SmartSegmentation] Failed to find %o', this.textSegment);
      return false;
    }

    this.selRange.setStart(this.domLocations[0].node, this.domLocations[0].index);
    const {node} = this.position;
    switch (node.nodeType) {
      case node.TEXT_NODE:
        this.selRange.setEnd(node, this.position.index);
        break;

      case node.ELEMENT_NODE:
        this.selRange.setEnd(node, node.childNodes.length);
        break;
    }
    const docsel = document.getSelection();
    docsel.removeAllRanges();
    docsel.addRange(this.selRange);
    positionUI(this.selRange.getBoundingClientRect());

    return true;
  }

  run() {
    while(this.canSearch()) {
      this.searchStep();
    }
    return this.applySelection();
  }
}

function selectCurrentSegment() {
  const segsel = new CurrentSegmentSelecter();
  segsel.run();
}

function positionUI(selRect) {
  const $messageBox = getMessageBoxJQ();
  $messageBox.css({visibility: 'visible'});
  $messageBox.css({
    top: selRect.bottom + window.scrollY,
    left: selRect.right + window.scrollX - $messageBox.outerWidth()
  });
}

function getCurrentSegment() {
  const {segmentations, currentSegmentationIndex: segIndex} = thisJob;
  return segmentations[segIndex]['formatted_phrase'];
}

function copySelected() {
  // Copy the selected text to the clipboard
  document.execCommand('Copy');

  // Report segment selection to callback
  if (thisJob.onselection) {
    thisJob.onselection(getCurrentSegment());
  }
}

function dismissUI() {
  getMessageBoxJQ().css({visibility: 'hidden'});
}

/**
 * Initialize the segmentation UI
 *
 * Params:
 * - targetNode:
 *      the DOM node targeted by the triggering event
 * - derivedSegmentations:
 *      an Array of Objects giving the segmentations to try to represent in the UI
 * - onselection (optional):
 *      a callback function that receives any segmentation copied to the clipboard with the UI
 */
export function startSegmentation(targetNode, derivedSegmentations, onselection) {
  Object.assign(thisJob, {
    segmentations: derivedSegmentations.slice(),
    currentSegmentationIndex: 0,
    recordNode: recordContaining(targetNode),
    onselection: onselection
  });
  selectCurrentSegment();
}

export function testSegmentation(targetNode, derivedSegmentations) {
  Object.assign(thisJob, {
    segmentations: derivedSegmentations.slice(),
    currentSegmentationIndex: 0,
    recordNode: recordContaining(targetNode),
    onselection: null
  });
  return new CurrentSegmentSelecter();
}
