'use strict';

var https = require('https');
var url = require('url');

const datadogApiKey = process.env.datadogApiKey;
///////////////////////////////////////////////////////////////////////////////
const datadogEndpoint = "https://app.datadoghq.com/api/v1/events"; // for testing "https://requestb.in";

///////////////////////////////////////////////////////////////////////////////

exports.handler = (event, context, callback) => {
  
    console.log(JSON.stringify(event,2,2));
    
    requestHttps({
      method: 'POST', 
      url: datadogEndpoint + "?api_key=" + datadogApiKey,
      body: JSON.stringify({
        "title": "Did you hear the news today?",
        "text": "Oh boy!",
        "priority": "normal",
        "tags": [ "" ],
        "alert_type": "info",
        "aggregation_key": "GitlabPipelineID",
        "source_type_name": "gitlab"
      })
    }, 
    (error, result) => {
      callback(null, {
        statusCode: 200,
        headers: { },
        body: "Success"
      });
    });
};

let requestHttps = function(requestDescription, callback) {
  const requestUrl = url.parse(requestDescription.url);
  const requestOptions = {
      host: requestUrl.host,
      port: requestUrl.port,
      path: requestUrl.path,
      method: requestDescription.method || 'GET',
      headers: requestDescription.headers || {}
  };
  const request = https.request(requestOptions, (response) => {
      let body = '';
      console.log('Status:', response.statusCode);
      console.log('Headers:', JSON.stringify(response.headers));
      response.setEncoding('utf8');
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
          console.log('Body:', body);
          callback(null, body);
      });
  });
  request.on('error', callback);
  request.write(requestDescription.body);
  request.end();
}
