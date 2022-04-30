import Keyboard from 'simple-keyboard';

(function () {
    var keyboard;
    var input;
    var inputList;

    function setup() {
        console.log("hi")
        var baseUrl = "";
        if (chrome && chrome.extension && chrome.extension.getURL) {
            baseUrl = chrome.extension.getURL("");
        }
        let styleElement = document.createElement('style')
        styleElement.src = baseUrl + 'simple-keyboard/build/css/index.css'
        document.body.appendChild(styleElement);

        let keyboardElement = document.createElement('div')
        keyboardElement.className = 'simple-keyboard'
        document.body.append(keyboardElement)

        const keyboard = new Keyboard({
            onKeyPress: button => this.onKeyPress(button)
        });
    }

    function onKeyPress(button) {

    }
    setup()
})()
