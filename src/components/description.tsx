import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const Description = observer(() => {

    const bpstore = useStore();

    function setDescription(description: string) {
        bpstore.setDescription(description);
    }

    return (
        <div>
             <input type="text" 
            value={bpstore.description} 
            onChange={(e) => setDescription(e.target.value)}
             />       
        </div>
    )
});

export default Description;