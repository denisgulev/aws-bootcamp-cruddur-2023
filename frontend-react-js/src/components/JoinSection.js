import './JoinSection.css';
import { Link } from "react-router-dom";

export default function JoinSection() {
  return (
    <div className="join">
      <h2 className="join-title">Join The Party!</h2>
      <div className="join-content">
        <p>Have something you want to say?</p>
        <p>Don't think about it, just crud it!</p>
        <p>Regret it? No worries, we'll forget it...</p>
        <div className="join-actions">
          <Link to="/signup" className="action">
            Join Now!
          </Link>
          <Link to="/signin" className="subaction">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}