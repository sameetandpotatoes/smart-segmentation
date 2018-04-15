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
    <li>Up or down arrow to change selection</li>
    <li>SPACE to copy to clipboard</li>
    <li>ENTER to copy to clipboard and dismiss</li>
    <li>ESC to dismiss</li>
  </ul>
</div>`).css({
  visibility: 'hidden'
}).appendTo(document.body);

const thisJob = {
  // This property contains the current list of segmentations
  segmentations: [],
  
  // This property indexes into *segmentations* for the currently selected one
  currentSegmentationIndex: 0,
  
  // This property indicates the record node in which we locate the segment
  recordNode: null,
  
  // This property is a callback (unless false-y) that gets called with the
  // segmentation copied by the user
  onselection: null
};
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
      selectSegment('previous');
      break;
    case "ArrowDown":
      selectSegment('next');
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
  var indexIncrement = 0;
  
  switch (which) {
    case 'next':
      indexIncrement = 1;
      break;
    case 'previous':
      indexIncrement = -1;
      break;
  }
  
  // Adjust current index by indexIncrement and apply text selection
  let {currentSegmentationIndex: segIndex, segmentations} = thisJob;
  segIndex = (
    segIndex + indexIncrement + segmentations.length
  ) % segmentations.length;
  thisJob.currentSegmentationIndex = segIndex;
  
  selectCurrentSegment();
}

const leadingWhitePattern = /^\s+/m;

class CurrentSegmentSelecter {
  constructor() {
    this.textSegment = getCurrentSegment();
    this.selRange = document.createRange();
    this.position = {node: thisJob.recordNode, index: 0};
    this.nodeStack = [];
    this.curChar = 0;
    this.backtrackTo = {};
  }
  
  backtrack() {
    this.position.node = this.backtrackTo.node;
    this.position.index = this.backtrackTo.index;
    this.nodeStack = this.backtrackTo.nodeStack;
    this.curChar = 0;
  }
  
  popFromNodeStack() {
    let poppedNode = (this.position.node = this.nodeStack.pop());
    if (poppedNode && poppedNode.nextSibling) {
      this.nodeStack.push(poppedNode.nextSibling);
    }
  }
  
  moveToNextNode() {
    this.position.index = 0;
    this.popFromNodeStack();
  }
  
  canSearch() {
    return this.position.node != null && this.curChar < this.textSegment.length;
  }
  
  searchStep() {
    const {node, index} = this.position;
    switch (node.nodeType) {
      case node.TEXT_NODE:
        if (node.nodeValue.length <= index) {
          // Move to next node
          this.moveToNextNode();
        } else if (this.curChar === 0) {
          // Look for the first character in this node's text
          let firstCharPos = node.nodeValue.indexOf(this.textSegment[0]);
          if (firstCharPos >= 0) {
            this.selRange.setStart(node, firstCharPos);
            this.position.index = firstCharPos + 1;
            ++this.curChar;
            Object.assign(this.backtrackTo, this.position, {nodeStack: this.nodeStack.slice()});
          } else {
            // Move to next node
            this.popFromNodeStack();
          }
        } else if (leadingWhitePattern.test(this.textSegment.slice(this.curChar))) {
          // When segment indicates space, match any non-empty amount of whitespace
          let leadingWhite = leadingWhitePattern.exec(node.nodeValue.slice(index));
          if (leadingWhite) {
            this.position.index += leadingWhite[0].length;
            this.curChar += leadingWhitePattern.exec(this.textSegment.slice(this.curChar))[0].length;
          } else {
            this.backtrack();
          }
        } else if (this.textSegment[this.curChar] === node.nodeValue[index]) {
          // Match the exact character
          ++this.position.index;
          ++this.curChar;
        } else {
          this.backtrack();
        }
        break;
      
      case node.ELEMENT_NODE:
        if (node.childNodes[1]) {
          this.nodeStack.push(node.childNodes[1]);
        }
        if (node.childNodes[0]) {
          this.position.node = node.childNodes[0];
        } else {
          this.popFromNodeStack();
        }
        break;
      
      default:
        this.popFromNodeStack();
        break;
    }
  }
  
  applySelection() {
    if (this.curChar < this.textSegment.length) {
      return false;
    }
    
    this.selRange.setEnd(this.position.node, this.position.index);
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
  return segmentations[segIndex];
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
