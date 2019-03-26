/**
 * Skyload - Download manager for media content
 * @link http://skyload.io
 *
 * @version v5.8.14
 *
 * License Agreement:
 * http://skyload.io/eula
 *
 * Privacy Policy:
 * http://skyload.io/privacy-policy
 *
 * Support and FAQ:
 * http://skyload.io/help
 * support@skyload.io
 */

"use strict";

define('DZ', ['APP', 'underscore', 'jquery'], function (Skyload, _) {
    Skyload.Custodian.Require('DZ', function () {
        return Skyload.AppView.extend({
            findSoundInfo: function findSoundInfo() {
                var _this = this;

                return new Promise(function (resolve, reject) {
                    try {
                        var code = 'function(){' + 'try {' + 'return {' + 'author:dzPlayer.getArtistName(),' + 'name:dzPlayer.getSongTitle(),' + 'album:dzPlayer.getAlbumTitle(),' + 'duration:dzPlayer.getDuration(),' + 'id:dzPlayer.getSongId(),' + 'cover:dzPlayer.getCover()' + '}' + '}catch(e){return null}' + '}';

                        Skyload.Methods.B(code).then(function (data) {
                            try {
                                data = JSON.parse(data);
                                data.id = parseInt(data.id);

                                if (isNaN(data.id)) {
                                    _this.playNextSound();

                                    throw new Error('Wrong id');
                                } else {
                                    data.duration = parseInt(data.duration);
                                    data.index = [Skyload.SOURCE_DEEZER, data.id].join('_');
                                    data.cover = 'http://e-cdn-images.deezer.com/images/cover/' + data.cover + '/50x50.jpg';

                                    resolve(data);
                                }
                            } catch (e) {
                                reject(e);
                            }
                        }, reject);
                    } catch (e) {
                        reject(e);
                    }
                });
            },
            playNextSound: function playNextSound() {
                return Skyload.Methods.B('function(){dzPlayer.stopAudioAds()}');
            }
        });
    });
});