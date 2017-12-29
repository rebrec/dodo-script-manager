process.env.NODE_ENV = 'test'; // set env before
const helper = require('../../helpers/data');
const Promise = require('bluebird');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../../config');
const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');
const ScriptVersionEnumeratorFactory = require(config.projectRoot + '/app/models/ScriptVersionEnumerator');
let db;



chai.use(chaiHttp);


describe('ScriptVersionEnumerator', function () {

    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);

    it('listVersions() should return an array of unique elements - test1', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const ScriptVersionEnumerator = ScriptVersionEnumeratorFactory(helper.db);
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
                const scriptDataEnumerator = new ScriptVersionEnumerator(params1.scriptname);
                scriptDataEnumerator.listVersions()
                    .then(res => {
                        expect(res).to.be.a('array');
                        expect(res.length).to.equal(2);
                        done();
                    });
            })
    });

    it('listVersions() should return an array of unique elements - test2', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const ScriptVersionEnumerator = ScriptVersionEnumeratorFactory(helper.db);
        const params1 = helper.generateRandomData();
        const params2 = helper.generateRandomData();
        const params3 = helper.generateRandomData();

        let scriptdata1 = new ScriptData(params1.scriptname, params1.scriptversion);
        let scriptdata2 = new ScriptData(params1.scriptname, params2.scriptversion);
        let scriptdata3 = new ScriptData(params3.scriptname, params1.scriptversion);

        Promise.resolve()
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-1'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-2'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-3'))
            .then(scriptdata2.recordExecution.bind(scriptdata2, params2.hostname + '-1'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-1'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-2'))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname + '-2'))
            .then(_ => {
                const scriptVersionEnumerator = new ScriptVersionEnumerator(params3.scriptname);
                scriptVersionEnumerator.listVersions()
                    .then(res => {
                        expect(res).to.be.a('array');
                        expect(res.length).to.equal(1);
                        done();
                    });
            })
    });


    it('listVersions(null) should return an empty array', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const ScriptVersionEnumerator = ScriptVersionEnumeratorFactory(helper.db);
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
                const scriptVersionEnumerator = new ScriptVersionEnumerator();
                scriptVersionEnumerator.listVersions()
                    .then(res => {
                        expect(res).to.be.a('array');
                        expect(res.length).to.equal(0);
                        done();
                    });
            })
    });

});



