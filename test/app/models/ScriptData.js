const helper = require('../../helpers/data');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../../config');
const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');


chai.use(chaiHttp);


describe('ScriptData', function () {

    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);

    it('isAlreadyExecuted() should return false if not inserted before', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const params = helper.generateRandomData();
        let scriptdata = new ScriptData(params.scriptname, params.scriptversion);
        scriptdata.isAlreadyExecuted(params.hostname)
            .then(res => {
                expect(res).to.be.a('boolean');
                expect(res).to.equal(false);
                done();
            });
    });

    it('isAlreadyExecuted() should return true if inserted before', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const params = helper.generateRandomData();
        let scriptdata = new ScriptData(params.scriptname, params.scriptversion);
        scriptdata.recordExecution(params.hostname)
            .then(_ => {
                return scriptdata.isAlreadyExecuted(params.hostname)
            })
            .then(res => {
                expect(res).to.be.a('boolean');
                expect(res).to.equal(true);
                done();
            });
    });


    it('recordExecution() insert an element into the datasource', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const params = helper.generateRandomData();
        let scriptdata = new ScriptData(params.scriptname, params.scriptversion);
        scriptdata.recordExecution(params.hostname)
            .then(_ => {
                helper.db.scriptData.findOneAsync({scriptname: params.scriptname})
                    .then((res) => {
                        expect(res).to.have.property('scriptname');
                        expect(res.scriptname).to.equal(params.scriptname);
                        expect(res).to.have.property('scriptversion');
                        expect(res.scriptversion).to.equal(params.scriptversion);
                        expect(res).to.have.property('hostname');
                        expect(res.hostname).to.equal(params.hostname);
                        expect(res).to.have.property('executed');
                        expect(res.executed).to.equal(true);
                        done();
                    });
            });
    });


    it('clearExecutionStatus() should remove a specific hostname', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const params1 = helper.generateRandomData();
        const params2 = helper.generateRandomData();
        const params3 = helper.generateRandomData();

        let scriptdata1 = new ScriptData(params1.scriptname, params1.scriptversion);
        let scriptdata2 = new ScriptData(params2.scriptname, params2.scriptversion);
        let scriptdata3 = new ScriptData(params3.scriptname, params3.scriptversion);

        Promise.resolve()
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname))
            .then(scriptdata2.recordExecution.bind(scriptdata2, params2.hostname))
            .then(scriptdata3.recordExecution.bind(scriptdata3, params3.hostname))
            .then(scriptdata2.clearExecutionStatus().bind(scriptdata2, params2.hostname))
            .then(_ => {
                let check = params1;
                helper.db.scriptData.findAsync({scriptname: check.scriptname})
                    .then((res) => {
                        expect(res.length).to.equal(1);
                    });
            })
            .then(_ => {
                let check = params2;
                helper.db.scriptData.findAsync({scriptname: check.scriptname})
                    .then((res) => {
                        expect(res.length).to.equal(1);
                    });
            })
            .then(_ => {
                let check = params3;
                helper.db.scriptData.findAsync({scriptname: check.scriptname})
                    .then((res) => {
                        expect(res.length).to.equal(1);
                        done();
                    });
            });
    });

    it('clearExecutionStatusByRegexp() can clear the helper.db using a wildcard regexp', function (done) {
        const ScriptData = ScriptDataFactory(helper.db);
        const params1 = helper.generateRandomData();

        let scriptdata1 = new ScriptData(params1.scriptname, params1.scriptversion);
        let initialRecordCount = 0;
        Promise.resolve()
            .then(_=>{
                return helper.db.scriptData.findAsync({})
            })
            .then(res =>{
                initialRecordCount = res.length;
            })
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-1'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-2'))
            .then(scriptdata1.recordExecution.bind(scriptdata1, params1.hostname + '-3'))
            .then(scriptdata1.clearExecutionStatusByRegexp.bind(scriptdata1, '.*'))
            .then(_ => {
                helper.db.scriptData.findAsync({})
                    .then((res) => {
                        expect(res.length).to.equal(initialRecordCount);
                        done();
                    });
            });
    });
    // it('listHosts() return every hosts of specific script name/version (not implemented yet)');
    
});



