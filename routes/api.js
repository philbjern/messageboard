'use strict';

require('dotenv').config();

const crypto = require('crypto');
const mongoose = require('mongoose');

const { Board, Thread, Reply } = require('../model.js');
const { path } = require('../server.js');

module.exports = function (app) {

  const db = mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });


  // Middleware to check if the board exists
  const checkThreadExists = (req, res, next) => {
    const boardId = req.params.board;
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    // Check if the board exists in the database
    Thread.findOne({ board: boardId }, (err, board) => {
      if (err || !board) {
        return res.status(404).json({ error: 'Board not found' });
      }
      next();
    });
  };

  app.route('/api/threads')
  .get(async (req, res) => {
    // Return all threads
    const boards = await Board.find()
    .populate({ path: 'threads', select: '-__v -delete_password -reported', populate: { path: 'replies', select: '-__v -delete_password -reported' } })
    .exec();

    return res.json(boards);
  })

  app.route('/api/threads/:board')
  .post(async (req, res) => {
    const boardName = req.params.board;
    const { text, delete_password } = req.body;

    if (!text || !delete_password) {
      return res.status(400).json({ error: 'Text and delete password are required' });
    }

    let board = await Board.findOne({ name: boardName }).exec();
    if (!board) {
      board = new Board({ name: boardName });
      console.log('New board created:', board._id);
    }
    let newBoardId = board._id;

    const hashedPassword = crypto.createHash('sha256').update(delete_password).digest('hex');

    const newThread = new Thread({
      board_id: newBoardId,
      board: boardName,
      text,
      delete_password: hashedPassword,
      created_on: new Date(),
      bumped_on: new Date(),
    });

    board.threads.push(newThread._id);
    board.bumped_on = new Date();

    try {
      const savedThread = await newThread.save();
      const savedBoard = await board.save();

      if (!savedBoard) {
        return res.status(404).json({ error: 'Could not save board' });
      }

      // res.redirect(`/b/${boardId}`);
      res.json(savedThread)
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save thread and update board' });
    }


  }).get(async (req, res) => {
    const boardId = req.params.board;
    const threadId = req.query.thread_id;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    if (threadId) {
      // Fetching a specific thread
      const thread = await Thread.findById(threadId)
        .select('-delete_password -reported')
        .populate({ 
          path: 'replies',
          select: '-__v -delete_password -reported',
        })
        .exec();

      if (thread) {
        return res.json(thread)
      }
      return res.status(404).json({ error: 'Thread not found' });
    }

    const board = await Board.findOne({ name: boardId })
      .select('-delete_password -reported')
      .populate({ 
        path: 'threads',
        select: '-__v -delete_password -reported',
        populate: { 
          path: 'replies',
          select: '-__v -delete_password -reported',
        }, 
        options: { limit: 10, sort: { created_on: -1 } } })
      .exec();

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    return res.json(board.threads);
  }).put((req, res) => {
    // Reporting a thread
    const threadId = req.body.thread_id;

    if (!threadId) {
      return res.status(400).json({ error: 'Thread ID is required' });
    }

    Thread.findByIdAndUpdate(threadId, { reported: true }, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to report thread' });
      }
      res.send('reported');
    });
  }).delete((req, res) => {
    // Deleting a thread with password
    const threadId = req.body.thread_id;
    const deletePassword = req.body.delete_password;

    if (!threadId || !deletePassword) {
      return res.status(400).json({ error: 'Thread ID and delete password are required' });
    }

    Thread.findById(threadId, (err, thread) => {
      if (err || !thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      const hashedPassword = crypto.createHash('sha256').update(deletePassword).digest('hex');

      if (thread.delete_password !== hashedPassword) {
        return res.send('incorrect password');
      }

      thread.remove((err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete thread' });
        }
        res.send('success');
      });
    });
  });

  app.route('/api/replies/:board')
  .get(async (req, res) => {
    const boardName = req.params.board;
    const threadId = req.query.thread_id;
    if (!boardName || !threadId) {
      return res.status(400).json({ error: 'Board name and thread id is required' });
    }

    // Fetching a specific thread with replies
    const thread = await Thread.findById(threadId)
      .select("-__v -delete_password -reported")
      .populate({ path: 'replies', select: "-__v -delete_password -reported" })
      .exec();
      
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(thread);
  }).post((req, res) => {
    const boardName = req.params.board;
    const { text, delete_password, thread_id } = req.body;
    
    if (!text || !delete_password || !thread_id) {
      return res.status(400).json({ error: 'Text, delete password, and thread ID are required' });
    }
    
    const newBumpedOn = new Date();
    const hashedPassword = crypto.createHash('sha256').update(delete_password).digest('hex');

    const newReply = new Reply({
      thread: thread_id,
      text,
      delete_password: hashedPassword,
      created_on: newBumpedOn,
      bumped_on: newBumpedOn,
    });

    newReply.save((err, savedReply) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save reply' });
      }

      Thread.findByIdAndUpdate(
        thread_id,
        { $push: { replies: savedReply._id }, $inc: { replycount: 1 }, bumped_on: newBumpedOn },
        { new: true },
        (err, updatedThread) => {
          if (err || !updatedThread) {
            return res.status(404).json({ error: 'Thread not found' });
          }
          // res.redirect(`/b/${boardId}/${thread_id}`);
          res.json(updatedThread);
        }
      );
    });
  }).delete(async (req, res) => {
    const boardName = req.params.board;
    const { thread_id, reply_id, delete_password } = req.body;
    if (!thread_id || !reply_id || !delete_password) {
      return res.status(400).json({ error: 'Thread ID, reply ID, and delete password are required' });
    }

    const reply =  await Reply.findById(reply_id).exec();
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const deletePasswordHash = crypto.createHash('sha256').update(delete_password).digest('hex');
    if (reply.delete_password !== deletePasswordHash) {
      return res.send('incorrect password');
    }

    reply.text = '[deleted]';
    reply.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete reply' });
      }
    })

    res.send('success');
  }).put(async (req, res) => {
    // Report a reply
    const { thread_id, reply_id } = req.body;
    if (!thread_id || !reply_id) {
      return res.status(400).json({ error: 'Thread ID and reply ID are required' });
    }

    const reply = await Reply.findById(reply_id).exec();
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    reply.reported = true;
    reply.bumped_on = new Date();

    const thread = await Thread.findById(thread_id).exec();
    if(!thread) {
      console.error(`Could not find thread with ID: ${thread_id}`);
      return res.status(404).json({ error: 'Thread not found' });
    }
    thread.bumped_on = new Date();
    thread.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to update thread' });
      }
    });

    reply.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to report reply' });
      }
      res.send('reported');
    });
  });

};
