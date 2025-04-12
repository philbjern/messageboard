const threads = [
  {
    board: 'test_board',
    text: 'First thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: 'password',
  },
  {
    board: 'test_board',
    text: 'Second thread',
    created_on: new Date(),
    bumped_on: new Date(),
    reported: false,
    delete_password: 'password',
  }
];

exports.threads = threads;

exports.getThreadById = (id) => {
  return threads.find((thread) => thread._id === id);
};