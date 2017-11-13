'use strict';

var https = require('https');
var url = require('url');

exports.handler = (event, context, callback) => {

  console.log('Event:\n' + JSON.stringify(event, 2, 2));

  const datadogApiKey = event.headers['X-Gitlab-Token'];
  const gitlabEventType = event.headers['X-Gitlab-Event'];
  const gitlabEvent = JSON.parse(event.body);

  let datadogEndpoint;
  let datadogData;
  switch (gitlabEventType) {
    case 'Pipeline Hook':
      datadogEndpoint = 'https://app.datadoghq.com/api/v1/events';
      const pipelineStatusToDatadogAlertTypeMap = {
        running: "info",
        pending: "info",
        success: "success",
        failed: "error",
        canceled: "warning",
        skipped: "info",
      }
      datadogData = {
        host: 'gitlab.com',
        source_type_name: 'gitlab',
        title: 'gitlab' +
          ' / ' + gitlabEvent.project.namespace +
          ' / ' + gitlabEvent.project.name +
          ' / ' + gitlabEvent.object_attributes.ref +
          ' / pipeline ' + gitlabEvent.object_attributes.status.toUpperCase(),
        text: gitlabEvent.commit.url,
        priority: 'normal',
        alert_type: pipelineStatusToDatadogAlertTypeMap[gitlabEvent.object_attributes.status],
        aggregation_key: 'gitlab/' + gitlabEvent.project.path_with_namespac + '/' + gitlabEvent.object_attributes.ref + '/pipeline',
        tags: [
          'project:' + gitlabEvent.project.path_with_namespace,
          'pipeline:' + gitlabEvent.object_attributes.ref
        ]
      }
      break;
    default:
      console.log('unsupported event: ' + gitlabEventType)
      callback(null, {
        statusCode: 400,
        body: 'unsupported event: ' + gitlabEventType
      });
      return;
  }

  requestHttps({
      method: 'POST',
      url: datadogEndpoint + "?api_key=" + datadogApiKey,
      body: JSON.stringify(datadogData)
    },
    (error, result) => {
      callback(null, {
        statusCode: 200,
        body: result
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
    // console.log('Response:', JSON.stringify(response));
    console.log('Status:', response.statusCode);
    let body = '';
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
