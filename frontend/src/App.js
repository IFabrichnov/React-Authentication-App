import React, {Component} from 'react';
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";
import 'materialize-css';
import AuthPage from "./pages/AuthPage";
import QuotesPage from "./pages/QuotesPage";
import {getUser} from "./components/UserFunctions";


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
