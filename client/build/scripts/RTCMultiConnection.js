// Last time updated: 2016-08-12 5:21:05 AM UTC
// _____________________
// RTCMultiConnection-v3
// Open-Sourced: https://github.com/muaz-khan/RTCMultiConnection
// --------------------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// --------------------------------------------------
'use strict';
"use strict";
!function() {
    function RTCMultiConnection(roomid, forceOptions) {
        function onUserLeft(remoteUserId) {
            connection.deletePeer(remoteUserId)
        }
        function connectSocket(connectCallback) {
            if (connection.socketAutoReConnect = !0,
            connection.socket)
                return void (connectCallback && connectCallback(connection.socket));
            if ("undefined" == typeof SocketConnection)
                if ("undefined" != typeof FirebaseConnection)
                    window.SocketConnection = FirebaseConnection;
                else {
                    if ("undefined" == typeof PubNubConnection)
                        throw "SocketConnection.js seems missed.";
                    window.SocketConnection = PubNubConnection
                }
            new SocketConnection(connection,function(s) {
                connectCallback && connectCallback(connection.socket)
            }
            )
        }
        function beforeUnload(shiftModerationControlOnLeave, dontCloseSocket) {
            connection.closeBeforeUnload && (connection.isInitiator === !0 && connection.dontMakeMeModerator(),
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    userLeft: !0
                }, participant),
                connection.peers[participant] && connection.peers[participant].peer && connection.peers[participant].peer.close(),
                delete connection.peers[participant]
            }),
            dontCloseSocket || connection.closeSocket(),
            connection.broadcasters = [],
            connection.isInitiator = !1)
        }
        function applyConstraints(stream, mediaConstraints) {
            return stream ? (mediaConstraints.audio && stream.getAudioTracks().forEach(function(track) {
                track.applyConstraints(mediaConstraints.audio)
            }),
            void (mediaConstraints.video && stream.getVideoTracks().forEach(function(track) {
                track.applyConstraints(mediaConstraints.video)
            }))) : void (connection.enableLogs && console.error("No stream to applyConstraints."))
        }
        function replaceTrack(track, remoteUserId, isVideoTrack) {
            return remoteUserId ? void mPeer.replaceTrack(track, remoteUserId, isVideoTrack) : void connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.replaceTrack(track, participant, isVideoTrack)
            })
        }
        function keepNextBroadcasterOnServer() {
            if (connection.isInitiator && !connection.session.oneway && !connection.session.broadcast && "many-to-many" === connection.direction) {
                var firstBroadcaster = connection.broadcasters[0]
                  , otherBroadcasters = [];
                connection.broadcasters.forEach(function(broadcaster) {
                    broadcaster !== firstBroadcaster && otherBroadcasters.push(broadcaster)
                }),
                connection.autoCloseEntireSession || connection.shiftModerationControl(firstBroadcaster, otherBroadcasters, !0)
            }
        }
        forceOptions = forceOptions || {
            useDefaultDevices: !0
        };
        var connection = this;
        connection.channel = connection.sessionid = (roomid || location.href.replace(/\/|:|#|\?|\$|\^|%|\.|`|~|!|\+|@|\[|\||]|\|*. /g, "").split("\n").join("").split("\r").join("")) + "";
        var mPeer = new MultiPeers(connection);
        mPeer.onGettingLocalMedia = function(stream) {
            stream.type = "local",
            connection.setStreamEndHandler(stream),
            getRMCMediaElement(stream, function(mediaElement) {
                mediaElement.id = stream.streamid,
                mediaElement.muted = !0,
                mediaElement.volume = 0,
                -1 === connection.attachStreams.indexOf(stream) && connection.attachStreams.push(stream),
                "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !0, connection),
                connection.streamEvents[stream.streamid] = {
                    stream: stream,
                    type: "local",
                    mediaElement: mediaElement,
                    userid: connection.userid,
                    extra: connection.extra,
                    streamid: stream.streamid,
                    blobURL: mediaElement.src || URL.createObjectURL(stream),
                    isAudioMuted: !0
                },
                setHarkEvents(connection, connection.streamEvents[stream.streamid]),
                setMuteHandlers(connection, connection.streamEvents[stream.streamid]),
                connection.onstream(connection.streamEvents[stream.streamid])
            }, connection)
        }
        ,
        mPeer.onGettingRemoteMedia = function(stream, remoteUserId) {
            stream.type = "remote",
            connection.setStreamEndHandler(stream, "remote-stream"),
            getRMCMediaElement(stream, function(mediaElement) {
                mediaElement.id = stream.streamid,
                "undefined" != typeof StreamsHandler && StreamsHandler.setHandlers(stream, !1, connection),
                connection.streamEvents[stream.streamid] = {
                    stream: stream,
                    type: "remote",
                    userid: remoteUserId,
                    extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                    mediaElement: mediaElement,
                    streamid: stream.streamid,
                    blobURL: mediaElement.src || URL.createObjectURL(stream)
                },
                setMuteHandlers(connection, connection.streamEvents[stream.streamid]),
                connection.onstream(connection.streamEvents[stream.streamid])
            }, connection)
        }
        ,
        mPeer.onRemovingRemoteMedia = function(stream, remoteUserId) {
            var streamEvent = connection.streamEvents[stream.streamid];
            streamEvent || (streamEvent = {
                stream: stream,
                type: "remote",
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                streamid: stream.streamid,
                mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
            }),
            connection.onstreamended(streamEvent),
            delete connection.streamEvents[stream.streamid]
        }
        ,
        mPeer.onNegotiationNeeded = function(message, remoteUserId, callback) {
            connectSocket(function() {
                connection.socket.emit(connection.socketMessageEvent, "password"in message ? message : {
                    remoteUserId: message.remoteUserId || remoteUserId,
                    message: message,
                    sender: connection.userid
                }, callback || function() {}
                )
            })
        }
        ,
        mPeer.onUserLeft = onUserLeft,
        mPeer.disconnectWith = function(remoteUserId, callback) {
            connection.socket && connection.socket.emit("disconnect-with", remoteUserId, callback || function() {}
            ),
            connection.deletePeer(remoteUserId)
        }
        ,
        connection.broadcasters = [],
        connection.socketOptions = {
            transport: "polling"
        },
        connection.openOrJoin = function(localUserid, password) {
            connection.checkPresence(localUserid, function(isRoomExists, roomid) {
                if ("function" == typeof password && (password(isRoomExists, roomid),
                password = null ),
                isRoomExists) {
                    connection.sessionid = roomid;
                    var localPeerSdpConstraints = !1
                      , remotePeerSdpConstraints = !1
                      , isOneWay = !!connection.session.oneway
                      , isDataOnly = isData(connection.session);
                    remotePeerSdpConstraints = {
                        OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    },
                    localPeerSdpConstraints = {
                        OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                        OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                    };
                    var connectionDescription = {
                        remoteUserId: connection.sessionid,
                        message: {
                            newParticipationRequest: !0,
                            isOneWay: isOneWay,
                            isDataOnly: isDataOnly,
                            localPeerSdpConstraints: localPeerSdpConstraints,
                            remotePeerSdpConstraints: remotePeerSdpConstraints
                        },
                        sender: connection.userid,
                        password: password || !1
                    };
                    return void mPeer.onNegotiationNeeded(connectionDescription)
                }
                connection.userid;
                connection.userid = connection.sessionid = localUserid || connection.sessionid,
                connection.userid += "",
                connection.socket.emit("changed-uuid", connection.userid),
                password && connection.socket.emit("set-password", password),
                connection.isInitiator = !0,
                isData(connection.session) || connection.captureUserMedia()
            })
        }
        ,
        connection.open = function(localUserid, isPublicModerator) {
            connection.userid;
            return connection.userid = connection.sessionid = localUserid || connection.sessionid,
            connection.userid += "",
            connection.isInitiator = !0,
            connectSocket(function() {
                connection.socket.emit("changed-uuid", connection.userid),
                1 == isPublicModerator && connection.becomePublicModerator()
            }),
            isData(connection.session) ? void ("function" == typeof isPublicModerator && isPublicModerator()) : void connection.captureUserMedia("function" == typeof isPublicModerator ? isPublicModerator : null )
        }
        ,
        connection.becomePublicModerator = function() {
            connection.isInitiator && connection.socket.emit("become-a-public-moderator")
        }
        ,
        connection.dontMakeMeModerator = function() {
            connection.socket.emit("dont-make-me-moderator")
        }
        ,
        connection.deletePeer = function(remoteUserId) {
            if (remoteUserId) {
                if (connection.onleave({
                    userid: remoteUserId,
                    extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {}
                }),
                connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].streams.forEach(function(stream) {
                        stream.stop()
                    });
                    var peer = connection.peers[remoteUserId].peer;
                    if (peer && "closed" !== peer.iceConnectionState)
                        try {
                            peer.close()
                        } catch (e) {}
                    connection.peers[remoteUserId] && (connection.peers[remoteUserId].peer = null ,
                    delete connection.peers[remoteUserId])
                }
                if (-1 !== connection.broadcasters.indexOf(remoteUserId)) {
                    var newArray = [];
                    connection.broadcasters.forEach(function(broadcaster) {
                        broadcaster !== remoteUserId && newArray.push(broadcaster)
                    }),
                    connection.broadcasters = newArray,
                    keepNextBroadcasterOnServer()
                }
            }
        }
        ,
        connection.rejoin = function(connectionDescription) {
            if (!connection.isInitiator && connectionDescription && Object.keys(connectionDescription).length) {
                var extra = {};
                connection.peers[connectionDescription.remoteUserId] && (extra = connection.peers[connectionDescription.remoteUserId].extra,
                connection.deletePeer(connectionDescription.remoteUserId)),
                connectionDescription && connectionDescription.remoteUserId && (connection.join(connectionDescription.remoteUserId),
                connection.onReConnecting({
                    userid: connectionDescription.remoteUserId,
                    extra: extra
                }))
            }
        }
        ,
        connection.join = connection.connect = function(remoteUserId, options) {
            connection.sessionid = (remoteUserId ? remoteUserId.sessionid || remoteUserId.remoteUserId || remoteUserId : !1) || connection.sessionid,
            connection.sessionid += "";
            var localPeerSdpConstraints = !1
              , remotePeerSdpConstraints = !1
              , isOneWay = !1
              , isDataOnly = !1;
            if (remoteUserId && remoteUserId.session || !remoteUserId || "string" == typeof remoteUserId) {
                var session = remoteUserId ? remoteUserId.session || connection.session : connection.session;
                isOneWay = !!session.oneway,
                isDataOnly = isData(session),
                remotePeerSdpConstraints = {
                    OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                },
                localPeerSdpConstraints = {
                    OfferToReceiveAudio: isOneWay ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                    OfferToReceiveVideo: isOneWay ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                }
            }
            options = options || {};
            var cb = function() {}
            ;
            "function" == typeof options && (cb = options,
            options = {}),
            "undefined" != typeof options.localPeerSdpConstraints && (localPeerSdpConstraints = options.localPeerSdpConstraints),
            "undefined" != typeof options.remotePeerSdpConstraints && (remotePeerSdpConstraints = options.remotePeerSdpConstraints),
            "undefined" != typeof options.isOneWay && (isOneWay = options.isOneWay),
            "undefined" != typeof options.isDataOnly && (isDataOnly = options.isDataOnly);
            var connectionDescription = {
                remoteUserId: connection.sessionid,
                message: {
                    newParticipationRequest: !0,
                    isOneWay: isOneWay,
                    isDataOnly: isDataOnly,
                    localPeerSdpConstraints: localPeerSdpConstraints,
                    remotePeerSdpConstraints: remotePeerSdpConstraints
                },
                sender: connection.userid,
                password: !1
            };
            return connectSocket(function() {
                connection.peers[connection.sessionid] || (mPeer.onNegotiationNeeded(connectionDescription),
                cb())
            }),
            connectionDescription
        }
        ,
        connection.connectWithAllParticipants = function(remoteUserId) {
            mPeer.onNegotiationNeeded("connectWithAllParticipants", remoteUserId || connection.sessionid)
        }
        ,
        connection.removeFromBroadcastersList = function(remoteUserId) {
            mPeer.onNegotiationNeeded("removeFromBroadcastersList", remoteUserId || connection.sessionid),
            connection.peers.getAllParticipants(remoteUserId || connection.sessionid).forEach(function(participant) {
                mPeer.onNegotiationNeeded("dropPeerConnection", participant),
                connection.deletePeer(participant)
            }),
            connection.attachStreams.forEach(function(stream) {
                stream.stop()
            })
        }
        ,
        connection.getUserMedia = connection.captureUserMedia = function(callback, sessionForced) {
            callback = callback || function() {};
            var session = sessionForced || connection.session;
            return connection.dontCaptureUserMedia || isData(session) ? void callback() : void ((session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                if (error)
                    throw error;
                connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, function(stream) {
                    if ((session.audio || session.video) && !isAudioPlusTab(connection)) {
                        var nonScreenSession = {};
                        for (var s in session)
                            "screen" !== s && (nonScreenSession[s] = session[s]);
                        return void connection.invokeGetUserMedia(sessionForced, callback, nonScreenSession)
                    }
                    callback(stream)
                })
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(sessionForced, callback, session)))
        }
        ,
        connection.closeBeforeUnload = !0,
        window.addEventListener("beforeunload", beforeUnload, !1),
        connection.userid = getRandomString(),
        connection.changeUserId = function(newUserId, callback) {
            connection.userid = newUserId || getRandomString(),
            connection.socket.emit("changed-uuid", connection.userid, callback || function() {}
            )
        }
        ,
        connection.extra = {},
        connection.attachStreams = [],
        connection.session = {
            audio: !0,
            video: !0
        },
        connection.enableFileSharing = !1,
        connection.bandwidth = {
            screen: 512,
            audio: 128,
            video: 512
        },
        connection.codecs = {
            audio: "opus",
            video: "VP9"
        },
        connection.processSdp = function(sdp) {
            return isMobileDevice || isFirefox ? sdp : (sdp = CodecsHandler.setApplicationSpecificBandwidth(sdp, connection.bandwidth, !!connection.session.screen),
            sdp = CodecsHandler.setVideoBitrates(sdp, {
                min: 8 * connection.bandwidth.video * 1024,
                max: 8 * connection.bandwidth.video * 1024
            }),
            sdp = CodecsHandler.setOpusAttributes(sdp, {
                maxaveragebitrate: 8 * connection.bandwidth.audio * 1024,
                maxplaybackrate: 8 * connection.bandwidth.audio * 1024,
                stereo: 1,
                maxptime: 3
            }),
            "VP9" === connection.codecs.video && (sdp = CodecsHandler.preferVP9(sdp)),
            "H264" === connection.codecs.video && (sdp = CodecsHandler.removeVPX(sdp)),
            "G722" === connection.codecs.audio && (sdp = CodecsHandler.removeNonG722(sdp)),
            sdp)
        }
        ,
        "undefined" != typeof CodecsHandler && (connection.BandwidthHandler = connection.CodecsHandler = CodecsHandler),
        connection.mediaConstraints = {
            audio: {
                mandatory: {},
                optional: [{
                    bandwidth: 8 * connection.bandwidth.audio * 1024 || 1048576
                }]
            },
            video: {
                mandatory: {},
                optional: [{
                    bandwidth: 8 * connection.bandwidth.video * 1024 || 1048576
                }, {
                    facingMode: "user"
                }]
            }
        },
        isFirefox && (connection.mediaConstraints = {
            audio: !0,
            video: !0
        }),
        forceOptions.useDefaultDevices || isMobileDevice || DetectRTC.load(function() {
            var lastAudioDevice, lastVideoDevice;
            if (DetectRTC.MediaDevices.forEach(function(device) {
                "audioinput" === device.kind && connection.mediaConstraints.audio !== !1 && (lastAudioDevice = device),
                "videoinput" === device.kind && connection.mediaConstraints.video !== !1 && (lastVideoDevice = device)
            }),
            lastAudioDevice) {
                if (isFirefox)
                    return void (connection.mediaConstraints.audio !== !0 ? connection.mediaConstraints.audio.deviceId = lastAudioDevice.id : connection.mediaConstraints.audio = {
                        deviceId: lastAudioDevice.id
                    });
                1 == connection.mediaConstraints.audio && (connection.mediaConstraints.audio = {
                    mandatory: {},
                    optional: []
                }),
                connection.mediaConstraints.audio.optional || (connection.mediaConstraints.audio.optional = []);
                var optional = [{
                    sourceId: lastAudioDevice.id
                }];
                connection.mediaConstraints.audio.optional = optional.concat(connection.mediaConstraints.audio.optional)
            }
            if (lastVideoDevice) {
                if (isFirefox)
                    return void (connection.mediaConstraints.video !== !0 ? connection.mediaConstraints.video.deviceId = lastVideoDevice.id : connection.mediaConstraints.video = {
                        deviceId: lastVideoDevice.id
                    });
                1 == connection.mediaConstraints.video && (connection.mediaConstraints.video = {
                    mandatory: {},
                    optional: []
                }),
                connection.mediaConstraints.video.optional || (connection.mediaConstraints.video.optional = []);
                var optional = [{
                    sourceId: lastVideoDevice.id
                }];
                connection.mediaConstraints.video.optional = optional.concat(connection.mediaConstraints.video.optional)
            }
        }),
        connection.sdpConstraints = {
            mandatory: {
                OfferToReceiveAudio: !0,
                OfferToReceiveVideo: !0
            },
            optional: [{
                VoiceActivityDetection: !1
            }]
        },
        connection.optionalArgument = {
            optional: [{
                DtlsSrtpKeyAgreement: !0
            }, {
                googImprovedWifiBwe: !0
            }, {
                googScreencastMinBitrate: 300
            }, {
                googIPv6: !0
            }, {
                googDscp: !0
            }, {
                googCpuUnderuseThreshold: 55
            }, {
                googCpuOveruseThreshold: 85
            }, {
                googSuspendBelowMinBitrate: !0
            }, {
                googCpuOveruseDetection: !0
            }],
            mandatory: {}
        },
        connection.iceServers = IceServersHandler.getIceServers(connection),
        connection.candidates = {
            host: !0,
            stun: !0,
            turn: !0
        },
        connection.iceProtocols = {
            tcp: !0,
            udp: !0
        },
        connection.onopen = function(event) {
            connection.enableLogs && console.info("Data connection has been opened between you & ", event.userid)
        }
        ,
        connection.onclose = function(event) {
            connection.enableLogs && console.warn("Data connection has been closed between you & ", event.userid)
        }
        ,
        connection.onerror = function(error) {
            console.log("========================" , error);
            connection.enableLogs && console.error(error.userid, "data-error", error)
        }
        ,
        connection.onmessage = function(event) {
            connection.enableLogs && console.debug("data-message", event.userid, event.data)
        }
        ,
        connection.send = function(data, remoteUserId) {
            console.log("connection send -> connection.peers" , connection.peers);
            connection.peers.send(data, remoteUserId)
        }
        ,
        connection.close = connection.disconnect = connection.leave = function() {
            beforeUnload(!1, !0)
        }
        ,
        connection.closeEntireSession = function(callback) {
            callback = callback || function() {}
            ,
            connection.socket.emit("close-entire-session", function looper() {
                return connection.getAllParticipants().length ? void setTimeout(looper, 100) : (connection.onEntireSessionClosed({
                    sessionid: connection.sessionid,
                    userid: connection.userid,
                    extra: connection.extra
                }),
                void connection.changeUserId(null , function() {
                    connection.close(),
                    callback()
                }))
            })
        }
        ,
        connection.onEntireSessionClosed = function(event) {
            connection.enableLogs && console.info("Entire session is closed: ", event.sessionid, event.extra)
        }
        ,
        connection.onstream = function(e) {
            var parentNode = connection.videosContainer;
            parentNode.insertBefore(e.mediaElement, parentNode.firstChild),
            e.mediaElement.play(),
            setTimeout(function() {
                e.mediaElement.play()
            }, 5e3)
        }
        ,
        connection.onstreamended = function(e) {
            e.mediaElement || (e.mediaElement = document.getElementById(e.streamid)),
            e.mediaElement && e.mediaElement.parentNode && e.mediaElement.parentNode.removeChild(e.mediaElement)
        }
        ,
        connection.direction = "many-to-many",
        connection.removeStream = function(streamid) {
            var stream;
            return connection.attachStreams.forEach(function(localStream) {
                localStream.id === streamid && (stream = localStream)
            }),
            stream ? (connection.peers.getAllParticipants().forEach(function(participant) {
                var user = connection.peers[participant];
                try {
                    user.peer.removeStream(stream)
                } catch (e) {}
            }),
            void connection.renegotiate()) : void console.warn("No such stream exists.", streamid)
        }
        ,
        connection.addStream = function(session, remoteUserId) {
            function gumCallback(stream) {
                session.streamCallback && session.streamCallback(stream),
                connection.renegotiate(remoteUserId)
            }
            return session.getAudioTracks ? (-1 === connection.attachStreams.indexOf(session) && (session.streamid || (session.streamid = session.id),
            connection.attachStreams.push(session)),
            void connection.renegotiate(remoteUserId)) : isData(session) ? void connection.renegotiate(remoteUserId) : void ((session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                return error ? alert(error) : void connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, !session.audio && !session.video || isAudioPlusTab(connection) ? gumCallback : connection.invokeGetUserMedia(null , gumCallback))
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(null , gumCallback)))
        }
        ,
        connection.invokeGetUserMedia = function(localMediaConstraints, callback, session) {
            session || (session = connection.session),
            localMediaConstraints || (localMediaConstraints = connection.mediaConstraints),
            getUserMediaHandler({
                onGettingLocalMedia: function(stream) {
                    var videoConstraints = localMediaConstraints.video;
                    videoConstraints && (videoConstraints.mediaSource || videoConstraints.mozMediaSource ? stream.isScreen = !0 : videoConstraints.mandatory && videoConstraints.mandatory.chromeMediaSource && (stream.isScreen = !0)),
                    stream.isScreen || (stream.isVideo = stream.getVideoTracks().length,
                    stream.isAudio = !stream.isVideo && stream.getAudioTracks().length),
                    mPeer.onGettingLocalMedia(stream),
                    callback && callback(stream)
                },
                onLocalMediaError: function(error, constraints) {
                    mPeer.onLocalMediaError(error, constraints)
                },
                localMediaConstraints: localMediaConstraints || {
                    audio: session.audio ? localMediaConstraints.audio : !1,
                    video: session.video ? localMediaConstraints.video : !1
                }
            })
        }
        ,
        connection.applyConstraints = function(mediaConstraints, streamid) {
            if (!MediaStreamTrack || !MediaStreamTrack.prototype.applyConstraints)
                return void alert("track.applyConstraints is NOT supported in your browser.");
            if (streamid) {
                var stream;
                return connection.streamEvents[streamid] && (stream = connection.streamEvents[streamid].stream),
                void applyConstraints(stream, mediaConstraints)
            }
            connection.attachStreams.forEach(function(stream) {
                applyConstraints(stream, mediaConstraints)
            })
        }
        ,
        connection.replaceTrack = function(session, remoteUserId, isVideoTrack) {
            function gumCallback(stream) {
                connection.replaceTrack(stream, remoteUserId, isVideoTrack || session.video || session.screen)
            }
            if (session = session || {},
            !RTCPeerConnection.prototype.getSenders)
                return void connection.addStream(session);
            if (session instanceof MediaStreamTrack)
                return void replaceTrack(session, remoteUserId, isVideoTrack);
            if (session instanceof MediaStream)
                return session.getVideoTracks().length && replaceTrack(session.getVideoTracks()[0], remoteUserId, !0),
                void (session.getAudioTracks().length && replaceTrack(session.getAudioTracks()[0], remoteUserId, !1));
            if (isData(session))
                throw "connection.replaceTrack requires audio and/or video and/or screen.";
            (session.audio || session.video || session.screen) && (session.screen ? connection.getScreenConstraints(function(error, screen_constraints) {
                return error ? alert(error) : void connection.invokeGetUserMedia({
                    audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : !1,
                    video: screen_constraints,
                    isScreen: !0
                }, !session.audio && !session.video || isAudioPlusTab(connection) ? gumCallback : connection.invokeGetUserMedia(null , gumCallback))
            }) : (session.audio || session.video) && connection.invokeGetUserMedia(null , gumCallback))
        }
        ,
        connection.resetTrack = function(remoteUsersIds, isVideoTrack) {
            remoteUsersIds || (remoteUsersIds = connection.getAllParticipants()),
            "string" == typeof remoteUsersIds && (remoteUsersIds = [remoteUsersIds]),
            remoteUsersIds.forEach(function(participant) {
                var peer = connection.peers[participant].peer;
                "undefined" != typeof isVideoTrack && isVideoTrack !== !0 || !peer.lastVideoTrack || connection.replaceTrack(peer.lastVideoTrack, participant, !0),
                "undefined" != typeof isVideoTrack && isVideoTrack !== !1 || !peer.lastAudioTrack || connection.replaceTrack(peer.lastAudioTrack, participant, !1)
            })
        }
        ,
        connection.renegotiate = function(remoteUserId) {
            return remoteUserId ? void mPeer.renegotiatePeer(remoteUserId) : void connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.renegotiatePeer(participant)
            })
        }
        ,
        connection.setStreamEndHandler = function(stream, isRemote) {
            stream && stream.addEventListener && (isRemote = !!isRemote,
            stream.alreadySetEndHandler || (stream.alreadySetEndHandler = !0,
            stream.addEventListener("ended", function() {
                stream.idInstance && currentUserMediaRequest.remove(stream.idInstance),
                isRemote || delete connection.attachStreams[connection.attachStreams.indexOf(stream)];
                var streamEvent = connection.streamEvents[stream.streamid];
                streamEvent || (streamEvent = {
                    stream: stream,
                    streamid: stream.streamid,
                    type: isRemote ? "remote" : "local",
                    userid: connection.userid,
                    extra: connection.extra,
                    mediaElement: connection.streamEvents[stream.streamid] ? connection.streamEvents[stream.streamid].mediaElement : null
                }),
                (streamEvent.userid !== connection.userid || "remote" !== streamEvent.type) && (connection.onstreamended(streamEvent),
                delete connection.streamEvents[stream.streamid])
            }, !1)))
        }
        ,
        connection.onMediaError = function(error, constraints) {
            connection.enableLogs && console.error(error, constraints)
        }
        ,
        connection.addNewBroadcaster = function(broadcasterId, userPreferences) {
            connection.broadcasters.length && setTimeout(function() {
                mPeer.connectNewParticipantWithAllBroadcasters(broadcasterId, userPreferences, connection.broadcasters.join("|-,-|"))
            }, 1e4),
            connection.session.oneway || connection.session.broadcast || "many-to-many" !== connection.direction || -1 !== connection.broadcasters.indexOf(broadcasterId) || (connection.broadcasters.push(broadcasterId),
            keepNextBroadcasterOnServer())
        }
        ,
        connection.autoCloseEntireSession = !1,
        connection.filesContainer = connection.videosContainer = document.body || document.documentElement,
        connection.isInitiator = !1,
        connection.shareFile = mPeer.shareFile,
        "undefined" != typeof FileProgressBarHandler && FileProgressBarHandler.handle(connection),
        "undefined" != typeof TranslationHandler && TranslationHandler.handle(connection),
        connection.token = getRandomString,
        connection.onNewParticipant = function(participantId, userPreferences) {
            connection.acceptParticipationRequest(participantId, userPreferences)
        }
        ,
        connection.acceptParticipationRequest = function(participantId, userPreferences) {
            userPreferences.successCallback && (userPreferences.successCallback(),
            delete userPreferences.successCallback),
            mPeer.createNewPeer(participantId, userPreferences)
        }
        ,
        connection.onShiftedModerationControl = function(sender, existingBroadcasters) {
            connection.acceptModerationControl(sender, existingBroadcasters)
        }
        ,
        connection.acceptModerationControl = function(sender, existingBroadcasters) {
            connection.isInitiator = !0,
            connection.broadcasters = existingBroadcasters,
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    changedUUID: sender,
                    oldUUID: connection.userid,
                    newUUID: sender
                }, participant)
            }),
            connection.userid = sender,
            connection.socket.emit("changed-uuid", connection.userid)
        }
        ,
        connection.shiftModerationControl = function(remoteUserId, existingBroadcasters, firedOnLeave) {
            mPeer.onNegotiationNeeded({
                shiftedModerationControl: !0,
                broadcasters: existingBroadcasters,
                firedOnLeave: !!firedOnLeave
            }, remoteUserId)
        }
        ,
        "undefined" != typeof StreamsHandler && (connection.StreamsHandler = StreamsHandler),
        connection.onleave = function(userid) {}
        ,
        connection.invokeSelectFileDialog = function(callback) {
            var selector = new FileSelector;
            selector.selectSingleFile(callback)
        }
        ,
        connection.getPublicModerators = function(userIdStartsWith, callback) {
            "function" == typeof userIdStartsWith && (callback = userIdStartsWith),
            connectSocket(function() {
                connection.socket.emit("get-public-moderators", "string" == typeof userIdStartsWith ? userIdStartsWith : "", callback)
            })
        }
        ,
        connection.onmute = function(e) {
            e && e.mediaElement && ("both" === e.muteType || "video" === e.muteType ? (e.mediaElement.src = null ,
            e.mediaElement.pause(),
            e.mediaElement.poster = e.snapshot || "https://cdn.webrtc-experiment.com/images/muted.png") : "audio" === e.muteType && (e.mediaElement.muted = !0))
        }
        ,
        connection.onunmute = function(e) {
            e && e.mediaElement && e.stream && ("both" === e.unmuteType || "video" === e.unmuteType ? (e.mediaElement.poster = null ,
            e.mediaElement.src = URL.createObjectURL(e.stream),
            e.mediaElement.play()) : "audio" === e.unmuteType && (e.mediaElement.muted = !1))
        }
        ,
        connection.onExtraDataUpdated = function(event) {
            event.status = "online",
            connection.onUserStatusChanged(event, !0)
        }
        ,
        connection.onJoinWithPassword = function(remoteUserId) {
            console.warn(remoteUserId, "is password protected. Please join with password.")
        }
        ,
        connection.onInvalidPassword = function(remoteUserId, oldPassword) {
            console.warn(remoteUserId, "is password protected. Please join with valid password. Your old password", oldPassword, "is wrong.")
        }
        ,
        connection.onPasswordMaxTriesOver = function(remoteUserId) {
            console.warn(remoteUserId, "is password protected. Your max password tries exceeded the limit.")
        }
        ,
        connection.getAllParticipants = function(sender) {
            return connection.peers.getAllParticipants(sender)
        }
        ,
        "undefined" != typeof StreamsHandler && (StreamsHandler.onSyncNeeded = function(streamid, action, type) {
            connection.peers.getAllParticipants().forEach(function(participant) {
                mPeer.onNegotiationNeeded({
                    streamid: streamid,
                    action: action,
                    streamSyncNeeded: !0,
                    type: type || "both"
                }, participant)
            })
        }
        ),
        connection.connectSocket = function(callback) {
            connectSocket(callback)
        }
        ,
        connection.socketAutoReConnect = !0,
        connection.closeSocket = function() {
            try {
                io.sockets = {}
            } catch (e) {}
            connection.socket && (connection.socketAutoReConnect = !1,
            "function" == typeof connection.socket.disconnect && connection.socket.disconnect(),
            connection.socket = null )
        }
        ,
        connection.getSocket = function(callback) {
            return connection.socket ? callback && callback(connection.socket) : connectSocket(callback),
            connection.socket
        }
        ,
        connection.getRemoteStreams = mPeer.getRemoteStreams;
        var skipStreams = ["selectFirst", "selectAll", "forEach"];
        if (connection.streamEvents = {
            selectFirst: function(options) {
                if (!options) {
                    var firstStream;
                    for (var str in connection.streamEvents)
                        -1 !== skipStreams.indexOf(str) || firstStream || (firstStream = connection.streamEvents[str]);
                    return firstStream
                }
            },
            selectAll: function() {}
        },
        connection.socketURL = "/",
        connection.socketMessageEvent = "RTCMultiConnection-Message",
        connection.socketCustomEvent = "RTCMultiConnection-Custom-Message",
        connection.DetectRTC = DetectRTC,
        connection.setCustomSocketEvent = function(customEvent) {
            customEvent && (connection.socketCustomEvent = customEvent),
            connection.socket && connection.socket.emit("set-custom-socket-event-listener", connection.socketCustomEvent)
        }
        ,
        connection.getNumberOfBroadcastViewers = function(broadcastId, callback) {
            connection.socket && broadcastId && callback && connection.socket.emit("get-number-of-users-in-specific-broadcast", broadcastId, callback)
        }
        ,
        connection.onNumberOfBroadcastViewersUpdated = function(event) {
            connection.enableLogs && connection.isInitiator && console.info("Number of broadcast (", event.broadcastId, ") viewers", event.numberOfBroadcastViewers)
        }
        ,
        connection.onUserStatusChanged = function(event, dontWriteLogs) {
            connection.enableLogs && !dontWriteLogs && console.info(event.userid, event.status)
        }
        ,
        connection.getUserMediaHandler = getUserMediaHandler,
        connection.multiPeersHandler = mPeer,
        connection.enableLogs = !0,
        connection.setCustomSocketHandler = function(customSocketHandler) {
            "undefined" != typeof SocketConnection && (SocketConnection = customSocketHandler)
        }
        ,
        connection.chunkSize = 65 * 1000,
        connection.maxParticipantsAllowed = 50,
        connection.disconnectWith = mPeer.disconnectWith,
        connection.checkPresence = function(remoteUserId, callback) {
            return connection.socket ? void connection.socket.emit("check-presence", (remoteUserId || connection.sessionid) + "", callback) : void connection.connectSocket(function() {
                connection.checkPresence(remoteUserId, callback)
            })
        }
        ,
        connection.onReadyForOffer = function(remoteUserId, userPreferences) {
            connection.multiPeersHandler.createNewPeer(remoteUserId, userPreferences)
        }
        ,
        connection.setUserPreferences = function(userPreferences) {
            return connection.dontAttachStream && (userPreferences.dontAttachLocalStream = !0),
            connection.dontGetRemoteStream && (userPreferences.dontGetRemoteStream = !0),
            userPreferences
        }
        ,
        connection.updateExtraData = function() {
            connection.socket.emit("extra-data-updated", connection.extra)
        }
        ,
        connection.enableScalableBroadcast = !1,
        connection.maxRelayLimitPerUser = 3,
        connection.dontCaptureUserMedia = !1,
        connection.dontAttachStream = !1,
        connection.dontGetRemoteStream = !1,
        connection.onReConnecting = function(event) {
            connection.enableLogs && console.info("ReConnecting with", event.userid, "...")
        }
        ,
        connection.beforeAddingStream = function(stream) {
            return stream
        }
        ,
        connection.beforeRemovingStream = function(stream) {
            return stream
        }
        ,
        "undefined" != typeof isChromeExtensionAvailable && (connection.checkIfChromeExtensionAvailable = isChromeExtensionAvailable),
        "undefined" != typeof isFirefoxExtensionAvailable && (connection.checkIfChromeExtensionAvailable = isFirefoxExtensionAvailable),
        "undefined" != typeof getChromeExtensionStatus && (connection.getChromeExtensionStatus = getChromeExtensionStatus),
        connection.getScreenConstraints = function(callback, audioPlusTab) {
            isAudioPlusTab(connection, audioPlusTab) && (audioPlusTab = !0),
            getScreenConstraints(function(error, screen_constraints) {
                error || (screen_constraints = connection.modifyScreenConstraints(screen_constraints),
                callback(error, screen_constraints))
            }, audioPlusTab)
        }
        ,
        connection.modifyScreenConstraints = function(screen_constraints) {
            return screen_constraints
        }
        ,
        connection.onPeerStateChanged = function(state) {
            connection.enableLogs && -1 !== state.iceConnectionState.search(/closed|failed/gi) && console.error("Peer connection is closed between you & ", state.userid, state.extra, "state:", state.iceConnectionState)
        }
        ,
        connection.isOnline = !0,
        listenEventHandler("online", function() {
            connection.isOnline = !0
        }),
        listenEventHandler("offline", function() {
            connection.isOnline = !1
        }),
        connection.isLowBandwidth = !1,
        navigator && navigator.connection && navigator.connection.type && (connection.isLowBandwidth = -1 !== navigator.connection.type.toString().toLowerCase().search(/wifi|cell/g),
        connection.isLowBandwidth)) {
            if (connection.bandwidth = {
                audio: 30,
                video: 30,
                screen: 30
            },
            connection.mediaConstraints.audio && connection.mediaConstraints.audio.optional && connection.mediaConstraints.audio.optional.length) {
                var newArray = [];
                connection.mediaConstraints.audio.optional.forEach(function(opt) {
                    "undefined" == typeof opt.bandwidth && newArray.push(opt)
                }),
                connection.mediaConstraints.audio.optional = newArray
            }
            if (connection.mediaConstraints.video && connection.mediaConstraints.video.optional && connection.mediaConstraints.video.optional.length) {
                var newArray = [];
                connection.mediaConstraints.video.optional.forEach(function(opt) {
                    "undefined" == typeof opt.bandwidth && newArray.push(opt)
                }),
                connection.mediaConstraints.video.optional = newArray
            }
        }
        connection.getExtraData = function(remoteUserId) {
            if (!remoteUserId)
                throw "remoteUserId is required.";
            return connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {}
        }
        ,
        forceOptions.autoOpenOrJoin && connection.openOrJoin(connection.sessionid),
        connection.onUserIdAlreadyTaken = function(useridAlreadyTaken, yourNewUserId) {
            connection.enableLogs && console.warn("Userid already taken.", useridAlreadyTaken, "Your new userid:", yourNewUserId),
            connection.join(useridAlreadyTaken)
        }
        ,
        connection.trickleIce = !0,
        connection.onSettingLocalDescription = function(event) {
            if (connection.enableLogs) {
                console.info('Set local description for remote user', event.userid);
            }
        };
    }
    function SocketConnection(connection, connectCallback) {
        var parameters = "";
        parameters += "?userid=" + connection.userid,
        parameters += "&msgEvent=" + connection.socketMessageEvent,
        parameters += "&socketCustomEvent=" + connection.socketCustomEvent,
        connection.enableScalableBroadcast && (parameters += "&enableScalableBroadcast=true",
        parameters += "&maxRelayLimitPerUser=" + (connection.maxRelayLimitPerUser || 2)),
        connection.socketCustomParameters && (parameters += connection.socketCustomParameters);
        try {
            io.sockets = {}
        } catch (e) {}
        try {
            connection.socket = io((connection.socketURL || "/") + parameters)
        } catch (e) {
            connection.socket = io.connect((connection.socketURL || "/") + parameters, connection.socketOptions)
        }
        var mPeer = connection.multiPeersHandler;
        connection.socket.on("extra-data-updated", function(remoteUserId, extra) {
            connection.peers[remoteUserId] && (connection.peers[remoteUserId].extra = extra,
            connection.onExtraDataUpdated({
                userid: remoteUserId,
                extra: extra
            }))
        }),
        connection.socket.on(connection.socketMessageEvent, function(message) {
            if (message.remoteUserId == connection.userid) {
                if (connection.peers[message.sender] && connection.peers[message.sender].extra != message.message.extra && (connection.peers[message.sender].extra = message.extra,
                connection.onExtraDataUpdated({
                    userid: message.sender,
                    extra: message.extra
                })),
                message.message.streamSyncNeeded && connection.peers[message.sender]) {
                    var stream = connection.streamEvents[message.message.streamid];
                    if (!stream || !stream.stream)
                        return;
                    var action = message.message.action;
                    if ("ended" === action || "stream-removed" === action)
                        return void connection.onstreamended(stream);
                    var type = "both" != message.message.type ? message.message.type : null ;
                    return void stream.stream[action](type)
                }
                if ("connectWithAllParticipants" === message.message)
                    return -1 === connection.broadcasters.indexOf(message.sender) && connection.broadcasters.push(message.sender),
                    void mPeer.onNegotiationNeeded({
                        allParticipants: connection.getAllParticipants(message.sender)
                    }, message.sender);
                if ("removeFromBroadcastersList" === message.message)
                    return void (-1 !== connection.broadcasters.indexOf(message.sender) && (delete connection.broadcasters[connection.broadcasters.indexOf(message.sender)],
                    connection.broadcasters = removeNullEntries(connection.broadcasters)));
                if ("dropPeerConnection" === message.message)
                    return void connection.deletePeer(message.sender);
                if (message.message.allParticipants)
                    return -1 === message.message.allParticipants.indexOf(message.sender) && message.message.allParticipants.push(message.sender),
                    void message.message.allParticipants.forEach(function(participant) {
                        mPeer[connection.peers[participant] ? "renegotiatePeer" : "createNewPeer"](participant, {
                            localPeerSdpConstraints: {
                                OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                                OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                            },
                            remotePeerSdpConstraints: {
                                OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                                OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                            },
                            isOneWay: !!connection.session.oneway || "one-way" === connection.direction,
                            isDataOnly: isData(connection.session)
                        })
                    });
                if (message.message.newParticipant) {
                    if (message.message.newParticipant == connection.userid)
                        return;
                    if (connection.peers[message.message.newParticipant])
                        return;
                    return void mPeer.createNewPeer(message.message.newParticipant, message.message.userPreferences || {
                        localPeerSdpConstraints: {
                            OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        remotePeerSdpConstraints: {
                            OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        isOneWay: !!connection.session.oneway || "one-way" === connection.direction,
                        isDataOnly: isData(connection.session)
                    })
                }
                if ((message.message.readyForOffer || message.message.addMeAsBroadcaster) && connection.addNewBroadcaster(message.sender),
                message.message.newParticipationRequest && message.sender !== connection.userid) {
                    connection.peers[message.sender] && connection.deletePeer(message.sender);
                    var userPreferences = {
                        extra: message.extra || {},
                        localPeerSdpConstraints: message.message.remotePeerSdpConstraints || {
                            OfferToReceiveAudio: connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        remotePeerSdpConstraints: message.message.localPeerSdpConstraints || {
                            OfferToReceiveAudio: connection.session.oneway ? !!connection.session.audio : connection.sdpConstraints.mandatory.OfferToReceiveAudio,
                            OfferToReceiveVideo: connection.session.oneway ? !!connection.session.video || !!connection.session.screen : connection.sdpConstraints.mandatory.OfferToReceiveVideo
                        },
                        isOneWay: "undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction,
                        isDataOnly: "undefined" != typeof message.message.isDataOnly ? message.message.isDataOnly : isData(connection.session),
                        dontGetRemoteStream: "undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction,
                        dontAttachLocalStream: !!message.message.dontGetRemoteStream,
                        connectionDescription: message,
                        successCallback: function() {
                            ("undefined" != typeof message.message.isOneWay ? message.message.isOneWay : !!connection.session.oneway || "one-way" === connection.direction) && connection.addNewBroadcaster(message.sender, userPreferences),
                            (connection.session.oneway || "one-way" === connection.direction || isData(connection.session)) && connection.addNewBroadcaster(message.sender, userPreferences)
                        }
                    };
                    return void connection.onNewParticipant(message.sender, userPreferences)
                }
                return message.message.shiftedModerationControl ? void connection.onShiftedModerationControl(message.sender, message.message.broadcasters) : (message.message.changedUUID && connection.peers[message.message.oldUUID] && (connection.peers[message.message.newUUID] = connection.peers[message.message.oldUUID],
                delete connection.peers[message.message.oldUUID]),
                message.message.userLeft ? (mPeer.onUserLeft(message.sender),
                void (message.message.autoCloseEntireSession && connection.leave())) : void mPeer.addNegotiatedMessage(message.message, message.sender))
            }
        }),
        connection.socket.on("user-left", function(userid) {
            onUserLeft(userid),
            connection.onUserStatusChanged({
                userid: userid,
                status: "offline",
                extra: connection.peers[userid] ? connection.peers[userid].extra || {} : {}
            }),
            connection.onleave({
                userid: userid,
                extra: {}
            })
        }),
        connection.socket.on("connect", function() {
            return connection.socketAutoReConnect ? (connection.enableLogs && console.info("socket.io connection is opened."),
            connection.socket.emit("extra-data-updated", connection.extra),
            void (connectCallback && connectCallback(connection.socket))) : void (connection.socket = null )
        }),
        connection.socket.on("disconnect", function() {
            return connection.socketAutoReConnect ? void (connection.enableLogs && (console.info("socket.io connection is closed"),
            console.warn("socket.io reconnecting"))) : void (connection.socket = null )
        }),
        connection.socket.on("join-with-password", function(remoteUserId) {
            connection.onJoinWithPassword(remoteUserId)
        }),
        connection.socket.on("invalid-password", function(remoteUserId, oldPassword) {
            connection.onInvalidPassword(remoteUserId, oldPassword)
        }),
        connection.socket.on("password-max-tries-over", function(remoteUserId) {
            connection.onPasswordMaxTriesOver(remoteUserId)
        }),
        connection.socket.on("user-disconnected", function(remoteUserId) {
            remoteUserId !== connection.userid && (connection.onUserStatusChanged({
                userid: remoteUserId,
                status: "offline",
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra || {} : {}
            }),
            connection.deletePeer(remoteUserId))
        }),
        connection.socket.on("user-connected", function(userid) {
            userid !== connection.userid && connection.onUserStatusChanged({
                userid: userid,
                status: "online",
                extra: connection.peers[userid] ? connection.peers[userid].extra || {} : {}
            })
        }),
        connection.socket.on("closed-entire-session", function(sessionid, extra) {
            connection.leave(),
            connection.onEntireSessionClosed({
                sessionid: sessionid,
                userid: sessionid,
                extra: extra
            })
        }),
        connection.socket.on("userid-already-taken", function(useridAlreadyTaken, yourNewUserId) {
            connection.isInitiator = !1,
            connection.userid = yourNewUserId,
            connection.onUserIdAlreadyTaken(useridAlreadyTaken, yourNewUserId)
        }),
        connection.socket.on("logs", function(log) {
            connection.enableLogs && console.debug("server-logs", log)
        }),
        connection.socket.on("number-of-broadcast-viewers-updated", function(data) {
            connection.onNumberOfBroadcastViewersUpdated(data)
        })
    }
    function MultiPeers(connection) {
        function gumCallback(stream, message, remoteUserId) {
            var streamsToShare = {};
            connection.attachStreams.forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                }
            }),
            message.userPreferences.streamsToShare = streamsToShare,
            self.onNegotiationNeeded({
                readyForOffer: !0,
                userPreferences: message.userPreferences
            }, remoteUserId)
        }
        function initFileBufferReader() {
            connection.fbr = new FileBufferReader,
            connection.fbr.onProgress = function(chunk) {
                connection.onFileProgress(chunk)
            }
            ,
            connection.fbr.onBegin = function(file) {
                connection.onFileStart(file)
            }
            ,
            connection.fbr.onEnd = function(file) {
                connection.onFileEnd(file)
            }
        }
        var self = this
          , skipPeers = ["getAllParticipants", "getLength", "selectFirst", "streams", "send", "forEach"];
        connection.peers = {
            getLength: function() {
                var numberOfPeers = 0;
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1) {
                        numberOfPeers++;
                    }
                }
                return numberOfPeers;
            },
            selectFirst: function() {
                var firstPeer;
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1) {
                        firstPeer = this[peer];
                    }
                }
                return firstPeer;
            },
            getAllParticipants: function(sender) {
                var allPeers = [];
                for (var peer in this) {
                    if (skipPeers.indexOf(peer) == -1 && peer != sender) {
                        allPeers.push(peer);
                    }
                }
                return allPeers;
            },
            forEach: function(callbcak) {
                this.getAllParticipants().forEach(function(participant) {
                    callbcak(connection.peers[participant]);
                });
            },
            send: function(data, remoteUserId) {
                var that = this;

                if (!isNull(data.size) && !isNull(data.type)) {
                    self.shareFile(data, remoteUserId);
                    return;
                }

                if (data.type !== 'text' && !(data instanceof ArrayBuffer) && !(data instanceof DataView)) {
                    TextSender.send({
                        text: data,
                        channel: this,
                        connection: connection,
                        remoteUserId: remoteUserId
                    });
                    return;
                }

                if (data.type === 'text') {
                    data = JSON.stringify(data);
                }

                if (remoteUserId) {
                    var remoteUser = connection.peers[remoteUserId];
                    if (remoteUser) {
                        if (!remoteUser.channels.length) {
                            connection.peers[remoteUserId].createDataChannel();
                            connection.renegotiate(remoteUserId);
                            setTimeout(function() {
                                that.send(data, remoteUserId);
                            }, 3000);
                            return;
                        }

                        remoteUser.channels.forEach(function(channel) {
                            channel.send(data);
                        });
                        return;
                    }
                }

                this.getAllParticipants().forEach(function(participant) {
                    if (!that[participant].channels.length) {
                        connection.peers[participant].createDataChannel();
                        connection.renegotiate(participant);
                        setTimeout(function() {
                            that[participant].channels.forEach(function(channel) {
                                channel.send(data);
                            });
                        }, 3000);
                        return;
                    }

                    that[participant].channels.forEach(function(channel) {
                        channel.send(data);
                    });
                });
            }
        };

        this.uuid = connection.userid,
        this.getLocalConfig = function(remoteSdp, remoteUserId, userPreferences) {
            if (!userPreferences) {
                userPreferences = {};
            }

            return {
                streamsToShare: userPreferences.streamsToShare || {},
                rtcMultiConnection: connection,
                connectionDescription: userPreferences.connectionDescription,
                userid: remoteUserId,
                localPeerSdpConstraints: userPreferences.localPeerSdpConstraints,
                remotePeerSdpConstraints: userPreferences.remotePeerSdpConstraints,
                dontGetRemoteStream: !!userPreferences.dontGetRemoteStream,
                dontAttachLocalStream: !!userPreferences.dontAttachLocalStream,
                renegotiatingPeer: !!userPreferences.renegotiatingPeer,
                peerRef: userPreferences.peerRef,
                channels: userPreferences.channels || [],
                onLocalSdp: function(localSdp) {
                    self.onNegotiationNeeded(localSdp, remoteUserId);
                },
                onLocalCandidate: function(localCandidate) {
                    localCandidate = OnIceCandidateHandler.processCandidates(connection, localCandidate)
                    if (localCandidate) {
                        self.onNegotiationNeeded(localCandidate, remoteUserId);
                    }
                },
                remoteSdp: remoteSdp,
                onDataChannelMessage: function(message) {

                    if (!fbr && connection.enableFileSharing) initFileBufferReader();

                    if (typeof message == 'string' || !connection.enableFileSharing) {
                        self.onDataChannelMessage(message, remoteUserId);
                        return;
                    }

                    var that = this;

                    if (message instanceof ArrayBuffer || message instanceof DataView) {
                        fbr.convertToObject(message, function(object) {
                            that.onDataChannelMessage(object);
                        });
                        return;
                    }

                    if (message.readyForNextChunk) {
                        fbr.getNextChunk(message.uuid, function(nextChunk, isLastChunk) {
                            connection.peers[remoteUserId].channels.forEach(function(channel) {
                                channel.send(nextChunk);
                            });
                        }, remoteUserId);
                        return;
                    }

                    fbr.addChunk(message, function(promptNextChunk) {
                        connection.peers[remoteUserId].peer.channel.send(promptNextChunk);
                    });
                },
                onDataChannelError: function(error) {
                    self.onDataChannelError(error, remoteUserId);
                },
                onDataChannelOpened: function(channel) {
                    self.onDataChannelOpened(channel, remoteUserId);
                },
                onDataChannelClosed: function(event) {
                    self.onDataChannelClosed(event, remoteUserId);
                },
                onRemoteStream: function(stream) {
                    connection.peers[remoteUserId].streams.push(stream);

                    if (isPluginRTC && window.PluginRTC) {
                        var mediaElement = document.createElement('video');
                        var body = connection.videosContainer;
                        body.insertBefore(mediaElement, body.firstChild);
                        setTimeout(function() {
                            window.PluginRTC.attachMediaStream(mediaElement, stream);
                        }, 3000);
                        return;
                    }

                    self.onGettingRemoteMedia(stream, remoteUserId);
                },
                onRemoteStreamRemoved: function(stream) {
                    self.onRemovingRemoteMedia(stream, remoteUserId);
                },
                onPeerStateChanged: function(states) {
                    self.onPeerStateChanged(states);

                    if (states.iceConnectionState === 'new') {
                        self.onNegotiationStarted(remoteUserId, states);
                    }

                    if (states.iceConnectionState === 'connected') {
                        self.onNegotiationCompleted(remoteUserId, states);
                    }

                    if (states.iceConnectionState.search(/closed|failed/gi) !== -1) {
                        self.onUserLeft(remoteUserId);
                        self.disconnectWith(remoteUserId);
                    }
                }
            };
        };

        this.createNewPeer = function(remoteUserId, userPreferences) {
            if (connection.maxParticipantsAllowed <= connection.getAllParticipants().length) {
                return;
            }

            userPreferences = userPreferences || {};

            if (connection.isInitiator && !!connection.session.audio && connection.session.audio === 'two-way' && !userPreferences.streamsToShare) {
                userPreferences.isOneWay = false;
                userPreferences.isDataOnly = false;
                userPreferences.session = connection.session;
            }

            if (!userPreferences.isOneWay && !userPreferences.isDataOnly) {
                userPreferences.isOneWay = true;
                this.onNegotiationNeeded({
                    enableMedia: true,
                    userPreferences: userPreferences
                }, remoteUserId);
                return;
            }

            userPreferences = connection.setUserPreferences(userPreferences, remoteUserId);

            var localConfig = this.getLocalConfig(null, remoteUserId, userPreferences);
            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.createAnsweringPeer = function(remoteSdp, remoteUserId, userPreferences) {
            userPreferences = connection.setUserPreferences(userPreferences || {}, remoteUserId);

            var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);
            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.renegotiatePeer = function(remoteUserId, userPreferences, remoteSdp) {
            if (!connection.peers[remoteUserId]) {
                if (connection.enableLogs) {
                    console.error('This peer (' + remoteUserId + ') does not exists. Renegotiation skipped.');
                }
                return;
            }

            if (!userPreferences) {
                userPreferences = {};
            }

            userPreferences.renegotiatingPeer = true;
            userPreferences.peerRef = connection.peers[remoteUserId].peer;
            userPreferences.channels = connection.peers[remoteUserId].channels;

            var localConfig = this.getLocalConfig(remoteSdp, remoteUserId, userPreferences);

            connection.peers[remoteUserId] = new PeerInitiator(localConfig);
        };

        this.replaceTrack = function(track, remoteUserId, isVideoTrack) {
            if (!connection.peers[remoteUserId]) {
                throw 'This peer (' + remoteUserId + ') does not exists.';
            }

            var peer = connection.peers[remoteUserId].peer;

            if (!!peer.getSenders && typeof peer.getSenders === 'function' && peer.getSenders().length) {
                peer.getSenders().forEach(function(rtpSender) {
                    if (isVideoTrack && rtpSender.track instanceof VideoStreamTrack) {
                        connection.peers[remoteUserId].peer.lastVideoTrack = rtpSender.track;
                        rtpSender.replaceTrack(track);
                    }

                    if (!isVideoTrack && rtpSender.track instanceof AudioStreamTrack) {
                        connection.peers[remoteUserId].peer.lastAudioTrack = rtpSender.track;
                        rtpSender.replaceTrack(track);
                    }
                });
                return;
            }

            console.warn('RTPSender.replaceTrack is NOT supported.');
            this.renegotiatePeer(remoteUserId);
        };

        this.onNegotiationNeeded = function(message, remoteUserId) {};
        this.addNegotiatedMessage = function(message, remoteUserId) {
            if (message.type && message.sdp) {
                if (message.type == 'answer') {
                    if (connection.peers[remoteUserId]) {
                        connection.peers[remoteUserId].addRemoteSdp(message);
                    }
                }

                if (message.type == 'offer') {
                    if (message.renegotiatingPeer) {
                        this.renegotiatePeer(remoteUserId, null, message);
                    } else {
                        this.createAnsweringPeer(message, remoteUserId);
                    }
                }

                if (connection.enableLogs) {
                    console.log('Remote peer\'s sdp:', message.sdp);
                }
                return;
            }

            if (message.candidate) {
                if (connection.peers[remoteUserId]) {
                    connection.peers[remoteUserId].addRemoteCandidate(message);
                }

                if (connection.enableLogs) {
                    console.log('Remote peer\'s candidate pairs:', message.candidate);
                }
                return;
            }

            if (message.enableMedia) {
                if (connection.attachStreams.length || connection.dontCaptureUserMedia) {
                    var streamsToShare = {};
                    connection.attachStreams.forEach(function(stream) {
                        streamsToShare[stream.streamid] = {
                            isAudio: !!stream.isAudio,
                            isVideo: !!stream.isVideo,
                            isScreen: !!stream.isScreen
                        };
                    });
                    message.userPreferences.streamsToShare = streamsToShare;

                    self.onNegotiationNeeded({
                        readyForOffer: true,
                        userPreferences: message.userPreferences
                    }, remoteUserId);
                    return;
                }

                var localMediaConstraints = {};
                var userPreferences = message.userPreferences;
                if (userPreferences.localPeerSdpConstraints.OfferToReceiveAudio) {
                    localMediaConstraints.audio = connection.mediaConstraints.audio;
                }

                if (userPreferences.localPeerSdpConstraints.OfferToReceiveVideo) {
                    localMediaConstraints.video = connection.mediaConstraints.video;
                }

                var session = userPreferences.session || connection.session;

                if (session.oneway && session.audio && session.audio === 'two-way') {
                    session = {
                        audio: true
                    };
                }

                if (session.audio || session.video || session.screen) {
                    if (session.screen) {
                        connection.getScreenConstraints(function(error, screen_constraints) {
                            connection.invokeGetUserMedia({
                                audio: isAudioPlusTab(connection) ? getAudioScreenConstraints(screen_constraints) : false,
                                video: screen_constraints,
                                isScreen: true
                            }, (session.audio || session.video) && !isAudioPlusTab(connection) ? connection.invokeGetUserMedia(null, cb) : cb);
                        });
                    } else if (session.audio || session.video) {
                        connection.invokeGetUserMedia(null, cb, session);
                    }
                }
            }

            if (message.readyForOffer) {
                connection.onReadyForOffer(remoteUserId, message.userPreferences);
            }

            function cb(stream) {
                gumCallback(stream, message, remoteUserId);
            }
        };

        function gumCallback(stream, message, remoteUserId) {
            var streamsToShare = {};
            connection.attachStreams.forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                };
            });
            message.userPreferences.streamsToShare = streamsToShare;

            self.onNegotiationNeeded({
                readyForOffer: true,
                userPreferences: message.userPreferences
            }, remoteUserId);
        }

        this.connectNewParticipantWithAllBroadcasters = function(newParticipantId, userPreferences, broadcastersList) {
            broadcastersList = broadcastersList.split('|-,-|');
            if (!broadcastersList.length) {
                return;
            }

            var firstBroadcaster = broadcastersList[0];

            self.onNegotiationNeeded({
                newParticipant: newParticipantId,
                userPreferences: userPreferences || false
            }, firstBroadcaster);

            delete broadcastersList[0];

            var array = [];
            broadcastersList.forEach(function(broadcaster) {
                if (broadcaster) {
                    array.push(broadcaster);
                }
            });

            setTimeout(function() {
                self.connectNewParticipantWithAllBroadcasters(newParticipantId, userPreferences, array.join('|-,-|'));
            }, 10 * 1000);
        };

        this.onGettingRemoteMedia = function(stream, remoteUserId) {};
        this.onRemovingRemoteMedia = function(stream, remoteUserId) {};
        this.onGettingLocalMedia = function(localStream) {};
        this.onLocalMediaError = function(error, constraints) {
            connection.onMediaError(error, constraints);
        };

        var fbr;

        function initFileBufferReader() {
            fbr = new FileBufferReader();
            fbr.onProgress = function(chunk) {
                connection.onFileProgress(chunk);
            };
            fbr.onBegin = function(file) {
                connection.onFileStart(file);
            };
            fbr.onEnd = function(file) {
                connection.onFileEnd(file);
            };
        }

        this.shareFile = function(file, remoteUserId) {
            if (!connection.enableFileSharing) {
                throw '"connection.enableFileSharing" is false.';
            }

            initFileBufferReader();
            fbr.readAsArrayBuffer(file, function(uuid) {
                var arrayOfUsers = connection.getAllParticipants();

                if (remoteUserId) {
                    arrayOfUsers = [remoteUserId];
                }

                arrayOfUsers.forEach(function(participant) {
                    fbr.getNextChunk(uuid, function(nextChunk) {
                        connection.peers[participant].channels.forEach(function(channel) {
                            channel.send(nextChunk);
                        });
                    }, participant);
                });
            }, {
                userid: connection.userid,
                // extra: connection.extra,
                chunkSize: isFirefox ? 15 * 1000 : connection.chunkSize || 0
            });
        };

        if (typeof 'TextReceiver' !== 'undefined') {
            var textReceiver = new TextReceiver(connection);
        }

        this.onDataChannelMessage = function(message, remoteUserId) {
            textReceiver.receive(JSON.parse(message), remoteUserId, connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {});
        };

        this.onDataChannelClosed = function(event, remoteUserId) {
            event.userid = remoteUserId;
            event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
            connection.onclose(event);
        };

        this.onDataChannelError = function(error, remoteUserId) {
            error.userid = remoteUserId;
            event.extra = connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {};
            connection.onerror(error);
        };

        this.onDataChannelOpened = function(channel, remoteUserId) {
            // keep last channel only; we are not expecting parallel/channels channels
            if (connection.peers[remoteUserId].channels.length) {
                connection.peers[remoteUserId].channels = [channel];
                return;
            }

            connection.peers[remoteUserId].channels.push(channel);
            connection.onopen({
                userid: remoteUserId,
                extra: connection.peers[remoteUserId] ? connection.peers[remoteUserId].extra : {},
                channel: channel
            });
        };

        this.onPeerStateChanged = function(state) {
            connection.onPeerStateChanged(state);
        };

        this.onNegotiationStarted = function(remoteUserId, states) {};
        this.onNegotiationCompleted = function(remoteUserId, states) {};

        this.getRemoteStreams = function(remoteUserId) {
            remoteUserId = remoteUserId || connection.peers.getAllParticipants()[0];
            return connection.peers[remoteUserId] ? connection.peers[remoteUserId].streams : [];
        };

        this.isPluginRTC = connection.isPluginRTC = isPluginRTC
    }
    function fireEvent(obj, eventName, args) {
        if ("undefined" != typeof CustomEvent) {
            var eventDetail = {
                arguments: args,
                __exposedProps__: args
            }
              , event = new CustomEvent(eventName,eventDetail);
            obj.dispatchEvent(event)
        }
    }
    function setHarkEvents(connection, streamEvent) {
        if (!connection || !streamEvent)
            throw "Both arguments are required.";
        if (connection.onspeaking && connection.onsilence) {
            if ("undefined" == typeof hark)
                throw "hark.js not found.";
            hark(streamEvent.stream, {
                onspeaking: function() {
                    connection.onspeaking(streamEvent)
                },
                onsilence: function() {
                    connection.onsilence(streamEvent)
                },
                onvolumechange: function(volume, threshold) {
                    connection.onvolumechange && connection.onvolumechange(merge({
                        volume: volume,
                        threshold: threshold
                    }, streamEvent))
                }
            })
        }
    }
    function setMuteHandlers(connection, streamEvent) {
        streamEvent.stream && streamEvent.stream && streamEvent.stream.addEventListener && (streamEvent.stream.addEventListener("mute", function(event) {
            event = connection.streamEvents[streamEvent.streamid],
            event.session = {
                audio: "audio" === event.muteType,
                video: "video" === event.muteType
            },
            connection.onmute(event)
        }, !1),
        streamEvent.stream.addEventListener("unmute", function(event) {
            event = connection.streamEvents[streamEvent.streamid],
            event.session = {
                audio: "audio" === event.unmuteType,
                video: "video" === event.unmuteType
            },
            connection.onunmute(event)
        }, !1))
    }
    function getRandomString() {
        if (window.crypto && window.crypto.getRandomValues && -1 === navigator.userAgent.indexOf("Safari")) {
            for (var a = window.crypto.getRandomValues(new Uint32Array(3)), token = "", i = 0, l = a.length; l > i; i++)
                token += a[i].toString(36);
            return token
        }
        return (Math.random() * (new Date).getTime()).toString(36).replace(/\./g, "")
    }
    function getRMCMediaElement(stream, callback, connection) {
        var isAudioOnly = !1;
        stream.getVideoTracks && !stream.getVideoTracks().length && (isAudioOnly = !0);
        var mediaElement = document.createElement(isAudioOnly ? "audio" : "video");
        return isPluginRTC && window.PluginRTC ? (connection.videosContainer.insertBefore(mediaElement, connection.videosContainer.firstChild),
        void setTimeout(function() {
            window.PluginRTC.attachMediaStream(mediaElement, stream),
            callback(mediaElement)
        }, 1e3)) : (mediaElement[isFirefox ? "mozSrcObject" : "src"] = isFirefox ? stream : window.URL.createObjectURL(stream),
        mediaElement.controls = !0,
        isFirefox && mediaElement.addEventListener("ended", function() {
            if (currentUserMediaRequest.remove(stream.idInstance),
            "local" === stream.type) {
                StreamsHandler.onSyncNeeded(stream.streamid, "ended"),
                connection.attachStreams.forEach(function(aStream, idx) {
                    stream.streamid === aStream.streamid && delete connection.attachStreams[idx]
                });
                var newStreamsArray = [];
                connection.attachStreams.forEach(function(aStream) {
                    aStream && newStreamsArray.push(aStream)
                }),
                connection.attachStreams = newStreamsArray;
                var streamEvent = connection.streamEvents[stream.streamid];
                if (streamEvent)
                    return void connection.onstreamended(streamEvent);
                this.parentNode && this.parentNode.removeChild(this)
            }
        }, !1),
        mediaElement.play(),
        void callback(mediaElement))
    }
    function listenEventHandler(eventName, eventHandler) {
        window.removeEventListener(eventName, eventHandler),
        window.addEventListener(eventName, eventHandler, !1)
    }
    function removeNullEntries(array) {
        var newArray = [];
        return array.forEach(function(item) {
            item && newArray.push(item)
        }),
        newArray
    }
    function isData(session) {
        return !session.audio && !session.video && !session.screen && session.data
    }
    function isNull(obj) {
        return "undefined" == typeof obj
    }
    function isString(obj) {
        return "string" == typeof obj
    }
    function isAudioPlusTab(connection, audioPlusTab) {
        return connection.session.audio && "two-way" === connection.session.audio ? !1 : isFirefox && audioPlusTab !== !1 ? !0 : !isChrome || 50 > chromeVersion ? !1 : typeof audioPlusTab === !0 ? !0 : "undefined" == typeof audioPlusTab && connection.session.audio && connection.session.screen && !connection.session.video ? (audioPlusTab = !0,
        !0) : !1
    }
    function getAudioScreenConstraints(screen_constraints) {
        return isFirefox ? !0 : isChrome ? {
            mandatory: {
                chromeMediaSource: screen_constraints.mandatory.chromeMediaSource,
                chromeMediaSourceId: screen_constraints.mandatory.chromeMediaSourceId
            }
        } : !1
    }
    function setCordovaAPIs() {
        if ("iOS" === DetectRTC.osName && "undefined" != typeof cordova && "undefined" != typeof cordova.plugins && "undefined" != typeof cordova.plugins.iosrtc) {
            var iosrtc = cordova.plugins.iosrtc;
            window.webkitRTCPeerConnection = iosrtc.RTCPeerConnection,
            window.RTCSessionDescription = iosrtc.RTCSessionDescription,
            window.RTCIceCandidate = iosrtc.RTCIceCandidate,
            window.MediaStream = iosrtc.MediaStream,
            window.MediaStreamTrack = iosrtc.MediaStreamTrack,
            navigator.getUserMedia = navigator.webkitGetUserMedia = iosrtc.getUserMedia,
            iosrtc.debug.enable("iosrtc*"),
            iosrtc.registerGlobals()
        }
    }
    function setSdpConstraints(config) {
        var sdpConstraints, sdpConstraints_mandatory = {
            OfferToReceiveAudio: !!config.OfferToReceiveAudio,
            OfferToReceiveVideo: !!config.OfferToReceiveVideo
        };
        return sdpConstraints = {
            mandatory: sdpConstraints_mandatory,
            optional: [{
                VoiceActivityDetection: !1
            }]
        },
        navigator.mozGetUserMedia && firefoxVersion > 34 && (sdpConstraints = {
            OfferToReceiveAudio: !!config.OfferToReceiveAudio,
            OfferToReceiveVideo: !!config.OfferToReceiveVideo
        }),
        sdpConstraints
    }
    function PeerInitiator(config) {
        if (!RTCPeerConnection) {
            throw 'WebRTC 1.0 (RTCPeerConnection) API are NOT available in this browser.';
        }

        var connection = config.rtcMultiConnection;

        this.extra = config.remoteSdp ? config.remoteSdp.extra : connection.extra;
        this.userid = config.userid;
        this.streams = [];
        this.channels = config.channels || [];
        this.connectionDescription = config.connectionDescription;

        var self = this;

        if (config.remoteSdp) {
            this.connectionDescription = config.remoteSdp.connectionDescription;
        }

        var allRemoteStreams = {};

        defaults.sdpConstraints = setSdpConstraints({
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        });

        var peer;

        var renegotiatingPeer = !!config.renegotiatingPeer;
        if (config.remoteSdp) {
            renegotiatingPeer = !!config.remoteSdp.renegotiatingPeer;
        }

        var localStreams = [];
        connection.attachStreams.forEach(function(stream) {
            if (!!stream) {
                localStreams.push(stream);
            }
        });

        if (!renegotiatingPeer) {
            var iceTransports = 'all';
            if (connection.candidates.turn || connection.candidates.relay) {
                if (!connection.candidates.stun && !connection.candidates.reflexive && !connection.candidates.host) {
                    iceTransports = 'relay';
                }
            }

            peer = new RTCPeerConnection(navigator.onLine ? {
                iceServers: connection.iceServers,
                iceTransportPolicy: connection.iceTransportPolicy || iceTransports,
               /* rtcpMuxPolicy: connection.rtcpMuxPolicy || 'negotiate'*/
            } : null, window.PluginRTC ? null : connection.optionalArgument);

            if (!connection.iceServers.length) {
                peer = new RTCPeerConnection(null, null);
            }
        } else {
            peer = config.peerRef;
        }

        function getLocalStreams() {
            // if-block is temporarily disabled
            if (false && 'getSenders' in peer && typeof peer.getSenders === 'function') {
                var streamObject2 = new MediaStream();
                peer.getSenders().forEach(function(sender) {
                    streamObject2.addTrack(sender.track);
                });
                return streamObject2;
            }
            return peer.getLocalStreams();
        }

        peer.onicecandidate = function(event) {
            if (!event.candidate) {
                if (!connection.trickleIce) {
                    var localSdp = peer.localDescription;
                    config.onLocalSdp({
                        type: localSdp.type,
                        sdp: localSdp.sdp,
                        remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                        renegotiatingPeer: !!config.renegotiatingPeer || false,
                        connectionDescription: self.connectionDescription,
                        dontGetRemoteStream: !!config.dontGetRemoteStream,
                        extra: connection ? connection.extra : {},
                        streamsToShare: streamsToShare,
                        isFirefoxOffered: isFirefox
                    });
                }
                return;
            }

            if (!connection.trickleIce) return;
            config.onLocalCandidate({
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex
            });
        };

        var isFirefoxOffered = !isFirefox;
        if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.isFirefoxOffered) {
            isFirefoxOffered = true;
        }

        localStreams.forEach(function(localStream) {
            if (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.dontGetRemoteStream) {
                return;
            }

            if (config.dontAttachLocalStream) {
                return;
            }

            localStream = connection.beforeAddingStream(localStream);

            if (!localStream) return;

            if (getLocalStreams().forEach) {
                getLocalStreams().forEach(function(stream) {
                    if (localStream && stream.id == localStream.id) {
                        localStream = null;
                    }
                });
            }

            if (localStream) {
                peer.addStream(localStream);
            }
        });

        peer.oniceconnectionstatechange = peer.onsignalingstatechange = function() {
            var extra = self.extra;
            if (connection.peers[self.userid]) {
                extra = connection.peers[self.userid].extra || extra;
            }

            if (!peer) {
                return;
            }

            config.onPeerStateChanged({
                iceConnectionState: peer.iceConnectionState,
                iceGatheringState: peer.iceGatheringState,
                signalingState: peer.signalingState,
                extra: extra,
                userid: self.userid
            });
        };

        var sdpConstraints = {
            OfferToReceiveAudio: !!localStreams.length,
            OfferToReceiveVideo: !!localStreams.length
        };

        if (config.localPeerSdpConstraints) sdpConstraints = config.localPeerSdpConstraints;

        defaults.sdpConstraints = setSdpConstraints(sdpConstraints);

        var remoteStreamAddEvent = 'addstream';
        if ('ontrack' in peer) {
            // temporarily disabled
            // remoteStreamAddEvent = 'track';
        }

        var streamObject;
        peer.addEventListener(remoteStreamAddEvent, function(event) {
            if (!event) return;
            if (event.streams && event.streams.length && !event.stream) {
                if (!streamObject) {
                    streamObject = new MediaStream();
                    return;
                }

                event.streams.forEach(function(stream) {
                    if (stream.getVideoTracks().length) {
                        streamObject.addTrack(stream.getVideoTracks()[0]);
                    }
                    if (stream.getAudioTracks().length) {
                        streamObject.addTrack(stream.getAudioTracks()[0]);
                    }
                });
                event.stream = streamObject;

                if (connection.session.audio && connection.session.video && (!streamObject.getVideoTracks().length || !streamObject.getAudioTracks().length)) {
                    return;
                }

                streamObject = null;
            }

            var streamsToShare = {};
            if (config.remoteSdp && config.remoteSdp.streamsToShare) {
                streamsToShare = config.remoteSdp.streamsToShare;
            } else if (config.streamsToShare) {
                streamsToShare = config.streamsToShare;
            }

            var streamToShare = streamsToShare[event.stream.id];
            if (streamToShare) {
                event.stream.isAudio = streamToShare.isAudio;
                event.stream.isVideo = streamToShare.isVideo;
                event.stream.isScreen = streamToShare.isScreen;
            }
            event.stream.streamid = event.stream.id;
            if (!event.stream.stop) {
                event.stream.stop = function() {
                    if (isFirefox) {
                        var streamEndedEvent = 'ended';

                        if ('oninactive' in event.stream) {
                            streamEndedEvent = 'inactive';
                        }
                        fireEvent(event.stream, streamEndedEvent);
                    }
                };
            }
            allRemoteStreams[event.stream.id] = event.stream;
            config.onRemoteStream(event.stream);
        }, false);

        peer.onremovestream = function(event) {
            event.stream.streamid = event.stream.id;

            if (allRemoteStreams[event.stream.id]) {
                delete allRemoteStreams[event.stream.id];
            }

            config.onRemoteStreamRemoved(event.stream);
        };

        this.addRemoteCandidate = function(remoteCandidate) {
            peer.addIceCandidate(new RTCIceCandidate(remoteCandidate));
        };

        this.addRemoteSdp = function(remoteSdp, cb) {
            remoteSdp.sdp = connection.processSdp(remoteSdp.sdp);
            peer.setRemoteDescription(new RTCSessionDescription(remoteSdp), cb || function() {}, function(error) {
                if (!!connection.enableLogs) {
                    console.error(JSON.stringify(error, null, '\t'), '\n', remoteSdp.type, remoteSdp.sdp);
                }
            });
        };

        var isOfferer = true;

        if (config.remoteSdp) {
            isOfferer = false;
        }

        this.createDataChannel = function() {
            var channel = peer.createDataChannel('sctp', {});
            setChannelEvents(channel);
        };

        if (connection.session.data === true && !renegotiatingPeer) {
            if (!isOfferer) {
                peer.ondatachannel = function(event) {
                    var channel = event.channel;
                    setChannelEvents(channel);
                };
            } else {
                this.createDataChannel();
            }
        }

        if (config.remoteSdp) {
            if (config.remoteSdp.remotePeerSdpConstraints) {
                sdpConstraints = config.remoteSdp.remotePeerSdpConstraints;
            }
            defaults.sdpConstraints = setSdpConstraints(sdpConstraints);
            this.addRemoteSdp(config.remoteSdp, function() {
                createOfferOrAnswer('createAnswer');
            });
        }

        function setChannelEvents(channel) {
            // force ArrayBuffer in Firefox; which uses "Blob" by default.
            channel.binaryType = 'arraybuffer';

            channel.onmessage = function(event) {
                config.onDataChannelMessage(event.data);
            };

            channel.onopen = function() {
                config.onDataChannelOpened(channel);
            };

            channel.onerror = function(error) {
                config.onDataChannelError(error);
            };

            channel.onclose = function(event) {
                config.onDataChannelClosed(event);
            };

            channel.internalSend = channel.send;
            channel.send = function(data) {
                if (channel.readyState !== 'open') {
                    return;
                }

                channel.internalSend(data);
            };

            peer.channel = channel;
        }

        if (connection.session.audio == 'two-way' || connection.session.video == 'two-way' || connection.session.screen == 'two-way') {
            defaults.sdpConstraints = setSdpConstraints({
                OfferToReceiveAudio: connection.session.audio == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio),
                OfferToReceiveVideo: connection.session.video == 'two-way' || connection.session.screen == 'two-way' || (config.remoteSdp && config.remoteSdp.remotePeerSdpConstraints && config.remoteSdp.remotePeerSdpConstraints.OfferToReceiveAudio)
            });
        }

        var streamsToShare = {};
        if (getLocalStreams().forEach) {
            getLocalStreams().forEach(function(stream) {
                streamsToShare[stream.streamid] = {
                    isAudio: !!stream.isAudio,
                    isVideo: !!stream.isVideo,
                    isScreen: !!stream.isScreen
                };
            });
        }

        function createOfferOrAnswer(_method) {
            peer[_method](function(localSdp) {
                localSdp.sdp = connection.processSdp(localSdp.sdp);
                peer.setLocalDescription(localSdp, function() {
                    if (!connection.trickleIce) return;
                    config.onLocalSdp({
                        type: localSdp.type,
                        sdp: localSdp.sdp,
                        remotePeerSdpConstraints: config.remotePeerSdpConstraints || false,
                        renegotiatingPeer: !!config.renegotiatingPeer || false,
                        connectionDescription: self.connectionDescription,
                        dontGetRemoteStream: !!config.dontGetRemoteStream,
                        extra: connection ? connection.extra : {},
                        streamsToShare: streamsToShare,
                        isFirefoxOffered: isFirefox
                    });

                    connection.onSettingLocalDescription(self);
                }, function(error) {
                    if (!connection.enableLogs) return;
                    console.error('setLocalDescription error', error);
                });
            }, function(error) {
                if (!!connection.enableLogs) {
                    console.error('sdp-error', error);
                }
            }, defaults.sdpConstraints);
        }

        if (isOfferer) {
            createOfferOrAnswer('createOffer');
        }

        peer.nativeClose = peer.close;
        peer.close = function() {
            if (!peer) {
                return;
            }

            try {
                if (peer.iceConnectionState.search(/closed|failed/gi) === -1) {
                    peer.getRemoteStreams().forEach(function(stream) {
                        stream.stop();
                    });
                }
                peer.nativeClose();
            } catch (e) {}

            peer = null;
            self.peer = null;
        };

        this.peer = peer;
    }
    function loadIceFrame(callback, skip) {
        if (!loadedIceFrame) {
            if (!skip)
                return loadIceFrame(callback, !0);
            loadedIceFrame = !0;
            var iframe = document.createElement("iframe");
            iframe.onload = function() {
                function iFrameLoaderCallback(event) {
                    event.data && event.data.iceServers && (callback(event.data.iceServers),
                    window.removeEventListener("message", iFrameLoaderCallback))
                }
                iframe.isLoaded = !0,
                listenEventHandler("message", iFrameLoaderCallback),
                iframe.contentWindow.postMessage("get-ice-servers", "*")
            }
            ,
            iframe.src = "https://cdn.webrtc-experiment.com/getIceServers/",
            iframe.style.display = "none",
            (document.body || document.documentElement).appendChild(iframe)
        }
    }
    function getSTUNObj(stunStr) {
        var urlsParam = "urls";
        isPluginRTC && (urlsParam = "url");
        var obj = {};
        return obj[urlsParam] = stunStr,
        obj
    }
    function getTURNObj(turnStr, username, credential) {
        var urlsParam = "urls";
        isPluginRTC && (urlsParam = "url");
        var obj = {
            username: username,
            credential: credential
        };
        return obj[urlsParam] = turnStr,
        obj
    }
    function getExtenralIceFormatted() {
        var iceServers = [];
        return window.RMCExternalIceServers.forEach(function(ice) {
            ice.urls || (ice.urls = ice.url),
            -1 !== ice.urls.search("stun|stuns") && iceServers.push(getSTUNObj(ice.urls)),
            -1 !== ice.urls.search("turn|turns") && iceServers.push(getTURNObj(ice.urls, ice.username, ice.credential))
        }),
        iceServers
    }
    function setStreamType(constraints, stream) {
        constraints.mandatory && constraints.mandatory.chromeMediaSource ? stream.isScreen = !0 : constraints.mozMediaSource || constraints.mediaSource ? stream.isScreen = !0 : constraints.video ? stream.isVideo = !0 : constraints.audio && (stream.isAudio = !0)
    }
    function getUserMediaHandler(options) {
        function streaming(stream, returnBack) {
            setStreamType(options.localMediaConstraints, stream),
            options.onGettingLocalMedia(stream, returnBack),
            stream.addEventListener("ended", function() {
                delete currentUserMediaRequest.streams[idInstance],
                currentUserMediaRequest.mutex = !1,
                currentUserMediaRequest.queueRequests.indexOf(options) && (delete currentUserMediaRequest.queueRequests[currentUserMediaRequest.queueRequests.indexOf(options)],
                currentUserMediaRequest.queueRequests = removeNullEntries(currentUserMediaRequest.queueRequests))
            }, !1),
            currentUserMediaRequest.streams[idInstance] = {
                stream: stream
            },
            currentUserMediaRequest.mutex = !1,
            currentUserMediaRequest.queueRequests.length && getUserMediaHandler(currentUserMediaRequest.queueRequests.shift())
        }
        if (currentUserMediaRequest.mutex === !0)
            return void currentUserMediaRequest.queueRequests.push(options);
        currentUserMediaRequest.mutex = !0;
        var idInstance = JSON.stringify(options.localMediaConstraints);
        if (currentUserMediaRequest.streams[idInstance])
            streaming(currentUserMediaRequest.streams[idInstance].stream, !0);
        else {
            if (isPluginRTC && window.PluginRTC) {
                document.createElement("video");
                return void window.PluginRTC.getUserMedia({
                    audio: !0,
                    video: !0
                }, function(stream) {
                    stream.streamid = stream.id || getRandomString(),
                    streaming(stream)
                }, function(error) {})
            }
            var isBlackBerry = !!/BB10|BlackBerry/i.test(navigator.userAgent || "");
            if (isBlackBerry || "undefined" == typeof navigator.mediaDevices || "function" != typeof navigator.mediaDevices.getUserMedia)
                return navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia,
                void navigator.getUserMedia(options.localMediaConstraints, function(stream) {
                    stream.streamid = stream.streamid || stream.id || getRandomString(),
                    stream.idInstance = idInstance,
                    streaming(stream)
                }, function(error) {
                    options.onLocalMediaError(error, options.localMediaConstraints)
                });
            navigator.mediaDevices.getUserMedia(options.localMediaConstraints).then(function(stream) {
                stream.streamid = stream.streamid || stream.id || getRandomString(),
                stream.idInstance = idInstance,
                streaming(stream)
            })["catch"](function(error) {
                options.onLocalMediaError(error, options.localMediaConstraints)
            })
        }
    }
    function onMessageCallback(data) {
        if ("PermissionDeniedError" == data) {
            if (chromeMediaSource = "PermissionDeniedError",
            screenCallback)
                return screenCallback("PermissionDeniedError");
            throw new Error("PermissionDeniedError")
        }
        "rtcmulticonnection-extension-loaded" == data && (chromeMediaSource = "desktop"),
        data.sourceId && screenCallback && screenCallback(sourceId = data.sourceId)
    }
    function isChromeExtensionAvailable(callback) {
        if (callback) {
            if (isFirefox)
                return isFirefoxExtensionAvailable(callback);
            if ("desktop" == chromeMediaSource)
                return callback(!0);
            //window.postMessage("are-you-there", "*"),
            window.postMessage("webrtcdev-extension-presence", "*"),
            setTimeout(function() {
                callback("screen" == chromeMediaSource ? !1 : !0)
            }, 2e3)
        }
    }
    function isFirefoxExtensionAvailable(callback) {
        function messageCallback(event) {
            var addonMessage = event.data;
            addonMessage && "undefined" != typeof addonMessage.isScreenCapturingEnabled && (isFirefoxAddonResponded = !0,
            callback(addonMessage.isScreenCapturingEnabled === !0 ? !0 : !1),
            window.removeEventListener("message", messageCallback, !1))
        }
        if (callback) {
            if (!isFirefox)
                return isChromeExtensionAvailable(callback);
            var isFirefoxAddonResponded = !1;
            window.addEventListener("message", messageCallback, !1),
            window.postMessage({
                checkIfScreenCapturingEnabled: !0,
                domains: [document.domain]
            }, "*"),
            setTimeout(function() {
                isFirefoxAddonResponded || callback(!0)
            }, 2e3)
        }
    }
/*  function getSourceId(callback, audioPlusTab) {
        alert(" rtc getSourceId");
        if (!callback)
            throw '"callback" parameter is mandatory.';
        return sourceId ? (callback(sourceId),
        void (sourceId = null )) : (screenCallback = callback,
        audioPlusTab ? void window.postMessage("audio-plus-tab", "*") : void window.postMessage("get-sourceId", "*"))
    }*/
    function getChromeExtensionStatus(extensionid, callback) {
        if (2 != arguments.length && (callback = extensionid,
        extensionid = window.RMCExtensionID || "ajhifddimkapgcifgcodmmfdlknahffk"),
        isFirefox)
            return callback("not-chrome");
        var image = document.createElement("img");
        image.src = "chrome-extension://" + extensionid + "/icon.png",
        image.onload = function() {
            chromeMediaSource = "screen",
            window.postMessage("are-you-there", "*"),
            setTimeout(function() {
                callback("screen" == chromeMediaSource ? extensionid == extensionid ? "installed-enabled" : "installed-disabled" : "installed-enabled")
            }, 2e3)
        }
        ,
        image.onerror = function() {
            callback("not-installed")
        }
    }
    function getScreenConstraints(callback, audioPlusTab) {
        var firefoxScreenConstraints = {
            mozMediaSource: "window",
            mediaSource: "window",
            width: 29999,
            height: 8640
        };
        return isFirefox ? callback(null , firefoxScreenConstraints) : void isChromeExtensionAvailable(function(isAvailable) {
            var screen_constraints = {
                mandatory: {
                    chromeMediaSource: chromeMediaSource,
                    maxWidth: 29999,
                    maxHeight: 8640,
                    minFrameRate: 30,
                    maxFrameRate: 128,
                    minAspectRatio: 1.77
                },
                optional: []
            };
            return "desktop" != chromeMediaSource || sourceId ? ("desktop" == chromeMediaSource && (screen_constraints.mandatory.chromeMediaSourceId = sourceId),
            void callback(null , screen_constraints)) : void getSourceId(function() {
                screen_constraints.mandatory.chromeMediaSourceId = sourceId,
                callback("PermissionDeniedError" == sourceId ? sourceId : null , screen_constraints),
                sourceId = null
            }, audioPlusTab)
        })
    }

    function TextReceiver(connection) {
        var content = {};

        function receive(data, userid, extra) {
            // uuid is used to uniquely identify sending instance
            var uuid = data.uuid;
            if (!content[uuid]) {
                content[uuid] = [];
            }

            content[uuid].push(data.message);

            if (data.last) {
                var message = content[uuid].join('');
                if (data.isobject) {
                    message = JSON.parse(message);
                }

                // latency detection
                var receivingTime = new Date().getTime();
                var latency = receivingTime - data.sendingTime;

                var e = {
                    data: message,
                    userid: userid,
                    extra: extra,
                    latency: latency
                };

                if (connection.autoTranslateText) {
                    e.original = e.data;
                    connection.Translator.TranslateText(e.data, function(translatedText) {
                        e.data = translatedText;
                        connection.onmessage(e);
                    });
                } else {
                    connection.onmessage(e);
                }

                delete content[uuid];
            }
        }

        return {
            receive: receive
        };
    }

    var isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0
      , isFirefox = "undefined" != typeof window.InstallTrigger
      , isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0
      , isChrome = !!window.chrome && !isOpera
      , isIE = !!document.documentMode
      , isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
    "undefined" != typeof cordova && (isMobileDevice = !0,
    isChrome = !0),
    navigator && navigator.userAgent && -1 !== navigator.userAgent.indexOf("Crosswalk") && (isMobileDevice = !0,
    isChrome = !0);
    var isPluginRTC = !isMobileDevice && (isSafari || isIE);
    isPluginRTC && "undefined" != typeof URL && (URL.createObjectURL = function() {}
    );
    var chromeVersion = (!!(window.process && "object" == typeof window.process && window.process.versions && window.process.versions["node-webkit"]),
    50)
      , matchArray = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    isChrome && matchArray && matchArray[2] && (chromeVersion = parseInt(matchArray[2], 10));
    var firefoxVersion = 50;
    matchArray = navigator.userAgent.match(/Firefox\/(.*)/),
    isFirefox && matchArray && matchArray[1] && (firefoxVersion = parseInt(matchArray[1], 10)),
    window.addEventListener || (window.addEventListener = function(el, eventName, eventHandler) {
        el.attachEvent && el.attachEvent("on" + eventName, eventHandler)
    }
    ),
    window.attachEventListener = function(video, type, listener, useCapture) {
        video.addEventListener(type, listener, useCapture)
    }
    ;
    var MediaStream = window.MediaStream;
    "undefined" == typeof MediaStream && "undefined" != typeof webkitMediaStream && (MediaStream = webkitMediaStream),
    "undefined" != typeof MediaStream && ("getVideoTracks"in MediaStream.prototype || (MediaStream.prototype.getVideoTracks = function() {
        if (!this.getTracks)
            return [];
        var tracks = [];
        return this.getTracks.forEach(function(track) {
            -1 !== track.kind.toString().indexOf("video") && tracks.push(track)
        }),
        tracks
    }
    ,
    MediaStream.prototype.getAudioTracks = function() {
        if (!this.getTracks)
            return [];
        var tracks = [];
        return this.getTracks.forEach(function(track) {
            -1 !== track.kind.toString().indexOf("audio") && tracks.push(track)
        }),
        tracks
    }
    ),
    "stop"in MediaStream.prototype || (MediaStream.prototype.stop = function() {
        this.getAudioTracks().forEach(function(track) {
            track.stop && track.stop()
        }),
        this.getVideoTracks().forEach(function(track) {
            track.stop && track.stop()
        })
    }
    )),
    function() {
        function getBrowserInfo() {
            var nameOffset, verOffset, ix, nAgt = (navigator.appVersion,
            navigator.userAgent), browserName = navigator.appName, fullVersion = "" + parseFloat(navigator.appVersion), majorVersion = parseInt(navigator.appVersion, 10);
            if (isOpera) {
                browserName = "Opera";
                try {
                    fullVersion = navigator.userAgent.split("OPR/")[1].split(" ")[0],
                    majorVersion = fullVersion.split(".")[0]
                } catch (e) {
                    fullVersion = "0.0.0.0",
                    majorVersion = 0
                }
            } else
                isIE ? (verOffset = nAgt.indexOf("MSIE"),
                browserName = "IE",
                fullVersion = nAgt.substring(verOffset + 5)) : isChrome ? (verOffset = nAgt.indexOf("Chrome"),
                browserName = "Chrome",
                fullVersion = nAgt.substring(verOffset + 7)) : isSafari ? (verOffset = nAgt.indexOf("Safari"),
                browserName = "Safari",
                fullVersion = nAgt.substring(verOffset + 7),
                -1 !== (verOffset = nAgt.indexOf("Version")) && (fullVersion = nAgt.substring(verOffset + 8))) : isFirefox ? (verOffset = nAgt.indexOf("Firefox"),
                browserName = "Firefox",
                fullVersion = nAgt.substring(verOffset + 8)) : (nameOffset = nAgt.lastIndexOf(" ") + 1) < (verOffset = nAgt.lastIndexOf("/")) && (browserName = nAgt.substring(nameOffset, verOffset),
                fullVersion = nAgt.substring(verOffset + 1),
                browserName.toLowerCase() === browserName.toUpperCase() && (browserName = navigator.appName));
            return isEdge && (browserName = "Edge",
            fullVersion = parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10).toString()),
            -1 !== (ix = fullVersion.indexOf(";")) && (fullVersion = fullVersion.substring(0, ix)),
            -1 !== (ix = fullVersion.indexOf(" ")) && (fullVersion = fullVersion.substring(0, ix)),
            majorVersion = parseInt("" + fullVersion, 10),
            isNaN(majorVersion) && (fullVersion = "" + parseFloat(navigator.appVersion),
            majorVersion = parseInt(navigator.appVersion, 10)),
            {
                fullVersion: fullVersion,
                version: majorVersion,
                name: browserName,
                isPrivateBrowsing: !1
            }
        }
        function retry(isDone, next) {
            var currentTrial = 0
              , maxRetry = 50
              , isTimeout = !1
              , id = window.setInterval(function() {
                isDone() && (window.clearInterval(id),
                next(isTimeout)),
                currentTrial++ > maxRetry && (window.clearInterval(id),
                isTimeout = !0,
                next(isTimeout))
            }, 10)
        }
        function isIE10OrLater(userAgent) {
            var ua = userAgent.toLowerCase();
            if (0 === ua.indexOf("msie") && 0 === ua.indexOf("trident"))
                return !1;
            var match = /(?:msie|rv:)\s?([\d\.]+)/.exec(ua);
            return match && parseInt(match[1], 10) >= 10 ? !0 : !1
        }
        function detectPrivateMode(callback) {
            var isPrivate;
            if (window.webkitRequestFileSystem)
                window.webkitRequestFileSystem(window.TEMPORARY, 1, function() {
                    isPrivate = !1
                }, function(e) {
                    console.log(e),
                    isPrivate = !0
                });
            else if (window.indexedDB && /Firefox/.test(window.navigator.userAgent)) {
                var db;
                try {
                    db = window.indexedDB.open("test")
                } catch (e) {
                    isPrivate = !0
                }
                "undefined" == typeof isPrivate && retry(function() {
                    return "done" === db.readyState ? !0 : !1
                }, function(isTimeout) {
                    isTimeout || (isPrivate = db.result ? !1 : !0)
                })
            } else if (isIE10OrLater(window.navigator.userAgent)) {
                isPrivate = !1;
                try {
                    window.indexedDB || (isPrivate = !0)
                } catch (e) {
                    isPrivate = !0
                }
            } else if (window.localStorage && /Safari/.test(window.navigator.userAgent)) {
                try {
                    window.localStorage.setItem("test", 1)
                } catch (e) {
                    isPrivate = !0
                }
                "undefined" == typeof isPrivate && (isPrivate = !1,
                window.localStorage.removeItem("test"))
            }
            retry(function() {
                return "undefined" != typeof isPrivate ? !0 : !1
            }, function(isTimeout) {
                callback(isPrivate)
            })
        }
        function detectDesktopOS() {
            var unknown = "-"
              , nVer = navigator.appVersion
              , nAgt = navigator.userAgent
              , os = unknown
              , clientStrings = [{
                s: "Windows 10",
                r: /(Windows 10.0|Windows NT 10.0)/
            }, {
                s: "Windows 8.1",
                r: /(Windows 8.1|Windows NT 6.3)/
            }, {
                s: "Windows 8",
                r: /(Windows 8|Windows NT 6.2)/
            }, {
                s: "Windows 7",
                r: /(Windows 7|Windows NT 6.1)/
            }, {
                s: "Windows Vista",
                r: /Windows NT 6.0/
            }, {
                s: "Windows Server 2003",
                r: /Windows NT 5.2/
            }, {
                s: "Windows XP",
                r: /(Windows NT 5.1|Windows XP)/
            }, {
                s: "Windows 2000",
                r: /(Windows NT 5.0|Windows 2000)/
            }, {
                s: "Windows ME",
                r: /(Win 9x 4.90|Windows ME)/
            }, {
                s: "Windows 98",
                r: /(Windows 98|Win98)/
            }, {
                s: "Windows 95",
                r: /(Windows 95|Win95|Windows_95)/
            }, {
                s: "Windows NT 4.0",
                r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/
            }, {
                s: "Windows CE",
                r: /Windows CE/
            }, {
                s: "Windows 3.11",
                r: /Win16/
            }, {
                s: "Android",
                r: /Android/
            }, {
                s: "Open BSD",
                r: /OpenBSD/
            }, {
                s: "Sun OS",
                r: /SunOS/
            }, {
                s: "Linux",
                r: /(Linux|X11)/
            }, {
                s: "iOS",
                r: /(iPhone|iPad|iPod)/
            }, {
                s: "Mac OS X",
                r: /Mac OS X/
            }, {
                s: "Mac OS",
                r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/
            }, {
                s: "QNX",
                r: /QNX/
            }, {
                s: "UNIX",
                r: /UNIX/
            }, {
                s: "BeOS",
                r: /BeOS/
            }, {
                s: "OS/2",
                r: /OS\/2/
            }, {
                s: "Search Bot",
                r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/
            }];
            for (var id in clientStrings) {
                var cs = clientStrings[id];
                if (cs.r.test(nAgt)) {
                    os = cs.s;
                    break
                }
            }
            var osVersion = unknown;
            switch (/Windows/.test(os) && (/Windows (.*)/.test(os) && (osVersion = /Windows (.*)/.exec(os)[1]),
            os = "Windows"),
            os) {
            case "Mac OS X":
                /Mac OS X (10[\.\_\d]+)/.test(nAgt) && (osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1]);
                break;
            case "Android":
                /Android ([\.\_\d]+)/.test(nAgt) && (osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1]);
                break;
            case "iOS":
                /OS (\d+)_(\d+)_?(\d+)?/.test(nAgt) && (osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer),
                osVersion = osVersion[1] + "." + osVersion[2] + "." + (0 | osVersion[3]))
            }
            return {
                osName: os,
                osVersion: osVersion
            }
        }
        function DetectLocalIPAddress(callback) {
            DetectRTC.isWebRTCSupported && (DetectRTC.isORTCSupported || getIPs(function(ip) {
                callback(ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/) ? "Local: " + ip : "Public: " + ip)
            }))
        }
        function getIPs(callback) {
            function handleCandidate(candidate) {
                var ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
                  , match = ipRegex.exec(candidate);
                if (!match)
                    return void console.warn("Could not match IP address in", candidate);
                var ipAddress = match[1];
                void 0 === ipDuplicates[ipAddress] && callback(ipAddress),
                ipDuplicates[ipAddress] = !0
            }
            var ipDuplicates = {}
              , RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection
              , useWebKit = !!window.webkitRTCPeerConnection;
            if (!RTCPeerConnection) {
                var iframe = document.getElementById("iframe");
                if (!iframe)
                    throw "NOTE: you need to have an iframe in the page right above the script tag.";
                var win = iframe.contentWindow;
                RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection,
                useWebKit = !!win.webkitRTCPeerConnection
            }
            if (RTCPeerConnection) {
                var servers, mediaConstraints = {
                    optional: [{
                        RtpDataChannels: !0
                    }]
                };
                useWebKit && (servers = {
                    iceServers: [{
                        urls: "stun:stun.services.mozilla.com"
                    }]
                },
                "undefined" != typeof DetectRTC && DetectRTC.browser.isFirefox && DetectRTC.browser.version <= 38 && (servers[0] = {
                    url: servers[0].urls
                }));
                var pc = new RTCPeerConnection(servers,mediaConstraints);
                pc.onicecandidate = function(ice) {
                    ice.candidate && handleCandidate(ice.candidate.candidate)
                }
                ,
                pc.createDataChannel(""),
                pc.createOffer(function(result) {
                    pc.setLocalDescription(result, function() {}, function() {})
                }, function() {}),
                setTimeout(function() {
                    var lines = pc.localDescription.sdp.split("\n");
                    lines.forEach(function(line) {
                        0 === line.indexOf("a=candidate:") && handleCandidate(line)
                    })
                }, 1e3)
            }
        }
        function checkDeviceSupport(callback) {
            return canEnumerate ? (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources && (navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack)),
            !navigator.enumerateDevices && navigator.enumerateDevices && (navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator)),
            navigator.enumerateDevices ? (MediaDevices = [],
            audioInputDevices = [],
            audioOutputDevices = [],
            videoInputDevices = [],
            void navigator.enumerateDevices(function(devices) {
                devices.forEach(function(_device) {
                    var device = {};
                    for (var d in _device)
                        device[d] = _device[d];
                    "audio" === device.kind && (device.kind = "audioinput"),
                    "video" === device.kind && (device.kind = "videoinput");
                    var skip;
                    MediaDevices.forEach(function(d) {
                        d.id === device.id && d.kind === device.kind && (skip = !0)
                    }),
                    skip || (device.deviceId || (device.deviceId = device.id),
                    device.id || (device.id = device.deviceId),
                    device.label ? ("videoinput" !== device.kind || isWebsiteHasWebcamPermissions || (isWebsiteHasWebcamPermissions = !0),
                    "audioinput" !== device.kind || isWebsiteHasMicrophonePermissions || (isWebsiteHasMicrophonePermissions = !0)) : (device.label = "Please invoke getUserMedia once.",
                    "https:" !== location.protocol && document.domain.search && -1 === document.domain.search(/localhost|127.0./g) && (device.label = "HTTPs is required to get label of this " + device.kind + " device.")),
                    "audioinput" === device.kind && (hasMicrophone = !0,
                    -1 === audioInputDevices.indexOf(device) && audioInputDevices.push(device)),
                    "audiooutput" === device.kind && (hasSpeakers = !0,
                    -1 === audioOutputDevices.indexOf(device) && audioOutputDevices.push(device)),
                    "videoinput" === device.kind && (hasWebcam = !0,
                    -1 === videoInputDevices.indexOf(device) && videoInputDevices.push(device)),
                    -1 === MediaDevices.indexOf(device) && MediaDevices.push(device))
                }),
                "undefined" != typeof DetectRTC && (DetectRTC.MediaDevices = MediaDevices,
                DetectRTC.hasMicrophone = hasMicrophone,
                DetectRTC.hasSpeakers = hasSpeakers,
                DetectRTC.hasWebcam = hasWebcam,
                DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions,
                DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions,
                DetectRTC.audioInputDevices = audioInputDevices,
                DetectRTC.audioOutputDevices = audioOutputDevices,
                DetectRTC.videoInputDevices = videoInputDevices),
                callback && callback()
            })) : void (callback && callback())) : void (callback && callback())
        }
        var browserFakeUserAgent = "Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45";
        !function(that) {
            "undefined" == typeof window && ("undefined" == typeof window && "undefined" != typeof global ? (global.navigator = {
                userAgent: browserFakeUserAgent,
                getUserMedia: function() {}
            },
            that.window = global) : "undefined" == typeof window,
            "undefined" == typeof document && (that.document = {},
            document.createElement = document.captureStream = document.mozCaptureStream = function() {
                return {}
            }
            ),
            "undefined" == typeof location && (that.location = {
                protocol: "file:",
                href: "",
                hash: ""
            }),
            "undefined" == typeof screen && (that.screen = {
                width: 0,
                height: 0
            }))
        }("undefined" != typeof global ? global : window);
        var navigator = window.navigator;
        "undefined" != typeof navigator ? ("undefined" != typeof navigator.webkitGetUserMedia && (navigator.getUserMedia = navigator.webkitGetUserMedia),
        "undefined" != typeof navigator.mozGetUserMedia && (navigator.getUserMedia = navigator.mozGetUserMedia)) : navigator = {
            getUserMedia: function() {},
            userAgent: browserFakeUserAgent
        };
        var isMobileDevice = !!/Android|webOS|iPhone|iPad|iPod|BB10|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(navigator.userAgent || "")
          , isEdge = !(-1 === navigator.userAgent.indexOf("Edge") || !navigator.msSaveOrOpenBlob && !navigator.msSaveBlob)
          , isOpera = !!window.opera || navigator.userAgent.indexOf(" OPR/") >= 0
          , isFirefox = "undefined" != typeof window.InstallTrigger
          , isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf("Constructor") > 0
          , isChrome = !!window.chrome && !isOpera
          , isIE = !!document.documentMode && !isEdge
          , isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i)
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry|BB10/i)
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i)
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i)
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i)
            },
            any: function() {
                return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()
            },
            getOsName: function() {
                var osName = "Unknown OS";
                return isMobile.Android() && (osName = "Android"),
                isMobile.BlackBerry() && (osName = "BlackBerry"),
                isMobile.iOS() && (osName = "iOS"),
                isMobile.Opera() && (osName = "Opera Mini"),
                isMobile.Windows() && (osName = "Windows"),
                osName
            }
        }
          , osName = "Unknown OS"
          , osVersion = "Unknown OS Version";
        if (isMobile.any())
            osName = isMobile.getOsName();
        else {
            var osInfo = detectDesktopOS();
            osName = osInfo.osName,
            osVersion = osInfo.osVersion
        }
        var isCanvasSupportsStreamCapturing = !1
          , isVideoSupportsStreamCapturing = !1;
        ["captureStream", "mozCaptureStream", "webkitCaptureStream"].forEach(function(item) {
            !isCanvasSupportsStreamCapturing && item in document.createElement("canvas") && (isCanvasSupportsStreamCapturing = !0),
            !isVideoSupportsStreamCapturing && item in document.createElement("video") && (isVideoSupportsStreamCapturing = !0)
        });
        var MediaDevices = []
          , audioInputDevices = []
          , audioOutputDevices = []
          , videoInputDevices = [];
        navigator.mediaDevices && navigator.mediaDevices.enumerateDevices && (navigator.enumerateDevices = function(callback) {
            navigator.mediaDevices.enumerateDevices().then(callback)["catch"](function() {
                callback([])
            })
        }
        );
        var canEnumerate = !1;
        "undefined" != typeof MediaStreamTrack && "getSources"in MediaStreamTrack ? canEnumerate = !0 : navigator.mediaDevices && navigator.mediaDevices.enumerateDevices && (canEnumerate = !0);
        var hasMicrophone = !1
          , hasSpeakers = !1
          , hasWebcam = !1
          , isWebsiteHasMicrophonePermissions = !1
          , isWebsiteHasWebcamPermissions = !1;
        checkDeviceSupport();
        var DetectRTC = window.DetectRTC || {};
        DetectRTC.browser = getBrowserInfo(),
        detectPrivateMode(function(isPrivateBrowsing) {
            DetectRTC.browser.isPrivateBrowsing = !!isPrivateBrowsing
        }),
        DetectRTC.browser["is" + DetectRTC.browser.name] = !0;
        var isWebRTCSupported = (!!(window.process && "object" == typeof window.process && window.process.versions && window.process.versions["node-webkit"]),
        !1);
        ["RTCPeerConnection", "webkitRTCPeerConnection", "mozRTCPeerConnection", "RTCIceGatherer"].forEach(function(item) {
            isWebRTCSupported || item in window && (isWebRTCSupported = !0)
        }),
        DetectRTC.isWebRTCSupported = isWebRTCSupported,
        DetectRTC.isORTCSupported = "undefined" != typeof RTCIceGatherer;
        var isScreenCapturingSupported = !1;
        DetectRTC.browser.isChrome && DetectRTC.browser.version >= 35 ? isScreenCapturingSupported = !0 : DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 34 && (isScreenCapturingSupported = !0),
        "https:" !== location.protocol && (isScreenCapturingSupported = !1),
        DetectRTC.isScreenCapturingSupported = isScreenCapturingSupported;
        var webAudio = {
            isSupported: !1,
            isCreateMediaStreamSourceSupported: !1
        };
        ["AudioContext", "webkitAudioContext", "mozAudioContext", "msAudioContext"].forEach(function(item) {
            webAudio.isSupported || item in window && (webAudio.isSupported = !0,
            "createMediaStreamSource"in window[item].prototype && (webAudio.isCreateMediaStreamSourceSupported = !0))
        }),
        DetectRTC.isAudioContextSupported = webAudio.isSupported,
        DetectRTC.isCreateMediaStreamSourceSupported = webAudio.isCreateMediaStreamSourceSupported;
        var isRtpDataChannelsSupported = !1;
        DetectRTC.browser.isChrome && DetectRTC.browser.version > 31 && (isRtpDataChannelsSupported = !0),
        DetectRTC.isRtpDataChannelsSupported = isRtpDataChannelsSupported;
        var isSCTPSupportd = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version > 28 ? isSCTPSupportd = !0 : DetectRTC.browser.isChrome && DetectRTC.browser.version > 25 ? isSCTPSupportd = !0 : DetectRTC.browser.isOpera && DetectRTC.browser.version >= 11 && (isSCTPSupportd = !0),
        DetectRTC.isSctpDataChannelsSupported = isSCTPSupportd,
        DetectRTC.isMobileDevice = isMobileDevice;
        var isGetUserMediaSupported = !1;
        navigator.getUserMedia ? isGetUserMediaSupported = !0 : navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (isGetUserMediaSupported = !0),
        DetectRTC.browser.isChrome && DetectRTC.browser.version >= 46 && "https:" !== location.protocol && (DetectRTC.isGetUserMediaSupported = "Requires HTTPs"),
        DetectRTC.isGetUserMediaSupported = isGetUserMediaSupported,
        DetectRTC.osName = osName,
        DetectRTC.osVersion = osVersion;
        var displayResolution = "";
        if (screen.width) {
            var width = screen.width ? screen.width : ""
              , height = screen.height ? screen.height : "";
            displayResolution += "" + width + " x " + height
        }
        DetectRTC.displayResolution = displayResolution,
        DetectRTC.isCanvasSupportsStreamCapturing = isCanvasSupportsStreamCapturing,
        DetectRTC.isVideoSupportsStreamCapturing = isVideoSupportsStreamCapturing,
        DetectRTC.DetectLocalIPAddress = DetectLocalIPAddress,
        DetectRTC.isWebSocketsSupported = "WebSocket"in window && 2 === window.WebSocket.CLOSING,
        DetectRTC.isWebSocketsBlocked = !DetectRTC.isWebSocketsSupported,
        DetectRTC.checkWebSocketsSupport = function(callback) {
            callback = callback || function() {}
            ;
            try {
                var websocket = new WebSocket("wss://echo.websocket.org:443/");
                websocket.onopen = function() {
                    DetectRTC.isWebSocketsBlocked = !1,
                    callback(),
                    websocket.close(),
                    websocket = null
                }
                ,
                websocket.onerror = function() {
                    DetectRTC.isWebSocketsBlocked = !0,
                    callback()
                }
            } catch (e) {
                DetectRTC.isWebSocketsBlocked = !0,
                callback()
            }
        }
        ,
        DetectRTC.load = function(callback) {
            callback = callback || function() {}
            ,
            checkDeviceSupport(callback)
        }
        ,
        DetectRTC.MediaDevices = MediaDevices,
        DetectRTC.hasMicrophone = hasMicrophone,
        DetectRTC.hasSpeakers = hasSpeakers,
        DetectRTC.hasWebcam = hasWebcam,
        DetectRTC.isWebsiteHasWebcamPermissions = isWebsiteHasWebcamPermissions,
        DetectRTC.isWebsiteHasMicrophonePermissions = isWebsiteHasMicrophonePermissions,
        DetectRTC.audioInputDevices = audioInputDevices,
        DetectRTC.audioOutputDevices = audioOutputDevices,
        DetectRTC.videoInputDevices = videoInputDevices;
        var isSetSinkIdSupported = !1;
        "setSinkId"in document.createElement("video") && (isSetSinkIdSupported = !0),
        DetectRTC.isSetSinkIdSupported = isSetSinkIdSupported;
        var isRTPSenderReplaceTracksSupported = !1;
        DetectRTC.browser.isFirefox && "undefined" != typeof mozRTCPeerConnection ? "getSenders"in mozRTCPeerConnection.prototype && (isRTPSenderReplaceTracksSupported = !0) : DetectRTC.browser.isChrome && "undefined" != typeof webkitRTCPeerConnection && "getSenders"in webkitRTCPeerConnection.prototype && (isRTPSenderReplaceTracksSupported = !0),
        DetectRTC.isRTPSenderReplaceTracksSupported = isRTPSenderReplaceTracksSupported;
        var isRemoteStreamProcessingSupported = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version > 38 && (isRemoteStreamProcessingSupported = !0),
        DetectRTC.isRemoteStreamProcessingSupported = isRemoteStreamProcessingSupported;
        var isApplyConstraintsSupported = !1;
        "undefined" != typeof MediaStreamTrack && "applyConstraints"in MediaStreamTrack.prototype && (isApplyConstraintsSupported = !0),
        DetectRTC.isApplyConstraintsSupported = isApplyConstraintsSupported;
        var isMultiMonitorScreenCapturingSupported = !1;
        DetectRTC.browser.isFirefox && DetectRTC.browser.version >= 43 && (isMultiMonitorScreenCapturingSupported = !0),
        DetectRTC.isMultiMonitorScreenCapturingSupported = isMultiMonitorScreenCapturingSupported,
        DetectRTC.isPromisesSupported = !!("Promise"in window),
        "undefined" == typeof DetectRTC && (window.DetectRTC = {});
        var MediaStream = window.MediaStream;
        "undefined" == typeof MediaStream && "undefined" != typeof webkitMediaStream && (MediaStream = webkitMediaStream),
        "undefined" != typeof MediaStream ? DetectRTC.MediaStream = Object.keys(MediaStream.prototype) : DetectRTC.MediaStream = !1,
        "undefined" != typeof MediaStreamTrack ? DetectRTC.MediaStreamTrack = Object.keys(MediaStreamTrack.prototype) : DetectRTC.MediaStreamTrack = !1;
        var RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        "undefined" != typeof RTCPeerConnection ? DetectRTC.RTCPeerConnection = Object.keys(RTCPeerConnection.prototype) : DetectRTC.RTCPeerConnection = !1,
        window.DetectRTC = DetectRTC,
        "undefined" != typeof module && (module.exports = DetectRTC),
        "function" == typeof define && define.amd && define("DetectRTC", [], function() {
            return DetectRTC
        })
    }(),
    document.addEventListener("deviceready", setCordovaAPIs, !1),
    setCordovaAPIs();
    var RTCPeerConnection, defaults = {};
    "undefined" != typeof mozRTCPeerConnection ? RTCPeerConnection = mozRTCPeerConnection : "undefined" != typeof webkitRTCPeerConnection ? RTCPeerConnection = webkitRTCPeerConnection : "undefined" != typeof window.RTCPeerConnection && (RTCPeerConnection = window.RTCPeerConnection);
    var RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription
      , RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate
      , MediaStreamTrack = window.MediaStreamTrack;
    window.onPluginRTCInitialized = function() {
        MediaStreamTrack = window.PluginRTC.MediaStreamTrack,
        RTCPeerConnection = window.PluginRTC.RTCPeerConnection,
        RTCIceCandidate = window.PluginRTC.RTCIceCandidate,
        RTCSessionDescription = window.PluginRTC.RTCSessionDescription
    }
    ,
    "undefined" != typeof window.PluginRTC && window.onPluginRTCInitialized();
    var CodecsHandler = function() {
        function removeVPX(sdp) {
            if (!sdp || "string" != typeof sdp)
                throw "Invalid arguments.";
            return sdp = sdp.replace("a=rtpmap:100 VP8/90000\r\n", ""),
            sdp = sdp.replace("a=rtpmap:101 VP9/90000\r\n", ""),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 100/g, "m=video $1 RTP/SAVPF $2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF ([0-9 ]*) 101/g, "m=video $1 RTP/SAVPF $2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 100([0-9 ]*)/g, "m=video $1 RTP/SAVPF$2"),
            sdp = sdp.replace(/m=video ([0-9]+) RTP\/SAVPF 101([0-9 ]*)/g, "m=video $1 RTP/SAVPF$2"),
            sdp = sdp.replace("a=rtcp-fb:120 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:120 nack pli\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:120 ccm fir\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 nack pli\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:101 ccm fir\r\n", "")
        }
        function disableNACK(sdp) {
            if (!sdp || "string" != typeof sdp)
                throw "Invalid arguments.";
            return sdp = sdp.replace("a=rtcp-fb:126 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:126 nack pli\r\n", "a=rtcp-fb:126 pli\r\n"),
            sdp = sdp.replace("a=rtcp-fb:97 nack\r\n", ""),
            sdp = sdp.replace("a=rtcp-fb:97 nack pli\r\n", "a=rtcp-fb:97 pli\r\n")
        }
        function prioritize(codecMimeType, peer) {
            if (peer && peer.getSenders && peer.getSenders().length) {
                if (!codecMimeType || "string" != typeof codecMimeType)
                    throw "Invalid arguments.";
                peer.getSenders().forEach(function(sender) {
                    for (var params = sender.getParameters(), i = 0; i < params.codecs.length; i++)
                        if (params.codecs[i].mimeType == codecMimeType) {
                            params.codecs.unshift(params.codecs.splice(i, 1));
                            break
                        }
                    sender.setParameters(params)
                })
            }
        }
        function removeNonG722(sdp) {
            return sdp.replace(/m=audio ([0-9]+) RTP\/SAVPF ([0-9 ]*)/g, "m=audio $1 RTP/SAVPF 9")
        }
        function setBAS(sdp, bandwidth, isScreen) {
            return bandwidth ? "undefined" != typeof isFirefox && isFirefox ? sdp : isMobileDevice ? sdp : (isScreen && (bandwidth.screen ? bandwidth.screen < 300 && console.warn("It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.") : console.warn("It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.")),
            bandwidth.screen && isScreen && (sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, ""),
            sdp = sdp.replace(/a=mid:video\r\n/g, "a=mid:video\r\nb=AS:" + bandwidth.screen + "\r\n")),
            (bandwidth.audio || bandwidth.video || bandwidth.data) && (sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, "")),
            bandwidth.audio && (sdp = sdp.replace(/a=mid:audio\r\n/g, "a=mid:audio\r\nb=AS:" + bandwidth.audio + "\r\n")),
            bandwidth.video && (sdp = sdp.replace(/a=mid:video\r\n/g, "a=mid:video\r\nb=AS:" + (isScreen ? bandwidth.screen : bandwidth.video) + "\r\n")),
            sdp) : sdp
        }
        function findLine(sdpLines, prefix, substr) {
            return findLineInRange(sdpLines, 0, -1, prefix, substr)
        }
        function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
            for (var realEndLine = -1 !== endLine ? endLine : sdpLines.length, i = startLine; realEndLine > i; ++i)
                if (0 === sdpLines[i].indexOf(prefix) && (!substr || -1 !== sdpLines[i].toLowerCase().indexOf(substr.toLowerCase())))
                    return i;
            return null
        }
        function getCodecPayloadType(sdpLine) {
            var pattern = new RegExp("a=rtpmap:(\\d+) \\w+\\/\\d+")
              , result = sdpLine.match(pattern);
            return result && 2 === result.length ? result[1] : null
        }
        function setVideoBitrates(sdp, params) {
            if (isMobileDevice)
                return sdp;
            params = params || {};
            var vp8Payload, xgoogle_min_bitrate = params.min, xgoogle_max_bitrate = params.max, sdpLines = sdp.split("\r\n"), vp8Index = findLine(sdpLines, "a=rtpmap", "VP8/90000");
            if (vp8Index && (vp8Payload = getCodecPayloadType(sdpLines[vp8Index])),
            !vp8Payload)
                return sdp;
            var rtxPayload, rtxIndex = findLine(sdpLines, "a=rtpmap", "rtx/90000");
            if (rtxIndex && (rtxPayload = getCodecPayloadType(sdpLines[rtxIndex])),
            !rtxIndex)
                return sdp;
            var rtxFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + rtxPayload.toString());
            if (null !== rtxFmtpLineIndex) {
                var appendrtxNext = "\r\n";
                appendrtxNext += "a=fmtp:" + vp8Payload + " x-google-min-bitrate=" + (xgoogle_min_bitrate || "228") + "; x-google-max-bitrate=" + (xgoogle_max_bitrate || "228"),
                sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext),
                sdp = sdpLines.join("\r\n")
            }
            return sdp
        }
        function setOpusAttributes(sdp, params) {
            if (isMobileDevice)
                return sdp;
            params = params || {};
            var opusPayload, sdpLines = sdp.split("\r\n"), opusIndex = findLine(sdpLines, "a=rtpmap", "opus/48000");
            if (opusIndex && (opusPayload = getCodecPayloadType(sdpLines[opusIndex])),
            !opusPayload)
                return sdp;
            var opusFmtpLineIndex = findLine(sdpLines, "a=fmtp:" + opusPayload.toString());
            if (null === opusFmtpLineIndex)
                return sdp;
            var appendOpusNext = "";
            return appendOpusNext += "; stereo=" + ("undefined" != typeof params.stereo ? params.stereo : "1"),
            appendOpusNext += "; sprop-stereo=" + ("undefined" != typeof params["sprop-stereo"] ? params["sprop-stereo"] : "1"),
            "undefined" != typeof params.maxaveragebitrate && (appendOpusNext += "; maxaveragebitrate=" + (params.maxaveragebitrate || 1048576)),
            "undefined" != typeof params.maxplaybackrate && (appendOpusNext += "; maxplaybackrate=" + (params.maxplaybackrate || 1048576)),
            "undefined" != typeof params.cbr && (appendOpusNext += "; cbr=" + ("undefined" != typeof params.cbr ? params.cbr : "1")),
            "undefined" != typeof params.useinbandfec && (appendOpusNext += "; useinbandfec=" + params.useinbandfec),
            "undefined" != typeof params.usedtx && (appendOpusNext += "; usedtx=" + params.usedtx),
            "undefined" != typeof params.maxptime && (appendOpusNext += "\r\na=maxptime:" + params.maxptime),
            sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext),
            sdp = sdpLines.join("\r\n")
        }
        function preferVP9(sdp) {
            return -1 === sdp.indexOf("SAVPF 100 101") || -1 === sdp.indexOf("VP9/90000") ? sdp : sdp.replace("SAVPF 100 101", "SAVPF 101 100")
        }
        function forceStereoAudio(sdp) {
            for (var sdpLines = sdp.split("\r\n"), fmtpLineIndex = null , i = 0; i < sdpLines.length; i++)
                if (-1 !== sdpLines[i].search("opus/48000")) {
                    var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
                    break
                }
            for (var i = 0; i < sdpLines.length; i++)
                if (-1 !== sdpLines[i].search("a=fmtp")) {
                    var payload = extractSdp(sdpLines[i], /a=fmtp:(\d+)/);
                    if (payload === opusPayload) {
                        fmtpLineIndex = i;
                        break
                    }
                }
            return null === fmtpLineIndex ? sdp : (sdpLines[fmtpLineIndex] = sdpLines[fmtpLineIndex].concat("; stereo=1; sprop-stereo=1"),
            sdp = sdpLines.join("\r\n"))
        }
        var isMobileDevice = !!navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i);
        return "undefined" != typeof cordova && (isMobileDevice = !0),
        navigator && navigator.userAgent && -1 !== navigator.userAgent.indexOf("Crosswalk") && (isMobileDevice = !0),
        {
            removeVPX: removeVPX,
            disableNACK: disableNACK,
            prioritize: prioritize,
            removeNonG722: removeNonG722,
            setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
                return setBAS(sdp, bandwidth, isScreen)
            },
            setVideoBitrates: function(sdp, params) {
                return setVideoBitrates(sdp, params)
            },
            setOpusAttributes: function(sdp, params) {
                return setOpusAttributes(sdp, params)
            },
            preferVP9: preferVP9,
            forceStereoAudio: forceStereoAudio
        }
    }();
    window.BandwidthHandler = CodecsHandler;
    var loadedIceFrame, OnIceCandidateHandler = function() {
        function processCandidates(connection, icePair) {
            var candidate = icePair.candidate
              , iceRestrictions = connection.candidates
              , stun = iceRestrictions.stun
              , turn = iceRestrictions.turn;
            if (isNull(iceRestrictions.reflexive) || (stun = iceRestrictions.reflexive),
            isNull(iceRestrictions.relay) || (turn = iceRestrictions.relay),
            (iceRestrictions.host || !candidate.match(/typ host/g)) && (turn || !candidate.match(/typ relay/g)) && (stun || !candidate.match(/typ srflx/g))) {
                var protocol = connection.iceProtocols;
                if ((protocol.udp || !candidate.match(/ udp /g)) && (protocol.tcp || !candidate.match(/ tcp /g)))
                    return connection.enableLogs && console.debug("Your candidate pairs:", candidate),
                    {
                        candidate: candidate,
                        sdpMid: icePair.sdpMid,
                        sdpMLineIndex: icePair.sdpMLineIndex
                    }
            }
        }
        return {
            processCandidates: processCandidates
        }
    }();
    "undefined" != typeof window.getExternalIceServers && 1 == window.getExternalIceServers && loadIceFrame(function(externalIceServers) {
        externalIceServers && externalIceServers.length && (window.RMCExternalIceServers = externalIceServers,
        window.iceServersLoadCallback && "function" == typeof window.iceServersLoadCallback && window.iceServersLoadCallback(externalIceServers))
    });
    var IceServersHandler = function() {
        function getIceServers(connection) {
            var iceServers = [];
            return iceServers.push(getSTUNObj("stun:stun.l.google.com:19302")),
            iceServers.push(getTURNObj("turn:webrtcweb.com:80", "muazkh", "muazkh")),
            iceServers.push(getTURNObj("turn:webrtcweb.com:443", "muazkh", "muazkh")),
            window.RMCExternalIceServers ? iceServers = iceServers.concat(getExtenralIceFormatted()) : "undefined" != typeof window.getExternalIceServers && 1 == window.getExternalIceServers && (connection.iceServers = iceServers,
            window.iceServersLoadCallback = function() {
                connection.iceServers = connection.iceServers.concat(getExtenralIceFormatted())
            }
            ),
            iceServers
        }
        return {
            getIceServers: getIceServers
        }
    }()
      , currentUserMediaRequest = {
        streams: [],
        mutex: !1,
        queueRequests: [],
        remove: function(idInstance) {
            this.mutex = !1;
            var stream = this.streams[idInstance];
            if (stream) {
                stream = stream.stream;
                var options = stream.currentUserMediaRequestOptions;
                this.queueRequests.indexOf(options) && (delete this.queueRequests[this.queueRequests.indexOf(options)],
                this.queueRequests = removeNullEntries(this.queueRequests)),
                this.streams[idInstance].stream = null ,
                delete this.streams[idInstance]
            }
        }
    }
      , StreamsHandler = function() {
        function handleType(type) {
            return type ? "string" == typeof type || "undefined" == typeof type ? type : type.audio && type.video ? null : type.audio ? "audio" : type.video ? "video" : void 0 : void 0
        }
        function setHandlers(stream, syncAction, connection) {
            function graduallyIncreaseVolume() {
                if (connection.streamEvents[stream.streamid].mediaElement) {
                    var mediaElement = connection.streamEvents[stream.streamid].mediaElement;
                    mediaElement.volume = 0,
                    afterEach(200, 5, function() {
                        mediaElement.volume += .2
                    })
                }
            }
            stream && stream.addEventListener && (("undefined" == typeof syncAction || 1 == syncAction) && stream.addEventListener("ended", function() {
                StreamsHandler.onSyncNeeded(this.streamid, "ended")
            }, !1),
            stream.mute = function(type, isSyncAction) {
                type = handleType(type),
                "undefined" != typeof isSyncAction && (syncAction = isSyncAction),
                ("undefined" == typeof type || "audio" == type) && stream.getAudioTracks().forEach(function(track) {
                    track.enabled = !1,
                    connection.streamEvents[stream.streamid].isAudioMuted = !0
                }),
                ("undefined" == typeof type || "video" == type) && stream.getVideoTracks().forEach(function(track) {
                    track.enabled = !1
                }),
                ("undefined" == typeof syncAction || 1 == syncAction) && StreamsHandler.onSyncNeeded(stream.streamid, "mute", type),
                connection.streamEvents[stream.streamid].muteType = type || "both",
                fireEvent(stream, "mute", type)
            }
            ,
            stream.unmute = function(type, isSyncAction) {
                type = handleType(type),
                "undefined" != typeof isSyncAction && (syncAction = isSyncAction),
                graduallyIncreaseVolume(),
                ("undefined" == typeof type || "audio" == type) && stream.getAudioTracks().forEach(function(track) {
                    track.enabled = !0,
                    connection.streamEvents[stream.streamid].isAudioMuted = !1
                }),
                ("undefined" == typeof type || "video" == type) && (stream.getVideoTracks().forEach(function(track) {
                    track.enabled = !0
                }),
                "undefined" != typeof type && "video" == type && connection.streamEvents[stream.streamid].isAudioMuted && !function looper(times) {
                    times || (times = 0),
                    times++,
                    100 > times && connection.streamEvents[stream.streamid].isAudioMuted && (stream.mute("audio"),
                    setTimeout(function() {
                        looper(times)
                    }, 50))
                }()),
                ("undefined" == typeof syncAction || 1 == syncAction) && StreamsHandler.onSyncNeeded(stream.streamid, "unmute", type),
                connection.streamEvents[stream.streamid].unmuteType = type || "both",
                fireEvent(stream, "unmute", type)
            }
            )
        }
        function afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes) {
            startedTimes = (startedTimes || 0) + 1,
            startedTimes >= numberOfTimes || setTimeout(function() {
                callback(),
                afterEach(setTimeoutInteval, numberOfTimes, callback, startedTimes)
            }, setTimeoutInteval)
        }
        return {
            setHandlers: setHandlers,
            onSyncNeeded: function(streamid, action, type) {}
        }
    }();
    window.addEventListener("message", function(event) {
        event.origin == window.location.origin && onMessageCallback(event.data)
    });
    var sourceId, screenCallback, chromeMediaSource = "screen";
    var TextSender = {
        send: function(config) {
            var connection = config.connection;

            var channel = config.channel,
                remoteUserId = config.remoteUserId,
                initialText = config.text,
                packetSize = connection.chunkSize || 1000,
                textToTransfer = '',
                isobject = false;

            if (!isString(initialText)) {
                isobject = true;
                initialText = JSON.stringify(initialText);
            }

            // uuid is used to uniquely identify sending instance
            var uuid = getRandomString();
            var sendingTime = new Date().getTime();

            sendText(initialText);

            function sendText(textMessage, text) {
                var data = {
                    type: 'text',
                    uuid: uuid,
                    sendingTime: sendingTime
                };

                if (textMessage) {
                    text = textMessage;
                    data.packets = parseInt(text.length / packetSize);
                }

                if (text.length > packetSize) {
                    data.message = text.slice(0, packetSize);
                } else {
                    data.message = text;
                    data.last = true;
                    data.isobject = isobject;
                }

                channel.send(data, remoteUserId);

                textToTransfer = text.slice(data.message.length);

                if (textToTransfer.length) {
                    setTimeout(function() {
                        sendText(null, textToTransfer);
                    }, connection.chunkInterval || 100);
                }
            }
        }
    },
    FileProgressBarHandler = function() {
        function handle(connection) {
            function updateLabel(progress, label) {
                if (-1 !== progress.position) {
                    var position = +progress.position.toFixed(2).split(".")[1] || 100;
                    label.innerHTML = position + "%"
                }
            }
            var progressHelper = {};
            connection.onFileStart = function(file) {
                var div = document.createElement("div");
                return div.title = file.name,
                div.innerHTML = "<label>0%</label> <progress></progress>",
                file.remoteUserId && (div.innerHTML += " (Sharing with:" + file.remoteUserId + ")"),
                connection.filesContainer || (connection.filesContainer = document.body || document.documentElement),
                connection.filesContainer.insertBefore(div, connection.filesContainer.firstChild),
                file.remoteUserId ? (progressHelper[file.uuid] || (progressHelper[file.uuid] = {}),
                progressHelper[file.uuid][file.remoteUserId] = {
                    div: div,
                    progress: div.querySelector("progress"),
                    label: div.querySelector("label")
                },
                void (progressHelper[file.uuid][file.remoteUserId].progress.max = file.maxChunks)) : (progressHelper[file.uuid] = {
                    div: div,
                    progress: div.querySelector("progress"),
                    label: div.querySelector("label")
                },
                void (progressHelper[file.uuid].progress.max = file.maxChunks))
            }
            ,
            connection.onFileProgress = function(chunk) {
                var helper = progressHelper[chunk.uuid];
                helper && (!chunk.remoteUserId || (helper = progressHelper[chunk.uuid][chunk.remoteUserId])) && (helper.progress.value = chunk.currentPosition || chunk.maxChunks || helper.progress.max,
                updateLabel(helper.progress, helper.label))
            }
            ,
            connection.onFileEnd = function(file) {
                var helper = progressHelper[file.uuid];
                if (!helper)
                    return void console.error("No such progress-helper element exists.", file);
                if (!file.remoteUserId || (helper = progressHelper[file.uuid][file.remoteUserId])) {
                    var div = helper.div;
                    -1 != file.type.indexOf("image") ? div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><img src="' + file.url + '" title="' + file.name + '" style="max-width: 80%;">' : div.innerHTML = '<a href="' + file.url + '" download="' + file.name + '">Download <strong style="color:red;">' + file.name + '</strong> </a><br /><iframe src="' + file.url + '" title="' + file.name + '" style="width: 80%;border: 0;height: inherit;margin-top:1em;"></iframe>'
                }
            }
        }
        return {
            handle: handle
        }
    }(), 
    TranslationHandler = function() {
        function handle(connection) {
            connection.autoTranslateText = !1,
            connection.language = "en",
            connection.googKey = "AIzaSyCgB5hmFY74WYB-EoWkhr9cAGr6TiTHrEE",
            connection.Translator = {
                TranslateText: function(text, callback) {
                    var newScript = document.createElement("script");
                    newScript.type = "text/javascript";
                    var sourceText = encodeURIComponent(text)
                      , randomNumber = "method" + connection.token();
                    window[randomNumber] = function(response) {
                        response.data && response.data.translations[0] && callback && callback(response.data.translations[0].translatedText),
                        response.error && "Daily Limit Exceeded" === response.error.message && (warn('Text translation failed. Error message: "Daily Limit Exceeded."'),
                        callback(text))
                    }
                    ;
                    var source = "https://www.googleapis.com/language/translate/v2?key=" + connection.googKey + "&target=" + (connection.language || "en-US") + "&callback=window." + randomNumber + "&q=" + sourceText;
                    newScript.src = source,
                    document.getElementsByTagName("head")[0].appendChild(newScript)
                }
            }
        }
        return {
            handle: handle
        }
    }();
    window.RTCMultiConnection = RTCMultiConnection
}();
