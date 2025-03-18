import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobsList from './components/JobsList';
import CreateJob from './components/CreateJob';
import JobDetails from './components/JobDetails';
import Navigation from './components/Navigation';
import LiveKitPage from './components/LiveKitPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<JobsList />} />
            <Route path="/create-job" element={<CreateJob />} />
            <Route path="/jobs/:id" element={<JobDetails />} />
            <Route path="/audio-conference" element={<LiveKitPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;