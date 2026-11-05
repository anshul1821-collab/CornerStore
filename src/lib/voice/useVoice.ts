import { useEffect, useState } from "react";
import { voiceManager, type SpeakOptions, type VoiceState } from "./voiceManager";

export function useVoice() {
  const [state, setState] = useState<VoiceState>(() => voiceManager.getState());

  useEffect(() => {
    return voiceManager.subscribe(setState);
  }, []);

  return {
    ...state,
    speak: (opts: SpeakOptions) => voiceManager.speak(opts),
    stop: () => voiceManager.stop(),
    replay: () => voiceManager.replay(),
    replayLastDialogue: () => voiceManager.replayLastDialogue(),
    setEnabled: (enabled: boolean) => voiceManager.setEnabled(enabled),
    setVoiceEnabled: (enabled: boolean) => voiceManager.setVoiceEnabled(enabled),
    setVolume: (volume: number) => voiceManager.setVolume(volume),
    playDoorChime: () => voiceManager.playDoorChime(),
    playCoinChime: () => voiceManager.playCoinChime(),
    playSoundEffect: (kind: "chime" | "coin" | "success" | "oops" | "tap") =>
      voiceManager.playSoundEffect(kind),
    startAmbience: () => voiceManager.startAmbience(),
    stopAmbience: () => voiceManager.stopAmbience(),
    setAmbienceVolume: (vol: number) => voiceManager.setAmbienceVolume(vol),
  };
}
