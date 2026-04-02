

const Help = () => {

    const openHelp = () => {
        window.open('./help/help.html', '_blank');
    }

    return (
        <div>
            <button onClick={openHelp}>?</button>
        </div>
    )
};

export default Help;