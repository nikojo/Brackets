//import { useState } from 'react';
import { useStore } from '../lib/BracketStore.ts';

export default function KataKumite() {

    const bpstore = useStore();

    function toggleKataKumite() {
        bpstore.setIsKata(!bpstore.isKata);
    }

    return (
        <div>
            <input type="checkbox" id="kataKumite" defaultChecked={bpstore.isKata} onChange={toggleKataKumite}/>
            <label htmlFor="kataKumite">Kata?</label>            
        </div>
    )
}