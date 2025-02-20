import './ActivityFeed.css';
import ActivityItem from './ActivityItem';
import EditProfileButton from './EditProfileButton';
import ProfileAvatar from './ProfileAvatar';

export default function ActivityFeed({
  profilePage,
  title,
  handle,
  bio,
  cognito_user_uuid,
  setReplyActivity,
  setPopped,
  activities
}) {
  return (
    <div className="activity-feed">
      <header className="activity-feed__header">
        {profilePage ? (
          <div className="profile-container">
            <div className="profile-header">
              <ProfileAvatar cognito_user_uuid={cognito_user_uuid} />
              <div className="info">
                <div className="title">{title}</div>
                <div className="handle">@{handle}</div>
              </div>
              <EditProfileButton setPopped={setPopped} />
            </div>
            <div className="bio-section">
              <div className="cruds-count">{activities.length} CRUDs</div>
              <div className="bio">{bio}</div>
            </div>
          </div>
        ) : (
          <div className="title">{title}</div>
        )}
      </header>

      <div className="activity-feed__collection">
        {activities.map((activity, index) => (
          <ActivityItem
            key={index}
            activity={activity}
            setReplyActivity={setReplyActivity}
            setPopped={setPopped}
          />
        ))}
      </div>
    </div>
  );
}