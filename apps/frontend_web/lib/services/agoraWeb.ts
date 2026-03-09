"use client";

/**
 * Minimal Agora Web voice service loaded from Agora CDN script.
 * Keeps implementation dependency-free for this repo.
 */

type AgoraClient = any;
type LocalAudioTrack = any;

declare global {
  interface Window {
    AgoraRTC?: any;
  }
}

class AgoraWebService {
  private client: AgoraClient | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private remoteUsers: Set<number> = new Set();
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized && this.client) {
      return true;
    }

    const loaded = await this.ensureScriptLoaded();
    if (!loaded || !window.AgoraRTC) {
      return false;
    }

    this.client = window.AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    this.client.on("user-published", async (user: any, mediaType: string) => {
      await this.client?.subscribe(user, mediaType);
      if (mediaType === "audio" && user.audioTrack) {
        user.audioTrack.play();
        if (user.uid != null) this.remoteUsers.add(Number(user.uid));
      }
    });

    this.client.on("user-unpublished", (user: any) => {
      if (user.uid != null) this.remoteUsers.delete(Number(user.uid));
    });

    this.client.on("user-left", (user: any) => {
      if (user.uid != null) this.remoteUsers.delete(Number(user.uid));
    });

    this.initialized = true;
    return true;
  }

  async join(appId: string, channel: string, token: string, uid: number): Promise<boolean> {
    try {
      if (!(await this.initialize())) return false;
      if (!this.client) return false;

      await this.client.join(appId, channel, token, uid);
      this.localAudioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
      await this.client.publish([this.localAudioTrack]);
      return true;
    } catch (error) {
      console.error("[AgoraWeb] Join failed", error);
      return false;
    }
  }

  async leave(): Promise<void> {
    try {
      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }
      if (this.client) {
        await this.client.leave();
      }
      this.remoteUsers.clear();
    } catch (error) {
      console.error("[AgoraWeb] Leave failed", error);
    }
  }

  toggleMute(): boolean {
    if (!this.localAudioTrack) return false;
    const muted = this.localAudioTrack.muted === true;
    this.localAudioTrack.setMuted(!muted);
    return !muted;
  }

  getRemoteParticipantCount(): number {
    return this.remoteUsers.size;
  }

  private async ensureScriptLoaded(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (window.AgoraRTC) return true;

    return new Promise((resolve) => {
      const existing = document.querySelector("script[data-agora-web='1']") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.AgoraRTC)), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://download.agora.io/sdk/release/AgoraRTC_N.js";
      script.async = true;
      script.dataset.agoraWeb = "1";
      script.onload = () => resolve(Boolean(window.AgoraRTC));
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
}

export const agoraWebService = new AgoraWebService();
