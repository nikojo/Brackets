import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const Seeded = observer(() => {

    const bpstore = useStore();

    function toggleIsSeededMatch() {
        bpstore.setIsSeededMatch(!bpstore.isSeededMatch);
    }

    return (
        <div>
            <input type="checkbox" id="seeded" checked={bpstore.isSeededMatch} onChange={toggleIsSeededMatch}/>
            <label htmlFor="seeded">Seeded Match?</label>            
        </div>
    )
});

export default Seeded;