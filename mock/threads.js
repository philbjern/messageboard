const crypto = require('crypto');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const threads = [
  {
    board: 'testboard',
    text: 'First thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Second thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Third thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Fourth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Fifth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Sixth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Seventh thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Eight thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
    text: 'Ninth thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: hashPassword('password'),
  },
  {
    board: 'testboard',
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