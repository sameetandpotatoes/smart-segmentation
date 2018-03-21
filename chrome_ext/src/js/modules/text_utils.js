import $ from 'jquery';
import cheerio from 'cheerio';

function cleanText(rawText) {
  return (
    rawText.replace(/(?:(?:\r\n|\r|\n)\s*){2,}/gim, "\n\n")
           .replace(/ +(?= )/g,'') // Remove more than 2 spaces:
           .replace(/&nbsp;/gi," ") // Remove html-encoded characters:
           .replace(/&amp;/gi,"&")
           .replace(/&quot;/gi,'"')
           .replace(/&lt;/gi,'<')
           .replace(/&gt;/gi,'>')
  );
}

function createSegmentButton() {
  var a = document.createElement('span');
  var linkText = document.createTextNode('Segment this!');
  a.className = 'btn btn-success btn-segment';
  a.style.position = 'absolute';
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
      highlightedSegment.substring(startSelect + lengthSelect, highlightedSegment.length).indexOf(" ");
    if (distanceFromSelectToNextSpace == -1) {
      distanceFromSelectToNextSpace = 0;
    }

    // Find the last space before the start of the select.
    // TODO find last punctuation actually?
    var roundedBackWord =
      highlightedSegment.substring(0, startSelect + 1).lastIndexOf(" ");
    if (roundedBackWord == -1) {
        roundedBackWord = startSelect;
    }

    var selectedPhrase =
      highlightedSegment.substring(roundedBackWord, startSelect + lengthSelect + distanceFromSelectToNextSpace)
                        .trim();
    console.log("Selected phrase: " + selectedPhrase);

    var segmentButton = createSegmentButton();
    segmentButton.style.top = e.clientX + "px";
    segmentButton.style.left = e.clientY + "px";
    // Remove previous segment buttons, add this one
    $('.btn-segment').remove();
    document.body.appendChild(segmentButton);
    return selectedText;
}

function getTextOnCurrentPage() {
	const $ = cheerio.load(document.body.innerHTML);
  // We only care about text in the following HTML tags:
  const TEXT_TAGS = ['ul', 'span', 'a', 'p'];
  var textElements = TEXT_TAGS.map(tag => cleanText($(tag, 'body').text()));
  var completeTextOnPageRaw = textElements.join("");

  // TODO perhaps some more parsing / cleaning can be done here.
  var completeTextNoImgTag = completeTextOnPageRaw.replace(/<img[^>]*>/g, '');
  return completeTextNoImgTag;
}

export { getSelectedTextFromEvent, getTextOnCurrentPage };
