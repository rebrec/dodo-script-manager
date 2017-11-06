process.env.NODE_ENV = 'test'; // set env before
const helper = require('../../helpers/data');
const Promise = require('bluebird');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../../config');
const ScriptSettingFactory = require(config.projectRoot + '/app/models/ScriptSettings');



function generateRandomData() {
    let randomBase = Math.random().toString(36).substring(7);
    return {
        scriptname: 'scriptname-' + randomBase,
        scriptversion: 'scriptversion-' + randomBase,
        hostname: 'hostname-' + randomBase
    }
}

chai.use(chaiHttp);


describe('ScriptSettings', function () {

    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);
    

    it('getScriptSettings() should return an object containing all the settings (beta settings)', function (done) {
        const ScriptSettings = ScriptSettingFactory(helper.db);
        const params = generateRandomData();
        let scriptSettings = new ScriptSettings(params.scriptname, params.scriptversion);
        Promise.resolve()
            .then(_=>{
                return scriptSettings.collection.insertAsync({scriptname: params.scriptname, scriptversion: params.scriptversion, beta: true})
            })
            .then(_=>{
                return scriptSettings.getScriptSettings()
            })
            .then(res => {
                expect(res).to.be.a('object');
                expect(res.beta).to.equal(true);
                done();
            });
    });

    it('setScriptSettings() store all settings for the specific script', function (done) {
        const ScriptSettings = ScriptSettingFactory(helper.db);
        const params = generateRandomData();
        let scriptSettings = new ScriptSettings(params.scriptname, params.scriptversion);
        let settings = {beta: true};
        scriptSettings.setScriptSettings(settings)
            .then(_=>{
                return helper.db.settings.findAsync({scriptname: params.scriptname, scriptversion: params.scriptversion});
            })
            .then(dbData=> {
                helper.db.settings.findAsync({scriptname: params.scriptname, scriptversion: params.scriptversion})
                expect(dbData).to.be.a('array');
                expect(dbData.length).to.equal(1);
                expect(dbData[0].beta).to.equal(true);
                done();
            });
    });


});



