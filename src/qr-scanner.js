import { BrowserMultiFormatReader } from '@zxing/library/esm';

//const System = window.System;

System.register("QRScannerModule", [], function (exports, context) {
    'use strict';
    var __moduleName = context && context.id;
    return {
        execute: function () {
              class QrScanner {
                static getBarcdeResolver() {
                    QrScanner.browserCodeReader = QrScanner.browserCodeReader || new BrowserMultiFormatReader();
                    return QrScanner.browserCodeReader;
                }
                constructor(video, onDecode, canvasSize = QrScanner.DEFAULT_CANVAS_SIZE) {
                    this.$video = video;
                    this.$canvas = document.createElement('canvas');
                    this._onDecode = onDecode;
                    this._active = false;
                    this._paused = false;

                    this.$canvas.width = canvasSize;
                    this.$canvas.height = canvasSize;
                    this._sourceRect = {
                        x: 0,
                        y: 0,
                        width: canvasSize,
                        height: canvasSize
                    };

                    this.$video.addEventListener('play', (event) => this._onPlay(event));
                }

                /* ACTIVATE CAM */
                static hasCamera() {
                    // note that enumerateDevices can always be called and does not prompt the user for permission. However, device
                    // labels are only readable if served via https and an active media stream exists or permanent permission is
                    // given. That doesn't matter for us though as we don't require labels.
                    return navigator.mediaDevices.enumerateDevices()
                        .then(devices => devices.some(device => device.kind === 'videoinput'))
                        .catch(() => false);
                }


                start() {
                    if (this._active && !this._paused) { return Promise.resolve(); }

                    if (window.location.protocol !== 'https:') {
                        console.warn('The camera stream is only accessible if the page is transferred via https.');
                    }

                    console.log("start scanning...");

                    this._active = true;
                    this._paused = false;

                    if (document.hidden) {
                        // camera will be started as soon as tab is in foreground
                        console.warn('camera will be started as soon as tab is in foreground');
                        return Promise.reject();
                    }

                    clearTimeout(this._offTimeout);
                    this._offTimeout = null;

                    if (this.$video.srcObject) {
                        // camera stream already/still set
                        this.$video.play();
                        return Promise.resolve();
                    }

                    let facingMode = 'environment';

                    return this._getCameraStream('environment', true)
                        .catch(() => {
                            // we (probably) don't have an environment camera
                            facingMode = 'user';
                            return this._getCameraStream(); // throws if camera is not accessible (e.g. due to not https)
                        })
                        .then(stream => {
                            this.$video.srcObject = stream;
                            this._setVideoMirror(facingMode);
                            this.$video.play();
                        })
                        .catch(e => {
                            this._active = false;
                            throw e;
                        });
                }

                _getCameraStream(facingMode, exact = false) {
                    const constraintsToTry = [{
                        width: { min: 1024 }
                    }, {
                        width: { min: 768 }
                    }, {}];

                    if (facingMode) {
                        if (exact) {
                            facingMode = { exact: facingMode };
                        }
                        constraintsToTry.forEach(constraint => constraint.facingMode = facingMode);
                    }
                    return this._getMatchingCameraStream(constraintsToTry);
                }

                _getMatchingCameraStream(constraintsToTry) {
                    if (constraintsToTry.length === 0) {
                        return Promise.reject('Camera not found.');
                    }
                    return navigator.mediaDevices.getUserMedia({
                        video: constraintsToTry.shift()
                    }).catch( /** @todo добавить возможность отказа от вебкамеры! */
                        () => this._getMatchingCameraStream(constraintsToTry)
                    );
                }

                _setVideoMirror(facingMode) {
                    // in user facing mode mirror the video to make it easier for the user to position the QR code
                    const scaleFactor = facingMode === 'user' ? -1 : 1;
                    this.$video.style.transform = 'scaleX(' + scaleFactor + ')';
                }


                /// ON PLAY >>>
                _onPlay() {
                    this._updateSourceRect();
                    this._scanFrame();
                }

                _updateSourceRect() {
                    const smallestDimension = Math.min(this.$video.videoWidth, this.$video.videoHeight);
                    const sourceRectSize = Math.round(2 / 3 * smallestDimension);
                    this._sourceRect.width = this._sourceRect.height = sourceRectSize;
                    this._sourceRect.x = (this.$video.videoWidth - sourceRectSize) / 2;
                    this._sourceRect.y = (this.$video.videoHeight - sourceRectSize) / 2;
                }

                _scanFrame() {
                    if (!this._active || this.$video.paused || this.$video.ended) return false;
                    // Ставим браузер на паузу
                    requestAnimationFrame(() => {
                        const scanPromice = QrScanner.scanImage(this.$video, this._sourceRect, null, this.$canvas, true);
                        scanPromice
                            .then((res) => {
                                this._onDecode(res);
                            })
                            .catch((e) => { console.log(e); })
                            .then(() => {
                                setTimeout(() => { this._scanFrame() }, 100);
                            });
                    });
                }

                destroy() {
                    this.$video.removeEventListener('play', this._onPlay);
                    this.$video.pause();
                    setTimeout(() => {
                        const track = this.$video.srcObject && this.$video.srcObject.getTracks()[0];
                        if (!track) return;
                        track.stop();
                        this.$video.srcObject = null;
                    }, 300);
                    this._active = false;
                }

                stop() {
                    this.destroy();
                }

                static scanImage(imageOrFileOrUrl, sourceRect = null, worker = null, canvas = null, fixedCanvasSize = false, alsoTryWithoutSourceRect = false) {
                    return new Promise((resolve, reject) => {
                        QrScanner._loadImage(imageOrFileOrUrl)
                            .then(image => {
                                const scanPromice = QrScanner.getBarcdeResolver().decodeFromImageElement(image);
                                setTimeout(() => { reject('timeout', 3000) });
                                scanPromice.then(result => {
                                    resolve(result);
                                    console.log(result);
                                })
                                    .catch((e) => {
                                        reject();
                                        console.log(e);
                                    });
                            })
                            .catch((error) => {
                                reject(error);
                            });
                    });
                }

                static _loadImage(imageOrFileOrUrl) {
                    if (imageOrFileOrUrl instanceof HTMLCanvasElement || imageOrFileOrUrl instanceof HTMLVideoElement) {

                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(imageOrFileOrUrl.width, imageOrFileOrUrl.videoWidth);
                        canvas.height = Math.max(imageOrFileOrUrl.height, imageOrFileOrUrl.videoHeight);
                        canvas.getContext('2d').drawImage(imageOrFileOrUrl, 0, 0, canvas.width, canvas.height);
                        const image = new Image();
                        image.src = canvas.toDataURL();

                        return Promise.resolve(image);
                    } else if (imageOrFileOrUrl instanceof Image) {

                        Promise.resolve(imageOrFileOrUrl);

                        //return QrScanner._awaitImageLoad(imageOrFileOrUrl).then(() => imageOrFileOrUrl);
                    } else if (imageOrFileOrUrl instanceof File || imageOrFileOrUrl instanceof URL
                        || typeof (imageOrFileOrUrl) === 'string') {
                        const image = new Image();
                        if (imageOrFileOrUrl instanceof File) {
                            image.src = URL.createObjectURL(imageOrFileOrUrl);
                        } else {
                            image.src = imageOrFileOrUrl;
                        }
                        return Promise.resolve(image);
                    } else {
                        return Promise.reject('Unsupported image type.');
                    }
                }

                /* async */
                static _awaitImageLoad(image) {
                    return new Promise((resolve, reject) => {
                        if (image.complete && image.naturalWidth !== 0) {
                            // already loaded
                            resolve();
                        } else {
                            let onLoad, onError;
                            onLoad = () => {
                                image.removeEventListener('load', onLoad);
                                image.removeEventListener('error', onError);
                                resolve();
                            };
                            onError = () => {
                                image.removeEventListener('load', onLoad);
                                image.removeEventListener('error', onError);
                                reject('Image load error');
                            };
                            image.addEventListener('load', onLoad);
                            image.addEventListener('error', onError);
                        }
                    });
                }

            }

            QrScanner.DEFAULT_CANVAS_SIZE = 400;
            exports("QrScanner", QrScanner);
        }
    }
})