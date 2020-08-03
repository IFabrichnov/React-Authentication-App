const {Router} = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {check, validationResult} = require('express-validator'); //библиотека для валидации пароля и почты
const User = require('../models/User');
const Article = require('../models/Article');
const router = Router();

// /register
router.post('/register',
  //проверка валидации
  [
    check('email', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина 6 символов')
      .isLength({min: 6})
  ],
  async (req, res) => {

    try {
      //обработка валидации
      //таким образом экспресс валидатор как раз валидирует входящие поля
      const errors = validationResult(req);
      //если объект error не пустой,то сразу возвращаем на фронтенд
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при регистрации'
        })
      }

      //получаем поля email и pass из request body
      const {email, password} = req.body;
      //проверка, если уже есть такой email, то будет ошибка
      //проверка на уникальность по почте
      const candidate = await User.findOne({email: email});
      //если такой уже есть, то выдаем данное сообщение и возвращаем
      if (candidate) {
        return res.status(400).json({message: 'Такой пользователь уже существует'})
      }

      //с помощью библиотеки bcryptjs хэшируем пароли и сравниваем
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({email: email, password: hashedPassword});

      await user.save();

      res.status(201).json({message: 'Пользователь создан'});

    } catch (e) {
      res.status(500).json({message: 'Что-то пошло не так'});
    }
  });

// /login
router.post('/login',
  [
    check('email', 'Введите корректный email').normalizeEmail().isEmail(),
    check('password', 'Введите пароль').exists()
  ],
  async (req, res) => {

    try {
      //обработка валидации
      //таким образом экспресс валидатор как раз валидирует входящие поля
      const errors = validationResult(req);
      //если объект error не пустой,то сразу возвращаем на фронтенд
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
          message: 'Некорректные данные при входе в систему'
        })
      }

      //получаем поля email и pass из request body
      const {email, password} = req.body;
      //ищем по email пользователя
      const user = await User.findOne({email: email});

      //если нет, то пишем статус и возвращаем
      if (!user) {
        return res.status(400).json({message: 'Пользователь не найден'})
      }
      //проверяем, совпадают ли пароли с помощью bcrypt
      //первый агрумент пароль введенный, второй у юзера, которого нашли по email
      const isMatch = await bcrypt.compare(password, user.password);
      //если пароли не совпадают
      if (!isMatch) {
        return res.status(400).json({message: 'Неверный пароль'});
      }
      //если все ок, то делаем авторизацию с помощью библиотеки jsonwebtoken
      //генерируем token, передаем параметры с помощью которых инициализируем юзера
      const token = jwt.sign(
        {userId: user.id},
        config.get("jwtSecret"),
        {expiresIn: '1h'}
      );

      res.json({token: token, userId: user.id});
    } catch (e) {
      res.status(500).json({message: 'Что-то пошло не так'});
    }
  });


//помещаем посты в базу данных
router.post('/quotes', async (req, res) => {
  //в хэдер передал токен, получаю его тут и верифицирую
  let auth = req.headers.authorization;
  let profile = jwt.verify(auth, config.get("jwtSecret"));
  // получаю из верифицированного токена айди залогинившегося юзера
  let profileUserId = profile.userId;
  //сохраняю посты, с айдишником залогинившегося пользователя
    const article = new Article({
      quotes: req.body.quotes,
      userId: profileUserId
    });

    await article.save();
  }
);

//возврат клиенту постов
router.get('/quotes', (req, res, next) => {
  //в хэдер передал токен, получаю его тут и верифицирую
  let auth = req.headers.authorization;

  let profile = jwt.verify(auth, config.get("jwtSecret"));
  //возврат клиенту только его постов
  Article.find({userId: profile.userId})
    .then(data =>
      res.json(data))
    .catch(next);

});

//данные с токена
router.get('/me', async (req, res) => {
  //в хэдер передал токен, получаю его тут и верифицирую
  let auth = req.headers.authorization;

  let profile = jwt.verify(auth, config.get("jwtSecret"));
  //нахожу юзера в базе по айди
  const user = await User.findById({_id: profile.userId}).exec();

  if (!user) {
    return res.status(400).json({message: 'Пользователь не найден'})
  }
  //передаю мыло залогинившегося пользователя для отображения
  res.json({email: user.email});

});


module.exports = router;