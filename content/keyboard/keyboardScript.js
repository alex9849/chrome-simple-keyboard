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

export const languageLayouts = {
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
  default: ["1 2 3 {bksp}", "4 5 6 {enter}", "7 8 9 .", "{tab} 0 - {downkeyboard}"],
}

const querySelector = 'input:not([readonly]), textarea:not([readonly])'
let keyboard;
let keyboardElement;
let keyboardTogglerElement;
let inputElement;
let inputElementNumeric = false
let keyboardHideTask = null;
let languageLayout = createKeyboardLayout(english);
let shiftPressed = false;
let lockPressed = false;
let isMouseDown = false;
let enableKeyboard = true;
let autoToggleIntervalId = null;
let listenersRegistered = false;
let keyboardStyleElement;

const windowEventTypes = ['input', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'selectstart', 'click']
const windowEventHandlers = new Map()

const bodyMouseDownHandler = () => {
  isMouseDown = true;
}

const bodyMouseUpHandler = () => {
  onMouseUp();
}

const bodyKeyDownHandler = event => {
  onPhysicalKeyDown(event);
}

const bodyKeyUpHandler = event => {
  onPhysicalKeyUp(event);
}

function appendDownKeyboardKey(rows = []) {
  if (!rows.length) {
    return rows
  }

  const normalizedRows = [...rows]
  const lastRowIndex = normalizedRows.length - 1
  if (!normalizedRows[lastRowIndex].includes("{downkeyboard}")) {
    normalizedRows[lastRowIndex] += " {downkeyboard}"
  }
  if (normalizedRows[lastRowIndex].includes("@")) {
    normalizedRows[lastRowIndex] = normalizedRows[lastRowIndex].replace("@ ", "")
  }
  if (normalizedRows[lastRowIndex].includes(".com")) {
    normalizedRows[lastRowIndex] = normalizedRows[lastRowIndex].replace(".com ", "")
  }
  return normalizedRows
}

function createKeyboardLayout(layout) {
  const resolvedLayout = typeof layout === "string" ? languageLayouts[layout] : layout
  const fallbackLayout = resolvedLayout || english

  return {
    ...fallbackLayout,
    layout: {
      ...fallbackLayout.layout,
      default: appendDownKeyboardKey(fallbackLayout.layout?.default),
      shift: appendDownKeyboardKey(fallbackLayout.layout?.shift)
    }
  }
}

export function setLanguageLayout(layout) {
  languageLayout = createKeyboardLayout(layout)
  updateLayout()
}

export function getLanguageLayout() {
  return languageLayout
}

export function setEnableKeyboard(value) {
  enableKeyboard = value
  if (value) {
    const activeInputElement = getActiveInputElement()
    if (!activeInputElement || activeInputElement.matches(".no-keyboard, .no-keyboard-no-toggler")) {
      return
    }

    if (inputElement !== activeInputElement) {
      autoToggleKeyboard()
      return
    }

    hideKeyboardToggler();
    showKeyboard();
    return
  }

  if (isKeyboardShown()) {
    hideKeyboard()
  }
}

function removeExistingKeyboardDom() {
  document.querySelectorAll('#virtual-keyboard, #keyboard-toggler').forEach(element => {
    element.remove()
  })
}

function destroyKeyboard() {
  if (autoToggleIntervalId !== null) {
    clearInterval(autoToggleIntervalId)
    autoToggleIntervalId = null
  }

  if (listenersRegistered && document.body) {
    document.body.removeEventListener('mousedown', bodyMouseDownHandler)
    document.body.removeEventListener('mouseup', bodyMouseUpHandler)
    document.body.removeEventListener('keydown', bodyKeyDownHandler)
    document.body.removeEventListener('keyup', bodyKeyUpHandler)
    windowEventTypes.forEach(type => {
      const handler = windowEventHandlers.get(type)
      if (handler) {
        window.removeEventListener(type, handler, true)
      }
    })
    listenersRegistered = false
  }

  if (keyboard?.destroy) {
    keyboard.destroy()
  }
  keyboard = null

  if (keyboardHideTask != null) {
    clearTimeout(keyboardHideTask)
    keyboardHideTask = null
  }

  inputElement = null
  inputElementNumeric = false
  shiftPressed = false
  lockPressed = false
  isMouseDown = false

  removeExistingKeyboardDom()

  if (keyboardStyleElement?.isConnected) {
    keyboardStyleElement.remove()
  }
  keyboardStyleElement = null
}

export function setupKeyboard() {
  destroyKeyboard()

  if (!languageLayout) {
    languageLayout = createKeyboardLayout(english)
  }
  keyboardStyleElement = document.createElement('link')
  keyboardStyleElement.rel = 'stylesheet'
  keyboardStyleElement.href = cssURL
  document.head.appendChild(keyboardStyleElement);

  keyboardElement = document.createElement('div')
  keyboardElement.id = "virtual-keyboard"
  keyboardElement.style = "display: none"
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
  document.body.addEventListener('mousedown', bodyMouseDownHandler);
  document.body.addEventListener('mouseup', bodyMouseUpHandler);
  document.body.addEventListener('keydown', bodyKeyDownHandler);
  document.body.addEventListener('keyup', bodyKeyUpHandler);

  windowEventTypes.forEach(type => {
    const handler = event => {
      if(isChildElement(event.target, keyboardElement)) {
        event.preventDefault()
      }
    }
    windowEventHandlers.set(type, handler)
    window.addEventListener(type, handler, true);
  });
  listenersRegistered = true

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
  autoToggleIntervalId = setInterval(() => {
    autoToggleKeyboard();
  }, 200);
  hideKeyboard()
}

function isKeyboardShown() {
  if(!keyboardElement) {
    return false
  }
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

  // Block physical inputs when editing a numeric field
  if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', 'Backspace', 'Tab', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    return event
  }
  if (event.key === '.' && !inputElement.value.includes('.')) {
    return event
  }
  if (event.key === '-' && inputElement.selectionStart === 0 && !inputElement.value.includes('-')) {
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
    if(![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '-', '{bksp}', ',', '.', '{tab}', '{enter}'].some(x => String(x) === button)) {
      return
    }
    if(button === ',') {
      button = '.'
    }
    if (button === '.' && inputElement.value.includes('.')) {
      return;
    }
    if (button === '-' && (inputElement.selectionStart !== 0 || inputElement.value.includes('-'))) {
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
  if (!enableKeyboard) {
    hideKeyboard();
    return;
  }

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
  if (!enableKeyboard) {
    return;
  }

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
  if (!enableKeyboard) {
    hideKeyboard();
    return;
  }

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

function getActiveInputElement() {
  if (document.activeElement.matches(querySelector)) {
    return document.activeElement
  }

  if (document.activeElement.shadowRoot?.activeElement.matches(querySelector)) {
    return document.activeElement.shadowRoot.activeElement
  }

  return null
}

function autoToggleKeyboard() {
  if(isMouseDown) {
    return
  }

  const activeInputElement = getActiveInputElement()

  if(activeInputElement) {
    if (inputElement === activeInputElement) {
      return
    }

    onFocus(activeInputElement)
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

export function updateLayout() {
  if(!keyboard) {
    return
  }
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
