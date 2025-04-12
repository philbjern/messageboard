const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Board, Thread, Reply } = require('../model');
const { threads } = require('../mock/threads');

const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

chai.use(chaiHttp);

describe('Functional Tests', function() {

  before(function(done) {
    this.timeout(5000); // Increase timeout to 5000ms
    mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        console.log('Database connected');
        done();
      })
      .catch(err => {
        console.error('Database connection error:', err);
        done(err);
      });
  })

  before(async function() {
    this.timeout(10000); // Increase timeout for this hook to 10 seconds
    console.log("Seeding initial data");

    // Verify database connection
    if (!Thread.db) {
      console.error("Database connection is not established");
      throw new Error("Database connection is not established");
    }

    try {
      await Thread.deleteMany({});
      console.log("All threads deleted");
      await Thread.insertMany(threads);
      console.log("Initial threads inserted");
    } catch (err) {
      console.error("Error in before hook:", err);
      throw err; // Ensure that errors are propagated
    }
  });

  it('should run test', function (done) {
    chai.request(server)
      .get('/')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  })

  it('should create a new thread POST to /api/threads/:board', function(done) {
    chai.request(server)
      .post('/api/threads/testboard')
      .send({
        text: 'Test thread',
        delete_password: 'password123'
      })
      .end(function(err, res) {
        const hashedPassword = crypto.createHash('sha256').update('password123').digest('hex');
        Thread.findOne({ text: 'Test thread' }, function(err, thread) {
          assert.equal(thread.text, 'Test thread');
          assert.equal(thread.delete_password, hashedPassword);
          done();
        });
      });
  })

});
