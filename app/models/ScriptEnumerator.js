module.exports = function (db) {

    class ScriptVersionEnumerator {
        constructor(scriptname) {
            this.scriptname = scriptname;
            this.collection = db.scriptData;
        }

        // List Script Versions from scriptname

        listScripts() {
            return this.collection.findAsync({})
                .then(docs => {
                    let tmp = {};
                    let res = [];
                    for (let i = 0; i < docs.length; i++) {
                        let doc = docs[i];
                        tmp[doc.scriptname] = true;
                    }
                    res = Object.keys(tmp);
                    return res;
                });

        }
    }
    return ScriptVersionEnumerator;
};

