import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://github.com/topojson/topojson
import * as topojson from 'topojson';

// https://www.npmjs.com/package/rc-slider
import Slider from 'rc-slider/lib/Slider';
import 'rc-slider/assets/index.css';

// http://recharts.org/en-US
import {
  LineChart, Line, XAxis, ResponsiveContainer, CartesianGrid, Tooltip,
} from 'recharts';

// https://d3js.org/
import _ from 'underscore';

// https://d3js.org/
import * as d3 from 'd3';

let interval;
let g, path;

class Vis extends Component {
  constructor() {
    super();

    this.state = {
      line_chart_data:[],
      selected_country:'Total',
      selected_country_total:0,
      year_idx:0
    }
  }
  componentDidMount() {
    let self = this;

    let width = 320;
    let height = 420;

    let projection = d3.geoAzimuthalEquidistant().center([52,44]).scale(550);
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    function showTooltip (d) {
      let offsetL = document.getElementsByClassName(style.map_container)[0].offsetLeft + 10;
      let offsetT = document.getElementsByClassName(style.map_container)[0].offsetTop + 10;
      let country = d.properties.NAME;
      let max = {
        date:'',
        value:0
      };
      _.each(self.props.data[country], (value, date) => {
        if (value > max.value) {
          max.value = value,
          max.date = date;
        }
      });
      let mouse = d3.mouse(svg.node()).map( function(d) {
        return parseInt(d);
      });
      if (mouse[1] > 300) {
        offsetT = offsetT - 120;
      }
      if (mouse[0] > 200) {
        offsetL = offsetL - 120;
      }
      if (self.props.data[country]) {
        tooltip.classed(style.hidden, false)
          .attr('style', 'left: ' + (mouse[0] + offsetL) +  'px; top:' + (mouse[1] + offsetT) + 'px;')
          .html('<h4>' + country + '</h4><p>Maximum was in ' + max.date.replace('M', '/') + ' with ' + max.value.toLocaleString() + ' live births.');
      }
    }
    function selectCountry (d) {
      if (self.props.data[d.properties.NAME]) {
        if (!d3.select(this).classed(style.selected)) {
          self.setState((state, props) => ({
            selected_country: d.properties.NAME
          }));
          d3.select('.' + style.selected_country).classed(style.hidden, false);
          d3.select('.' + style.selected).classed(style.selected, false);
          d3.select(this.parentNode.appendChild(this)).classed(style.selected, true);
        }
        else {
          d3.select('.' + style.selected_country).classed(style.hidden, true);
          d3.select('.' + style.selected).classed(style.selected, false);
          self.setState((state, props) => ({
            selected_country: 'Total'
          }));
        }
      }
      else {
        self.setState((state, props) => ({
          selected_country: 'Total'
        }));
      }
      self.updateLineChartData(self.props.data);
    }
    d3.json('./data/europe.topojson').then(function(topology) {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.europe).features)
        .enter()
        .append('path')
        .attr('d', path)
        .on('mousemove', showTooltip)
        .on('mouseout', function (d,i) {
          tooltip.classed(style.hidden, true);
         })
        .on('click', selectCountry)
        .attr('class', style.path)
        .attr('fill', function(d, i) {
          return self.getCountryColor(d.properties.NAME);
        });
      self.text = svg.append('text')
        .attr('alignment-baseline', 'middle')
        .attr('dy', '.35em')
        .attr('class', style.text)
        .attr('text-anchor', 'middle')
        .attr('x', '50%')
        .attr('y', '55%')
        .html(self.dates[self.state.year_idx].replace('M', '/') + ' Total ' + (7714293).toLocaleString());
    });
    setTimeout(() => {
      this.createInterval();
    }, 3000);
  }
  componentWillReceiveProps(props) {
    this.updateLineChartData(props.data);
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  updateLineChartData(data) {
    let line_chart_data = [];
    let sum = 0;
    _.each(data[this.state.selected_country], (value, date) => {
      line_chart_data.push({
        'date':date.replace('M', '/'),
        'value':(value === -1) ? NaN : value
      });
      sum = sum + ((value === -1) ? 0 : value);
    });
    this.setState((state, props) => ({
      line_chart_data:line_chart_data,
      selected_country_total:sum
    }));
  }
  createInterval() {
    interval = setInterval(() => {
      this.setState((state, props) => ({
        year_idx:this.state.year_idx + 1
      }), this.changeCountryColor);
      if (this.state.year_idx >= (this.dates.length - 1)) {
        clearInterval(interval);
        setTimeout(() => {
          this.setState((state, props) => ({
            year_idx:0
          }), this.createInterval);
        }, 2000);
      }
    }, 200);
  }
  getCountryColor(country) {
    if (this.props.data[country] !== undefined) {
      if (this.props.data[country][this.dates[this.state.year_idx]] > 100) {
        return 'rgba(0, 0, 255, ' + ((this.props.data[country][this.dates[this.state.year_idx]]) / 1) / _.max((_.values(this.props.data[country]))) + ')';
      }
      else {
        return '#fff';
      }
    }
    else {
      return '#fff';
    }
  }
  changeCountryColor(type) {
    let self = this;
    g.selectAll('path').attr('d', path)
      .attr('fill', function(d, i) {
        return self.getCountryColor(d.properties.NAME);
      });
  }
  onBeforeSliderChange(value) {
    if (interval) {
      clearInterval(interval)
    }
  }
  onSliderChange(value) {
    this.setState((state, props) => ({
      year_idx:value
    }), this.changeCountryColor);
  }
  onAfterSliderChange(value) {
  }
  render() {
    this.dates = _.keys(this.props.data['Finland']);
    if (this.text) {
      this.text.html(this.dates[this.state.year_idx].replace('M', '/') + ' ' + this.state.selected_country);
      let selected_value = 0;
      if (this.state.selected_country && this.props.data[this.state.selected_country]) {
        selected_value = this.props.data[this.state.selected_country][this.dates[this.state.year_idx]];
        if (selected_value === -1) {
          this.text.html(this.dates[this.state.year_idx].replace('M', '/') + ' ' + this.state.selected_country + ' –');
        }
        else {
          this.text.html(this.dates[this.state.year_idx].replace('M', '/') + ' ' + this.state.selected_country + ' ' + selected_value.toLocaleString());
        }
      }
    }
    return (
      <div>
        <Slider
          className={style.slider_container}
          dots={false}
          max={this.dates.length - 1}
          onAfterChange={this.onAfterSliderChange.bind(this)}
          onBeforeChange={this.onBeforeSliderChange}
          onChange={this.onSliderChange.bind(this)}
          value={this.state.year_idx}
        />
        <div className={style.map_container}></div>
        <h4>Live births from 1960 to 2017 in {this.state.selected_country}: {this.state.selected_country_total.toLocaleString()}. This is the yearly distribution</h4>
        <ResponsiveContainer width="100%" height={200} className={style.line_chart_container}>
          <LineChart isAnimationActive={true} data={this.state.line_chart_data} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
            <XAxis dataKey="date" interval={12} hide={true} />
            <Tooltip formatter={(value, name, props) => {
              return [value.toLocaleString() + ' live births'];
            }}/>/>
            <Line type="linear" dataKey="value" stroke="#00f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
export default Vis;