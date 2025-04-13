'use strict';

require('dotenv').config();

const crypto = require('crypto');
const mongoose = require('mongoose');

const { Board, Thread, Reply } = require('../model.js');

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

  app.route('/api/threads/:board').post(async (req, res) => {
    const boardId = req.params.board;
    const { text, delete_password } = req.body;
    
    if (!text || !delete_password) {
      return res.status(400).json({ error: 'Text and delete password are required' });
    }

    const hashedPassword = crypto.createHash('sha256').update(delete_password).digest('hex');

    const newThread = new Thread({
      board: boardId,
      text,
      delete_password: hashedPassword,
      created_on: new Date(),
      bumped_on: new Date(),
      replies: []
    });

    try {
      const savedThread = await newThread.save();

      const updatedBoard = await Board.findOneAndUpdate(
        { name: boardId },
        { $push: { threads: savedThread._id } },
        { new: true, upsert: true, useFindAndModify: false }
      );

      if (!updatedBoard) {
        return res.status(404).json({ error: 'Board not found after update (this should ideally not happen with upsert)' });
      }

      res.redirect(`/b/${boardId}`);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save thread and update board' });
    }

    
  }).get((req, res) => {
    const boardId = req.params.board;

    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }
    
    Board.findOne({ name: boardId })
      .populate({ path: 'threads', options: { limit: 10, sort: { created_on: -1 } } })
      .exec((err, board) => {
        if (err || !board) {
          return res.status(404).json({ error: 'Board not found' });
        }
        
        const threads = board.threads.map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replycount: thread.replycount,
        }));
        
        res.json(threads);
      });

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
      res.json({ message: 'Thread reported successfully' });
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
        return res.status(403).json({ error: 'Incorrect password' });
      }

      thread.remove((err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete thread' });
        }
        res.json({ message: 'Thread deleted successfully' });
      });
    });
  });
    
  app.route('/api/replies/:board').get((req, res) => {
    const boardId = req.params.board;
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    } 
    res.json({ message: 'Replies API' });
  }).post((req, res) => {
    const boardId = req.params.board;
    const { text, delete_password, thread_id } = req.body;

    if (!text || !delete_password || !thread_id) {
      return res.status(400).json({ error: 'Text, delete password, and thread ID are required' });
    }

    const hashedPassword = crypto.createHash('sha256').update(delete_password).digest('hex');

    const newReply = new Reply({
      thread: thread_id,
      text,
      delete_password: hashedPassword,
      created_on: new Date(),
      bumped_on: new Date(),
    });

    newReply.save((err, savedReply) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save reply' });
      }

      Thread.findByIdAndUpdate(
        thread_id,
        { $push: { replies: savedReply._id }, $inc: { replycount: 1 }, bumped_on: new Date() },
        { new: true },
        (err, updatedThread) => {
          if (err || !updatedThread) {
            return res.status(404).json({ error: 'Thread not found' });
          }
          res.redirect(`/b/${boardId}/${thread_id}`);
        }
      );
    });
  }).delete((req, res) => {
    res.json({ message: 'Delete reply API' });
  }).put((req, res) => {
    res.json({ message: 'Report reply API' });
  });

};
