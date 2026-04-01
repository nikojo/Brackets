import type { ChangeEvent } from 'react';
import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const KataKumite = observer(() => {

    const bpstore = useStore();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        bpstore.setIsKata(event.target.value === 'Kata');
    };

    const handleTop4Change = (event: ChangeEvent<HTMLInputElement>) => {
        bpstore.setIsTop4(event.target.value === 'Top 4');
    }

    function toggleHasThirdPlaceMatch() {
        bpstore.setHasThirdPlaceMatch(!bpstore.hasThirddPlaceMatch);
    }

    return (
        <div>
            {['Kata', 'Kumite'].map(kk => (
                <label key={kk}>
                    <input
                        type="radio"
                        name="kk" // Grouping
                        value={kk}
                        checked={bpstore.isKata ? 'Kata' === kk : 'Kumite' === kk} // Controlled
                        onChange={handleChange}
                    />
                    {kk}
                </label>
            ))}
            <br />
            <div style={{ marginLeft: '20px' }}>
                {['Top 4', 'Top 8'].map(top => (
                    <label key={top}>
                        <input
                            type="radio"
                            name="top" // Grouping
                            value={top}
                            checked={bpstore.isKata ? (bpstore.isTop4 ? 'Top 4' === top : 'Top 8' === top) : false} // Controlled
                            onChange={handleTop4Change}
                            disabled={!bpstore.isKata} // Disable if not Kata
                        />
                        {top}
                    </label>
                ))}
                <br />
                <input type="checkbox" id="thirdPlace" checked={bpstore.hasThirddPlaceMatch} onChange={toggleHasThirdPlaceMatch} disabled={bpstore.isKata} />
                <label htmlFor="thirdPlace">Third Place Match?</label>     
            </div>
        </div>
    )
});

export default KataKumite;