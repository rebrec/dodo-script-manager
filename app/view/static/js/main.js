document.addEventListener('DOMContentLoaded', main);

let dropdownScriptnames, dropdownScriptVersions, hostDataTable, settingStatus;
let myApp = {
    scriptname: null,
    scriptversion: null
};


let config = {
    scriptnameListURL:  '/api/script',
    scriptSettingURL:   '/api/script/settings'
};



function main() {
    settingStatus = new SettingStatus('#setting-status');
    dropdownScriptnames = new DropDownList('#dropdown-scriptname', {emptyArrayValue: 'No  Script Available'});
    dropdownScriptVersions = new DropDownList('#dropdown-scriptversion', {emptyArrayValue: 'No Version Available'});
    hostDataTable = new DataTable('#host-datatable');

    dropdownScriptnames.onChange = onScriptnamesChange;
    dropdownScriptVersions.onChange = onScriptVersionsChange;
    hostDataTable.onRemove = onRemoveHost;


    dropdownScriptnames.setDataSourceURL(config.scriptnameListURL);
}


function onScriptnamesChange(scriptname) {
    myApp.scriptname = scriptname;
    let url = config.scriptnameListURL + '/' + scriptname;
    dropdownScriptVersions.setDataSourceURL(url)
}

function onScriptVersionsChange(scriptversion) {
    myApp.scriptversion = scriptversion;
    let url = config.scriptnameListURL + '/' + myApp.scriptname + '/' + scriptversion;
    hostDataTable.setDataSourceURL(url);
    updateSettingStatus();
}

function onRemoveHost(hostname) {
    let url = config.scriptnameListURL + '/' + myApp.scriptname + '/' + myApp.scriptversion + '/' + hostname;
    $.ajax({
        url: url,
        type: 'DELETE',
        success: function (result) {
            console.log(result);
            onScriptVersionsChange(myApp.scriptversion);
            // Do something with the result
        }
    });

}

function updateSettingStatus() {
    let url = config.scriptSettingURL + '/' + myApp.scriptname + '/' + myApp.scriptversion;
    settingStatus.setDataSourceURL(url);
}