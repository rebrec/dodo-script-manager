const helper = require('../../../helpers/data');
const Promise = require('bluebird');

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../../../config');
const dbLoader = require(config.projectRoot + '/app/models/db')(config);
const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');

chai.use(chaiHttp);

describe('API Endpoint /api/script/settings', function () {
    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);

    it('GET /script/settings/script_name_custom_param/0.1', function (done) {
        chai.request(helper.app)
            .get('/api/script/settings/script_name_custom_param/0.1')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body.data.beta).to.be.equal(true);
                expect(res.body.data.someother).to.be.an('string');
                expect(res.body.data.someother).to.be.equal('param');
                done();
            });
    });

    it('POST /script/settings/script_name_14/1', function (done) {
        chai.request(helper.app)
            .post('/api/script/settings/script_name_14/1')
            .type('form')
            .send({
                'beta': 'true',
                'another': 'thing'
            })
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                helper.db.settings.findAsync({scriptname: 'script_name_14', scriptversion: '1'})
                    .then(data => {
                        expect(data).to.be.an('array');;
                        expect(data.length).to.be.equal(1);;
                        expect(data[0].beta).to.be.equal('true');
                        expect(data[0].another).to.be.equal('thing');
                        done();
                    });
            });
    });

});



