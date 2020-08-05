import React, { Component } from 'react';
import axios from 'axios';


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