import './ActivityFeed.css';
import ActivityItem from './ActivityItem';

export default function ActivityFeed({ title, activities, setReplyActivity, setPopped }) {
  return (
    <div className="activity_feed">
      <div className="activity_feed_heading">
        <div className="title">{title}</div>
      </div>
      <div className="activity_feed_collection">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.uuid}
            activity={activity}
            setReplyActivity={setReplyActivity}
            setPopped={setPopped}
          />
        ))}
      </div>
    </div>
  );
}