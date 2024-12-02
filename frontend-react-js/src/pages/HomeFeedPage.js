import './HomeFeedPage.css';
import React from "react";
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useAuth } from '../hooks/useAuth';
import DesktopNavigation from '../components/DesktopNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import ActivityFeed from '../components/ActivityFeed';
import ActivityForm from '../components/ActivityForm';
import ReplyForm from '../components/ReplyForm';

export default function HomeFeedPage() {
  const { activities, setActivities, replyActivity, setReplyActivity, popped, setPopped, poppedReply, setPoppedReply } = useHomeFeed();
  const { user } = useAuth();

  return (
    <article>
      <DesktopNavigation user={user} active="home" setPopped={setPopped} />
      <div className="content">
        <ActivityForm
          popped={popped}
          setPopped={setPopped}
          setActivities={setActivities}
        />
        <ReplyForm
          activity={replyActivity}
          popped={poppedReply}
          setPopped={setPoppedReply}
          setActivities={setActivities}
          activities={activities}
        />
        <ActivityFeed
          title="Home"
          setReplyActivity={setReplyActivity}
          setPopped={setPoppedReply}
          activities={activities}
        />
      </div>
      <DesktopSidebar user={user} />
    </article>
  );
}