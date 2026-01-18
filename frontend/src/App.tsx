import './App.css'
import Home from './pages/Home'
import MeetingRoom from './pages/MeetingRoom'
import GovernanceDashboard from './pages/GovernanceDashboard'
import NotFound from './pages/NotFound'
import { Route, Switch } from "wouter";
function App() {

  return (
    <Switch>
      <Route path={""} component={Home} />
      <Route path={"/meeting"} component={MeetingRoom} />
      <Route path={"/meeting/:meetingId/dashboard"} component={GovernanceDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default App
