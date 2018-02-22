module.exports = function (db) {

    const Promise = require('bluebird');
    const moment = require('moment');


    class ScriptData {
        constructor(scriptname, scriptVersion = null) {
            this.scriptname     = scriptname;
            this.scriptversion  = scriptVersion;
            this.collection     = db.scriptData;
            // function promisification (only useful one, exposed publicly)
        }

        recordExecution(hostname, additionnalData, executed = true) {
            // let recordTimestamp = (new Date()).toISOString().replace('T', ' ').slice(0, -5);
            let now = new Date();
            let recordTimestamp = moment(now).format("YYYY-MM-DD HH:mm:ss");
            return this.updateLastCheckTimestamp(hostname)
                .then(_ => {
                    return this.collection.findOneAsync({scriptname: this.scriptname, scriptversion: this.scriptversion, hostname: hostname})
                })
                .then(doc => {
                    if (doc.hasOwnProperty('executed') && JSON.parse(doc.executed) === true && JSON.parse(executed) === false){
                        // we will add additionnalData but will keep existing logs
                        additionnalData.logs = doc.additionnalData.logs;
                        executed = 'true';
                    }
                    doc.recordTimestamp = recordTimestamp;
                    doc.additionnalData = additionnalData;
                    doc.executed        = executed;

                    return this.collection.updateAsync(
                        {
                            scriptname: this.scriptname,
                            scriptversion: this.scriptversion,
                            hostname: hostname
                        },
                        doc,
                        {upsert: true}
                    );
                })
        }

        updateLastCheckTimestamp(hostname) {
            let timestamp = (new Date()).toISOString().replace('T', ' ').slice(0, -5);
            return this.collection.findAsync({
                scriptname: this.scriptname,
                scriptversion: this.scriptversion,
                hostname: hostname
            })
                .then(res=> {
                    let doc;
                    if (res.length !== 0) {
                        doc = res[0];
                    } else {
                        doc = {
                            scriptname: this.scriptname,
                            scriptversion: this.scriptversion,
                            hostname: hostname
                        }
                    }
                    doc.lastCheckTimestamp = timestamp;
                    return doc;
                })
                .then(doc => {
                    return this.collection.updateAsync(
                        {
                            scriptname: this.scriptname,
                            scriptversion: this.scriptversion,
                            hostname: hostname
                        },
                        doc,
                        {upsert: true}
                    );
                });
        }

        isAlreadyExecuted(hostname) {
            return this.updateLastCheckTimestamp(hostname)
                .then(_ => {
                    return this.collection.findOneAsync({scriptname: this.scriptname, scriptversion: this.scriptversion, hostname: hostname})
                })
                .then(doc => {
                    if (!doc.hasOwnProperty('executed')){
                        return false;
                    }
                    return doc.executed;
                });
        }


        clearExecutionStatus(hostname) {
            return this.collection.removeAsync({
                scriptname: this.scriptname,
                scriptversion: this.scriptversion,
                hostname: hostname
            }, {multi: true}); // multiple record removal
        }

        listHosts() {
            return this.collection.findAsync({scriptname: this.scriptname, scriptversion: this.scriptversion})
                .then(docs => {
                    let res = [];
                    for (let i = 0; i < docs.length; i++) {
                        let doc = docs[i];
                        // console.log(JSON.stringify(doc));
                        delete doc._id;
                        delete doc.scriptname;
                        delete doc.scriptversion;
                        if (!doc.hasOwnProperty('executed')) doc.executed = false;
                        // compatibility with previous version (fix missing fields)
                        if (!doc.hasOwnProperty('lastCheckTimestamp')) doc.lastCheckTimestamp = 'not available?';
                        if (!doc.hasOwnProperty('recordTimestamp')) doc.recordTimestamp = '';
                        if (!doc.hasOwnProperty('additionnalData')) doc.additionnalData = {};
                        res.push(doc);
                    }
                    return res;
                });
        }

        clearExecutionStatusByRegexp(regexp) {
            return this.collection.removeAsync({
                scriptname: this.scriptname,
                scriptversion: this.scriptversion,
                hostname: {$regex: new RegExp(regexp)}
            }, {multi: true}); // multiple record removal
        }

    }
    return ScriptData;
};