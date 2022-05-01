'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';

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
    keyboardElement.id = "virtual-keyboard"
    keyboardElement.onmousedown = e => e.preventDefault()
    document.body.append(keyboardElement)

    let keyboardWrapper = document.createElement('div')
    keyboardWrapper.className = 'keyboard-wrapper simple-keyboard'
    keyboardElement.append(keyboardWrapper)

    const delegate = (selector) => (cb) => (e) => e.target.matches(selector) && cb(e);
    const inputDelegate = delegate('input, input:not([type])');
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
        let keyboardHeight = keyboardElement.offsetHeight
        document.body.style = "padding-bottom: " + String(keyboardHeight) + "px !important"
    } else {
        keyboardHideTask = setTimeout(() => {
            keyboardElement.style = "display: none"
            document.body.style = ""
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
