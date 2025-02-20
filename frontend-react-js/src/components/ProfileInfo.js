import './ProfileInfo.css';
import { ReactComponent as ElipsesIcon } from './svg/elipses.svg';
import React, { useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileInfo({ user }) {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const togglePopup = () => setIsPopupVisible(prev => !prev);

  const handleSignOut = async () => {
    try {
      await signOut({ global: true });
      window.location.href = '/';
      localStorage.removeItem('access_token');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const wrapperClasses = `profile-info-wrapper ${isPopupVisible ? 'popup-visible' : ''}`;

  return (
    <div className={wrapperClasses}>
      {isPopupVisible && (
        <div className="profile-popup">
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      )}
      <div className="profile-info" onClick={togglePopup}>
        <ProfileAvatar cognito_user_uuid={user.cognito_user_uuid} />
        <div className="profile-details">
          <div className="profile-display-name">{user?.display_name || 'My Name'}</div>
          <div className="profile-username">@{user?.handle || 'handle'}</div>
        </div>
        <ElipsesIcon className="icon" />
      </div>
    </div>
  );
}