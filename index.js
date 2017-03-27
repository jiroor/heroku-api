const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.get('/test', function(request, response) {
  response.json({message: 'success'});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
