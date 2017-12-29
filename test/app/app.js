const helper = require('../helpers/data');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

const config = require('../../config');
const dbLoader = require(config.projectRoot + '/app/models/db')(config);
const ScriptDataFactory = require(config.projectRoot + '/app/models/scriptdata');



chai.use(chaiHttp);

describe('API Endpoint /api/script', function () {
    beforeEach(helper.beforeTest);
    afterEach(helper.afterTest);


    it('access to the endpoint', function (done) {
        chai.request(helper.app)
            .get('/api/script')
            .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body.status).to.be.an('string');
                expect(res.body.status).to.be.equal('success');
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.be.equal(4);
                done();
                // expect(res.body.data).to.be.equal('');;
            });
    });
    
    
});



