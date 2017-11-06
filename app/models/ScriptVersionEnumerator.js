module.exports = function (db) {

    const Promise = require('bluebird');


    class ScriptVersionEnumerator {
        constructor(scriptname) {
            this.scriptname = scriptname;
            this.collection = db.scriptData;
            // function promisification (ugly, one by one)
            this.findOne = Promise.promisify(this.collection.findOne.bind(this.collection));
            this.find = Promise.promisify(this.collection.find.bind(this.collection));
            this.insert = Promise.promisify(this.collection.insert.bind(this.collection));
            this.remove = Promise.promisify(this.collection.remove.bind(this.collection));
        }

        // List Script Versions from scriptname

        listVersions() {
            return this.find({scriptname: this.scriptname})
                .then(docs => {
                    let tmp = {};
                    let res = [];
                    for (let i = 0; i < docs.length; i++) {
                        let doc = docs[i];
                        tmp[doc.scriptversion] = true;
                    }
                    res = Object.keys(tmp);
                    return res;
                });

        }
    }
    return ScriptVersionEnumerator;
};

