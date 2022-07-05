'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';
import germanLayout from "simple-keyboard-layouts/build/layouts/german";
import englishLayout from "simple-keyboard-layouts/build/layouts/english"


const numericLayout = {
    default: ["1 2 3", "4 5 6", "7 8 9", "{tab} 0 {bksp} {downkeyboard}"],
}

const querySelector = 'input[type=text], input[type=url], input[type=number], input[type=password], input[type=search],textarea'
var keyboard;
var keyboardElement;
var inputElement;
var keyboardHideTask = null;
var languageLayout = englishLayout;
var shiftPressed = false;

function setup() {
    chrome.storage.sync.get({
        language: 'english',
    }, function(items) {
        switch (items.language) {
            case 'german':
                languageLayout = germanLayout
                break
            default:
                languageLayout = englishLayout
        }
        const keyRows = languageLayout.layout.default;
        keyRows[keyRows.length - 1] += " {downkeyboard}"
    });

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
    document.body.addEventListener('click', inputDelegate((el) => onFocus(el)));
    document.body.addEventListener('focusout', inputDelegate((el) =>onFocusOut(el)));
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(key => {
        window.addEventListener(key, event => {
            if(isChildElement(event.target, keyboardElement)) {
                event.preventDefault()
            }
        }, true);
    });

    keyboard = new Keyboard({
        onKeyPress: button => onKeyPress(button),
        ...languageLayout,
        display: {
            "{tab}": "↹",
            "{bksp}": "⌫",
            "{downkeyboard}": "\u25BC",
            "{space}": " ",
            "{lock}": "⇪",
            "{shift}": "⇧",
            "{enter}": "↵"
        }
    });
    showKeyboard(false)
}

function isChildElement(child, target) {
    if(target === child) {
        return true
    }
    if(!!child.parentElement) {
        return isChildElement(child.parentElement, target)
    }
    return false
}

function onKeyPress(button) {
    console.log(button)
    if (!inputElement || !button) {
        return;
    }
    var pos = inputElement.selectionStart;
    var posEnd = inputElement.selectionEnd;
    if (inputElement.type.toLowerCase() === 'number' && button !== "{tab}" && button !== "{downkeyboard}") {
        onKeyPressNumeric(button)
        return;
    }

    switch (button) {
        case "{shift}":
            handleShiftPress();
            break
        case "{lock}":
            handleCapsLockPressed();
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
                break;
            }
            if (posEnd === pos) {
                pos = pos - 1;
            }
            inputElement.value = String(inputElement.value).substr(0, pos) + String(inputElement.value).substr(posEnd);
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
        case "{downkeyboard}":
            showKeyboard(false)
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

    if (button !== "{shift}") {
        disableShiftPress()
    }
}

function onKeyPressNumeric(button) {
    if(![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '{bksp}'].some(x => String(x) === button)) {
        return
    }
    if(button === "{bksp}") {
        const strValue = String(inputElement.value)
        if(strValue.length > 0) {
            inputElement.value = strValue.substring(0, strValue.length - 1)
        }
    } else {
        inputElement.value = String(inputElement.value) + button
    }
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
    const dialogs = document.querySelectorAll('.fixed-full')
    if(show) {
        if(keyboardHideTask != null) {
            clearTimeout(keyboardHideTask)
            keyboardHideTask = null;
        }
        keyboardElement.style = ""
        let keyboardHeight = keyboardElement.offsetHeight
        const style = "padding-bottom: " + String(keyboardHeight) + "px !important"
        document.body.style = style
        for(let fixed of dialogs) {
            fixed.style = style
        }
    } else {
        keyboardHideTask = setTimeout(() => {
            keyboardElement.style = "display: none"
            document.body.style = ""
            keyboardHideTask = null;
            for(const fixed of dialogs) {
                fixed.style = ""
            }
        })
    }
}

function onFocus(e) {
    inputElement = e.target
    if(e.target.type.toLowerCase() === 'number') {
        keyboard.setOptions({
            layout: numericLayout,
            layoutName: "default"
        })
    } else {
        keyboard.setOptions({
            ...languageLayout,
            layoutName: "default"
        })
    }
    showKeyboard(true)
    inputElement.scrollIntoView({ behavior: 'smooth' });
}

function onFocusOut(e) {
    inputElement = null
    showKeyboard(false)
}

function handleShiftPress() {
    shiftPressed = !shiftPressed
    toggleShiftLayout()
}

function handleCapsLockPressed() {
    toggleShiftLayout()
}

function disableShiftPress() {
    if(!shiftPressed) {
        return
    }
    shiftPressed = false
    toggleShiftLayout()
}

function toggleShiftLayout() {
    let currentLayout = keyboard.options.layoutName;
    let shiftToggle = currentLayout === "default" ? "shift" : "default";

    keyboard.setOptions({
        layoutName: shiftToggle
    });
}
setup()
