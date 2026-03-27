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
            <input type="checkbox" id="top4" checked={bpstore.isTop4} onChange={() => bpstore.setIsTop4(!bpstore.isTop4)} disabled={!bpstore.isKata}/>
            <label htmlFor="top4">Top 4?</label>        
        </div>
    )
});

export default KataKumite;