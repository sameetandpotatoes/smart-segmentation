import $ from 'jquery';
import { getRightClickedTextFromEvent } from './textUtils';

function enableRightClickListener(sendSegEvent) {
    // $('.a-link-normal.s-access-detail-page.s-color-twister-title-link.a-text-normal').lettering();
    document.oncontextmenu = function(e) {
        debugger;
    }
}

var wrapContent = (function() {
  var oSpan = document.createElement('span');
  oSpan.className = 'mySpanClass';

  var innerFunc = function(id) {
    var el = (typeof id == 'string')? document.getElementById(id) : id;
    var node, nodes = el && el.childNodes;
    var span;

    for (var i=0, iLen=nodes.length; i<iLen; i++) {
      node = nodes[i];
      if (node.nodeType == 3) {
        // node.parentNode.insertBefore(span, node);
        // span.appendChild(node);
        var words = node.nodeValue.split(" ");
        var parentNode = node.parentNode;
        parentNode.removeChild(node);
        words.forEach(function(word) {
            span = oSpan.cloneNode(false);
            span.appendChild(document.createTextNode(word + " "));
            parentNode.appendChild(span);
            // node.parentNode.insertBefore(span, document.createTextNode(word));
            // span.appendChild(node);
        });
      } else {
        innerFunc(node);
      }
    }
  };
  return innerFunc;
}());

function wrapHTMLstring(s) {
  var el = document.createElement('div');
  el.innerHTML = s;
  wrapContent(el);
  return el.innerHTML;
}

$(document).ready(function() {
    $("a").each(function() {
        if (this.innerHTML !== "") {
            this.innerHTML = wrapHTMLstring(this.innerHTML);
        }
    });
});

export { enableRightClickListener };
