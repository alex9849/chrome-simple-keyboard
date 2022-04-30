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

    let keyboardElement = document.createElement('div')
    keyboardElement.className = 'simple-keyboard'
    document.body.append(keyboardElement)

    keyboard = new Keyboard({
        onKeyPress: button => onKeyPress(button)
    });
}

function onKeyPress(button) {
    console.log(button)
    if (button === "{shift}" || button === "{lock}") {
        handleShift();
    }
}

function handleShift() {
    let currentLayout = keyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";

    keyboard.setOptions({
        layoutName: shiftToggle
    });
}
setup()
