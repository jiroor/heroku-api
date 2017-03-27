const lib = require('../../lib');

module.exports = {
  tips
};

function tips() {
  return lib.sdb
    .select('tips')
    .values();
}
