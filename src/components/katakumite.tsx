import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const KataKumite = observer(() => {

    const bpstore = useStore();

    function toggleKataKumite() {
        bpstore.setIsKata(!bpstore.isKata);
    }

    return (
        <div>
            <input type="checkbox" id="kataKumite" checked={bpstore.isKata} onChange={toggleKataKumite}/>
            <label htmlFor="kataKumite">Kata?</label>            
        </div>
    )
});

export default KataKumite;