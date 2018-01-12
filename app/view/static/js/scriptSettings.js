document.addEventListener('DOMContentLoaded', main);

// global var defined : scriptSettings
let betaSelector = '#script-settings-field-beta';

let betaField;


function main() {
    $('#script-settings-label-scriptname').text(scriptSettings.scriptName);
    $('#script-settings-label-scriptversion').text(scriptSettings.scriptVersion);
    betaField = new SettingsBetaToggle(betaSelector, config);
    betaField.setScript(scriptSettings.scriptName, scriptSettings.scriptVersion);
}

