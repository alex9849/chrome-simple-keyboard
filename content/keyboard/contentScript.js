'use strict';

import Keyboard from 'simple-keyboard';
import cssURL from './contentScript.css';
import {triggerElementAction, isVisible, triggerFormSubmit, performNativeKeyPress, isChildElement} from './utils'
import arabic from "simple-keyboard-layouts/build/layouts/arabic";
import assamese from "simple-keyboard-layouts/build/layouts/assamese";
import armenianEastern from "simple-keyboard-layouts/build/layouts/armenianEastern";
import armenianWestern from "simple-keyboard-layouts/build/layouts/armenianWestern";
import balochi from "simple-keyboard-layouts/build/layouts/balochi";
import belarusian from "simple-keyboard-layouts/build/layouts/belarusian";
import bengali from "simple-keyboard-layouts/build/layouts/bengali";
import brazilian from "simple-keyboard-layouts/build/layouts/brazilian";
import burmese from "simple-keyboard-layouts/build/layouts/burmese";
import chinese from "simple-keyboard-layouts/build/layouts/chinese";
import czech from "simple-keyboard-layouts/build/layouts/czech";
import english from "simple-keyboard-layouts/build/layouts/english";
import farsi from "simple-keyboard-layouts/build/layouts/farsi";
import french from "simple-keyboard-layouts/build/layouts/french";
import georgian from "simple-keyboard-layouts/build/layouts/georgian";
import german from "simple-keyboard-layouts/build/layouts/german";
import gilaki from "simple-keyboard-layouts/build/layouts/gilaki";
import greek from "simple-keyboard-layouts/build/layouts/greek";
import hebrew from "simple-keyboard-layouts/build/layouts/hebrew";
import hindi from "simple-keyboard-layouts/build/layouts/hindi";
import hungarian from "simple-keyboard-layouts/build/layouts/hungarian";
import italian from "simple-keyboard-layouts/build/layouts/italian";
import japanese from "simple-keyboard-layouts/build/layouts/japanese";
import kannada from "simple-keyboard-layouts/build/layouts/kannada";
import korean from "simple-keyboard-layouts/build/layouts/korean";
import kurdish from "simple-keyboard-layouts/build/layouts/kurdish";
import macedonian from "simple-keyboard-layouts/build/layouts/macedonian";
import malayalam from "simple-keyboard-layouts/build/layouts/malayalam";
import nigerian from "simple-keyboard-layouts/build/layouts/nigerian";
import nko from "simple-keyboard-layouts/build/layouts/nko";
import norwegian from "simple-keyboard-layouts/build/layouts/norwegian";
import odia from "simple-keyboard-layouts/build/layouts/odia";
import polish from "simple-keyboard-layouts/build/layouts/polish";
import punjabi from "simple-keyboard-layouts/build/layouts/punjabi";
import russian from "simple-keyboard-layouts/build/layouts/russian";
import russianOld from "simple-keyboard-layouts/build/layouts/russianOld";
import sindhi from "simple-keyboard-layouts/build/layouts/sindhi";
import spanish from "simple-keyboard-layouts/build/layouts/spanish";
import swedish from "simple-keyboard-layouts/build/layouts/swedish";
import telugu from "simple-keyboard-layouts/build/layouts/telugu";
import thai from "simple-keyboard-layouts/build/layouts/thai";
import turkish from "simple-keyboard-layouts/build/layouts/turkish";
import ukrainian from "simple-keyboard-layouts/build/layouts/ukrainian";
import urdu from "simple-keyboard-layouts/build/layouts/urdu";
import urduStandard from "simple-keyboard-layouts/build/layouts/urduStandard";
import uyghur from "simple-keyboard-layouts/build/layouts/uyghur";

const languageLayouts = {
    arabic,
    assamese,
    armenianEastern,
    armenianWestern,
    balochi,
    belarusian,
    bengali,
    brazilian,
    burmese,
    chinese,
    czech,
    english,
    farsi,
    french,
    georgian,
    german,
    gilaki,
    greek,
    hebrew,
    hindi,
    hungarian,
    italian,
    japanese,
    kannada,
    korean,
    kurdish,
    macedonian,
    malayalam,
    nigerian,
    nko,
    norwegian,
    odia,
    polish,
    punjabi,
    russian,
    russianOld,
    sindhi,
    spanish,
    swedish,
    telugu,
    thai,
    turkish,
    ukrainian,
    urdu,
    urduStandard,
    uyghur
}

const numericLayout = {
    default: ["1 2 3 {bksp}", "4 5 6 {enter}", "7 8 9 .", "{tab} 0  {downkeyboard}"],
}

const querySelector = 'input:not([readonly]), textarea:not([readonly])'
let keyboard;
let keyboardElement;
let keyboardTogglerElement;
let inputElement;
let inputElementNumeric = false
let keyboardHideTask = null;
let languageLayout = english;
let shiftPressed = false;
let lockPressed = false;
let isMouseDown = false;

function setup() {
    browser.storage.sync.get({
        language: 'english',
    }).then(item => {
        languageLayout = languageLayouts[item.language]
        const keyRowsDefault = languageLayout.layout.default;
        keyRowsDefault[keyRowsDefault.length - 1] += " {downkeyboard}"
        const keyRowsShift = languageLayout.layout.shift;
        keyRowsShift[keyRowsShift.length - 1] += " {downkeyboard}"
        if(!!keyboard) {
            updateLayout()
        }
    });

    let styleElement = document.createElement('link')
    styleElement.rel = 'stylesheet'
    styleElement.href = cssURL
    document.head.appendChild(styleElement);

    keyboardElement = document.createElement('div')
    keyboardElement.id = "virtual-keyboard"
    keyboardElement.onmousedown = e => e.preventDefault()
    keyboardElement.ontouchstart = e => e.preventDefault()
    document.body.append(keyboardElement)
    let keyboardWrapper = document.createElement('div')
    keyboardWrapper.className = 'keyboard-wrapper simple-keyboard'
    keyboardElement.append(keyboardWrapper)

    keyboardTogglerElement = document.createElement('div');
    keyboardTogglerElement.id = 'keyboard-toggler';
    keyboardTogglerElement.className = 'hidden';
    keyboardTogglerElement.onmousedown = e => e.preventDefault();
    keyboardTogglerElement.ontouchstart = e => e.preventDefault()
    keyboardTogglerElement.onclick = e => toggleKeyboard();
    document.body.append(keyboardTogglerElement);
    document.body.addEventListener('mousedown', e => isMouseDown = true);
    document.body.addEventListener('mouseup', e => onMouseUp());
    document.body.addEventListener('keydown', e => onPhysicalKeyDown(e));
    document.body.addEventListener('keyup', e => onPhysicalKeyUp(e));

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
        },
        physicalKeyboardHighlight: true,
        physicalKeyboardHighlightBgColor: "#b6b6b6"
    });
    setInterval(() => {
        autoToggleKeyboard();
    }, 200);
    hideKeyboard()
}

function isKeyboardShown() {
    return isVisible(keyboardElement)
}

function onPhysicalKeyUp(event) {
    if(!event.isTrusted) {
        return event
    }
    if(!inputElementNumeric && event.key === 'Shift') {
        setShiftPress(false)
    }
    return event
}

function onPhysicalKeyDown(event) {
    if(!event.isTrusted) {
        return event
    }

    if(!inputElementNumeric && event.key === 'Shift') {
        setShiftPress(true)
    }
    //if(!inputElementNumeric && event.key === 'CapsLock') {
    //    setLockPress(event.getModifierState("CapsLock"))
    //}

    // Block physical inputs when editing a numeric field
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace', 'Tab', 'Enter'].includes(event.key)) {
        return event
    }
    if (event.key === '.' && !inputElement.value.includes('.')) {
        return event
    }

    if(isKeyboardShown() && inputElementNumeric) {
        event.stopImmediatePropagation()
        event.preventDefault();
    }
    return event
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

function handleBackSpace() {
    let pos = inputElement.selectionStart;
    let posEnd = inputElement.selectionEnd;
    if (pos === null) {
        inputElement.value = String(inputElement.value).substring(0, inputElement.value.length-1);
        performNativeKeyPress(inputElement, 8);
        return;
    }

    if (posEnd === 0) {
        performNativeKeyPress(inputElement, 8);
        return;
    }
    if (posEnd === pos) {
        pos = pos - 1;
    }
    inputElement.value = String(inputElement.value).substring(0, pos) + String(inputElement.value).substring(posEnd);
    inputElement.selectionStart = pos;
    inputElement.selectionEnd = pos;
    performNativeKeyPress(inputElement, 8);
}

function handleAddCharacters(chars) {
    let pos = inputElement.selectionStart;
    let posEnd = inputElement.selectionEnd;
    for(let char of chars) {
        if (pos === null) {
            inputElement.value = inputElement.value + char;
        } else {
            inputElement.value = inputElement.value.substring(0, pos) + char + inputElement.value.substring(posEnd);
            inputElement.selectionStart = pos + 1;
            inputElement.selectionEnd = pos + 1;
            pos = inputElement.selectionStart;
            posEnd = inputElement.selectionEnd;
        }
        performNativeKeyPress(inputElement, String(char).charCodeAt(0))
    }
}

function onKeyPress(button) {
    if (!inputElement || !button) {
        return;
    }
    if (button === '{downkeyboard}') {
        return;
    }

    if (inputElementNumeric) {
        if(![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '{bksp}', ',', '.', '{tab}', '{enter}'].some(x => String(x) === button)) {
            return
        }
        if(button === ',') {
            button = '.'
        }
        if (button === '.' && inputElement.value.includes('.')) {
            return;
        }
    }

    switch (button) {
        case "{shift}":
            setShiftPress(!shiftPressed);
            break
        case "{lock}":
            setLockPress(!lockPressed);
            break
        case "{enter}":
            handleEnter()
            break
        case "{bksp}":
            handleBackSpace()
            break
        case "{tab}":
            handleTab(!shiftPressed)
            break
        case "{space}":
            button = " "
        default:
            handleAddCharacters(button)
            break
    }

    if (button !== "{shift}") {
        setShiftPress(false)
    }
}

function onFocus(target) {
    if (target.matches(".no-keyboard-no-toggler")) {
        hideKeyboardToggler();
        onFocusOut()
        return;
    }
    onFocusOut()
    inputElement = target
    if(['checkbox', 'radio', 'button', 'color', 'image', 'file', 'hidden'].includes(target.type.toLowerCase())) {
        return;
    }
    if(target.type.toLowerCase() === 'number') {
        inputElementNumeric = true
        inputElement.type="text"
        if(inputElement.value) {
            inputElement.selectionStart = inputElement.value.length
        }
    }

    if (inputElement.matches(".no-keyboard")) {
        showKeyboardToggler();
        return;
    }

    updateLayout();
    hideKeyboardToggler();
    showKeyboard();

    const remainingHeight = window.innerHeight - keyboardElement.offsetHeight
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = inputElement.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - (remainingHeight / 2);
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
}

function showKeyboardToggler() {
    keyboardTogglerElement.classList.remove("hidden");
}

function hideKeyboardToggler() {
    keyboardTogglerElement.classList.add("hidden");
}

function toggleKeyboard() {
    if (keyboardElement.style.display === "none") {
        showKeyboard();
    } else {
        hideKeyboard();
    }
}

function handleEnter() {
    const tag = inputElement.tagName.toLowerCase();
    if (inputElement.isContentEditable || tag === 'textarea') {
        if(shiftPressed) {
            triggerFormSubmit(inputElement)
            return;
        }
        handleAddCharacters('\n')
        return
    }
    if (tag === 'input') {
        triggerFormSubmit(inputElement)
        return
    }
    triggerElementAction()
}

function handleTab(forward = true) {
    let focusable = Array.from(
        document.querySelectorAll('textarea, input, [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.disabled && el.tabIndex >= 0 && el.offsetParent !== null && isVisible(el));
    focusable = focusable.filter(el => ['input', 'textarea'].includes(el.tagName.toLowerCase()))

    const active = document.activeElement;
    const index = focusable.indexOf(active);

    let nextIndex;
    if (forward) {
        nextIndex = (index + 1) % focusable.length;
    } else {
        nextIndex = (index - 1 + focusable.length) % focusable.length;
    }

    focusable[nextIndex].focus();
}

function onFocusOut() {
    if(inputElement) {
        recoverNumeric()
        inputElement.blur()
        inputElement = null
    }
    hideKeyboard()
    hideKeyboardToggler()
}

function recoverNumeric() {
    if(inputElementNumeric) {
        if (inputElement.value && inputElement.value.charAt(inputElement.value.length - 1) === '.') {
            inputElement.value = inputElement.value.substring(0, inputElement.value.length - 1)
            performNativeKeyPress(inputElement, String('.').charCodeAt(0))
        }
        inputElement.type="number"
        inputElementNumeric = false
    }
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
    document.body.style.paddingBottom = style
    for(let fixed of dialogs) {
        fixed.style = style
    }
}

function autoToggleKeyboard() {
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
        keyboardHideTask = null;
        for(const fixed of dialogs) {
            fixed.style = ""
        }
    })
}

function setLockPress(value) {
    if(lockPressed === value) {
        return
    }
    lockPressed = value
    updateShiftLayout()
}

function setShiftPress(value) {
    if(shiftPressed === value) {
        return
    }
    shiftPressed = value
    updateShiftLayout()
}

function isShiftLayoutActive() {
    return (shiftPressed || lockPressed) && !(shiftPressed && lockPressed)
}

function updateLayout() {
    if(inputElementNumeric) {
        keyboard.setOptions({
            layout: numericLayout,
            layoutName: "default"
        })
        keyboard.removeButtonTheme("{downkeyboard}", "hg-downkeyboard-standard")
    } else {
        keyboard.setOptions({
            ...languageLayout,
            layoutName: "default"
        })
        keyboard.addButtonTheme("{downkeyboard}", "hg-downkeyboard-standard")
        updateShiftLayout()
    }
}

function updateShiftLayout() {
    keyboard.setOptions({
        layoutName: isShiftLayoutActive() ? "shift" : "default"
    });
    if (lockPressed) {
        keyboard.addButtonTheme("{lock}", "vk-button-pressed")
    } else {
        keyboard.removeButtonTheme("{lock}", "vk-button-pressed")
    }
    if (shiftPressed) {
        keyboard.addButtonTheme("{shift}", "vk-button-pressed")
    } else {
        keyboard.removeButtonTheme("{shift}", "vk-button-pressed")
    }
}
setup()
