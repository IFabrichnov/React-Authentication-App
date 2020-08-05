import React, {Component} from "react";
import {login, register} from "../components/UserFunctions";
import {withRouter} from "react-router-dom";

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