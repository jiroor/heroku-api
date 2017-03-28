const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const _ = require('lodash');
const lib = require('./lib');
const api = require('./api');

app.use(bodyParser.json());
app.use(cors());

app.use('/zelda', express.static(__dirname + '/zelda/public'));

app.set('port', (process.env.PORT || 5000));

let oauth2 = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN
};
let tables = _.chain(process.env.TABLES)
  .split(',')
  .chunk(2)
  .map(_.partial(_.zipObject, ['name', 'spreadsheetId']))
  .value();

lib.sdb.init(oauth2, tables)
  .then(() => {
    _.each(api, (apis, directory) => {
      _.each(apis, (func, name) => {
        let url = _.join(['/api', directory, name], '/');

        app.post(url, function(request, response) {
          response.json(func());
        });
      });
    });
  });

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
