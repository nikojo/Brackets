import InputParticipants from './components/InputParticipants.tsx';
import KataKumite from './components/katakumite.tsx';
import { SaveOpenButtons } from './components/saveOpen.tsx';
import ThirdPlace from './components/thirdPlace.tsx';
import bpstore from './lib/BracketStore.ts';

export default function BracketConfigPanel() {

    return (
        <div className="bracket-config-panel">
            Bracket Config Panel
            <InputParticipants />
            <KataKumite />
            <ThirdPlace />
            <SaveOpenButtons store={bpstore} />
        </div>
    )


}
