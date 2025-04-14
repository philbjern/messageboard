const crypto = require('crypto');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const testBoardId =  "67fa8a49bcd152b180adbf05"

const threads = [
  {
    board: testBoardId,
    text: 'First thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Second thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Third thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Fourth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Fifth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Sixth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Seventh thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Eight thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Ninth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: testBoardId,
    text: 'Tenth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  }
];

const replies = [
  {
    text: 'First reply',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    text: 'Second reply',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    text: 'Third reply',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  }
]

exports.threads = threads;
exports.replies = replies;

exports.getThreadById = (id) => {
  return threads.find((thread) => thread._id === id);
};