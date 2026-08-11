import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices
} from '@daily-co/react-native-webrtc';
import { Platform, PermissionsAndroid } from 'react-native';

import InCallManager from 'react-native-incall-manager';

const BACKEND_URL = 'https://realtimeapi.pradeephgk.com';

const HEART_ONLY_INSTRUCTIONS = `
You are Prof. G, an AI NEET Biology Tutor.

CURRENT SUBJECT:
Human Heart

ROLE:
Teach the student about the human heart interactively.

ALLOWED TOPICS:
- Heart anatomy
- Chambers
- Blood vessels
- Blood circulation inside heart
- Heart wall
- Pericardium
- Left Atrium
- Right Ventricle
- Left Ventricle
- Aorta
- Pulmonary Arteries
- Pulmonary Veins
- Superior Vena Cava
- Inferior Vena Cava
- NEET questions related to the heart

BEHAVIOR:
1. Ask questions.
2. Listen to the student's answer.
3. Evaluate the answer.
4. Explain the concept.
5. Ask a follow-up question.
6. Adjust difficulty based on performance.

STRICT RESTRICTION:
Do not answer questions outside the human heart.

If the student asks an unrelated question:
"I'm Prof. G, your Heart Tutor. Let's stay focused on the human heart."

Do not provide the unrelated answer.

You are Prof. G, a male Indian NEET Biology tutor.

You are a male Indian English-speaking Human Heart Learning Assistant.

Speak in natural Indian English with a clear, friendly Indian male voice/accent.

Your ONLY purpose is to teach about the human heart.

Use simple English that is easy for Indian students to understand.
Avoid unnecessary American slang or expressions.

Your voice should be:
- Warm
- Confident
- Teacher-like
- Calm
- Energetic when explaining important concepts
- Natural and conversational

Do not sound like a news reader.
Do not speak too quickly.
Use short pauses when explaining difficult concepts.
Pronounce medical terminology clearly.

VOICE DELIVERY:
- Speak clearly and audibly.
- Use a strong, natural speaking volume.
- Do not whisper.
- Do not speak softly or quietly.
- Maintain consistent vocal energy throughout the conversation.
- Speak at a moderate pace.
- Clearly emphasize important medical terms.
- Sound like a confident classroom teacher addressing a student.
`;

export type AudioOutput =
  | 'speaker'
  | 'earpiece'
  | 'bluetooth'
  | 'auto';

export type RealtimeCallbacks = {
  onTranscript?: (text: string, isUser: boolean) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
};

export class RealtimeService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: any = null;
  private dataChannel: any = null;
  private callbacks: RealtimeCallbacks;
  private messageBuffer: string = '';
  private currentAudioOutput: AudioOutput = 'speaker';

  constructor(callbacks: RealtimeCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async connect() {
    // 1. Request mic permission
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Microphone permission denied');
      }
    }

    // Start audio routing manager
    InCallManager.start({
      media: 'audio',
    });

    // Default to speaker
    this.setSpeaker(true);

    // 2. Get temporary OpenAI credential
    const tokenResponse = await fetch(
      `${BACKEND_URL}/realtime/token?model=gpt-realtime-2.1&voice=cedar&type=realtime`
    );

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Failed to get Realtime token: ${errText}`);
    }

    const tokenData = await tokenResponse.json();

    const clientSecret =
      tokenData.client_secret?.value ||
      tokenData.client_secret;

    if (!clientSecret) {
      throw new Error('Failed to get Realtime client secret');
    }

    // 3. Create peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    } as any);

    this.peerConnection = pc;

    // 4. Get microphone
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    this.localStream = stream;

    // 5. Add microphone tracks
    stream.getTracks().forEach((track: any) => {
      pc.addTrack(track, stream);
    });

    // 6. Create data channel
    const dc = (pc as any).createDataChannel('oai-events');

    this.dataChannel = dc;

    // IMPORTANT:
    // Configure the Realtime session when the channel opens.
    dc.onopen = () => {
      console.log('[Realtime] Data channel opened');

      const sessionUpdate = {
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions: HEART_ONLY_INSTRUCTIONS,
        },
      };

      dc.send(JSON.stringify(sessionUpdate));

      console.log(
        '[Realtime] Heart-only instructions sent'
      );
    };

    // Receive Realtime events
    dc.onmessage = (event: any) => {
      try {
        const msg = JSON.parse(event.data);

        console.log(
          '[Realtime Event]',
          msg.type
        );

        this.handleRealtimeEvent(msg);
      } catch (e) {
        console.warn(
          '[Realtime] Failed to parse message:',
          event.data
        );
      }
    };

    // 7. Receive AI audio
    (pc as any).ontrack = (event: any) => {
      console.log(
        '[Realtime] Remote audio track received'
      );

      const remoteStream = event.streams?.[0];

      if (remoteStream) {
        console.log(
          '[Realtime] Remote stream active'
        );
        // Make sure speaker routing remains enabled
        if (this.currentAudioOutput === 'speaker') {
          this.setSpeaker(true);
        }
      }
    };

    // 8. Create SDP offer
    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
    } as any);

    await pc.setLocalDescription(offer);

    // 9. Send SDP to OpenAI
    const sdpResponse = await fetch(
      'https://api.openai.com/v1/realtime/calls',
      {
        method: 'POST',
        body: (offer as any).sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
      }
    );

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();

      throw new Error(
        `Realtime SDP exchange failed: ${errorText}`
      );
    }

    // 10. Set remote SDP
    const answerSdp = await sdpResponse.text();

    const answer = new RTCSessionDescription({
      type: 'answer',
      sdp: answerSdp,
    } as any);

    await pc.setRemoteDescription(answer);

    console.log(
      '[Realtime] Connected to OpenAI Realtime'
    );

    this.callbacks.onConnected?.();

    return pc;
  }

  setSpeaker(enabled: boolean) {
    try {
      InCallManager.setForceSpeakerphoneOn(
        enabled,
      );

      this.currentAudioOutput = enabled
        ? 'speaker'
        : 'earpiece';

      console.log(
        `[Audio] Speaker: ${enabled ? 'ON' : 'OFF'
        }`,
      );
    } catch (error) {
      console.error(
        '[Audio] Failed to set speaker',
        error,
      );
    }
  }

  private handleRealtimeEvent(event: any) {
    const type = event.type as string;

    switch (type) {
      // User speaking transcript (interim)
      case 'conversation.item.input_audio_transcription.delta':
        if (event.delta) {
          this.callbacks.onTranscript?.(event.delta, true);
        }
        break;

      // User speaking transcript (final)
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.callbacks.onTranscript?.(event.transcript, true);
        }
        break;

      // Bot response text delta (streaming)
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
      case 'response.output_text.delta':
      case 'response.text.delta':
        if (event.delta) {
          this.callbacks.onTranscript?.(event.delta, false);
        }
        break;

      // Bot response text final - logged for debugging; deltas handle incremental streaming UI
      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
      case 'response.output_text.done':
      case 'response.text.done':
        console.log('[Realtime] Bot transcript complete:', event.transcript || event.text);
        break;

      // Bot speaking started
      case 'response.output_audio.delta':
      case 'response.audio.delta':
        this.callbacks.onSpeakingChange?.(true);
        break;

      // Bot speaking done
      case 'response.output_audio.done':
      case 'response.audio.done':
      case 'response.done':
        this.callbacks.onSpeakingChange?.(false);
        break;

      // User started speaking (VAD detection)
      case 'input_audio_buffer.speech_started':
        this.callbacks.onSpeakingChange?.(false);
        this.callbacks.onTranscript?.('', true); // signal new user turn
        break;

      // User stopped speaking
      case 'input_audio_buffer.speech_stopped':
        break;

      // Error
      case 'error':
        const errMsg = event.error?.message || 'Unknown Realtime error';
        console.error('[Realtime] Error event:', errMsg);
        this.callbacks.onError?.(errMsg);
        break;

      default:
        break;
    }
  }

  /**
   * Mute / unmute the local microphone track
   */
  setMicEnabled(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        if (track.kind === 'audio') {
          track.enabled = enabled;
        }
      });
    }
  }

  async disconnect() {
    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch (e) { }
      this.dataChannel = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.callbacks.onDisconnected?.();
    console.log('[Realtime] Disconnected');
  }
}
