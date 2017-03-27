const Promise = require('bluebird');
const spreadsheet = require('edit-google-spreadsheet');
const _ = require('lodash');

module.exports = {
  setOauth2,
  get,
  receive,
  columns,
  format
};

// cache
let c = {
  oauth2: null,
  tables: {}
};

/**
 * set oauth2 option for getting spreadsheet data
 * @param {Object} oauth2
 */
function setOauth2(oauth2) {
  if (_.isObject(oauth2)) {
    c.oauth2 = oauth2;
  }
}

/**
 * IDからスプレッドシートのインスタンスの取得
 * @param {Object} table
 * @return {Promise}
 */
function get(table) {
  if (_.isNull(c.oauth2)) {
    throw new Error('you need to call `setOauth2` method and set oauth2 option');
  }

  if (!_.isObject(table)) {
    throw new Error('`table` must be Object');
  }

  let cacheSheet = _.get(c.tables, [table.spreadsheetId, 'sheet']);
  if (cacheSheet) {
    return Promise.resolve(cacheSheet);
  }
  // cache
  c.tables[table.spreadsheetId] = table;

  let opts = {
    oauth2: {
      client_id: c.oauth2.clientId,
      client_secret: c.oauth2.clientSecret,
      refresh_token: c.oauth2.refreshToken
    }
  };
  opts.spreadsheetId = table.spreadsheetId;
  if (_.has(table.sheetId)) {
    opts.worksheetId = table.sheetId;
  } else if (_.has(table.sheetName)) {
    opts.worksheetName = table.sheetName;
  } else {
    opts.worksheetId = 'od6';
  }

  return Promise.promisify(spreadsheet.load)(opts)
    .then((sheet) => {
      c.tables[table.spreadsheetId].sheet = sheet;

      return sheet;
    });
}

/**
 *
 */
function receive(sheet) {
  let cacheTable = c.tables[sheet.opts.spreadsheetId];
  if (cacheTable.rows) {
    return Promise.resolve(cacheTable.rows);
  }

  return Promise.promisify(sheet.receive, {
    context: sheet
  })()
    .then((rows) => {
      cacheTable.rows = rows;

      return rows;
    });
}

/**
 * 取得したスプレッドシートのカラム名の情報を取得する
 * @param {Object} sheet
 * @return {Promise}
 */
function columns(sheet) {
  return receive(sheet)
    .then(_columns);
}

/**
 * 取得したスプレッドシートのインスタンスをCollectionにフォーマットする
 * @param {Object} sheet
 * @return {Promise}
 */
function format(sheet) {
  return receive(sheet)
    .then((rows) => {
      let keys = _columns(rows);

      return _.transform(rows, (result, row, index) => {
        if (_.eq(+index, 1)) {
          return;
        }

        let values = _.transform(row, (res, val, key) => {
          _.set(res, +key - 1, val);
        }, []);

        result.push(_.zipObject(keys, values));
      }, []);
    });
}

/**
 * 取得したスプレッドシートのカラム名の情報を取得する
 * @param {Object} rows
 * @return {Promise}
 */
function _columns(rows) {
  return _.chain(rows)
    .get(1)
    .values()
    .map(_.camelCase)
    .value();
}