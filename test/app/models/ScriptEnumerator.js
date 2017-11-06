const helper = require('../../helpers/data');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const config = require('../../../config');

const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');
const ScriptEnumeratorFactory = require(config.projectRoot + '/app/models/ScriptEnumerator');




chai.use(chaiHttp);


describe('ScriptEnumerator', function () {

    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);


    it('listScripts() should return an array of unique elements', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const ScriptEnumerator = ScriptEnumeratorFactory(helper.db);
        const params1 = helper.generateRandomData();
        const params2 = helper.generateRandomData();
        const params3 = helper.generateRandomData();

        let scriptdata1 = new ScriptData(params1.scriptname, params1.scriptversion);
        let scriptdata2 = new ScriptData(params1.scriptname, params2.scriptversion);
        let scriptdata3 = new ScriptData(params3.scriptname, params3.scriptversion);

        Promise.resolve()
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-1'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-2'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-3'))
            .then(scriptdata2.recordExecution.bind(scriptdata2, params2.hostname + '-1'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-1'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-2'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-2'))
            .then(_ => {
                const scriptEnumerator = new ScriptEnumerator();
                scriptEnumerator.listScripts()
                    .then(res => {
                        expect(res).to.be.a('array');
                        expect(res.length).to.equal(6);
                        done();
                    });
            })
    });
});



