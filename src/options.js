
// Saves options to chrome.storage
function save_options() {
    const language = document.getElementById('keyboard-layout').value;
    chrome.storage.sync.set({
        language: language
    }, function() {
        // Update status to let user know options were saved.
        const status = document.getElementById('save');
        status.textContent = "Options saved! \u{2713}";
        setTimeout(function() {
            status.textContent = 'Save';
        }, 2000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    const languages = [
        "arabic", "assamese", "armenianEastern", "armenianWestern", "balochi", "belarusian", "bengali", "brazilian",
        "burmese", "chinese", "czech", "english", "farsi", "french", "georgian", "german", "gilaki", "greek", "hebrew",
        "hindi", "hungarian", "italian", "japanese", "kannada", "korean", "kurdish", "macedonian", "malayalam",
        "nigerian", "nko", "norwegian", "odia", "polish", "punjabi", "russian", "russianOld", "sindhi", "spanish",
        "swedish", "telugu", "thai", "turkish", "ukrainian", "urdu", "urduStandard", "uyghur"
    ]
    const languageNode = document.getElementById('keyboard-layout')
    for(const language of languages) {
        const option = document.createElement("option");
        option.value = language
        option.text = language
        languageNode.appendChild(option)
    }

    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        language: 'english',
    }, function(items) {
        languageNode.value = items.language;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
