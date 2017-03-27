const path = require('path');
const lib = require(path.resolve(__dirname, 'lib'));

module.exports = {
  tips
};

function tips() {
  return lib.sdb
    .select('tips')
    .values();
}
