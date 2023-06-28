const { inspect: insp } = require('util');
const crypto = require('crypto');

module.exports.generateId = (size = 16) => {
  return crypto.randomBytes(size).toString('hex');
}

module.exports.inspect = (data) => console.log(insp(data, false, 16));
