import InputParticipants from './components/InputParticipants.tsx';
import KataKumite from './components/katakumite.tsx';
import ThirdPlace from './components/thirdPlace.tsx';

export default function BracketConfigPanel() {

    return (
        <div className="bracket-config-panel">
            Bracket Config Panel
            <InputParticipants />
            <KataKumite />
            <ThirdPlace />
        </div>
    )


}
