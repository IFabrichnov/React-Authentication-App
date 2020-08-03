# Приложение регистрации, авторизации и отправки сообщений (React)

## Пакет package.json

Приложение использует пакеты: **expressjs, mongoose, axios, react, bcrypt-nodejs.** 


## Настройка приложения

**index.js** - файл, в котором подключены все пакеты, включая сервер и базу данных MongoDB.

```javascript
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

```

Теперь приложение прослушивает порт 5000. 


## База данных 

Регистрируюсь на **MongoDB**, создаю базу данных для приложения, помещаю uri в файл db.jd (своего рода конфиг), куда помещаю еще и port.
```javascript
module.exports = {
"port": 5000,
"mongoURi": "mongodb+srv://ivan@cluster0.fixsz.azure.mongodb.net/fullstack?retryWrites=true&w=majority"
};
```

## Роуты (routes/auth.js)

Приложение имеет следующие маршруты:
1) Домашняя страница (/)
2) Роут логина (/login)
3) Роут регистрации (/register)
4) Страница отправки сообщений (/quotes)

Создаю файл **auth.js** в котором находятся все роуты и рендеринг страниц.

Пояснения к каждому роуту присутствуют в комментариях.


```javascript
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
```


## Модели

Чтобы создавать посты, изначально нужно создать модель поста (Article). Имеется два свойства - цитата и айди юзера, для дальнейшего определения этого юзера с помощью токена и отображения именно его сообщений.

```javascripta
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
```

Помимо схемы сообщения, есть схема нового пользователя.

```javascript
const {Schema, model} = require('mongoose');

const schema = new Schema({
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true}
});

module.exports = model('User', schema);
```


## Фронтенд 


### App (/)

Приложение написано с помощью **React**.

Тут я помещаю в локальный стейт текущего пользователя, который подтягиваю с помощью getUser(), который равен
~~~javascript
```react
export const getUser = () => {
  return localStorage.getItem('usertoken');
};

```
~~~

Далее, чтобы компонента перерисовывалась, передаю текущего юзера через onLoginSuccess в компонент AuthPage.
Если юзер (currentUser) авторизован, то отрисовывается QuotesPage, если нет - редирект на '/'.

~~~javascript
```react
class App extends Component {

  state = {currentUser: getUser()};

  onLoginSuccess(res) {
    this.setState({currentUser: getUser()})
  }

  render() {
    const {currentUser} = this.state;
    return (
      <Router>
        <div className="container">
          <Switch>
            <Route path="/" exact render={(props) => {
              return <AuthPage {...props} onLoginSuccess={this.onLoginSuccess.bind(this)}/>
            }}/>


            <Route path="/quotes" render={() => {
              return currentUser
                ? <QuotesPage/>
                : <Redirect to="/"/>
            }}/>
          </Switch>

        </div>
      </Router>
    );
  }


}

export default App;

```
~~~

### Авторизация, регистрация (AuthPage)

Авторизация написана с помощью классовой компоненты. Имеется локальное состояние, хэндлеры изменения инпутов и хэндлеры логина и регистрации.
~~~javascript
```react
class AuthPage extends Component {

  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
      errors: {}
    };
    this.onChange = this.onChange.bind(this);
    this.onRegisterHandler = this.onRegisterHandler.bind(this);
    this.onLoginHandler = this.onLoginHandler.bind(this);
  }

  //изменение инпутов
  onChange(e) {
    this.setState({[e.target.name]: e.target.value})
  }

  //хэндлер реистрации
  onRegisterHandler(e) {
    e.preventDefault();
    //запись нового юзера с данными из инпутов
    const newUser = {
      email: this.state.email,
      password: this.state.password
    };
    //передача нового юзера в метод register из UserFunctions
    //который в дальнейшем передается через axios post
    register(newUser).then(res => {
        this.props.history.push('/')
    })
  };

  //хэндлер логина
  onLoginHandler(e) {
    e.preventDefault();

    const user = {
      email: this.state.email,
      password: this.state.password
    };

    login(user).then(res => {

      if (res) {

        this.props.onLoginSuccess(res);
        this.props.history.push('/quotes');
      }
    })
  };

  render() {
    return (
      <div className="row">
        <div className="col s6 offset-s3">
          <h3>Login и Register</h3>
          <div className="card blue-grey lighten-5">
            <div className="card-content gray-text">
              <span className="card-title">Авторизация</span>
              <div>
                <div className="input-field">
                  <input
                         id="email"
                         type="text"
                         name="email"
                         onChange={this.onChange}
                         value={this.state.email}

                  />
                  <label htmlFor="email">Email</label>
                </div>

                <div className="input-field">
                  <input
                    variant="contained"
                         id="password"
                         type="password"
                         name="password"
                         onChange={this.onChange}
                         value={this.state.password}

                  />
                  <label htmlFor="password">Пароль</label>
                </div>

              </div>
            </div>
            <div className="card-action">
              <button  onClick={this.onLoginHandler}  className="btn  green darken-1" style={{marginRight: 30}}>Войти</button>
              <button  onClick={this.onRegisterHandler} className="btn light-blue darken-3">Регистрация</button>
            </div>
          </div>
        </div>
      </div>
    )
  }
};

export default withRouter(AuthPage);
```
~~~

В хэндлерах присутствуют функции, благодаря которым отправляются запросы на бэкенд.

**UserFunctions.js**

```javascript
import axios from 'axios';

export const register = newUser => {
  return axios
    .post('/register', {
      email: newUser.email,
      password: newUser.password
    })
    .then(res => {
      console.log('Registered!');
    })
};

export const login = user => {
  return axios
    .post('/login', {
      email: user.email,
      password: user.password
    })
    .then(response => {
      localStorage.setItem('usertoken', JSON.stringify(response.data));
      return JSON.stringify(response.data)
    })
    .catch(err => {
      console.log(err);
    });
};

export const getUser = () => {
  return localStorage.getItem('usertoken');
};

```


### Цитаты (/quotes) (QuotesPage)

**/quotes** отправляет цитату из формы, сохраняет ее в базе данных, сразу же подгружает ее и постит сообщение снизу под формой.
Тоже написана с помощью классовой компоненты. Имеет локальный стейт, хранящий сообщения и имя (email) текущего пользователя.
~~~javascript
```react
class QuotesPage extends Component {

  state = {
    messages: [],
    name: ''
  };

  componentDidMount() {
    this.getMessage();
    this.getUserQuotes();
  }

  storageObject = JSON.parse(localStorage.getItem('usertoken'));
  tokenString = this.storageObject.token;


  //получаю цитаты из БД
  getMessage = () => {
    axios.get('/quotes', {headers: { Authorization: this.tokenString}})
      .then(res => {
        if (res.data) {
      
          this.setState({
            messages: res.data
          })
        }
      })
      .catch(err => console.log(err));
  };

  //получаю имя пользователя (емейл) по токену
  getUserQuotes = () => {
    axios.get('/me', {headers: { Authorization: this.tokenString}})
      .then(user => {
        this.setState({
          name: user.data.email
        })
      })
      .catch(err => console.log(err));
  };

  //хэндлер выхода
  logOut(e) {
    e.preventDefault();
    localStorage.removeItem('usertoken');
    this.props.history.push('/');
  }


  render() {
    //беру сообщения из стейта, которые в свою очередь получены из БД
    //и передаю их в QuotesList
    let messages = this.state.messages;
    let name = this.state.name;

    return (
      <div className="row">
        <div className="col s6 offset-s3">
          <div className="card blue-grey lighten-5">
            <div className="card-content gray-text">
              <span>Пользователь: {name}</span>
              <span className="card-title">Цитаты</span>
              <Input getMessage={this.getMessage}/>
              <QuotesList messages={messages}  />

              <button  onClick={this.logOut.bind(this)} className="btn light-blue darken-3">Выход</button>
            </div>

          </div>
        </div>
      </div>
    )
  }
};

export default withRouter(QuotesPage);
```
~~~

## Компонент Input и QuotesList

### Input

Тут происходит написание и сохранение цитат в БД. С помощью post запроса происходит добавление нового сообщения.

~~~javascript
```react

class Input extends Component {

  state = {
    quotes: ""
  };

  storageObject = JSON.parse(localStorage.getItem('usertoken'));
  tokenString = this.storageObject.token;

  //добавление сообщения
  addMessage = () => {
    const newMessage = {quotes: this.state.quotes};

    if(newMessage.quotes && newMessage.quotes.length > 0){
      axios.post('/quotes', newMessage, {headers: { Authorization: this.tokenString}})
        .then(res => {
          if(res.data){
            this.props.getMessage();
            this.setState({quotes: ""})
          }
        })
        .catch(err => console.log(err))
    }else {
      console.log('Поле не должно быть пустым')
    }
  };

  //изменение инпута
  handleChange = (e) => {
    this.setState({
      quotes: e.target.value
    })
  };

  render() {
    let { quotes } = this.state;
    return (
      <div>
        <input type="text" onChange={this.handleChange} value={quotes} />
        <button onClick={this.addMessage} className="btn  green darken-1" >Отправить</button>
      </div>
    )
  }
}

export default Input;
```
~~~

### QuotesList

Тут происходит отрисовка новых цитат.

~~~javascript
```react
import React from 'react';

//вывод цитат: если сообщение есть, то мапим в li, если нет то выводим текст НЕТ цитат
const QuotesList = ({ messages }) => {

  return (
    <ul>
      {
        messages &&
        messages.length > 0 ?
          (
            messages.map(messages => {
              return (
                <li key={messages._id}>{messages.quotes}</li>
              )
            })
          )
          :
          (
            <li>No messages</li>
          )
      }
    </ul>
  )
};

export default QuotesList;
```
~~~
