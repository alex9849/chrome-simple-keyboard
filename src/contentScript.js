'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';

var contentScript;
var keyboard;
var keyboardElement;
var inputElement;
var keyboardHideTask = null;

function setup() {
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
    const inputDelegate = delegate('input, textarea, input:not([type])');
    document.body.addEventListener('focusin', inputDelegate((el) => onFocus(el)));
    document.body.addEventListener('focusout', inputDelegate((el) =>onFocusOut(el)));

    keyboard = new Keyboard({
        onKeyPress: button => onKeyPress(button)
    });
    showKeyboard(false)
}

function onKeyPress(button) {
    console.log(button)
    if (!inputElement || !button) {
        return;
    }
    var pos = inputElement.selectionStart;
    var posEnd = inputElement.selectionEnd;

    switch (button) {
        case "{shift}":
        case "{lock}":
            handleShift();
            break
        case "{enter}":
            if(inputElement.tagName.toLowerCase() === "textarea") {
                button = "\n"
                inputElement.value = inputElement.value.substr(0, pos) + button + inputElement.value.substr(posEnd);
                inputElement.selectionStart = pos + 1;
                inputElement.selectionEnd = pos + 1;
            } else {
                //TODO
            }
            performNativeKeyPress(inputElement, 13);
            break
        case "{bksp}":
            if (posEnd === 0) {
                performNativeKeyPress(inputElement, 8);
                return;
            }
            if (posEnd === pos) {
                pos = pos - 1;
            }
            inputElement.value = inputElement.value.substr(0, pos) + inputElement.value.substr(posEnd);
            inputElement.selectionStart = pos;
            inputElement.selectionEnd = pos;
            performNativeKeyPress(inputElement, 8);
            break
        case "{tab}":
            break
        case "{space}":
            break
        default:
            inputElement.value = inputElement.value.substr(0, pos) + button + inputElement.value.substr(posEnd);
            inputElement.selectionStart = pos + 1;
            inputElement.selectionEnd = pos + 1;
            performNativeKeyPress(inputElement, String(button).charCodeAt(0))
            break
    }
}

function performNativeKeyPress(element, keyCode) {
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(
        new Event("keydown", { keyCode: keyCode, which: keyCode })
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
