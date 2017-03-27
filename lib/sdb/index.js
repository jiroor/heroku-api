const Promise = require('bluebird');
const _ = require('lodash');

const spreadsheet = require('./spreadsheet');

module.exports = {
  init,

  select,
  insert,
  update,
  remove
};

// cache
let c = {
  sheets: {},
  columns: {},
  data: {}
};

/**
 * initialize sdb
 * @param {Object} oauth2 google authorization
 * @param {Object[]} tables to use table datas
 * @return {Promise}
 */
function init(oauth2, tables) {
  var tableNames = _.map(tables, 'name');

  spreadsheet.setOauth2(oauth2);

  return Promise.resolve(tables)
    .map(spreadsheet.get)
    .then((sheets) => {
      c.sheets = _.zipObject(tableNames, sheets);

      return Promise.map(sheets, spreadsheet.receive);
    })
    .then(() => {
      let sheets = _.values(c.sheets);

      return Promise.props({
        columns: Promise.map(sheets, spreadsheet.columns),
        data: Promise.map(sheets, spreadsheet.format)
      })
    })
    .then((response) => {
      c.columns = _.zipObject(tableNames, response.columns);
      c.data = _.zipObject(tableNames, response.data);
    });
}

/**
 * start to get data in spreadsheet
 * @param {string} name table name to get data
 * @return {Base}
 */
function select(name) {
  let base = _createBase(name);

  return base;
}

/**
 * start to insert data in spreadsheet
 * @param {string} name table name to insert data
 * @return {Base}
 * @todo
 */
function insert(name) {
}

/**
 * start to update data in spreadsheet
 * @param {string} name table name to update data
 * @return {Base}
 * @todo
 */
function update(name) {
}

/**
 * start to remove data in spreadsheet
 * @param {string} name table name to remove data
 * @return {Base}
 * @todo
 */
function remove(name) {
}

/**
 * create base to do action to database
 * @param {string} name table name to do action
 * @return {Base}
 */
function _createBase(name) {
  let _data = _.chain(c.data).get(name).clone().value();

  return {
    _data: _data,

    where: where,
    limit: limit,
    orderBy: orderBy,

    values: values,
    value: value
  };
}

/**
 * @param {Object|Array|...*} predicate
 * @return {Base}
 * @example
 *
 * sdb.select('user').where({ user_id: 1, name: 'b' }).value();
 * sdb.select('user').where(['user_id', 1, 'name', 'b']).value();
 * sdb.select('user').where('user_id', 1, 'name', 'b').value();
 * // => get the same result
 */
function where(predicate) {
  if (_.isString(predicate)) {
    predicate = _.toArray(arguments);
  }

  if (_.isArray(predicate)) {
    predicate = _.chain(predicate).chunk(2).fromPairs().value();
  }

  predicate = _.mapKeys(predicate, (value, key) => {
    return _.camelCase(key);
  });

  this._data = _.filter(this._data, predicate);

  return this;
}

/**
 * @param {number} count
 * @return {Base}
 */
function limit(count) {
  this._data = _.slice(this._data, 0, count);

  return this;
}

/**
 * @param {string|Array<string>} iteratee
 * @param {string} order
 * @return {Base}
 * @example
 *
 * sdb.select('user').orderBy(['user_id', 'desc', 'name', 'asc']).value();
 * sdb.select('user').orderBy('user_id', 'desc', 'name', 'asc').value();
 * // => get the same result
 */
function orderBy(iteratee, order) {
  if (_.isString(iteratee)) {
    iteratee = _.toArray(arguments);
  }

  let unzipped = _.chain(iteratee).chunk(2).unzip().value();
  let iteratees = _.chain(unzipped).head().map(_.camelCase).value();
  let orders = _.last(unzipped);

  this._data = _.orderBy(this._data, iteratees, orders);

  return this;
}

/**
 * get list
 * @return {Array}
 */
function values() {
  return this._data;
}

/**
 * get one
 * @return {Object}
 */
function value() {
  return _.head(this._data);
}