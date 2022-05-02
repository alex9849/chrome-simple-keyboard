'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';

const querySelector = 'input[type=text], input[type=url], input[type=number], input[type=password], input[type=search],textarea'
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
    const inputDelegate = delegate(querySelector);
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
    if (inputElement.type.toLowerCase() === 'number' && button !== "{tab}") {
        onKeyPressNumeric(button)
        return;
    }

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
                //document.querySelector('').
                //console.log(inputElement)
                //inputElement.from.submit()
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
            let inputList = Array.from(document.querySelectorAll(querySelector))
            console.log(inputList)
            let index = inputList.indexOf(inputElement);
            console.log(index)
            inputList[(index + 1) % inputList.length].focus();
            break
        case "{space}":
            button = " "
        default:
            for(let char of button) {
                inputElement.value = inputElement.value.substr(0, pos) + char + inputElement.value.substr(posEnd);
                inputElement.selectionStart = pos + 1;
                inputElement.selectionEnd = pos + 1;
                pos = inputElement.selectionStart;
                posEnd = inputElement.selectionEnd;
                performNativeKeyPress(inputElement, String(char).charCodeAt(0))
            }
            break
    }
}

function onKeyPressNumeric(button) {
    if(![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].some(x => String(x) === button)) {
        return
    }
    inputElement.value = String(inputElement.value) + button
    performNativeKeyPress(inputElement, String(button).charCodeAt(0))
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
