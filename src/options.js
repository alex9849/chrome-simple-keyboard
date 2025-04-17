
// Saves options to chrome.storage
function save_options() {
    var language = document.getElementById('language').value;
    chrome.storage.sync.set({
        language: language
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
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
    const languageNode = document.getElementById('language')
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
