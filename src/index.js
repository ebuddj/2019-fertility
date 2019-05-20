import React from 'react'
import ReactDOM from 'react-dom'
import App from './jsx/App.jsx';

// https://ec.europa.eu/eurostat/web/asylum-and-managed-migration/data/database

const wrapper = document.getElementById('ebu-app-root');
wrapper ? ReactDOM.render(<App />, wrapper) : false;

