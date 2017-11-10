module.exports = function (db) {

    const Promise = require('bluebird');


    class ScriptData {
        constructor(scriptname, scriptVersion = null) {
            this.scriptname     = scriptname;
            this.scriptversion  = scriptVersion;
            this.collection     = db.scriptData;
            // function promisification (only useful one, exposed publicly)
        }

        recordExecution(hostname, executed=true) {
            return this.isAlreadyExecuted(hostname)
                .then(alreadyExecuted=> {
                    if (alreadyExecuted) {
                        return
                    } else {
                        let recordTimestamp = (new Date()).toISOString().replace('T',' ').slice(0,-5)
                        return this.collection.updateAsync(
                            {
                                scriptname: this.scriptname,
                                scriptversion: this.scriptversion,
                                hostname: hostname
                            },
                            {
                                scriptname: this.scriptname,
                                scriptversion: this.scriptversion,
                                hostname: hostname,
                                recordTimestamp: recordTimestamp,
                                executed: executed
                            },
                            {   upsert : true    }
                        );
                    }
                });
        }

        isAlreadyExecuted(hostname) {
            return this.collection.findAsync({scriptname: this.scriptname, scriptversion: this.scriptversion, hostname: hostname})
                .then(res=> {
                    if (res.length === 0) return false;
                    else {
                        let h = res[0];
                        if (!h.hasOwnProperty('executed')){
                            throw new Error('Host do no have "executed" property !');
                        }
                        return h.executed;
                    }
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
                        // compatibility with previous version (fix missing fields)
                        if (!doc.hasOwnProperty('recordTimestamp')) doc.recordTimestamp = 'not saved'
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