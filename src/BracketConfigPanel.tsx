import InputParticipants from './components/InputParticipants.tsx';
import KataKumite from './components/katakumite.tsx';
import { ImportExportButtons } from './components/importExport.tsx';
import ThirdPlace from './components/thirdPlace.tsx';
import Seeded from './components/seeded.tsx';
import Description from './components/description.tsx';
import bpstore from './lib/BracketStore.ts';
import Shuffle from './components/shuffle.tsx';

export default function BracketConfigPanel() {

    return (
        <div className="bracket-config-panel">
            Bracket Config Panel
            <fieldset>
                <legend>Bracket Description</legend>
                <Description />
            </fieldset>
            <fieldset>
                <legend>Participants</legend>
                <InputParticipants />
            </fieldset>
            <fieldset>
                <legend>Options</legend>
                <KataKumite />
                <ThirdPlace />
                <Seeded />
            </fieldset>
            <Shuffle />
            <ImportExportButtons store={bpstore} />
        </div>
    )


}
