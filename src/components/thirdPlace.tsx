import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const ThirdPlace = observer(() => {

    const bpstore = useStore();

    function toggleHasThirdPlaceMatch() {
        bpstore.setHasThirdPlaceMatch(!bpstore.hasThirddPlaceMatch);
    }

    return (
        <div>
            <input type="checkbox" id="thirdPlace" checked={bpstore.hasThirddPlaceMatch} onChange={toggleHasThirdPlaceMatch} disabled={bpstore.isKata}/>
            <label htmlFor="thirdPlace">Third Place Match?</label>            
        </div>
    )
});

export default ThirdPlace;