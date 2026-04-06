import InputParticipants from './components/InputParticipants.tsx';
import KataKumite from './components/katakumite.tsx';
import { ImportExportButtons } from './components/importExport.tsx';
import Seeded from './components/seeded.tsx';
import Title from './components/title.tsx';
import bpstore from './lib/BracketStore.ts';
import Shuffle from './components/shuffle.tsx';
import Help from './components/help.tsx';

export default function BracketConfigPanel() {

    return (
        <div className="bracket-config-panel">
            <fieldset>
                <legend>Bracket Title</legend>
                <Title />
            </fieldset>
            <fieldset>
                <legend>Participants</legend>
                <InputParticipants />
            </fieldset>
            <fieldset>
                <legend>Options</legend>
                <KataKumite />
                <Seeded />
            </fieldset>
            <fieldset>
                <legend>Tools</legend>
                <Shuffle />
            </fieldset>
            <fieldset>
                <legend>Import/Export</legend>
                <ImportExportButtons store={bpstore} />
            </fieldset>
            <fieldset>
                <legend>Help</legend>
                <Help />
            </fieldset>
        </div>
    )


}
