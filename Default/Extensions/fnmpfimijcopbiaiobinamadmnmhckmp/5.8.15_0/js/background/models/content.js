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

define('content_model', ['data_base_model', 'stream', 'backbone', 'underscore'], function (DataBaseModel, Stream, Backbone, _) {
    var DownloadInput = Backbone.Model.extend({
        defaults: {
            id: null, // id for video collection
            index: null, // content index
            group: null,
            separate: false,
            environment: Skyload.ENVIRONMENT_CONTENT
        },
        hasGroup: function hasGroup() {
            return !_.isNull(this.get('group'));
        },
        isSeparate: function isSeparate() {
            return this.get('separate');
        }
    });

    return DataBaseModel.extend({

        /**
         * @description Return JSON Content item model
         * @return Object
         */
        getContentModel: function getContentModel() {
            throw new Error('Not implemented yet');
        },

        /**
         * @description Return JSON download model
         * @return Object
         */
        getDownloadModel: function getDownloadModel() {
            throw new Error('Not implemented yet');
        },

        /**
         * @return Promise Backbone.Model
         */
        getFreshModel: function getFreshModel() {
            return Promise.resolve(this);
        },

        /**
         * @return Backbone.Model Self
         */
        setDownloadId: function setDownloadId(id) {
            return this.set('download_id', id).save();
        },

        /**
         * @return Object
         */
        toJSON: function toJSON() {
            var json = _.clone(this.attributes);
            delete json['x_stream'];

            return json;
        },

        /**
         * @description Download and return Download model object JSON
         * @return Object
         */
        download: function download(params) {
            try {
                var input = new DownloadInput(params);

                /** Create download object */
                var download = this.getDownloadModel(input.get('id'));

                if (_.isNull(download)) {
                    throw new Error('Not found current model to download');
                } else {
                    download = _.extend(download, {
                        environment: input.get('environment'),
                        group: input.get('group'),
                        params: input.toJSON(),
                        state: Skyload.DOWNLOAD_STATE_PENDING
                    });
                }

                /** Set filename if user check to separate dir */
                if (this.get('type') == Skyload.TYPE_SOUND && input.isSeparate()) {
                    var dir = _.chain([this.get('author'), this.get('album')]).compact().map(function (name) {
                        return Skyload.Methods.GetClearFileName(name, true);
                    }).value().join('/');

                    download.filename = dir + '/' + download.filename;
                }

                /** Get download model */
                var downloadModel = Skyload.Cache.Download.findWhere({ index: download.index });

                /** Create and download function */
                var create = function create() {
                    if (!(downloadModel instanceof Backbone.Model)) {
                        downloadModel = Skyload.Cache.Download.create(download);
                    }

                    if (!input.hasGroup()) {
                        return downloadModel.download();
                    } else {
                        return Promise.resolve(_.extend(downloadModel.toJSON()), {
                            index: downloadModel.getIndex()
                        });
                    }
                };

                if (downloadModel instanceof Backbone.Model) {
                    var response = _.extend(downloadModel.toJSON(), {
                        index: downloadModel.getIndex()
                    });

                    if (downloadModel.get('pause') === true && downloadModel.getId() > 0) {
                        return downloadModel.resume().then(function () {
                            return response;
                        });
                    } else if (downloadModel.get('state') != Skyload.DOWNLOAD_STATE_PENDING) {
                        return downloadModel.isExist().then(function (value) {
                            if (value) {
                                if (!input.hasGroup()) {
                                    downloadModel.show();
                                } else {
                                    downloadModel.set('group', input.get('group')).trigger('change:state', downloadModel, Skyload.DOWNLOAD_STATE_COMPLETE);
                                }
                            } else {
                                throw new Error('Not exist');
                            }

                            return response;
                        }).catch(function () {
                            return create();
                        }).catch(function (e) {
                            if (downloadModel instanceof Backbone.Model) {
                                downloadModel.stopWatchProgress();
                                downloadModel.destroy();
                            }

                            return Promise.reject(e);
                        });
                    }
                }

                return create().catch(function (e) {
                    if (downloadModel instanceof Backbone.Model) {
                        downloadModel.stopWatchProgress();
                        downloadModel.destroy();
                    }

                    return Promise.reject(e);
                });
            } catch (e) {
                return Promise.reject(e);
            }
        },
        getCover: function getCover() {
            var cover = this.get('cover');

            if (this.get('type') == Skyload.TYPE_SOUND && !_.isNull(cover)) {
                switch (this.get('source')) {
                    case Skyload.SOURCE_YANDEX:
                        return cover.replace('m40x40', 'm1000x1000');

                        break;
                    case Skyload.SOURCE_SOUNDCLOUD:
                        return cover.replace('large', 't500x500');

                        break;
                    case Skyload.SOURCE_GOOGLE_MUSIC:
                        return cover.replace('s200', 's1000');

                        break;
                    case Skyload.SOURCE_DEEZER:
                        return cover.replace('50x50', '1000x1000');

                        break;
                }
            }

            return cover;
        },
        expiredLifeTime: function expiredLifeTime() {
            return _.now() > this.get('dt') + 5 * 60000;
        },
        setStream: function setStream(stream) {
            this.set('x_stream', stream);
            return this;
        },
        getStream: function getStream() {
            return this.get('x_stream');
        }
    });
});