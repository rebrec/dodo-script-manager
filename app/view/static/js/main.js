document.addEventListener('DOMContentLoaded', main);

let dropdownScriptnames, dropdownScriptVersions, hostDataTable, settingStatus;
let myApp = {
    scriptname: null,
    scriptversion: null
};
let settingsLoaded;
let savedSettings;
let api;



function main() {
    if (localStorage.getItem('myApp')) {
        savedSettings = JSON.parse(localStorage.getItem('myApp'));
        settingsLoaded = false;
    } else {
        savedSettings = myApp;
        settingsLoaded = true;
    }
    api = new Api(config);
    settingStatus = new SettingStatus('#setting-status', config);
    dropdownScriptnames = new DropDownList('#dropdown-scriptname', {emptyArrayValue: 'No  Script Available'});
    dropdownScriptVersions = new DropDownList('#dropdown-scriptversion', {emptyArrayValue: 'No Version Available'});
    hostDataTable = new DataTable('#host-datatable');

    dropdownScriptnames.onChange        = onDropDownScriptnamesChange;
    dropdownScriptVersions.onChange     = onDropDownScriptVersionsChange;
    hostDataTable.onRemove              = onRemoveHost;
    hostDataTable.onRemoveTesterClick   = onRemoveTesterClick;
    hostDataTable.onAddTesterClick      = onAddTesterClick;

    dropdownScriptnames.setDataSourceURL(config.scriptnameListURL);

}


function onDropDownScriptnamesChange(scriptname) {
    if (  !settingsLoaded
        && savedSettings.scriptname
        && savedSettings.scriptname !== scriptname ) return dropdownScriptnames.select(savedSettings.scriptname);

    myApp.scriptname = scriptname;
    let url = config.scriptnameListURL + '/' + scriptname;
    dropdownScriptVersions.setDataSourceURL(url)
}

function onDropDownScriptVersionsChange(scriptversion) {
    if (  !settingsLoaded
        && savedSettings.scriptversion
        && savedSettings.scriptversion !== scriptversion ) {
        return dropdownScriptVersions.select(savedSettings.scriptversion);
    }
    if (!settingsLoaded && savedSettings.scriptversion === scriptversion) settingsLoaded = true;

    myApp.scriptversion = scriptversion;
    localStorage.setItem('myApp', JSON.stringify(myApp));
    updateHostDataTable();
    updateSettingStatus();
}

function updateHostDataTable(){
    let url = config.scriptnameListURL + '/' + myApp.scriptname + '/' + myApp.scriptversion;
    api.getScriptSettings(myApp.scriptname,  myApp.scriptversion)
        .then(settings => {
            hostDataTable.setScriptSettings(settings);
            hostDataTable.setDataSourceURL(url);
        });


}

function onRemoveHost(hostname) {
    api.removeHost(myApp.scriptname, myApp.scriptversion, hostname)
        .then(res =>{
            onDropDownScriptVersionsChange(myApp.scriptversion);
            // Do something with the result
        });
}

function onAddTesterClick(hostname) {
    api.addTester(myApp.scriptname, myApp.scriptversion, hostname)
        .then(res => {
            updateHostDataTable();
        });
}

function onRemoveTesterClick(hostname) {
    api.removeTester(myApp.scriptname, myApp.scriptversion, hostname)
        .then(res => {
            updateHostDataTable();
        });
}

function updateSettingStatus() {
    settingStatus.setScript(myApp.scriptname, myApp.scriptversion);
}