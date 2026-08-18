import { useEffect, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { renderGroveWav } from './groveSong';

export function useGroveSong(seed: number, enabled: boolean): void {
  const player = useAudioPlayer(null, { keepAudioSessionActive: true });
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const write = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers',
          shouldPlayInBackground: false,
        });
        const file = new File(Paths.cache, `grove-song-${seed}.wav`);
        if (!file.exists) {
          file.create();
          file.write(renderGroveWav(seed));
        }
        if (!cancelled) setUri(file.uri);
      } catch {
        if (!cancelled) setUri(null);
      }
    };
    void write();
    return () => {
      cancelled = true;
    };
  }, [seed]);

  useEffect(() => {
    if (!uri) return;
    player.replace({ uri });
    player.loop = true;
    player.volume = 0.32;
  }, [player, uri]);

  useEffect(() => {
    if (!uri) return;
    if (enabled) player.play();
    else player.pause();
  }, [enabled, player, uri]);
}
