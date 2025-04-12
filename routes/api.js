'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

module.exports = function (app) {
  
  app.route('/api/threads/:board', (req, res) => {
    res.json({ message: 'Threads API' });
  });
    
  app.route('/api/replies/:board', (req, res) => {
    res.json({ message: 'Replies API' });
  });

};
