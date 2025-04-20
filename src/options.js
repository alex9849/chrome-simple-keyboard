const languages = [
    { value: "arabic", label: "Arabic" },
    { value: "assamese", label: "Assamese" },
    { value: "armenianEastern", label: "Armenian Eastern" },
    { value: "armenianWestern", label: "Armenian Western" },
    { value: "balochi", label: "Balochi" },
    { value: "belarusian", label: "Belarusian" },
    { value: "bengali", label: "Bengali" },
    { value: "brazilian", label: "Brazilian" },
    { value: "burmese", label: "Burmese" },
    { value: "chinese", label: "Chinese" },
    { value: "czech", label: "Czech" },
    { value: "english", label: "English" },
    { value: "farsi", label: "Farsi" },
    { value: "french", label: "French" },
    { value: "georgian", label: "Georgian" },
    { value: "german", label: "German" },
    { value: "gilaki", label: "Gilaki" },
    { value: "greek", label: "Greek" },
    { value: "hebrew", label: "Hebrew" },
    { value: "hindi", label: "Hindi" },
    { value: "hungarian", label: "Hungarian" },
    { value: "italian", label: "Italian" },
    { value: "japanese", label: "Japanese" },
    { value: "kannada", label: "Kannada" },
    { value: "korean", label: "Korean" },
    { value: "kurdish", label: "Kurdish" },
    { value: "macedonian", label: "Macedonian" },
    { value: "malayalam", label: "Malayalam" },
    { value: "nigerian", label: "Nigerian" },
    { value: "nko", label: "Nko" },
    { value: "norwegian", label: "Norwegian" },
    { value: "odia", label: "Odia" },
    { value: "polish", label: "Polish" },
    { value: "punjabi", label: "Punjabi" },
    { value: "russian", label: "Russian" },
    { value: "russianOld", label: "Russian Old" },
    { value: "sindhi", label: "Sindhi" },
    { value: "spanish", label: "Spanish" },
    { value: "swedish", label: "Swedish" },
    { value: "telugu", label: "Telugu" },
    { value: "thai", label: "Thai" },
    { value: "turkish", label: "Turkish" },
    { value: "ukrainian", label: "Ukrainian" },
    { value: "urdu", label: "Urdu" },
    { value: "urduStandard", label: "Urdu Standard" },
    { value: "uyghur", label: "Uyghur" }
];


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
    const languageNode = document.getElementById('keyboard-layout')
    for(const language of languages) {
        const option = document.createElement("option");
        option.value = language.value
        option.text = language.label
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
