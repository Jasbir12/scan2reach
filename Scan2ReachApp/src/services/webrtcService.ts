import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from "react-native-webrtc";
import database from "@react-native-firebase/database";
import { ICE_SERVERS } from "../utils/constants";
import InCallManager from "react-native-incall-manager";

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;

  async initializeCall(callId: string, isReceiver: boolean): Promise<void> {
    this.localStream = await mediaDevices.getUserMedia({ audio: true, video: false });
    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    (this.peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        database().ref(`webrtc_calls/${callId}/${isReceiver ? "receiver" : "caller"}_candidates`).push({
          sdpMid: event.candidate.sdpMid, sdpMLineIndex: event.candidate.sdpMLineIndex, candidate: event.candidate.candidate,
        });
      }
    };

    (this.peerConnection as any).oniceconnectionstatechange = () => {
      if ((this.peerConnection as any).iceConnectionState === "connected") InCallManager.start({ media: "audio" });
    };

    if (isReceiver) await this.listenForOffer(callId);
    else await this.createOffer(callId);
    this.listenForRemoteIceCandidates(callId, isReceiver);
  }

  private async createOffer(callId: string): Promise<void> {
    const offer = await this.peerConnection!.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
    await this.peerConnection!.setLocalDescription(offer);
    await database().ref(`webrtc_calls/${callId}/offer`).set({ type: offer.type, sdp: offer.sdp });
    this.listenForAnswer(callId);
  }

  private async listenForOffer(callId: string): Promise<void> {
    database().ref(`webrtc_calls/${callId}/offer`).on("value", async (snapshot) => {
      const offer = snapshot.val();
      if (offer && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        await database().ref(`webrtc_calls/${callId}/answer`).set({ type: answer.type, sdp: answer.sdp });
      }
    });
  }

  private async listenForAnswer(callId: string): Promise<void> {
    database().ref(`webrtc_calls/${callId}/answer`).on("value", async (snapshot) => {
      const answer = snapshot.val();
      if (answer && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
  }

  private listenForRemoteIceCandidates(callId: string, isReceiver: boolean): void {
    database().ref(`webrtc_calls/${callId}/${isReceiver ? "caller" : "receiver"}_candidates`).on("child_added", (snapshot) => {
      const data = snapshot.val();
      if (this.peerConnection && data) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate({ sdpMid: data.sdpMid, sdpMLineIndex: data.sdpMLineIndex, candidate: data.candidate }));
      }
    });
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const track = this.localStream.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; return !track.enabled; }
    return false;
  }

  setSpeaker(enabled: boolean): void { InCallManager.setForceSpeakerphoneOn(enabled); }

  async endCall(callId: string): Promise<void> {
    if (this.peerConnection) { this.peerConnection.close(); this.peerConnection = null; }
    if (this.localStream) { this.localStream.getTracks().forEach((t) => t.stop()); this.localStream = null; }
    InCallManager.stop();
    await database().ref(`webrtc_calls/${callId}`).remove();
  }

  cleanup(): void {
    if (this.peerConnection) { this.peerConnection.close(); this.peerConnection = null; }
    if (this.localStream) { this.localStream.getTracks().forEach((t) => t.stop()); this.localStream = null; }
    InCallManager.stop();
  }
}

export default new WebRTCService();
