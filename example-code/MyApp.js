import Header from 'components/header/Header';
import Body from './components/body/Body';
import(/* webpackChunkName:"Overlays" */'components/overlays/Overlays');

const { consoler } = require("./components/consoler");
consoler();