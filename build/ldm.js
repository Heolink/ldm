"use strict";
var fs = require('fs');
var http = require('http');
var Q = require('q');
var XML = require('pixl-xml');
var Datastore = require('nedb');
var app = require('electron').app;
if (!app) {
    app = require('electron').remote.app;
}
var pathConfig = app.getPath('appData') + '/ldm';
var dbEpisode = new Datastore({ filename: pathConfig + '/episodes.db', autoload: true });
var Ldm = (function () {
    function Ldm() {
        this.episodes = [];
        this.xmlFileOnline = 'http://feeds.radiokawa.com/podcast_les-demons-du-midi.xml';
        this.xmlFileLocal = pathConfig + '/podcast_les-demons-du-midi.xml';
        this.folderEpisode = pathConfig + '/episodes';
    }
    Ldm.prototype.update = function (episode) {
        dbEpisode.update({ number: episode.number }, episode, {}, function (err, numReplaced) {
            //console.log(numReplaced)
        });
    };
    Ldm.prototype.getEpisodes = function () {
        var _this = this;
        return Q.promise(function (resolve, reject, notify) {
            dbEpisode.find({}).sort({ number: -1 }).exec(function (err, docs) {
                _this.episodes = docs;
                resolve(docs);
            });
        });
    };
    Ldm.prototype.parse = function () {
        var _this = this;
        return Q.promise(function (resolve, reject, notify) {
            var datas = [];
            var flux = XML.parse(_this.xmlFileLocal);
            for (var _i = 0, _a = flux.channel.item; _i < _a.length; _i++) {
                var xmlEpisode = _a[_i];
                var cleanTitle = xmlEpisode.title.replace(/ \(Les Démons du MIDI( #[0-9]+)?\)/, '');
                var numberEpisode = xmlEpisode.title.match(/#([0-9]+)/);
                if (numberEpisode) {
                    numberEpisode = +numberEpisode[1];
                }
                else {
                    numberEpisode = 0;
                }
                var episode = {
                    counter: 0,
                    number: numberEpisode,
                    originTitle: xmlEpisode.title,
                    title: cleanTitle,
                    time: xmlEpisode['itunes:duration'],
                    subtitle: xmlEpisode['itunes:subtitle'],
                    desc: xmlEpisode['itunes:summary'],
                    date: xmlEpisode.pubDate,
                    online: xmlEpisode.enclosure.url,
                    local: false
                };
                datas.push(episode);
            }
            resolve(datas);
        });
    };
    Ldm.prototype.populate = function (datas) {
        return Q.promise(function (resolve) {
            var counter = 0;
            datas.forEach(function (v, k) {
                dbEpisode.findOne({ number: v.number }, function (err, doc) {
                    if (!doc) {
                        dbEpisode.insert(v, function (err, doc) {
                        });
                    }
                    else {
                        v.counter = doc.counter;
                        dbEpisode.update({ number: v.number }, v, {}, function (err, numReplaced) {
                            //console.log(numReplaced)
                            counter++;
                        });
                    }
                });
            });
            var timeout = setInterval(function () {
                if (counter == datas.length) {
                    clearInterval(timeout);
                    resolve(true);
                }
            }, 100);
        });
    };
    Ldm.prototype.download = function () {
        var online = this.xmlFileOnline;
        var dest = this.xmlFileLocal;
        return Q.promise(function (resolve, reject, notify) {
            var tmp = dest + '.tmp';
            var file = fs.createWriteStream(tmp);
            var hasError = false;
            var processIfError = function (message, type, error) {
                hasError = true;
                fs.unlink(tmp);
                reject({ message: message, type: type, error: error });
            };
            var request = http.get(online, function (response) {
                if (response.statusCode != 200) {
                    processIfError('[!200] Error donwload file', 'httpError', response);
                }
                response.pipe(file);
            }).on('error', function (err) {
                processIfError('Error donwload file', 'httpError', err);
            });
            file.on('finish', function () {
                file.close();
                if (!hasError) {
                    fs.renameSync(tmp, dest);
                    resolve(dest);
                }
            });
        });
    };
    return Ldm;
}());
module.exports = new Ldm();
