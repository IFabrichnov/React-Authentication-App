const {model, Schema} = require('mongoose');

const Article = new Schema({
  quotes: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
});

module.exports = model('article', Article);