import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://alligator.io/react/axios-react/
import axios from 'axios';

// https://d3js.org/
import _ from 'underscore';

import Vis from './Vis.jsx';

class Layout extends Component {
  constructor() {
    super();
    
    this.state = {
      data:false
    }
  }
  componentDidMount() {
    let self = this;
    axios.get('./data/data.json', {
    })
    .then(function (response) {
      self.setState((state, props) => ({
        data:response.data
      }));
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  render() {
    return (
      <div>
        <h3>Live births per country from 1960 to 2017</h3>
        <Vis data={this.state.data}/>
        <p>Source: <a href="https://ec.europa.eu/eurostat/web/population-demography-migration-projections/data/database">Eurostats</a></p>
      </div>
    );
  }
}
export default Layout;