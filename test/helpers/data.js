process.env.NODE_ENV = 'test'; // set env before
const Promise = require('bluebird');
const fs = require('fs');
const config = require('../../config');
const dbLoader = require(config.projectRoot + '/app/models/db')(config);
let db;
let app;
let server;


Promise.promisifyAll(fs);


let helpers = {};

function loadDB() {
    config.debug && console.log('Loading DB');
    return dbLoader.loadAllDatabases()
        .then(ldb => {
            config.debug && console.log('DB Loaded');
            db = ldb;
            helpers.db = db;
        });
}

function populateDB() {
    config.debug && console.log("Populating DB");
    return Promise.all([_populateDBScriptData(), _populateDBSettings()])
        .then(_=>{
            config.debug && console.log('populating done!');
        });
}

function _populateDBSettings() {
    let dataset = [
        {scriptname: 'script_name_custom_param', scriptversion: '0.1', someother: 'param'},
        {scriptname: 'script_name_1', scriptversion: '0.2', beta:true, testers:['host1'] },
        {scriptname: 'script_name_1', scriptversion: '0.3' },
        {scriptname: 'script_name_2', scriptversion: '0.1' },
        {scriptname: 'script_name_2', scriptversion: '0.2' },
        {scriptname: 'script_name_2', scriptversion: '0.3' },
        {scriptname: 'script_name_3', scriptversion: '0.1' },
        {scriptname: 'script_name_3', scriptversion: '0.4' },
        {scriptname: 'script_name_beta', scriptversion: '0.1', beta: true, testers:['host-beta-executed', 'host-beta-not-executed', 'new_host1']}
    ];
    return db.settings.insertAsync(dataset)
}

function _populateDBScriptData() {
    let dataset = [
        {scriptname: 'script_name_1', scriptversion: '0.1', hostname: 'host-executed', executed: true},
        {scriptname: 'script_name_1', scriptversion: '0.1', hostname: 'host-not-executed', executed: false},
        {scriptname: 'script_name_1', scriptversion: '0.1', hostname: 'host1', executed: true},
        {scriptname: 'script_name_1', scriptversion: '0.2', hostname: 'host1', executed: true},
        {scriptname: 'script_name_1', scriptversion: '0.1', hostname: 'host2', executed: true},
        {scriptname: 'script_name_1', scriptversion: '0.2', hostname: 'host2', executed: true},
        {scriptname: 'script_name_1', scriptversion: '0.3', hostname: 'host1', executed: true},
        {scriptname: 'script_name_2', scriptversion: '0.1', hostname: 'host1', executed: true},
        {scriptname: 'script_name_2', scriptversion: '0.2', hostname: 'host1', executed: true},
        {scriptname: 'script_name_2', scriptversion: '0.1', hostname: 'host2', executed: true},
        {scriptname: 'script_name_2', scriptversion: '0.2', hostname: 'host2', executed: true},
        {scriptname: 'script_name_2', scriptversion: '0.3', hostname: 'host1', executed: true},
        {scriptname: 'script_name_3', scriptversion: '0.1', hostname: 'host1', executed: true},
        {scriptname: 'script_name_3', scriptversion: '0.1', hostname: 'host4', executed: true},
        {scriptname: 'script_name_3', scriptversion: '0.4', hostname: 'host4', executed: true},
        {scriptname: 'script_name_beta', scriptversion: '0.1', hostname: 'host-beta-executed', executed: true},
        {scriptname: 'script_name_beta', scriptversion: '0.1', hostname: 'host-beta-not-executed', executed: false}
    ];
    return db.scriptData.insertAsync(dataset)
}

function removeDBFiles() {
    let promises = [];
    config.debug && console.log('Removing DB Files');
    promises.push(fs.statAsync(config.dbSettingsFilename)
        .then(_=> {
            config.debug && console.log('File Exist (' + config.dbSettingsFilename + ') removing')
            return fs.unlinkAsync(config.dbSettingsFilename);
        })
        .catch(err => {
            config.debug && console.log('File do not exist (' + config.dbSettingsFilename + ') not removing')
            return;
        })
    );

    promises.push(fs.statAsync(config.dbScriptDataFilename)
        .then(_=> {
            config.debug && console.log('File Exist (' + config.dbScriptDataFilename + ') removing')
            return fs.unlinkAsync(config.dbScriptDataFilename);
        })
        .catch(err => {
            config.debug && console.log('File do not exist (' + config.dbScriptDataFilename + ') not removing');
            return;
        })
    );
    return Promise.all(promises);
}

function initApp() {
    config.debug && console.log('Init App');
    app = require(config.projectRoot + '/app/main')(db);
    return new Promise((resolve, reject) => {
        server = app.listen(config.port, resolve);
    })
        .then(_=>{
            helpers.app = app;
        });
}

helpers.beforeTest = function beforeTest(done) {
    Promise.resolve()
        .then(removeDBFiles)
        .then(loadDB)
        .then(populateDB)
        .then(initApp)
        .then(done);

};


helpers.afterTest = function afterTest(done) {
    Promise.resolve()
        .then(_=>{
            app.server = null;
            helpers.db = null;
            server.close(done);
        });
};


helpers.generateRandomData = function generateRandomData() {
    let randomBase = Math.random().toString(36).substring(7);
    return {
        scriptname: 'scriptname-' + randomBase,
        scriptversion: 'scriptversion-' + randomBase,
        hostname: 'hostname-' + randomBase
    }
};



module.exports = helpers;