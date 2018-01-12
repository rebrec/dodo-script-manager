module.exports = function (db) {

    const Promise = require('bluebird');


    class ScriptSettings {
        constructor(scriptname, scriptVersion = null) {
            this.scriptname = scriptname;
            this.scriptversion = scriptVersion;
            this.collection = db.settings;
            this.filter = {scriptname: this.scriptname, scriptversion: this.scriptversion};
        }

        getScriptSettings() {
            return Promise.resolve()
                .then(_ => {
                    return this.collection.findOneAsync(this.filter)
                })
                .then(res=> {
                    if (!res) res = {};
                    // delete res.scriptname;
                    // delete res.scriptversion;
                    delete res._id;
                    if (!res.beta) { res.beta = true;} // default state for scripts is beta=true
                    return this._setDefaultSettings(res)
                });

        }

        _setDefaultSettings(settings){
            if (!settings.hasOwnProperty('beta'))       settings.beta = true; // BETA MODE is On by default
            if (!settings.hasOwnProperty('testers'))    settings.testers = []; // BETA MODE is On by default
            return settings;
        }

        _setScriptSettings(settings) {
            return this.collection.findAsync(this.filter)
                .then(res=> {
                    let doc;
                    if (res.length !== 0) {
                        doc = res[0];
                    } else {
                        doc = this._setDefaultSettings(this.filter);
                    }
                    return doc;
                })
                .then(doc => {
                    let object;
                    object = Object.assign(doc, settings);
                    return this.collection.updateAsync(this.filter, doc, {upsert: true});
                });
        }

        _setBetaMode(mode) {
            return this.getScriptSettings()
                .then(settings=> {
                    settings.beta = mode;
                    return this._setScriptSettings(settings);
                })
        }
        
        isAllowedToRun(hostname){
            return this.getScriptSettings()
                .then(settings=> {
                    if (settings.beta) {
                        return (settings.testers.indexOf(hostname) > -1)
                    } else {
                        return true;
                    }
                });
        }
        
        enableBeta(){
            return this._setBetaMode(true);
        }

        disableBeta(){
            return this._setBetaMode(false);
        }

        addTester(uid){
            return this.getScriptSettings()
                .then(settings=>{
                    let index = settings.testers.indexOf(uid);
                    if (index === -1) settings.testers.push(uid);
                    return this._setScriptSettings(settings);
                })

        }

        delTester(uid){
            return this.getScriptSettings()
                .then(settings=>{
                    let index = settings.testers.indexOf(uid);
                    if (index !== -1) settings.testers.splice(index, 1);
                    return this._setScriptSettings(settings);
                })

        }
    }

    return ScriptSettings;
};