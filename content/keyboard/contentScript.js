import {
  setLanguageLayout,
  setupKeyboard
} from 'src/services/keyboard/content/keyboard/keyboardScript'

function setup() {
  chrome.storage.sync.get({
    language: 'english',
  }).then(item => {
    setLanguageLayout(item.language)
  });
  setupKeyboard()
}

setup()
