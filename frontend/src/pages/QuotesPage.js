import React, {Component} from "react";
import axios from 'axios';
import Input from "../components/Input";
import QuotesList from "../components/QuotesList";
import {withRouter} from "react-router-dom";

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