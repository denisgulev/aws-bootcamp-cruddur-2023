import './UserFeedPage.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams } from 'react-router-dom';
import DesktopNavigation from '../components/DesktopNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import ActivityFeed from '../components/ActivityFeed';
import ActivityForm from '../components/ActivityForm';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
import { useHomeFeed } from '../hooks/useHomeFeed';

export default function UserFeedPage() {
  const dataFetchedRef = useRef(false);
  const { handle } = useParams();
  const title = `@${handle}`;

  console.log("title", title)

  // Use the useAuth hook to get the authenticated user
  const { user } = useAuth(); // Assuming useAuth provides the current authenticated user
  const { popped, setPopped, activities, setActivities } = useHomeFeed();

  return (
    <article>
      <DesktopNavigation user={user} active={'profile'} setPopped={setPopped} />
      <div className='content'>
        <ActivityForm popped={popped} setActivities={setActivities} />
        <ActivityFeed title={title} activities={activities} />
      </div>
      <DesktopSidebar user={user} />
    </article>
  );
}