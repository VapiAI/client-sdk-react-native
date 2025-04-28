import type { OpenAI } from 'openai';
import EventEmitter from 'events';
import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObjectAppMessage,
  DailyEventObjectRemoteParticipantsAudioLevel,
  DailyEventObjectTrack,
  DailyTrackState,
  MediaDeviceInfo,
} from '@daily-co/react-native-daily-js';

import { Call, CreateAssistantDTO, CreateSquadDTO, AssistantOverrides } from './api';
import { apiClient } from './apiClient';

export interface AddMessageMessage {
  type: 'add-message';
  message: OpenAI.ChatCompletionMessageParam;
}

export interface ControlMessages {
  type: 'control';
  control: 'mute-assistant' | 'unmute-assistant';
}

type VapiClientToServerMessage = AddMessageMessage | ControlMessages;

type VapiEventNames =
  | 'call-end'
  | 'call-start'
  | 'volume-level'
  | 'speech-start'
  | 'speech-end'
  | 'message'
  | 'error';

type VapiEventListeners = {
  'call-end': () => void;
  'call-start': () => void;
  'volume-level': (volume: number) => void;
  'speech-start': () => void;
  'speech-end': () => void;
  playable: (track: DailyTrackState) => void;
  message: (message: any) => void;
  error: (error: any) => void;
};

class VapiEventEmitter extends EventEmitter {
  on<E extends VapiEventNames>(event: E, listener: VapiEventListeners[E]): this {
    super.on(event, listener);
    return this;
  }
  once<E extends VapiEventNames>(event: E, listener: VapiEventListeners[E]): this {
    super.once(event, listener);
    return this;
  }
  emit<E extends VapiEventNames>(event: E, ...args: Parameters<VapiEventListeners[E]>): boolean {
    return super.emit(event, ...args);
  }
  removeListener<E extends VapiEventNames>(event: E, listener: VapiEventListeners[E]): this {
    super.removeListener(event, listener);
    return this;
  }
  removeAllListeners(event?: VapiEventNames): this {
    super.removeAllListeners(event);
    return this;
  }
}

export default class Vapi extends VapiEventEmitter {
  private started: boolean = false;
  private call: DailyCall | null = null;
  private cameraDeviceValue: string | null = null;
  private cameraDeviceItems: any[] = [];
  private audioDeviceValue: string | null = null;
  private audioDevicesItems: any[] = [];
  private speakingTimeout: NodeJS.Timeout | null = null;
  constructor(apiToken: string, apiBaseUrl?: string) {
    super();
    apiClient.baseUrl = apiBaseUrl ?? 'https://api.vapi.ai';
    apiClient.setSecurityData(apiToken);
  }

  private async cleanup() {
    if (!this.call) return;
    this.removeEventListeners();
    this.started = false;
    await this.call.destroy();
    this.call = null;
    this.speakingTimeout = null;
    this.emit('call-end');
  }

  private onAppMessage(e?: DailyEventObjectAppMessage) {
    if (!e) {
      return;
    }
    try {
      if (e.data === 'listening') {
        return this.emit('call-start');
      } else {
        try {
          const parsedMessage = JSON.parse(e.data);
          this.emit('message', parsedMessage);
        } catch (parseError) {
          console.log('Error parsing message data: ', parseError);
        }
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  private onJoinedMeeting() {
    this.call?.enumerateDevices().then(({ devices }: any) => {
      this.updateAvailableDevices(devices);
      this.emit('call-start');
    });
  }

  private onTrackStarted(e: DailyEventObjectTrack | undefined) {
    if (
      !e ||
      !e.participant ||
      e.participant?.local ||
      e.track.kind !== 'audio' ||
      e?.participant?.user_name !== 'Vapi Speaker'
    ) {
      return;
    }
    this.call?.sendAppMessage('playable');
  }

  private async refreshSelectedDevice() {
    const devicesInUse = await this.call?.getInputDevices();

    const cameraDevice = devicesInUse?.camera as MediaDeviceInfo;
    if (devicesInUse && cameraDevice?.deviceId) {
      try {
        this.cameraDeviceValue = cameraDevice.deviceId;
        this.call?.setCamera(this.cameraDeviceValue);
      } catch (error) {
        console.error('error setting camera device', error);
      }
    }

    const speakerDevice = devicesInUse?.speaker as MediaDeviceInfo;
    if (devicesInUse && speakerDevice?.deviceId) {
      try {
        this.audioDeviceValue = speakerDevice.deviceId;
        await this.call?.setAudioDevice(this.audioDeviceValue);
      } catch (error) {
        console.error('error setting audio device', error);
      }
    }
  }

  private updateAvailableDevices(devices: MediaDeviceInfo[] | undefined) {
    const inputDevices = devices
      ?.filter((device) => device.kind === 'videoinput')
      .map((device) => {
        return {
          value: device.deviceId,
          label: device.label,
          originalValue: device,
        };
      });
    this.cameraDeviceItems = inputDevices || [];

    const outputDevices = devices
      ?.filter((device) => device.kind === 'audio')
      .map((device) => {
        return {
          value: device.deviceId,
          label: device.label,
          originalValue: device,
        };
      });
    this.audioDevicesItems = outputDevices || [];
    this.refreshSelectedDevice();
  }

  private initEventListeners() {
    if (!this.call) return;

    this.call.on('available-devices-updated', (e) => {
      this.updateAvailableDevices(e?.availableDevices);
    });
    this.call.on('app-message', (e) => {
      this.onAppMessage(e);
    });
    this.call.on('track-started', (e) => {
      this.onTrackStarted(e);
    });
    this.call.on('participant-left', (e) => {
      this.cleanup();
    });
    this.call.on('left-meeting', (e) => {
      this.cleanup();
    });
    this.call.on('error', (e) => {
      this.emit('error', e);
      this.cleanup();
    });
    this.call.on('joined-meeting', (e) => {
      this.onJoinedMeeting();
    });
    this.call.on('left-meeting', (e) => {
      this.cleanup();
    });
  }

  private removeEventListeners() {
    if (!this.call) return;
    const events: DailyEvent[] = [
      'available-devices-updated',
      'app-message',
      'track-started',
      'participant-left',
      'joined-meeting',
      'left-meeting',
      'error',
    ];
    for (const event of events) {
      this.call.off(event, (e: any) => console.log('Off ', e));
    }
  }

  async start(
    assistant?: CreateAssistantDTO | string,
    assistantOverrides?: AssistantOverrides,
    squad?: CreateSquadDTO | string,
  ): Promise<Call | null> {
    if (!assistant && !squad) {
      throw new Error('Assistant or assistants must be provided.');
    }

    if (this.started) {
      return null;
    }
    this.started = true;

    const webCall = (
      await apiClient.call.callControllerCreateWebCall({
        assistant: typeof assistant === 'string' ? undefined : assistant,
        assistantId: typeof assistant === 'string' ? assistant : undefined,
        assistantOverrides,
        squad: typeof squad === 'string' ? undefined : squad,
        squadId: typeof squad === 'string' ? squad : undefined,
      })
    ).data;
    // @ts-ignore this exists in the response
    const roomUrl = webCall.webCallUrl;

    if (!roomUrl) {
      throw new Error('webCallUrl is not available');
    }

    try {
      this.call = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
      });
      this.call.startRemoteParticipantsAudioLevelObserver(100);

      this.call.on('remote-participants-audio-level', (e) => {
        if (e) this.handleRemoteParticipantsAudioLevel(e);
      });

      this.initEventListeners();

      await this.call.join({
        url: roomUrl
      });
      return webCall;
    } catch (e) {
      console.error(e);
      this.emit('error', e);
      this.cleanup();
      return null;
    }
  }

  private handleRemoteParticipantsAudioLevel(
    e: DailyEventObjectRemoteParticipantsAudioLevel,
  ) {
    const speechLevel = Object.values(e.participantsAudioLevel).reduce(
      (a, b) => a + b,
      0,
    );

    this.emit('volume-level', Math.min(1, speechLevel / 0.15));

    const isSpeaking = speechLevel > 0.01;

    if (!isSpeaking) {
      return;
    }

    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = null;
    } else {
      this.emit('speech-start');
    }

    this.speakingTimeout = setTimeout(() => {
      this.emit('speech-end');
      this.speakingTimeout = null;
    }, 1000);
  }

  stop(): void {
    this.cleanup();
  }

  send(message: VapiClientToServerMessage): void {
    this.call?.sendAppMessage(JSON.stringify(message));
  }

  setMuted(mute: boolean) {
    try {
      if (!this.call) {
        throw new Error('Call object is not available.');
      }
      this.call.setLocalAudio(!mute);
    } catch (error) {
      throw error;
    }
  }

  isMuted() {
    try {
      if (!this.call) {
        return false;
      }
      return this.call.localAudio() === false;
    } catch (error) {
      throw error;
    }
  }
}