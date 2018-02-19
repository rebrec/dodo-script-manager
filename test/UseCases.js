const config = require('../config');

const chai = require('chai');
const chaiHttp = require('chai-http');
const Promise = require('bluebird');
const expect = chai.expect;

const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');
const helper = require(config.projectRoot + '/test/helpers/data');


chai.use(chaiHttp);


describe('ScriptData', function () {

    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);

    it('Testing whole process of checking isAlreadyExecuted + recordExec + isAlreadyExecuted again', function (done) {
        let scriptName = 'someScriptname';
        let scriptVersion = '1.0';
        let hostname = 'PC-BLAH';
        let data = {};
        // isAlreadyExecuted     $state = Invoke-RestMethod -Method Get -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"
        // Save-ExecutionStatus  $state = Invoke-RestMethod -Method Put -Uri "$BASE_URL/$SCRIPT_NAME/$SCRIPT_VERSION/$($env:COMPUTERNAME)"
        // ListHosts             GET ('/script/:script_name/:script_version')
        new Promise((resolve, reject)=> {
            console.log('get 1');
            chai.request(helper.app)
                .get('/api/script/' + scriptName + '/' + scriptVersion + '/' + hostname)
                .end(function (err, res) {
                    expect(res).to.have.status(200);
                    console.log('end 1');

                    resolve();
                });
        })
            .then(_=> {
                return new Promise((resolve, reject)=> {
                    console.log('get 2');
                    chai.request(helper.app)
                        .get('/api/script/' + scriptName + '/' + scriptVersion) // List Hosts
                        .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('object');
                            expect(res.body.data).to.be.an('array');
                            expect(res.body.data.length).to.be.equal(1);;
                            expect(res.body.data[0].lastCheckTimestamp).to.be.an('string');
                            expect(res.body.data[0].lastCheckTimestamp).to.match(/\d{4}-\d{2}.+/);
                            console.log('end 2');
                            resolve();
                        })
                })
            })
            .then(_=> {
                return new Promise((resolve, reject)=> {
                    console.log('get 3');
                    chai.request(helper.app)
                        .put('/api/script/' + scriptName + '/' + scriptVersion + '/' + hostname)
                        .send(data)
                        .end(function (err, res) {
                            expect(res).to.have.status(201);
                            console.log('end 3');
                            resolve();
                        });
                });
            })
            .then(_=> {
                return new Promise((resolve, reject)=> {
                    console.log('get 4');
                    chai.request(helper.app)
                        .get('/api/script/' + scriptName + '/' + scriptVersion) // List Hosts
                        .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('object');
                            expect(res.body.data).to.be.an('array');
                            expect(res.body.data.length).to.be.equal(1);;
                            expect(res.body.data[0].lastCheckTimestamp).to.be.an('string');
                            expect(res.body.data[0].lastCheckTimestamp).to.match(/\d{4}-\d{2}.+/);
                            expect(res.body.data[0].recordTimestamp).to.be.an('string');
                            expect(res.body.data[0].lastCheckTimestamp).to.match(/\d{4}-\d{2}.+/);
                            expect(res.body.data[0].hostname).to.be.an('string');
                            expect(res.body.data[0].hostname).to.be.equal(hostname);
                            expect(res.body.data[0].executed).to.be.an('boolean');
                            expect(res.body.data[0].executed).to.be.equal(true);
                            resolve();
                        });
                });
            })
            .then(_=> {
                return new Promise((resolve, reject)=> {
                    chai.request(helper.app)
                        .get('/api/script/' + scriptName + '/' + scriptVersion + '/' + hostname)
                        .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('object');
                            expect(res.body.data).to.be.equal(true);
                            resolve();
                        });
                });
            })
            .then(_=> {
                return new Promise((resolve, reject)=> {
                    chai.request(helper.app)
                        .get('/api/script/' + scriptName + '/' + scriptVersion) // List Hosts
                        .end(function (err, res) {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('object');
                            expect(res.body.data).to.be.an('array');
                            expect(res.body.data.length).to.be.equal(1);;
                            expect(res.body.data[0].lastCheckTimestamp).to.be.an('string');
                            expect(res.body.data[0].lastCheckTimestamp).to.match(/\d{4}-\d{2}.+/);
                            expect(res.body.data[0].recordTimestamp).to.be.an('string');
                            expect(res.body.data[0].lastCheckTimestamp).to.match(/\d{4}-\d{2}.+/);
                            expect(res.body.data[0].hostname).to.be.an('string');
                            expect(res.body.data[0].hostname).to.be.equal(hostname);
                            expect(res.body.data[0].executed).to.be.an('boolean');
                            expect(res.body.data[0].executed).to.be.equal(true);
                            resolve();
                        });
                });
            })
            .then(done);
    });

    // expect(res).to.be.json;
    //         expect(res.body).to.be.an('object');
    //         expect(res.body.status).to.be.an('string');
    //         expect(res.body.status).to.be.equal('success');
    //         expect(res.body.data).to.be.an('array');
    //         expect(res.body.data.length).to.be.equal(0);
    //         done();
    //         // expect(res.body.data).to.be.equal('');;

});



