import 'react-native-get-random-values';
import { PipecatClient } from '@pipecat-ai/client-js';
import { RNSmallWebRTCTransport } from '@pipecat-ai/react-native-small-webrtc-transport';
import { DailyMediaManager } from '@pipecat-ai/react-native-daily-media-manager';

const BACKEND_URL = 'https://voiceagent.pradeephgk.com';

export const OFFER_ENDPOINT = `${BACKEND_URL}/api/offer`;

export function createPipecatClient(callbacks) {
  return new PipecatClient({
    transport: new RNSmallWebRTCTransport({
      mediaManager: new DailyMediaManager(),
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    }),
    enableMic: true,
    enableCam: false,
    callbacks,
  });
}
