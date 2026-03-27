import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const Shuffle = observer(() => {

    const bpstore = useStore();
    function shuffleParticipants() {
        bpstore.shuffleParticipants();
    }

    return (
        <div>
             <input type="button" value="Shuffle Participants" onClick={shuffleParticipants} />
        </div>
    )
});

export default Shuffle;