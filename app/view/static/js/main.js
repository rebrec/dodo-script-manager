document.addEventListener('DOMContentLoaded', main);

let dropdownScriptnames, dropdownScriptVersions, hostDataTable, settingStatus;
let myApp = {
    scriptname: null,
    scriptversion: null
};
let settingsLoaded;
let savedSettings;




function main() {
    if (localStorage.getItem('myApp')) {
        savedSettings = JSON.parse(localStorage.getItem('myApp'));
        settingsLoaded = false;
    } else {
        savedSettings = myApp;
        settingsLoaded = true;
    }


    settingStatus = new SettingStatus('#setting-status', config);
    dropdownScriptnames = new DropDownList('#dropdown-scriptname', {emptyArrayValue: 'No  Script Available'});
    dropdownScriptVersions = new DropDownList('#dropdown-scriptversion', {emptyArrayValue: 'No Version Available'});
    hostDataTable = new DataTable('#host-datatable');

    dropdownScriptnames.onChange = onDropDownScriptnamesChange;
    dropdownScriptVersions.onChange = onDropDownScriptVersionsChange;
    hostDataTable.onRemove = onRemoveHost;


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
    let url = config.scriptnameListURL + '/' + myApp.scriptname + '/' + scriptversion;
    hostDataTable.setDataSourceURL(url);
    localStorage.setItem('myApp', JSON.stringify(myApp));
    updateSettingStatus();
}

function onRemoveHost(hostname) {
    let url = config.scriptnameListURL + '/' + myApp.scriptname + '/' + myApp.scriptversion + '/' + hostname;
    $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
            console.log(result);
            onDropDownScriptVersionsChange(myApp.scriptversion);
            // Do something with the result
        }
    });

}

function updateSettingStatus() {
    settingStatus.setScript(myApp.scriptname, myApp.scriptversion);
}