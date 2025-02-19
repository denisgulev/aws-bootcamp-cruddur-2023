import './ActivityItem.css';

import { useNavigate } from "react-router-dom";

import ActivityContent from '../components/ActivityContent';
import ActivityActionReply from '../components/ActivityActionReply';
import ActivityActionRepost from '../components/ActivityActionRepost';
import ActivityActionLike from '../components/ActivityActionLike';
import ActivityActionShare from '../components/ActivityActionShare';

export default function ActivityItem({ expanded, activity, setReplyActivity, setPopped }) {
  const navigate = useNavigate()

  const click = (event) => {
    event.preventDefault()
    const url = `/@${activity.handle}/status/${activity.uuid}`
    navigate(url)
    return false;
  }


  const attrs = {}
  attrs.className = 'activity_item clickable'
  attrs.onClick = click

  return (
    <div {...attrs}>
      <div className="activity_main">
        <ActivityContent activity={activity} />
        <div className="activity_actions">
          <ActivityActionReply
            setReplyActivity={setReplyActivity}
            activity={activity}
            setPopped={setPopped}
            activity_uuid={activity.uuid}
            count={activity.replies_count}
          />
          <ActivityActionRepost activity_uuid={activity.uuid} count={activity.reposts_count} />
          <ActivityActionLike activity_uuid={activity.uuid} count={activity.likes_count} />
          <ActivityActionShare activity_uuid={activity.uuid} />
        </div>
      </div>
    </div>
  );
}