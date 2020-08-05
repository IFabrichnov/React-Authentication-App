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

