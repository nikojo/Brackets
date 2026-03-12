//import { useState } from 'react';
import { useStore } from '../lib/BracketStore.ts';

export default function ThirdPlace() {

    const bpstore = useStore();

    function toggleHasThirdPlaceMatch() {
        bpstore.setHasThirdPlaceMatch(!bpstore.hasThirddPlaceMatch);
    }

    return (
        <div>
            <input type="checkbox" id="thirdPlace" defaultChecked={bpstore.hasThirddPlaceMatch} onChange={toggleHasThirdPlaceMatch}/>
            <label htmlFor="thirdPlace">Third Place Match?</label>            
        </div>
    )
}