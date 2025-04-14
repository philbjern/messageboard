const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { Board, Thread, Reply } = require('../model');
const { threads, replies } = require('../mock/threads');

const crypto = require('crypto');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

chai.use(chaiHttp);

describe('Functional Tests', function () {

  before(function (done) {
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

  before(async function () {
    this.timeout(10000); // Increase timeout for this hook to 10 seconds
    console.log("Seeding initial data");

    // Verify database connection
    if (!Thread.db) {
      console.error("Database connection is not established");
      throw new Error("Database connection is not established");
    }

    try {
      // clear existing boards
      await Board.deleteMany({});
      console.log("All boards deleted");
      const testBoard = await Board.insertMany({ name: 'testboard' });
      const testBoardId = testBoard[0]._id;
      console.log("Test board created with ID:", testBoardId);


      await Thread.deleteMany({});
      console.log("All threads deleted");
      const insertedThreads = await Thread.insertMany(threads);
      console.log("Initial threads inserted");

      const createAndAssociateReplies = async () => {
        for (const threadDoc of insertedThreads) {
          const newReplies = [
            { thread: threadDoc._id, text: 'First reply', delete_password: 'replypass1' },
            { thread: threadDoc._id, text: 'Second reply', delete_password: 'replypass2' },
            { thread: threadDoc._id, text: 'Third reply', delete_password: 'replypass3' },
          ];

          const savedReplies = await Reply.insertMany(newReplies);

          threadDoc.replies.push(...savedReplies);
          threadDoc.bumped_on = new Date();
          threadDoc.replycount = threadDoc.replies.length;
          threadDoc.board = testBoardId;

          await Board.findOneAndUpdate({ _id: testBoardId }, { $push: { threads: threadDoc._id } }, { new: true, upsert: true, useFindAndModify: false });
          await threadDoc.save();
        }
      };

      await createAndAssociateReplies();
      console.log("Replies created and associated with threads");
    } catch (err) {
      console.error("Error in before hook:", err);
      throw err; // Ensure that errors are propagated
    }
  });

  it('should run test', function (done) {
    chai.request(server)
      .get('/')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        done();
      });
  })

  it('should create a new thread POST to /api/threads/:board', function (done) {
    chai.request(server)
      .post('/api/threads/testboard123')
      .send({
        text: 'Test thread',
        delete_password: 'password123'
      })
      .end(function (err, res) {
        const hashedPassword = crypto.createHash('sha256').update('password123').digest('hex');
        Thread.findOne({ text: 'Test thread' }, function (err, thread) {
          assert.equal(thread.text, 'Test thread');
          assert.equal(thread.delete_password, hashedPassword);
          assert.isNotNull(thread.replies);
          assert.isArray(thread.replies);
          done();
        });
      });
  })

  it('should show 10 most recent threads with 3 replies each GET to /api/threads/:board', function (done) {
    chai.request(server)
      .get('/api/threads/testboard')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.threads);
        assert.isAtMost(res.body.threads.length, 10);
        res.body.threads.forEach(thread => {
          assert.isArray(thread.replies);
        });
        done();
      });
  });

  it("should respond to delete request invalid password with 403", function (done) {
    Thread.findOne({ text: 'First thread' }, function (err, thread) {
      if (err) {
        console.error("Error finding thread:", err);
        return done(err);
      }
      chai.request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: thread._id,
          delete_password: 'wrongpassword'
        })
        .end(function (err, res) {
          assert.equal(res.status, 403);
          assert.equal(res.body.error, 'Incorrect password');
          done();
        });
    });
  })

  it('should delete a thread with correct password', function (done) {
    Thread.findOne({ text: 'First thread' }, function (err, thread) {
      if (err) {
        console.error("Error finding thread:", err);
        return done(err);
      }

      const validPassword = crypto.createHash('sha256').update('password').digest('hex');

      chai.request(server)
        .delete('/api/threads/testboard')
        .send({
          thread_id: thread._id,
          delete_password: 'password'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });

  it('should report a thread', function (done) {
    Thread.findOne({ text: 'Second thread' }, function (err, thread) {
      if (err) {
        console.error("Error finding thread:", err);
        return done(err);
      }

      chai.request(server)
        .put('/api/threads/testboard')
        .send({
          thread_id: thread._id
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  it('should create a new reply POST to /api/replies/:board', function (done) {
    Thread.findOne({ text: 'Second thread' }, function (err, thread) {
      if (err) {
        console.error("Error finding thread:", err);
        return done(err);
      }
      chai.request(server)
        .post('/api/replies/testboard')
        .send({
          thread_id: thread._id,
          text: 'Test reply',
          delete_password: 'replypassword'
        })
        .end(function (err, res) {
          Reply.findOne({ text: 'Test reply' }, function (err, reply) {
            if (err) {
              console.error("Error finding reply:", err);
              return done(err);
            }
            assert.equal(reply.text, 'Test reply');
            const hashedPassword = crypto.createHash('sha256').update('replypassword').digest('hex');
            assert.equal(reply.delete_password, hashedPassword);
            done();
          })
        })
    })
  })

});
