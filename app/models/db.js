const Datastore = require('nedb');
const Promise = require('bluebird');

let db = {};


function loadAllDatabases() {
    let promises = [];
    promises.push(db.scriptData.loadDatabaseAsync());
    promises.push(db.settings.loadDatabaseAsync());
    return Promise.all(promises)
        .then(_=> {
            return db
        });
}

module.exports = function (config) {

    db.scriptData = new Datastore({filename: config.dbScriptDataFilename});
    db.scriptData.persistence.setAutocompactionInterval(5 * 60 * 1000);
    db.settings = new Datastore({filename: config.dbSettingsFilename});
    db.settings.persistence.setAutocompactionInterval(5 * 60 * 1000);
    Promise.promisifyAll(db.scriptData);
    Promise.promisifyAll(db.settings);
    return {
        loadAllDatabases: loadAllDatabases
    };
};
