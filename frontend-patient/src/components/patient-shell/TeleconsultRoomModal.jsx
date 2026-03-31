import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_RTC_CONFIGURATION = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ],
};

async function requestUserMedia(constraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  const legacyGetUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
  if (!legacyGetUserMedia) {
    throw new Error("Camera or microphone access is not available in this browser.");
  }
  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(navigator, constraints, resolve, reject);
  });
}

function serializeSessionDescription(description) {
  if (!description) return null;
  return { type: description.type, sdp: description.sdp };
}

function serializeIceCandidate(candidate) {
  if (!candidate) return null;
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  };
}

function MediaConsultPanel({
  consult,
  authToken,
  apiBase,
  currentUserId,
  consentAccepted,
  roomReady,
}) {
  const normalizedMode = String(consult?.mode || "").toLowerCase();
  const mediaLabel = normalizedMode === "video" ? "Video consult" : "Audio consult";
  const roomUnlocked = roomReady && consentAccepted;
  const sessionId = useMemo(() => `teleconsult-${consult?.id || "room"}`, [consult?.id]);
  const isVideo = normalizedMode === "video";
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localMediaRef = useRef(null);
  const remoteMediaRef = useRef(null);
  const lastEventIdRef = useRef(0);
  const processedEventIdsRef = useRef(new Set());
  const pendingOfferRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const [callStatus, setCallStatus] = useState(
    roomReady
      ? "Get ready to join when the doctor starts the consult."
      : "Once this consult is scheduled, live call controls will appear here.",
  );
  const [busy, setBusy] = useState(false);
  const [callJoined, setCallJoined] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [rtcConfiguration, setRtcConfiguration] = useState(DEFAULT_RTC_CONFIGURATION);

  const teardownCall = useCallback((message = "") => {
    if (peerRef.current) {
      try {
        peerRef.current.ontrack = null;
        peerRef.current.onicecandidate = null;
        peerRef.current.onconnectionstatechange = null;
        peerRef.current.close();
      } catch {
        // ignore close issues
      }
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    setCallJoined(false);
    setRemoteConnected(false);
    setMuted(false);
    setCameraEnabled(true);
    if (message) setCallStatus(message);
  }, []);

  useEffect(() => () => teardownCall(""), [teardownCall]);

  useEffect(() => {
    if (!authToken) return undefined;
    let cancelled = false;
    const loadRtcConfiguration = async () => {
      try {
        const response = await fetch(`${apiBase}/api/teleconsults/rtc-config`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        if (Array.isArray(data?.iceServers) && data.iceServers.length) {
          setRtcConfiguration({
            iceServers: data.iceServers,
            ...(data?.iceTransportPolicy ? { iceTransportPolicy: data.iceTransportPolicy } : {}),
          });
        }
      } catch {
        // keep default STUN config as fallback
      }
    };
    loadRtcConfiguration();
    return () => {
      cancelled = true;
    };
  }, [apiBase, authToken]);

  useEffect(() => {
    if (localMediaRef.current) {
      localMediaRef.current.srcObject = localStreamRef.current || null;
    }
  }, [callJoined, muted, cameraEnabled]);

  useEffect(() => {
    if (remoteMediaRef.current) {
      remoteMediaRef.current.srcObject = remoteStreamRef.current || null;
    }
  }, [remoteConnected]);

  const postCallEvent = useCallback(
    async (eventType, payload = null) => {
      const response = await fetch(`${apiBase}/api/teleconsults/${consult.id}/call-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId, eventType, payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to update the live consult channel.");
      }
      return data.event;
    },
    [apiBase, authToken, consult?.id, sessionId],
  );

  const ensurePeer = useCallback(async () => {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection(rtcConfiguration);
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteMediaRef.current) remoteMediaRef.current.srcObject = remoteStream;
    peer.ontrack = (event) => {
      event.streams?.[0]?.getTracks?.().forEach((track) => remoteStream.addTrack(track));
      if (!event.streams?.[0]) {
        event.track && remoteStream.addTrack(event.track);
      }
      setRemoteConnected(true);
      setCallStatus(`${mediaLabel} connected.`);
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        postCallEvent("candidate", serializeIceCandidate(event.candidate)).catch((error) => {
          setCallStatus(error.message || "Unable to send network details for the live consult.");
        });
      }
    };
    peer.onconnectionstatechange = () => {
      const state = String(peer.connectionState || "");
      if (state === "connected") {
        setRemoteConnected(true);
        setCallStatus(`${mediaLabel} connected.`);
      } else if (["failed", "disconnected"].includes(state)) {
        setCallStatus(`The ${normalizedMode} connection was interrupted. Retry joining if needed.`);
      } else if (state === "closed") {
        setCallStatus(`${mediaLabel} ended.`);
      }
    };
    peerRef.current = peer;
    return peer;
  }, [mediaLabel, normalizedMode, postCallEvent, rtcConfiguration]);

  const flushPendingCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer?.remoteDescription) return;
    const candidates = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // ignore candidate race conditions
      }
    }
  }, []);

  const handleIncomingEvent = useCallback(
    async (event) => {
      if (!event || processedEventIdsRef.current.has(event.id)) return;
      processedEventIdsRef.current.add(event.id);
      lastEventIdRef.current = Math.max(lastEventIdRef.current, Number(event.id) || 0);
      if (Number(event.senderUserId) === Number(currentUserId)) return;
      if (String(event.sessionId || "") !== sessionId) return;

      if (event.eventType === "offer") {
        pendingOfferRef.current = event.payload;
        if (!callJoined) {
          setCallStatus(`The doctor has started the ${normalizedMode} consult. Tap join to continue.`);
          return;
        }
        const peer = await ensurePeer();
        await peer.setRemoteDescription(event.payload);
        await flushPendingCandidates();
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await postCallEvent("answer", serializeSessionDescription(answer));
        setCallStatus(`Joining the ${normalizedMode} consult...`);
        return;
      }

      if (event.eventType === "answer") {
        const peer = peerRef.current;
        if (!peer) return;
        await peer.setRemoteDescription(event.payload);
        await flushPendingCandidates();
        setCallStatus(`Connecting ${normalizedMode} consult...`);
        return;
      }

      if (event.eventType === "candidate") {
        const candidate = new RTCIceCandidate(event.payload);
        const peer = peerRef.current;
        if (!peer?.remoteDescription) {
          pendingCandidatesRef.current.push(candidate);
          return;
        }
        try {
          await peer.addIceCandidate(candidate);
        } catch {
          // ignore candidate race conditions
        }
        return;
      }

      if (event.eventType === "ended") {
        teardownCall(`The ${normalizedMode} consult was ended.`);
      }
    },
    [
      callJoined,
      currentUserId,
      ensurePeer,
      flushPendingCandidates,
      normalizedMode,
      postCallEvent,
      sessionId,
      teardownCall,
    ],
  );

  useEffect(() => {
    if (!authToken || !consult?.id || !["audio", "video"].includes(normalizedMode)) return undefined;
    let cancelled = false;
    const loadEvents = async () => {
      try {
        const response = await fetch(
          `${apiBase}/api/teleconsults/${consult.id}/call-events?afterId=${encodeURIComponent(lastEventIdRef.current)}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok || cancelled) return;
        for (const event of data.events || []) {
          await handleIncomingEvent(event);
        }
      } catch {
        if (!cancelled) {
          setCallStatus((prev) => prev || `Live ${normalizedMode} updates were interrupted. Retry joining if needed.`);
        }
      }
    };
    loadEvents();
    const interval = window.setInterval(loadEvents, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiBase, authToken, consult?.id, handleIncomingEvent, normalizedMode]);

  const startOrJoinCall = async () => {
    if (!roomUnlocked || busy) return;
    setBusy(true);
    try {
      const localStream =
        localStreamRef.current ||
        (await requestUserMedia({
          audio: true,
          video: isVideo,
        }));
      localStreamRef.current = localStream;
      if (localMediaRef.current) {
        localMediaRef.current.srcObject = localStream;
      }
      const peer = await ensurePeer();
      if (!peer.getSenders().length) {
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
      }
      setCallJoined(true);

      if (pendingOfferRef.current) {
        await peer.setRemoteDescription(pendingOfferRef.current);
        await flushPendingCandidates();
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await postCallEvent("answer", serializeSessionDescription(answer));
        setCallStatus(`Joining the ${normalizedMode} consult...`);
      } else {
        setCallStatus(`Waiting for the doctor to start the ${normalizedMode} consult...`);
      }
    } catch (error) {
      setCallStatus(error?.message || `Unable to join ${normalizedMode} consult.`);
    } finally {
      setBusy(false);
    }
  };

  const endCall = async () => {
    try {
      if (callJoined) {
        await postCallEvent("ended");
      }
    } catch {
      // ignore end-call transport errors
    } finally {
      teardownCall(`${mediaLabel} ended.`);
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks?.().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextEnabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks?.().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setCameraEnabled(nextEnabled);
  };

  return (
    <div className="history-card subtle">
      <div className="section-head compact">
        <div>
          <p className="micro strong">{mediaLabel}</p>
          <p className="micro">
            {normalizedMode === "video"
              ? "Join the secure browser video room at the scheduled time."
              : "Join the secure browser audio room at the scheduled time."}
          </p>
        </div>
      </div>
      <p className="micro">
        {roomReady
          ? "When the doctor starts the consult, join directly from this screen."
          : "Once this consult is scheduled, live call controls will appear here."}
      </p>
      {!consentAccepted ? (
        <p className="micro">Accept the teleconsult notice below so the doctor can proceed with the live consult and documentation.</p>
      ) : null}
      {roomReady ? (
        <>
          <div className="teleconsult-room-actions">
            <button type="button" className="primary" onClick={startOrJoinCall} disabled={!roomUnlocked || busy}>
              {busy
                ? "Preparing..."
                : callJoined
                  ? normalizedMode === "video"
                    ? "Rejoin video"
                    : "Rejoin audio"
                  : normalizedMode === "video"
                    ? "Join video"
                    : "Join audio"}
            </button>
            <button type="button" className="secondary" onClick={toggleMute} disabled={!callJoined}>
              {muted ? "Unmute" : "Mute"}
            </button>
            {isVideo ? (
              <button type="button" className="ghost" onClick={toggleCamera} disabled={!callJoined}>
                {cameraEnabled ? "Camera off" : "Camera on"}
              </button>
            ) : null}
            <button type="button" className="ghost" onClick={endCall} disabled={!callJoined}>
              End call
            </button>
          </div>
          {!roomUnlocked ? <p className="micro">Accept the teleconsult notice to unlock live {normalizedMode}.</p> : null}
          <p className="micro">{callStatus}</p>
          <div className="teleconsult-media-shell">
            {isVideo ? (
              <div className="teleconsult-media-stage teleconsult-media-stage-video">
                <div className="teleconsult-media-primary-card">
                  <div className="teleconsult-media-caption-row">
                    <p className="micro strong">Doctor</p>
                    <span className={`appointments-mode-pill ${remoteConnected ? "success" : ""}`}>
                      {remoteConnected ? "Live" : "Waiting"}
                    </span>
                  </div>
                  <video ref={remoteMediaRef} autoPlay playsInline className="teleconsult-media-video teleconsult-media-video-primary" />
                  <p className="micro teleconsult-media-helper">
                    {remoteConnected
                      ? "Doctor connected."
                      : "As soon as the doctor joins, their live stream will appear here."}
                  </p>
                </div>
                <div className="teleconsult-media-overlay-card">
                  <div className="teleconsult-media-caption-row">
                    <p className="micro strong">Your camera</p>
                    <span className="appointments-mode-pill">You</span>
                  </div>
                  <video ref={localMediaRef} autoPlay muted playsInline className="teleconsult-media-video teleconsult-media-video-overlay" />
                  {!callJoined ? <p className="micro teleconsult-media-helper">Your media preview will appear here after you join.</p> : null}
                </div>
              </div>
            ) : (
              <div className="teleconsult-media-audio-grid">
                <div className="history-card subtle teleconsult-media-audio-card">
                  <div className="teleconsult-media-caption-row">
                    <p className="micro strong">Doctor</p>
                    <span className={`appointments-mode-pill ${remoteConnected ? "success" : ""}`}>
                      {remoteConnected ? "Live" : "Waiting"}
                    </span>
                  </div>
                  <audio ref={remoteMediaRef} autoPlay playsInline controls={false} />
                  <p className="micro teleconsult-media-helper">
                    {remoteConnected
                      ? "Doctor connected."
                      : "As soon as the doctor joins, their live audio will appear here."}
                  </p>
                </div>
                <div className="history-card subtle teleconsult-media-audio-card">
                  <div className="teleconsult-media-caption-row">
                    <p className="micro strong">Your microphone</p>
                    <span className="appointments-mode-pill">You</span>
                  </div>
                  <audio ref={localMediaRef} autoPlay muted />
                  {!callJoined ? <p className="micro teleconsult-media-helper">Your media preview will appear here after you join.</p> : null}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="teleconsult-room-actions">
          <span className="appointments-mode-pill">
            {normalizedMode === "video" ? "Video standby" : "Audio standby"}
          </span>
        </div>
      )}
    </div>
  );
}

export function TeleconsultRoomModal({
  consult,
  authToken,
  apiBase,
  currentUserId,
  closeTeleconsultRoom,
  teleStatusLabel,
  consultMessages,
  consultConsentSummary,
  acceptConsultConsent,
  consultMessageText,
  setConsultMessageText,
  sendConsultMessage,
  consultMessageStatus,
}) {
  if (!consult) return null;

  const normalizedMode = String(consult.mode || "").toLowerCase();
  const roomReady = ["scheduled", "in_progress"].includes(String(consult.status || "").toLowerCase());
  const patientConsentAccepted = Boolean(consultConsentSummary?.patientAccepted);

  return (
    <div className="modal-backdrop" onClick={closeTeleconsultRoom}>
      <div className="modal appointment-modal teleconsult-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-head compact">
          <div>
            <p className="eyebrow">Remote consult</p>
            <h2>{normalizedMode === "chat" ? "Chat consult room" : `${normalizedMode || "Remote"} consult room`}</h2>
            <p className="panel-sub">
              {teleStatusLabel(consult.status) || consult.status} • {consult.preferredSlot ? new Date(consult.preferredSlot).toLocaleString() : "Preferred slot not added"}
            </p>
          </div>
          <button className="ghost" type="button" onClick={closeTeleconsultRoom}>Close</button>
        </div>

        <div className="teleconsult-room-grid">
          <div className="teleconsult-room-main">
            {!patientConsentAccepted ? (
              <div className="history-card subtle teleconsult-notice-card">
                <p className="micro strong">Teleconsult notice</p>
                <p className="micro">
                  This remote consult is general app-based care support and does not replace emergency treatment or in-person care when urgently needed.
                </p>
                <div className="action-row">
                  <button className="secondary" type="button" onClick={acceptConsultConsent}>
                    I understand
                  </button>
                </div>
              </div>
            ) : null}

            <div className="history-card">
              <p className="micro">Mode: {normalizedMode || "-"}</p>
              <p className="micro">Phone: {consult.phone || "-"}</p>
              <p className="micro">Concern: {consult.concern || "-"}</p>
            </div>

            {["audio", "video"].includes(normalizedMode) ? (
              <MediaConsultPanel
                consult={consult}
                authToken={authToken}
                apiBase={apiBase}
                currentUserId={currentUserId}
                consentAccepted={patientConsentAccepted}
                roomReady={roomReady}
              />
            ) : null}

            <div className="teleconsult-chat-card">
              <div className="section-head compact">
                <div>
                  <p className="micro strong">Consult chat</p>
                  <p className="micro">Use this thread for updates, file-free instructions, and quick coordination.</p>
                </div>
              </div>
              <div className="consult-thread">
                {consultMessages.length === 0 ? (
                  <p className="micro">No messages yet.</p>
                ) : (
                  consultMessages.map((msg) => (
                    <div
                      key={`consult-msg-${msg.id}`}
                      className={`chat-msg ${msg.senderRole === "patient" ? "user" : "bot"}`}
                    >
                      <p className="micro">{new Date(msg.createdAt).toLocaleString()}</p>
                      <p>{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              <form className="chat-form" onSubmit={sendConsultMessage}>
                <input
                  type="text"
                  value={consultMessageText}
                  placeholder={normalizedMode === "chat" ? "Type your message to the doctor..." : "Send a quick message to the consult room..."}
                  disabled={!patientConsentAccepted}
                  onChange={(event) => setConsultMessageText(event.target.value)}
                />
                <button className="primary" type="submit" disabled={!patientConsentAccepted}>Send</button>
              </form>
              {consultMessageStatus ? <p className="micro">{consultMessageStatus}</p> : null}
            </div>
          </div>

          <aside className="teleconsult-room-side">
            <div className="history-card">
              <p className="mini-label">Session status</p>
              <h3>{teleStatusLabel(consult.status) || consult.status}</h3>
              <p className="micro">
                {normalizedMode === "chat"
                  ? "Stay on this screen for the live chat consult."
                  : normalizedMode === "audio"
                    ? "Join the browser audio room here and use chat as backup if the call drops."
                    : normalizedMode === "video"
                      ? "Join the browser video room here and use chat as backup if the call drops."
                      : "Stay on this screen for live consult updates."}
              </p>
              <p className="micro">
                {patientConsentAccepted
                  ? `Teleconsult notice accepted ${consultConsentSummary?.patientAcceptedAt ? `at ${new Date(consultConsentSummary.patientAcceptedAt).toLocaleString()}` : ""}.`
                  : "Teleconsult notice pending."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
