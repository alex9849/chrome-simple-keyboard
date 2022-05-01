'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page

/*
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
  `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

// Communicate with background file by sending a message
chrome.runtime.sendMessage(
  {
    type: 'GREETINGS',
    payload: {
      message: 'Hello, my name is Con. I am from ContentScript.',
    },
  },
  response => {
    console.log(response.message);
  }
);

// Listen for message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'COUNT') {
    console.log(`Current count is ${request.payload.count}`);
  }

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  sendResponse({});
  return true;
});
*/


var contentScript;
var keyboard;
var keyboardElement;
var inputElement;
var keyboardHideTask = null;

function setup() {
    var baseUrl = "";
    if (chrome && chrome.extension && chrome.extension.getURL) {
        baseUrl = chrome.extension.getURL("");
    }
    let styleElement = document.createElement('link')
    styleElement.rel = 'stylesheet'
    styleElement.href = chrome.runtime.getURL('contentScript.css')
    console.log(styleElement.href)
    document.head.appendChild(styleElement);

    keyboardElement = document.createElement('div')
    keyboardElement.className = 'simple-keyboard'
    keyboardElement.onmousedown = e => e.preventDefault()
    document.body.append(keyboardElement)

    const delegate = (selector) => (cb) => (e) => e.target.matches(selector) && cb(e);
    const inputDelegate = delegate('input[type=text], textarea, input[type=password], input:not([type])');
    document.body.addEventListener('focusin', inputDelegate((el) => onFocus(el)));
    document.body.addEventListener('focusout', inputDelegate((el) =>onFocusOut(el)));

    keyboard = new Keyboard({
        onKeyPress: button => onKeyPress(button)
    });
    showKeyboard(false)
}

function onKeyPress(button) {
    console.log(button)
    if (button === "{shift}" || button === "{lock}") {
        handleShift();
    }
    var pos = inputElement.selectionStart;
    var posEnd = inputElement.selectionEnd;
    inputElement.value =
        inputElement.value.substr(0, pos) + button + inputElement.value.substr(posEnd);
    inputElement.selectionStart = pos + 1;
    inputElement.selectionEnd = pos + 1;
    inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    inputElement.dispatchEvent(
        new Event("keydown", {'key': button})
    );
}

function showKeyboard(show) {
    if(show) {
        if(keyboardHideTask != null) {
            clearTimeout(keyboardHideTask)
            keyboardHideTask = null;
        }
        keyboardElement.style = ""
    } else {
        keyboardHideTask = setTimeout(() => {
            keyboardElement.style = "display: none"
            keyboardHideTask = null;
        })
    }
}

function onFocus(e) {
    inputElement = e.target
    showKeyboard(true)
}

function onFocusOut(e) {
    inputElement = null
    showKeyboard(false)
}

function handleShift() {
    let currentLayout = keyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";

    keyboard.setOptions({
        layoutName: shiftToggle
    });
}
setup()
