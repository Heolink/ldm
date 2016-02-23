import Vue = require('vue');
import fs = require('fs');
var ldm    = require('../ldm');
var app = require('electron').remote.app;
var plyr = require('plyr');




var home = Vue.extend({
    template: fs.readFileSync(app.getAppPath()+'/build/views/home.html', 'UTF8'),
    data: function(){
        return {
            episodes: null,
            currentEpisode: null,
            plyr: null,
            counted: false,
        }
    },
    asyncData: function (resolve, reject) {
        ldm.getEpisodes().then((episodes)=>{
            resolve({
                episodes: episodes,
                currentEpisode: episodes[0]
            });
        })
    },
    ready: function()
    {
        this.$watch('$loadingAsyncData', function (value) {
            if( value == false ) {
                console.log('init player')
                this.plyr = plyr.setup({
                    controls: ['restart','rewind','play','current-time','duration','mute','volume'],
                    volume: 10
                })[0];
                this.loadEpisodePlayer();
                document.querySelector('.plyr').addEventListener('timeupdate', (e) => {
                    if( Math.round(this.plyr.media.currentTime) == 60 && this.counted === false ) {
                        this.counted = true;
                        this.currentEpisode.counter++;
                        ldm.update(this.currentEpisode);
                    }
                });
                document.querySelector('.plyr').addEventListener('seeking', (e) => {
                    if( Math.round(this.plyr.media.currentTime) === 0 && this.counted ) {
                        this.counted = false;
                    }
                });
            }
        });

    },
    methods: {
        selectEpisode: function(index)
        {
            this.currentEpisode = this.episodes[index];
            this.loadEpisodePlayer();
        },
        loadEpisodePlayer: function()
        {
            this.counted = false;
            this.plyr.source({
                type:'audio',
                title: this.currentEpisode.title,
                sources: [{
                    src: this.currentEpisode.online,
                    type: 'audio/mp3'
                }]

            });
        }
    }
});


module.exports = home;