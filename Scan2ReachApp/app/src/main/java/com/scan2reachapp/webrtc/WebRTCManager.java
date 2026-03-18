package com.scan2reachapp.webrtc;

import android.content.Context;
import android.media.AudioManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import org.webrtc.AudioSource;
import org.webrtc.AudioTrack;
import org.webrtc.DataChannel;
import org.webrtc.IceCandidate;
import org.webrtc.MediaConstraints;
import org.webrtc.MediaStream;
import org.webrtc.PeerConnection;
import org.webrtc.PeerConnectionFactory;
import org.webrtc.RtpReceiver;
import org.webrtc.SdpObserver;
import org.webrtc.SessionDescription;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WebRTCManager {

    private static final String TAG = "WebRTCManager";

    private Context context;
    private PeerConnectionFactory peerConnectionFactory;
    private PeerConnection peerConnection;
    private AudioSource audioSource;
    private AudioTrack localAudioTrack;

    private DatabaseReference callRef;
    private boolean isInitiator;

    // ✅ FIX 1: Queue ICE candidates until remote description is set
    private final List<IceCandidate> pendingIceCandidates = new ArrayList<>();
    private boolean remoteDescriptionSet = false;

    private WebRTCListener listener;

    public interface WebRTCListener {
        void onConnected();
        void onDisconnected();
        void onError(String error);
    }

    public WebRTCManager(Context context, WebRTCListener listener) {
        this.context = context;
        this.listener = listener;
        initializePeerConnectionFactory();
    }

    private void initializePeerConnectionFactory() {
        PeerConnectionFactory.InitializationOptions initOptions =
            PeerConnectionFactory.InitializationOptions.builder(context)
                .setEnableInternalTracer(true)
                .createInitializationOptions();

        PeerConnectionFactory.initialize(initOptions);

        PeerConnectionFactory.Options options = new PeerConnectionFactory.Options();

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(options)
            .createPeerConnectionFactory();

        Log.d(TAG, "✅ PeerConnectionFactory initialized");
    }

    public void startCall(String callId, String userId, boolean isInitiator) {
        this.isInitiator = isInitiator;

        FirebaseDatabase database = FirebaseDatabase.getInstance("https://scan2reach-new-default-rtdb.firebaseio.com");
        callRef = database.getReference("webrtc_calls").child(callId);
com.google.firebase.auth.FirebaseAuth.getInstance().signInAnonymously();
        Log.d(TAG, "🎯 Starting call - ID: " + callId + ", Role: " + (isInitiator ? "CALLER" : "RECEIVER"));

        // ✅ FIX 2: Set audio mode to communication BEFORE creating peer connection
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
        }

        createPeerConnection();
        createAudioTrack();

        if (isInitiator) {
            createOffer();
        } else {
            // ✅ FIX 3: Listen for offer first — ICE candidates are listened AFTER remote desc is set
            listenForOffer();
        }
    }

    private void createPeerConnection() {
        List<PeerConnection.IceServer> iceServers = new ArrayList<>();
        iceServers.add(PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer());
        iceServers.add(PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer());

        PeerConnection.RTCConfiguration rtcConfig = new PeerConnection.RTCConfiguration(iceServers);
        rtcConfig.tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED;
        rtcConfig.bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE;
        rtcConfig.rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE;
        rtcConfig.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY;

        peerConnection = peerConnectionFactory.createPeerConnection(rtcConfig, new PeerConnectionObserver());
        Log.d(TAG, "✅ PeerConnection created");
    }

    private void createAudioTrack() {
        MediaConstraints audioConstraints = new MediaConstraints();
        audioConstraints.mandatory.add(new MediaConstraints.KeyValuePair("googEchoCancellation", "true"));
        audioConstraints.mandatory.add(new MediaConstraints.KeyValuePair("googNoiseSuppression", "true"));
        audioConstraints.mandatory.add(new MediaConstraints.KeyValuePair("googAutoGainControl", "true"));

        audioSource = peerConnectionFactory.createAudioSource(audioConstraints);
        localAudioTrack = peerConnectionFactory.createAudioTrack("local_audio_" + (isInitiator ? "caller" : "receiver"), audioSource);

        MediaStream mediaStream = peerConnectionFactory.createLocalMediaStream("local_stream");
        mediaStream.addTrack(localAudioTrack);

        peerConnection.addStream(mediaStream);
        Log.d(TAG, "🎤 Audio track created and added");
    }

    // ─── CALLER SIDE (App initiates, not used in your current flow) ───────────

    private void createOffer() {
        MediaConstraints sdpConstraints = new MediaConstraints();
        sdpConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));

        peerConnection.createOffer(new SdpObserver() {
            @Override
            public void onCreateSuccess(SessionDescription sessionDescription) {
                peerConnection.setLocalDescription(new SdpObserver() {
                    @Override
                    public void onSetSuccess() {
                        Log.d(TAG, "✅ Local description set (Offer)");
                        sendOfferToFirebase(sessionDescription);
                    }
                    @Override public void onCreateSuccess(SessionDescription sd) {}
                    @Override public void onSetFailure(String s) { Log.e(TAG, "❌ setLocalDescription failed: " + s); }
                    @Override public void onCreateFailure(String s) {}
                }, sessionDescription);
            }
            @Override public void onSetSuccess() {}
            @Override public void onCreateFailure(String s) {
                Log.e(TAG, "❌ createOffer failed: " + s);
                if (listener != null) listener.onError("Failed to create offer");
            }
            @Override public void onSetFailure(String s) {}
        }, sdpConstraints);
    }

    private void sendOfferToFirebase(SessionDescription sdp) {
        Map<String, Object> offerData = new HashMap<>();
        offerData.put("type", sdp.type.canonicalForm());
        offerData.put("sdp", sdp.description);

        callRef.child("offer").setValue(offerData)
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ Offer sent to Firebase");
                listenForAnswer();
                // ✅ Start listening for ICE candidates after offer is sent
                listenForIceCandidates();
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Failed to send offer", e);
                if (listener != null) listener.onError("Failed to send offer");
            });
    }

    // ─── RECEIVER SIDE (App receives call from website) ───────────────────────

    private void listenForOffer() {
        Log.d(TAG, "👂 Listening for offer from website caller...");

        callRef.child("offer").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    String type = snapshot.child("type").getValue(String.class);
                    String sdp = snapshot.child("sdp").getValue(String.class);

                    if (type != null && sdp != null) {
                        Log.d(TAG, "📥 Offer received from Firebase");

                        SessionDescription remoteSdp = new SessionDescription(
                            SessionDescription.Type.fromCanonicalForm(type), sdp
                        );

                        peerConnection.setRemoteDescription(new SdpObserver() {
                            @Override
                            public void onSetSuccess() {
                                Log.d(TAG, "✅ Remote description set (Offer)");
                                // ✅ FIX 4: Mark remote desc ready, flush pending ICE candidates
                                remoteDescriptionSet = true;
                                drainPendingIceCandidates();
                                createAnswer();
                                // ✅ FIX 5: Start listening for ICE candidates AFTER remote desc is set
                                listenForIceCandidates();
                            }
                            @Override public void onCreateSuccess(SessionDescription sd) {}
                            @Override public void onSetFailure(String s) { Log.e(TAG, "❌ setRemoteDescription failed: " + s); }
                            @Override public void onCreateFailure(String s) {}
                        }, remoteSdp);
                    }
                }
            }
            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "❌ Failed to listen for offer", error.toException());
            }
        });
    }

    private void createAnswer() {
        MediaConstraints sdpConstraints = new MediaConstraints();
        sdpConstraints.mandatory.add(new MediaConstraints.KeyValuePair("OfferToReceiveAudio", "true"));

        peerConnection.createAnswer(new SdpObserver() {
            @Override
            public void onCreateSuccess(SessionDescription sessionDescription) {
                peerConnection.setLocalDescription(new SdpObserver() {
                    @Override
                    public void onSetSuccess() {
                        Log.d(TAG, "✅ Local description set (Answer)");
                        sendAnswerToFirebase(sessionDescription);
                    }
                    @Override public void onCreateSuccess(SessionDescription sd) {}
                    @Override public void onSetFailure(String s) { Log.e(TAG, "❌ setLocalDescription (answer) failed: " + s); }
                    @Override public void onCreateFailure(String s) {}
                }, sessionDescription);
            }
            @Override public void onSetSuccess() {}
            @Override public void onCreateFailure(String s) { Log.e(TAG, "❌ createAnswer failed: " + s); }
            @Override public void onSetFailure(String s) {}
        }, sdpConstraints);
    }

    private void sendAnswerToFirebase(SessionDescription sdp) {
        Map<String, Object> answerData = new HashMap<>();
        answerData.put("type", sdp.type.canonicalForm());
        answerData.put("sdp", sdp.description);

        callRef.child("answer").setValue(answerData)
            .addOnSuccessListener(aVoid -> Log.d(TAG, "✅ Answer sent to Firebase"))
            .addOnFailureListener(e -> Log.e(TAG, "❌ Failed to send answer", e));
    }

    private void listenForAnswer() {
        callRef.child("answer").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    String type = snapshot.child("type").getValue(String.class);
                    String sdp = snapshot.child("sdp").getValue(String.class);

                    if (type != null && sdp != null) {
                        Log.d(TAG, "📥 Answer received");
                        SessionDescription remoteSdp = new SessionDescription(
                            SessionDescription.Type.fromCanonicalForm(type), sdp
                        );
                        peerConnection.setRemoteDescription(new SdpObserver() {
                            @Override
                            public void onSetSuccess() {
                                Log.d(TAG, "✅ Remote description set (Answer)");
                                remoteDescriptionSet = true;
                                drainPendingIceCandidates();
                            }
                            @Override public void onCreateSuccess(SessionDescription sd) {}
                            @Override public void onSetFailure(String s) { Log.e(TAG, "❌ setRemoteDescription (answer) failed: " + s); }
                            @Override public void onCreateFailure(String s) {}
                        }, remoteSdp);
                    }
                }
            }
            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "❌ Failed to listen for answer", error.toException());
            }
        });
    }

    // ─── ICE CANDIDATES ───────────────────────────────────────────────────────

    private void listenForIceCandidates() {
        // Receiver reads caller_candidates (sent by website), Caller reads receiver_candidates
        String remoteCandidatesPath = isInitiator ? "receiver_candidates" : "caller_candidates";
        Log.d(TAG, "👂 Listening for ICE candidates at: " + remoteCandidatesPath);

        callRef.child(remoteCandidatesPath).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                for (DataSnapshot candidateSnapshot : snapshot.getChildren()) {
                    String sdpMid = candidateSnapshot.child("sdpMid").getValue(String.class);
                    Integer sdpMLineIndex = candidateSnapshot.child("sdpMLineIndex").getValue(Integer.class);
                    String sdp = candidateSnapshot.child("candidate").getValue(String.class);

                    if (sdpMid != null && sdpMLineIndex != null && sdp != null) {
                        IceCandidate candidate = new IceCandidate(sdpMid, sdpMLineIndex, sdp);

                        // ✅ FIX 6: Queue if remote description not yet set
                        if (remoteDescriptionSet && peerConnection != null) {
                            peerConnection.addIceCandidate(candidate);
                            Log.d(TAG, "➕ Added remote ICE candidate immediately");
                        } else {
                            pendingIceCandidates.add(candidate);
                            Log.d(TAG, "📦 Queued ICE candidate (waiting for remote desc)");
                        }
                    }
                }
            }
            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "❌ Failed to listen for ICE candidates", error.toException());
            }
        });
    }

    // ✅ FIX 7: Drain queued ICE candidates once remote description is ready
    private void drainPendingIceCandidates() {
        if (peerConnection == null) return;
        Log.d(TAG, "🚿 Draining " + pendingIceCandidates.size() + " pending ICE candidates");
        for (IceCandidate candidate : pendingIceCandidates) {
            peerConnection.addIceCandidate(candidate);
        }
        pendingIceCandidates.clear();
    }

    // ─── CONTROLS ─────────────────────────────────────────────────────────────

    public void toggleMute(boolean mute) {
        if (localAudioTrack != null) {
            localAudioTrack.setEnabled(!mute);
            Log.d(TAG, mute ? "🔇 Muted" : "🔊 Unmuted");
        }
    }

    public void endCall() {
        if (peerConnection != null) {
            peerConnection.close();
            peerConnection = null;
        }
        if (audioSource != null) {
            audioSource.dispose();
            audioSource = null;
        }
        if (localAudioTrack != null) {
            localAudioTrack.dispose();
            localAudioTrack = null;
        }
        

        // Restore audio mode
        try {
            AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                audioManager.setMode(AudioManager.MODE_NORMAL);
            }
        } catch (Exception ignored) {}

        Log.d(TAG, "📞 Call ended - WebRTC cleaned up");
    }

    public void dispose() {
        endCall();
        if (peerConnectionFactory != null) {
            peerConnectionFactory.dispose();
            peerConnectionFactory = null;
        }
    }

    // ─── PEER CONNECTION OBSERVER ─────────────────────────────────────────────

    private class PeerConnectionObserver implements PeerConnection.Observer {

        @Override
        public void onIceCandidate(IceCandidate iceCandidate) {
            // App sends its ICE candidates to Firebase
            String candidatesPath = isInitiator ? "caller_candidates" : "receiver_candidates";

            Map<String, Object> candidateData = new HashMap<>();
            candidateData.put("sdpMid", iceCandidate.sdpMid);
            candidateData.put("sdpMLineIndex", iceCandidate.sdpMLineIndex);
            candidateData.put("candidate", iceCandidate.sdp);

            if (callRef != null) {
                callRef.child(candidatesPath).push().setValue(candidateData);
                Log.d(TAG, "📤 Sent ICE candidate to: " + candidatesPath);
            }
        }

        @Override
        public void onIceConnectionChange(PeerConnection.IceConnectionState state) {
            Log.d(TAG, "🔗 ICE Connection State: " + state);

            if (state == PeerConnection.IceConnectionState.CONNECTED ||
                state == PeerConnection.IceConnectionState.COMPLETED) {
                if (listener != null) listener.onConnected();
            } else if (state == PeerConnection.IceConnectionState.DISCONNECTED ||
                       state == PeerConnection.IceConnectionState.FAILED) {
                if (listener != null) listener.onDisconnected();
            }
        }

        @Override
        public void onAddStream(MediaStream mediaStream) {
            // ✅ FIX 8: Actually render the remote audio track
            Log.d(TAG, "➕ Remote stream added with " + mediaStream.audioTracks.size() + " audio track(s)");
            if (!mediaStream.audioTracks.isEmpty()) {
                AudioTrack remoteAudioTrack = mediaStream.audioTracks.get(0);
                remoteAudioTrack.setEnabled(true);
                Log.d(TAG, "🔊 Remote audio track enabled");
            }
        }

        @Override public void onIceConnectionReceivingChange(boolean receiving) {}
        @Override public void onSignalingChange(PeerConnection.SignalingState state) { Log.d(TAG, "📡 Signaling: " + state); }
        @Override public void onIceGatheringChange(PeerConnection.IceGatheringState state) { Log.d(TAG, "🧊 ICE Gathering: " + state); }
        @Override public void onRemoveStream(MediaStream mediaStream) {}
        @Override public void onDataChannel(DataChannel dataChannel) {}
        @Override public void onRenegotiationNeeded() {}
        @Override public void onAddTrack(RtpReceiver receiver, MediaStream[] mediaStreams) {
            Log.d(TAG, "➕ Track added via onAddTrack");
        }
        @Override public void onIceCandidatesRemoved(IceCandidate[] candidates) {}
    }
}
