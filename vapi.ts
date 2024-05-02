import type { OpenAI } from 'openai';
import EventEmitter from 'events';
import Daily, {
  DailyCall,
  DailyEvent,
  DailyEventObject,
  DailyEventObjectAppMessage,
  DailyEventObjectTrack,
  DailyTrackState,
  MediaDeviceInfo,
} from '@daily-co/react-native-daily-js';

import { Call, CreateAssistantDTO, OverrideAssistantDTO } from './api';
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
  | 'speech-start'
  | 'speech-end'
  | 'message'
  | 'error';

type VapiEventListeners = {
  'call-end': () => void;
  'call-start': () => void;
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
    this.emit('call-end');
  }

  private handleRemoteSpeech(e: any) {
    if (e?.status === 'stopped') {
      this.emit('speech-end');
    } else if (e?.status === 'started') {
      this.emit('speech-start');
    } else {
      console.log('unhandled remote speech status', e);
    }
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
          if (parsedMessage?.type === 'speech-update') {
            this.handleRemoteSpeech(parsedMessage);
          }
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

    const events: DailyEvent[] = ['joined-meeting', 'left-meeting', 'error'];
    const handleNewMeetingState = async (_event?: DailyEventObject) => {
      switch (this.call?.meetingState()) {
        case 'joined-meeting':
          return this.onJoinedMeeting();
        case 'left-meeting':
          return this.cleanup();
        case 'error':
          await this.cleanup();
          break;
      }
    };
    handleNewMeetingState();
    for (const event of events) {
      this.call.on(event, handleNewMeetingState);
    }
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
    assistant: CreateAssistantDTO | string,
    assistantOverrides?: OverrideAssistantDTO,
  ): Promise<Call | null> {
    if (this.started) {
      return null;
    }
    this.started = true;

    const webCall = (
      await apiClient.call.callControllerCreateWebCall({
        assistant: typeof assistant === 'string' ? undefined : assistant,
        assistantId: typeof assistant === 'string' ? assistant : undefined,
        assistantOverrides,
      })
    ).data;
    const roomUrl = webCall.webCallUrl;

    if (!roomUrl) {
      throw new Error('webCallUrl is not available');
    }

    try {
      this.call = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
      });
      this.initEventListeners();

      this.call?.join({
        url: roomUrl,
      });

      return webCall;
    } catch (e) {
      console.error(e);
      this.emit('error', e);
      this.cleanup();
      return null;
    }
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
