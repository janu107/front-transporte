/**
 * Navbar.jsx
 * Alias semántico del Header para la barra de navegación superior.
 * Se mantiene como componente separado por claridad de la estructura.
 */
import Header from './Header';

export function Navbar(props) {
  return <Header {...props} />;
}

export default Navbar;
