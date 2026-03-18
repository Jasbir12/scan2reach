package com.scan2reachapp.webrtc;

public class SignalingData {
    private String type; // "offer", "answer", "ice_candidate"
    private String sdp;
    private String sdpMid;
    private Integer sdpMLineIndex;
    private String candidate;
    
    public SignalingData() {}
    
    public SignalingData(String type, String sdp) {
        this.type = type;
        this.sdp = sdp;
    }
    
    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getSdp() { return sdp; }
    public void setSdp(String sdp) { this.sdp = sdp; }
    
    public String getSdpMid() { return sdpMid; }
    public void setSdpMid(String sdpMid) { this.sdpMid = sdpMid; }
    
    public Integer getSdpMLineIndex() { return sdpMLineIndex; }
    public void setSdpMLineIndex(Integer sdpMLineIndex) { this.sdpMLineIndex = sdpMLineIndex; }
    
    public String getCandidate() { return candidate; }
    public void setCandidate(String candidate) { this.candidate = candidate; }
}