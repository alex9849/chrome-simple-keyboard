import {
  getLanguageLayout,
  setLanguageLayout,
  setupKeyboard,
  updateLayout
} from 'src/services/keyboard/content/keyboard/keyboardScript'

function setup() {
  chrome.storage.sync.get({
    language: 'english',
  }).then(item => {
    setLanguageLayout(item.language)
    const languageLayout = getLanguageLayout()
    const keyRowsDefault = languageLayout.layout.default;
    keyRowsDefault[keyRowsDefault.length - 1] += " {downkeyboard}"
    const keyRowsShift = languageLayout.layout.shift;
    keyRowsShift[keyRowsShift.length - 1] += " {downkeyboard}"
    updateLayout()
  });
  setupKeyboard()
}

setup()
