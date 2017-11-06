module.exports = function (db) {

    const Promise = require('bluebird');


    class ScriptSettings {
        constructor(scriptname, scriptVersion = null) {
            this.scriptname = scriptname;
            this.scriptversion = scriptVersion;
            this.collection = db.settings;
        }


        getScriptSettings() {
            return Promise.resolve()
                .then(_ => {
                    return this.collection.findOneAsync({scriptname: this.scriptname, scriptversion: this.scriptversion})
                })
                .then(res=> {
                    if (!res) return {};
                    // delete res.scriptname;
                    // delete res.scriptversion;
                    delete res._id;
                    return res
                });

        }

        setScriptSettings(settings) {
            let filter = {scriptname: this.scriptname, scriptversion: this.scriptversion}
            let object;
            object = Object.assign(filter, settings);
            return this.collection.updateAsync(filter, object, {upsert: true});
        }
    }

    return ScriptSettings;
};