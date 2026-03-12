import './App.css'
import BracketPanel from './BracketPanel'
import BracketConfigPanel from './BracketConfigPanel'
import { Group, Panel, Separator } from 'react-resizable-panels';

function App() {

  return (
    <>
      <Group className="app" orientation="horizontal">

        {/* Left Panel (Sidebar) */}
        <Panel className="left-sidebar" defaultSize={255} minSize={5} maxSize={350}>
          <div>
            <BracketConfigPanel />
          </div>
        </Panel>

        {/* The resize handle/separator */}
        <Separator style={{ width: '6px', background: '#ccc', cursor: 'col-resize' }} />

        {/* Main Content Panel */}
        <Panel className="main-content" minSize={50}>
            <BracketPanel />
        </Panel>

      </Group>
    </>
  )
}

export default App
