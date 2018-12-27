import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import RuleEditor from './ruleEditor';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editable: false,
      elements: [
              {'id': 'A', 'content': 'IP  ["192.168.0.1","192.168.0.2"]'},
              {'id': 'B', 'content': '城市人口 >= 10W'},
              {'id': 'C', 'content': 'CardId Age < 35'},
              {'id': 'D', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'E', 'content': '城市人口 >= 10W'},
              {'id': 'F', 'content': 'CardId Age < 35'},
              {'id': 'G', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'H', 'content': '城市人口 >= 10W'},
              {'id': 'I', 'content': 'CardId Age < 35'},
              {'id': 'J', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'K', 'content': '城市人口 >= 10W'},
              {'id': 'L', 'content': 'CardId Age < 35'},
              {'id': 'M', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
              {'id': 'N', 'content': '城市人口 >= 10W'},
              {'id': 'O', 'content': 'CardId Age < 35'},
            ]
    }
  }
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <div style={{
          width: '100%',
          background: 'lightblue',
          height: 20,
        }}/>
        <button onClick={ () => {
          console.log(this.refs.ruleEditor.getTree());
        this.setState({
          editable: !this.state.editable,
          elements: [
                {'id': 'B', 'content': '城市人口 >= 10W'},
                {'id': 'C', 'content': 'CardId Age < 35'},
                {'id': 'D', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
                {'id': 'E', 'content': '城市人口 >= 10W'},
                {'id': 'F', 'content': 'CardId Age < 35'},
                {'id': 'G', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
                {'id': 'H', 'content': '城市人口 >= 10W'},
                {'id': 'I', 'content': 'CardId Age < 35'},
                {'id': 'J', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
                {'id': 'K', 'content': '城市人口 >= 10W'},
                {'id': 'L', 'content': 'CardId Age < 35'},
                {'id': 'M', 'content': 'IP IN ["192.168.0.1","192.168.0.2"]'},
                {'id': 'N', 'content': '城市人口 >= 10W'},
                {'id': 'O', 'content': 'CardId Age < 35'},
              ]
        })} }>gengxin</button>
        <RuleEditor elements={this.state.elements} editable={this.state.editable} ref="ruleEditor"/>
      </div>
    );
  }
}

export default App;
