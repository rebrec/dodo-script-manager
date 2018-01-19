class Api {
    constructor(config) {
        this._config = config;
    }


    getScriptSettings(scriptname, scriptversion) {
        if (!scriptname) throw new Error('undefined scriptname value');
        if (!scriptversion) throw new Error('undefined scriptversion value');
        let url = this._config.scriptApiSettingURL + '/' + scriptname + '/' + scriptversion;
        return new Promise((resolve, reject) =>{
            $.getJSON(url, data => {
                if (data.status !== 'success')      return reject('Failed to fetch url : ' + JSON.stringify(data));
                // if (typeof data.data.length !== 'number')   return reject('Retrieved data is not an Array! (no length property)');
                return resolve(data.data);
            });
        });

    }

    removeHost(scriptname, scriptversion, hostname) {
        let url = config.scriptnameListURL + '/' + scriptname + '/' + scriptversion + '/' + hostname;
        let data = {};
        return $.ajax({
            url: url,
            type: 'DELETE',
            data: data
        });
    }

    addTester(scriptname, scriptversion, hostname) {
        if (!scriptname) throw new Error('undefined scriptname value');
        if (!scriptversion) throw new Error('undefined scriptversion value');
        if (!hostname) throw new Error('undefined hostname value');
        let url = this._config.scriptApiSettingURL + '/' + scriptname + '/' + scriptversion + '/' + hostname;
        let data = {};
        return $.ajax({
            url: url,
            type: 'PUT',
            data: data
        });
    }

    removeTester(scriptname, scriptversion, hostname) {
        if (!scriptname) throw new Error('undefined scriptname value');
        if (!scriptversion) throw new Error('undefined scriptversion value');
        if (!hostname) throw new Error('undefined hostname value');
        let url = this._config.scriptApiSettingURL + '/' + scriptname + '/' + scriptversion + '/' + hostname;
        let data = {};
        return $.ajax({
            url: url,
            type: 'DELETE',
            data: data
        });
    }
    
    
}