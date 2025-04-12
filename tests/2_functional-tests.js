const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

describe('Functional Tests', function() {

  it('should run test', function (done) {
    chai.request(server)
      .get('/')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  })

});
