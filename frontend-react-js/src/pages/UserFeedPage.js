import './UserFeedPage.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import DesktopNavigation from '../components/DesktopNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import ActivityFeed from '../components/ActivityFeed';
import ActivityForm from '../components/ActivityForm';
import { useAuth, setAccessToken } from '../hooks/useAuth'; // Import the useAuth hook
import ProfileForm from '../components/ProfileForm';

export default function UserFeedPage() {
  const [profile, setProfile] = useState([]);
  const [activities, setActivities] = useState([]);
  const [popped, setPopped] = useState(false);
  const [poppedProfile, setPoppedProfile] = useState(false);
  const dataFetchedRef = useRef(false);
  const params = useParams();

  // Use the useAuth hook to get the authenticated user
  const { user } = useAuth();

  const loadData = async () => {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/activities/@${params.handle}`

    get(url, {
      auth: false,
      success: function (data) {
        console.log('setprofile', data.profile)
        setProfile(data.profile)
        setActivities(data.activities)
      }
    })
  };

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;
    loadData();
  }, []);

  return (
    <article>
      <DesktopNavigation user={user} active={'profile'} setPopped={setPopped} />
      <div className='content'>
        <ActivityForm popped={popped} setActivities={setActivities} />
        <ProfileForm
          profile={profile}
          setProfile={setProfile}
          popped={poppedProfile}
          setPopped={setPoppedProfile}
        />
        <ActivityFeed
          profilePage={profile != null}
          setPopped={setPoppedProfile}
          title={profile.display_name}
          handle={profile.handle}
          bio={profile.bio}
          cognito_user_uuid={profile.cognito_user_uuid}
          activities={activities}
        />
      </div>
      <DesktopSidebar user={user} />
    </article>
  );
}