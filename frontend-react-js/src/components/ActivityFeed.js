import './ActivityFeed.css';
import ActivityItem from './ActivityItem';
import EditProfileButton from './EditProfileButton';

export default function ActivityFeed({ profilePage, title, handle, bio, activities, setReplyActivity, setPopped }) {
  return (
    <div className="activity_feed">
      <div className="activity_feed_heading">
        {
          profilePage &&
          <div className="profile-container">
            <div>
              <div className="cruds_count">
                {activities.length} CRUDs
              </div>
              <div className="avatar">
                <img src="https://assets.app.denisgulev.com/avatars/avatar1.png" />
              </div>
              <div className="info">
                <div className="title">
                  {title}
                </div>
                <div className="handle">
                  @{handle}
                </div>
              </div>
              <div className="bio">
                {bio}
              </div>
            </div>
            <EditProfileButton setPopped={setPopped} />
          </div>
        }
        {
          !profilePage &&
          <div className="title">
            {title}
          </div>
        }
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