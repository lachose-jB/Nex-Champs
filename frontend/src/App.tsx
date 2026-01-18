import './App.css'
import Home from './pages/Home'
import MeetingRoom from './pages/MeetingRoom'
import GovernanceDashboard from './pages/GovernanceDashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { Route, Switch } from "wouter";

function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="">
        {() => (
          <Home />
        )}
      </Route>
      <Route path="/meeting">
        {() => (
          <MeetingRoom />
        )}
      </Route>
      <Route path="/meeting/:meetingId/dashboard">
        {() => (
          <GovernanceDashboard />
        )}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  )
}

export default App
