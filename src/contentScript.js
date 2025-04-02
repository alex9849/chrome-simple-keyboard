'use strict';

import Keyboard from 'simple-keyboard';
import './contentScript.css';
import germanLayout from "simple-keyboard-layouts/build/layouts/german";
import englishLayout from "simple-keyboard-layouts/build/layouts/english";
import frenchLayout from "simple-keyboard-layouts/build/layouts/french";
import czechLayout from "simple-keyboard-layouts/build/layouts/czech";

const languageLayouts = {
    'english': englishLayout,
    'german': germanLayout,
    'french': frenchLayout,
    'czech': czechLayout,
}

const numericLayout = {
    default: ["1 2 3", "4 5 6", "7 8 9", "{tab} 0 {bksp} {downkeyboard}"],
}

const querySelector = 'input:not([readonly]), textarea:not([readonly])'
var keyboard;
var keyboardElement;
var togglerButton;
var inputElement;
var keyboardHideTask = null;
var languageLayout = englishLayout;
var shiftPressed = false;
var isMouseDown = false;

function setup() {
    chrome.storage.sync.get({
        language: 'english',
    }, function(items) {
        languageLayout = languageLayouts[items.language]
        const keyRowsDefault = languageLayout.layout.default;
        keyRowsDefault[keyRowsDefault.length - 1] += " {downkeyboard}"
        const keyRowsShift = languageLayout.layout.shift;
        keyRowsShift[keyRowsShift.length - 1] += " {downkeyboard}"
        if(!!keyboard) {
            //For some reason simple-keyboard only applied the change in the layout if we change something.
            // just asetting the layout is not enough
            toggleShiftLayout()
            toggleShiftLayout()
        }
    });

    let styleElement = document.createElement('link')
    styleElement.rel = 'stylesheet'
    styleElement.href = chrome.runtime.getURL('contentScript.css')
    document.head.appendChild(styleElement);

    keyboardElement = document.createElement('div')
    keyboardElement.id = "virtual-keyboard"
    keyboardElement.onmousedown = e => e.preventDefault()
    keyboardElement.ontouchstart = e => e.preventDefault()
    document.body.append(keyboardElement)
    let keyboardWrapper = document.createElement('div')
    keyboardWrapper.className = 'keyboard-wrapper simple-keyboard'
    keyboardElement.append(keyboardWrapper)

    togglerButton = document.createElement('div');
    togglerButton.id = 'keyboard-toggler';
    togglerButton.className = 'hidden';
    togglerButton.onmousedown = e => e.preventDefault();
    togglerButton.ontouchstart = e => e.preventDefault()
    togglerButton.onclick = e => toggleKeyboard();
    document.body.append(togglerButton);
    document.body.addEventListener('mousedown', e => isMouseDown = true);
    document.body.addEventListener('mouseup', e => onMouseUp());

    ['input', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'selectstart', 'click'].forEach(key => {
        window.addEventListener(key, event => {
            if(isChildElement(event.target, keyboardElement)) {
                event.preventDefault()
            }
        }, true);
    });

    keyboard = new Keyboard({
        onKeyPress: button => onKeyPress(button),
        onKeyReleased: button => onKeyRelease(button),
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
    setInterval(() => {
        checkKeyboard();
    }, 200);
    hideKeyboard()
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

function onKeyRelease(button) {
    switch (button) {
        case "{downkeyboard}":
            onFocusOut()
            break
    }
}

function onMouseUp() {
    isMouseDown = false;
    if(inputElement) {
        return
    }
    hideKeyboard()
    hideKeyboardToggler();
}

function onKeyPress(button) {
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
                if (pos !== null) {
                    inputElement.value = inputElement.value.substr(0, pos) + button + inputElement.value.substr(posEnd);
                    inputElement.selectionStart = pos + 1;
                    inputElement.selectionEnd = pos + 1;
                } else {
                    inputElement.value = inputElement.value + button;
                }
            } else {
                //document.querySelector('').
                //console.log(inputElement)
                //inputElement.from.submit()
            }
            performNativeKeyPress(inputElement, 13);
            break
        case "{bksp}":
            if (pos === null) {
                inputElement.value = String(inputElement.value).substr(0, inputElement.value.length-1);
                performNativeKeyPress(inputElement, 8);
                break;
            }

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
            let index = inputList.indexOf(inputElement);
            inputList[(index + 1) % inputList.length].focus();
            break
        case "{downkeyboard}":
            break
        case "{space}":
            button = " "
        default:
            for(let char of button) {
                if (pos === null) {
                    inputElement.value = inputElement.value + char;
                } else {
                    inputElement.value = inputElement.value.substr(0, pos) + char + inputElement.value.substr(posEnd);
                    inputElement.selectionStart = pos + 1;
                    inputElement.selectionEnd = pos + 1;
                    pos = inputElement.selectionStart;
                    posEnd = inputElement.selectionEnd;
                }
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
    element.dispatchEvent(new Event("keydown", { keyCode: keyCode, which: keyCode }));
    element.dispatchEvent(new Event("keypress", { keyCode: keyCode, which: keyCode }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    //element.dispatchEvent(new Event("change", { bubbles: true }));
}

function onFocus(target) {
    inputElement = target
    if(target.type.toLowerCase() === 'number') {
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

    if (inputElement.matches(".no-keyboard")) {
        showKeyboardToggler();
        return;
    }

    hideKeyboardToggler();
    showKeyboard()
    const offset = 50;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = inputElement.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
}

function showKeyboardToggler() {
    togglerButton.classList.remove("hidden");
}

function hideKeyboardToggler() {
    togglerButton.classList.add("hidden");
}

function toggleKeyboard() {
    if (keyboardElement.style.display === "none") {
        showKeyboard();
    } else {
        hideKeyboard();
    }
}

function onFocusOut() {
    if(inputElement) {
        inputElement.blur()
        inputElement = null
    }
    hideKeyboard()
    hideKeyboardToggler()
}

function showKeyboard() {
    const dialogs = document.querySelectorAll('.fixed-full')
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
}

function checkKeyboard() {
    if(isMouseDown) {
        return
    }
    if(document.activeElement.matches(querySelector)) {
        if (inputElement === document.activeElement) {
            return
        }
        onFocus(document.activeElement)
    } else {
        if (inputElement === null) {
            return;
        }
        onFocusOut()
    }
}

function hideKeyboard() {
    keyboardHideTask = setTimeout(() => {
        const dialogs = document.querySelectorAll('.fixed-full')
        keyboardElement.style = "display: none"
        document.body.style = ""
        keyboardHideTask = null;
        for(const fixed of dialogs) {
            fixed.style = ""
        }
    })
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
