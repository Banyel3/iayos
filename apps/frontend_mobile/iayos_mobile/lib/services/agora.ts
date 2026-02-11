/**
 * Agora Voice Calling Service
 *
 * Manages the Agora RTC engine for voice calls.
 * Provides singleton access to the engine instance and
 * handles initialization, joining/leaving channels, and audio controls.
 * 
 * ⚠️ TEMPORARILY DISABLED - Agora native module requires development build
 * TODO: Re-enable when creating production build with expo-dev-client
 */

// TEMPORARILY COMMENTED OUT - Requires native build
/*
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  IRtcEngineEventHandler,
  RtcConnection,
  ConnectionStateType,
  ConnectionChangedReasonType,
} from "react-native-agora";
*/
import { Platform, PermissionsAndroid, Alert } from "react-native";

// Temporary type stubs for development
type IRtcEngine = any;
type IRtcEngineEventHandler = any;
type ConnectionStateType = number;
type ConnectionChangedReasonType = number;
type RtcConnection = any;

const ConnectionStateType = {
  ConnectionStateConnecting: 2,
  ConnectionStateConnected: 3,
  ConnectionStateFailed: 5,
};

const ChannelProfileType = {
  ChannelProfileCommunication: 0,
};

const ClientRoleType = {
  ClientRoleBroadcaster: 1,
};

// Stub function - will not work until native build is created
const createAgoraRtcEngine = (): any => {
  console.warn('[Agora] Native module disabled - requires development build');
  
  const noop = () => {};
  const asyncNoop = async () => {};

  // Return a no-op engine stub so calls like `this.engine.initialize(...)`
  // do not crash when the native module is unavailable.
  const stubEngine: IRtcEngine = {
    // Core lifecycle
    initialize: asyncNoop,
    release: noop,

    // Event handling
    registerEventHandler: noop,
    unregisterEventHandler: noop,

    // Channel operations
    joinChannel: asyncNoop,
    leaveChannel: asyncNoop,

    // Audio controls
    muteLocalAudioStream: noop,
    enableAudio: noop,
    disableAudio: noop,
    enableLocalAudio: noop,
    setEnableSpeakerphone: noop,
    setChannelProfile: noop,
    setClientRole: noop,
    setDefaultAudioRouteToSpeakerphone: noop,
  } as any;

  return stubEngine;
};

export interface CallState {
  isInitialized: boolean;
  isInCall: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  remoteUserId: number | null;
  connectionState: "disconnected" | "connecting" | "connected" | "failed";
  callDuration: number;
}

export type CallEventHandler = {
  onUserJoined?: (uid: number) => void;
  onUserOffline?: (uid: number) => void;
  onJoinChannelSuccess?: (channel: string, uid: number) => void;
  onLeaveChannel?: () => void;
  onError?: (errorCode: number, message: string) => void;
  onConnectionStateChanged?: (
    state: ConnectionStateType,
    reason: ConnectionChangedReasonType
  ) => void;
};

class AgoraService {
  private engine: IRtcEngine | null = null;
  private eventHandler: IRtcEngineEventHandler | null = null;
  private currentChannel: string | null = null;
  private customEventHandler: CallEventHandler | null = null;

  private _state: CallState = {
    isInitialized: false,
    isInCall: false,
    isMuted: false,
    isSpeakerOn: false,
    remoteUserId: null,
    connectionState: "disconnected",
    callDuration: 0,
  };

  private callStartTime: number | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private stateListeners: Set<(state: CallState) => void> = new Set();

  get state(): CallState {
    return { ...this._state };
  }

  /**
   * Subscribe to state changes
   */
  addStateListener(listener: (state: CallState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyStateChange() {
    this.stateListeners.forEach((listener) => listener(this.state));
  }

  private updateState(partial: Partial<CallState>) {
    this._state = { ...this._state, ...partial };
    this.notifyStateChange();
  }

  /**
   * Request microphone permission (Android only)
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "iAyos needs access to your microphone for voice calls.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error("[Agora] Permission error:", err);
        return false;
      }
    }
    // iOS handles permissions via Info.plist
    return true;
  }

  /**
   * Initialize the Agora engine with App ID
   */
  async initialize(appId: string): Promise<boolean> {
    if (this._state.isInitialized && this.engine) {
      console.log("[Agora] Already initialized");
      return true;
    }

    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error("[Agora] Microphone permission denied");
        Alert.alert(
          "Permission Required",
          "Microphone permission is required for voice calls."
        );
        return false;
      }

      console.log("[Agora] Initializing engine with App ID:", appId.slice(0, 8) + "...");

      // Create engine
      this.engine = createAgoraRtcEngine();

      // Initialize with app ID
      await this.engine.initialize({
        appId: appId,
      });

      // Set up event handler
      this.setupEventHandler();

      // Configure for voice calling
      this.engine.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication
      );
      this.engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Enable audio
      this.engine.enableAudio();

      // Set default speaker to earpiece (phone mode)
      this.engine.setDefaultAudioRouteToSpeakerphone(false);

      this.updateState({ isInitialized: true });
      console.log("[Agora] ✅ Engine initialized successfully");

      return true;
    } catch (error) {
      console.error("[Agora] ❌ Initialization error:", error);
      this.updateState({ isInitialized: false });
      return false;
    }
  }

  /**
   * Set up event handlers for Agora events
   */
  private setupEventHandler() {
    if (!this.engine) return;

    this.eventHandler = {
      onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
        console.log(
          `[Agora] ✅ Joined channel: ${connection.channelId}, uid: ${connection.localUid}`
        );
        this.updateState({
          isInCall: true,
          connectionState: "connected",
        });
        this.startDurationTimer();
        this.customEventHandler?.onJoinChannelSuccess?.(
          connection.channelId || "",
          connection.localUid || 0
        );
      },

      onUserJoined: (connection: RtcConnection, remoteUid: number) => {
        console.log(`[Agora] 👤 Remote user joined: ${remoteUid}`);
        this.updateState({ remoteUserId: remoteUid });
        this.customEventHandler?.onUserJoined?.(remoteUid);
      },

      onUserOffline: (connection: RtcConnection, remoteUid: number) => {
        console.log(`[Agora] 👤 Remote user left: ${remoteUid}`);
        this.updateState({ remoteUserId: null });
        this.customEventHandler?.onUserOffline?.(remoteUid);
      },

      onLeaveChannel: (connection: RtcConnection, stats: any) => {
        console.log("[Agora] Left channel");
        this.stopDurationTimer();
        this.updateState({
          isInCall: false,
          remoteUserId: null,
          connectionState: "disconnected",
          callDuration: 0,
        });
        this.customEventHandler?.onLeaveChannel?.();
      },

      onError: (err: number, msg: string) => {
        console.error(`[Agora] ❌ Error ${err}: ${msg}`);
        this.customEventHandler?.onError?.(err, msg);
      },

      onConnectionStateChanged: (
        connection: RtcConnection,
        state: ConnectionStateType,
        reason: ConnectionChangedReasonType
      ) => {
        console.log(`[Agora] Connection state: ${state}, reason: ${reason}`);

        let connState: CallState["connectionState"] = "disconnected";
        switch (state) {
          case ConnectionStateType.ConnectionStateConnecting:
            connState = "connecting";
            break;
          case ConnectionStateType.ConnectionStateConnected:
            connState = "connected";
            break;
          case ConnectionStateType.ConnectionStateFailed:
            connState = "failed";
            break;
          default:
            connState = "disconnected";
        }

        this.updateState({ connectionState: connState });
        this.customEventHandler?.onConnectionStateChanged?.(state, reason);
      },
    };

    this.engine.registerEventHandler(this.eventHandler);
  }

  /**
   * Join a voice call channel
   */
  async joinChannel(
    token: string,
    channelName: string,
    uid: number,
    eventHandler?: CallEventHandler
  ): Promise<boolean> {
    if (!this.engine || !this._state.isInitialized) {
      console.error("[Agora] Engine not initialized");
      return false;
    }

    if (this._state.isInCall) {
      console.warn("[Agora] Already in a call");
      return false;
    }

    try {
      this.customEventHandler = eventHandler || null;
      this.currentChannel = channelName;
      this.updateState({ connectionState: "connecting" });

      console.log(`[Agora] Joining channel: ${channelName} with uid: ${uid}`);

      this.engine.joinChannel(token, channelName, uid, {
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });

      return true;
    } catch (error) {
      console.error("[Agora] ❌ Join channel error:", error);
      this.updateState({ connectionState: "failed" });
      return false;
    }
  }

  /**
   * Leave the current channel
   */
  async leaveChannel(): Promise<void> {
    if (!this.engine || !this._state.isInCall) {
      console.log("[Agora] Not in a call, nothing to leave");
      return;
    }

    try {
      console.log("[Agora] Leaving channel...");
      this.engine.leaveChannel();
      this.currentChannel = null;
      this.customEventHandler = null;
    } catch (error) {
      console.error("[Agora] ❌ Leave channel error:", error);
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMute(): boolean {
    if (!this.engine || !this._state.isInCall) return false;

    const newMuteState = !this._state.isMuted;
    this.engine.muteLocalAudioStream(newMuteState);
    this.updateState({ isMuted: newMuteState });
    console.log(`[Agora] Microphone ${newMuteState ? "muted" : "unmuted"}`);
    return newMuteState;
  }

  /**
   * Toggle speaker mode
   */
  toggleSpeaker(): boolean {
    if (!this.engine || !this._state.isInCall) return false;

    const newSpeakerState = !this._state.isSpeakerOn;
    this.engine.setEnableSpeakerphone(newSpeakerState);
    this.updateState({ isSpeakerOn: newSpeakerState });
    console.log(`[Agora] Speaker ${newSpeakerState ? "on" : "off"}`);
    return newSpeakerState;
  }

  /**
   * Start call duration timer
   */
  private startDurationTimer() {
    this.callStartTime = Date.now();
    this.durationInterval = setInterval(() => {
      if (this.callStartTime) {
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.updateState({ callDuration: duration });
      }
    }, 1000);
  }

  /**
   * Stop call duration timer
   */
  private stopDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.callStartTime = null;
  }

  /**
   * Get formatted call duration
   */
  getFormattedDuration(): string {
    const seconds = this._state.callDuration;
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Release all resources
   */
  async destroy() {
    console.log("[Agora] Destroying engine...");

    this.stopDurationTimer();

    if (this._state.isInCall) {
      await this.leaveChannel();
    }

    if (this.engine && this.eventHandler) {
      this.engine.unregisterEventHandler(this.eventHandler);
    }

    if (this.engine) {
      this.engine.release();
      this.engine = null;
    }

    this.updateState({
      isInitialized: false,
      isInCall: false,
      isMuted: false,
      isSpeakerOn: false,
      remoteUserId: null,
      connectionState: "disconnected",
      callDuration: 0,
    });

    this.stateListeners.clear();
    console.log("[Agora] ✅ Engine destroyed");
  }
}

// Singleton instance
export const agoraService = new AgoraService();
