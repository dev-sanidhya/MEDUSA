'use client';

import { Player } from '@remotion/player';
import { MakeupComposition } from './remotion/MakeupComposition';

const FPS = 30;
const DURATION = FPS * 8; // 8-second loop

export default function RemotionHero({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'absolute', inset: 0, ...style }}>
      <Player
        component={MakeupComposition}
        durationInFrames={DURATION}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={FPS}
        loop
        autoPlay
        controls={false}
        acknowledgeRemotionLicense
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
