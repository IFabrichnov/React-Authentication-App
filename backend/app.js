const express = require('express');
const config = require('config');
const mongoose = require('mongoose');

const app = express();
const PORT = config.get('port') || 5000;

//для чтения json
app.use(express.json({extended: true}));

//регистрация роутов
app.use('/', require('./routes/auth'));

async function start() {
  try {
    //подключаемся к БД
    await mongoose.connect(config.get('mongoURi'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    //после того как подлключились к БД, подключаем сервер
    app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`));
  } catch (e) {
    console.log('Server Error', e.message);
    process.exit(1);
  }
}

start();

