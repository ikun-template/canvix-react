import canvas from './canvas.js';
import common from './common.js';
import inspector from './inspector.js';
import sidebar from './sidebar.js';
import toolbox from './toolbox.js';
import widgets from './widgets.js';

export default {
  ...common,
  ...canvas,
  ...sidebar,
  ...inspector,
  ...toolbox,
  ...widgets,
};
