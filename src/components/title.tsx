import { useStore } from '../lib/BracketStore.ts';
import { observer } from 'mobx-react-lite';

const Title = observer(() => {

    const bpstore = useStore();

    function setTitle(title: string) {
        bpstore.setTitle(title);
    }

    return (
        <div>
            <label htmlFor="title">Title:</label>
            <br />
            <input type="text" id="title"
            value={bpstore.title} 
            onChange={(e) => setTitle(e.target.value)}
             />       
        </div>
    )
});

export default Title;