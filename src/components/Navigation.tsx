import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, Headphones } from 'lucide-react';
import { Button } from './ui/button';

const Navigation = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">HR Portal</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button className="bg-transparent hover:bg-gray-100 text-gray-800">Jobs</Button>
            </Link>
            <Link to="/audio-conference">
              <Button className="bg-transparent hover:bg-gray-100 text-gray-800 flex items-center space-x-2">
                <Headphones className="h-4 w-4" />
                <span>Audio Conference</span>
              </Button>
            </Link>
            <Link to="/create-job">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Job</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation