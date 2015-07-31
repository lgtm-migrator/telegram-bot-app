'use strict';
var request = require('request');

var google = {
    search: function (query, callback) {
        request
            .get("http://ajax.googleapis.com/ajax/services/search/images?v=1.0&as_filetype=jpg%20png&rsz=8&q=" + encodeURI(query),
            function (err, httpResponse, body) {
                var responseData = JSON.parse(body).responseData;
                if (responseData.results && responseData.results.length > 0) {
                    var index = Math.floor(Math.random() * responseData.results.length),
                        imageUrl = responseData.results[index].unescapedUrl,
                        tbUrl = responseData.results[index].tbUrl;
                    google.getImage(imageUrl, callback, tbUrl);
                }
                else {
                    callback('Google can\'t find it for you');
                }
            }).on('error', function (e) {
                console.log('ERROR getting search result from google:' + e);
            });
    },

    getImage: function (url, callback, tbUrl) {
        request
            .get(url)
            .on('response', function (response) {
                if (!response.headers || !response.headers['content-type']) {
                    callback('can\'t load image');
                    return;
                }
                if (response.headers['content-type'].split('/')[0] !== 'image') {
                    if (!tbUrl) {
                        callback('can\'t load even preview');
                        return;
                    }
                    google.getImage(tbUrl, callback);
                    return;
                }
                callback(response, true, url);
            }).on('error', function (e) {
                console.log('ERROR uploading pic from server:' + e);
                google.getImage(tbUrl, callback);
            });
    }
};
module.exports = google;