document.addEventListener('DOMContentLoaded', main);

// global var defined : scriptSettings
let betaSelector = '#script-settings-field-beta';
let testerListSelector = '#script-settings-tester-list';

let betaField;
let testerList;


function main() {
    $('#script-settings-label-scriptname').text(scriptSettings.scriptName);
    $('#script-settings-label-scriptversion').text(scriptSettings.scriptVersion);
    betaField = new SettingsBetaToggle(betaSelector, config);
    testerList = new SettingsTesterList(testerListSelector, config);
    betaField.setScript(scriptSettings.scriptName, scriptSettings.scriptVersion);
    testerList.setScript(scriptSettings.scriptName, scriptSettings.scriptVersion);
    
}

