import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const Shuffle = observer(() => {

    const bpstore = useStore();
    function shuffleParticipants() {
        bpstore.shuffleParticipants();
    }

    return (
        <div>
             <button onClick={shuffleParticipants} >Shuffle Participants</button>
        </div>
    )
});

export default Shuffle;