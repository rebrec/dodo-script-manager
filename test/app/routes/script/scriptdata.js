const helper = require('../../../helpers/data');
const Promise = require('bluebird');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../../../config');
const dbLoader = require(config.projectRoot + '/app/models/db')(config);
const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');

chai.use(chaiHttp);

describe('API Endpoint /api/script', function () {
    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);


    it('GET a script not existing return an empty array', function (done) {
        chai.request(helper.app)
            .get('/api/script/not_exist')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.be.equal(0);
                done();
                // expect(res.body.data).to.be.equal('');;
            });
    });

    it('GET /script/script_name_1', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_1')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.be.equal(3);
                expect(res.body.data).to.contains('0.1');
                expect(res.body.data).to.contains('0.2');
                expect(res.body.data).to.contains('0.3');
                expect(res.body.data).to.not.contains('0.4');
                done();
                // expect(res.body.data).to.be.equal('');;
            });
    });

    it('GET /script/script_name_2/0.2', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_1/0.2')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.be.equal(2);
                let host1Found = false;
                let data = res.body.data;
                for (let i=0;i<data.length;i++){
                    let elt = data[i];
                    if (elt.hostname.indexOf('host1')>-1){
                        host1Found = true;
                        break;
                    }
                }
                expect(host1Found).to.be.equal(true);
                done();
            });
    });


    it('GET /script/script_name_1/0.2/host1', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_1/0.2/host1')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('boolean');
                expect(res.body.data).to.be.equal(true);
                done();
            });
    });
    it('GET /script/script_name_1/0.2/host_not_exist', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_1/0.2/host_not_exist')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('boolean');
                expect(res.body.data).to.not.be.equal(true);
                done();
            });
    });


    it('DELETE /script/script_name_1/0.2/host1', function (done) {
        chai.request(helper.app)
            .delete('/api/script/script_name_1/0.2/host1')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.scriptData.findAsync({scriptname: 'script_name_1', scriptversion: '0.2', hostname: 'host1'})
                    .then(data => {
                        expect(data.length).to.be.equal(0);
                        done();
                    })

            });
    });
    it('DELETE /script/script_name_1/0.2/host_not_exist', function (done) {
        chai.request(helper.app)
            .delete('/api/script/script_name_1/0.2/host_not_exist')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                done();
            });
    });

    it('PUT /script/script_name_1/0.2/new_host', function (done) {
        chai.request(helper.app)
            .put('/api/script/script_name_1/0.2/new_host')
            .send({ prop1: 'val1', prop2: 'val2'})
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.scriptData.findAsync({scriptname: 'script_name_1', scriptversion: '0.2', hostname: 'new_host'})
                    .then(data => {
                        expect(data).to.be.an('array');
                        expect(data.length).to.be.equal(1);
                        expect(data[0].hostname).to.be.equal('new_host');
                        expect(data[0].executed).to.be.equal(true);
                        expect(data[0].additionnalData.prop1).to.be.equal("val1");
                        expect(data[0].additionnalData.prop2).to.be.equal("val2");
                        done();
                    });
            });
    });

    it('PUT /script/script_name_1/0.1/host-not-executed', function (done) {
        chai.request(helper.app)
            .put('/api/script/script_name_1/0.1/host-not-executed')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.scriptData.findAsync({scriptname: 'script_name_1', scriptversion: '0.1', hostname: 'host-not-executed'})
                    .then(data => {
                        expect(data).to.be.an('array');
                        expect(data.length).to.be.equal(1);
                        expect(data[0].hostname).to.be.equal('host-not-executed');
                        expect(data[0].executed).to.be.equal(true);
                        done();
                    });
            });
    });


    it('BETA GET /script/script_name_beta/0.1/host-beta-not-executed', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_beta/0.1/host-beta-not-executed')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('boolean');
                expect(res.body.data).to.be.equal(false);
                done();
            });
    });


    it('BETA GET /script/script_name_beta/0.1/host-beta-executed (tester)', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_beta/0.1/host-beta-executed')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('boolean');
                expect(res.body.data).to.be.equal(true);
                done();
            });
    });

    it('BETA GET /script/script_name_beta/0.1/new_host2 (not tester)', function (done) {
        chai.request(helper.app)
            .get('/api/script/script_name_beta/0.1/new_host2')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('boolean');
                expect(res.body.data).to.be.equal(false);
                done();
            });
    });


    it('BETA PUT /script/script_name_beta/0.1/new_host1 (tester)', function (done) {
        chai.request(helper.app)
            .put('/api/script/script_name_beta/0.1/new_host1')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.scriptData.findAsync({scriptname: 'script_name_beta', scriptversion: '0.1', hostname: 'new_host1'})
                    .then(data => {
                        expect(data).to.be.an('array');;
                        expect(data.length).to.be.equal(1);;
                        expect(data[0].hostname).to.be.equal('new_host1');
                        expect(data[0].executed).to.be.equal(true);
                        done();
                    });
            });
    });


    it('BETA PUT /script/script_name_beta/0.1/new_host2 (not tester)', function (done) {
        chai.request(helper.app)
            .put('/api/script/script_name_beta/0.1/new_host1')
            .end(function (err, res) {
                expect(res).to.have.status(201);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.scriptData.findAsync({scriptname: 'script_name_beta', scriptversion: '0.1', hostname: 'new_host1'})
                    .then(data => {
                        expect(data).to.be.an('array');;
                        expect(data.length).to.be.equal(1);;
                        expect(data[0].hostname).to.be.equal('new_host1');
                        expect(data[0].executed).to.be.equal(true);
                        done();
                    });
            });
    });

});



