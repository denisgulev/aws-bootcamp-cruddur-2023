import './ActivityItem.css';

import ActivityContent from '../components/ActivityContent';
import ActivityActionReply from '../components/ActivityActionReply';
import ActivityActionRepost from '../components/ActivityActionRepost';
import ActivityActionLike from '../components/ActivityActionLike';
import ActivityActionShare from '../components/ActivityActionShare';

export default function ActivityItem({ activity, setReplyActivity, setPopped }) {
  const replies = activity.replies ? (
    <div className="replies">
      {activity.replies.map((reply) => (
        <ActivityItem
          key={reply.uuid}
          setReplyActivity={setReplyActivity}
          setPopped={setPopped}
          activity={reply}
        />
      ))}
    </div>
  ) : null;

  return (
    <div className="activity_item">
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
      {replies}
    </div>
  );
}