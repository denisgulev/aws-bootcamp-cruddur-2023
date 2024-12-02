import './ActivityContent.css';
import { Link } from "react-router-dom";
import { DateTime } from 'luxon';
import { ReactComponent as BombIcon } from './svg/bomb.svg';

export default function ActivityContent({ activity }) {
  const formatTime = (value, type) => {
    const past = DateTime.fromISO(value);
    const now = DateTime.now();
    const diff = now.diff(past, type).toObject();

    const days = diff.days || 0;
    const hours = diff.hours || 0;
    const minutes = diff.minutes || 0;

    if (type === 'minutes' || type === 'hours') {
      return minutes < 60
        ? `${Math.round(minutes)}m ago`
        : `${Math.floor(hours)}h ago`;
    }

    if (type === 'days') {
      return days > 1 ? `${Math.floor(days)}d` : `${Math.floor(hours)}h`;
    }
  };

  const formatExpiresAt = (expiresAt) => formatTime(expiresAt, 'minutes');
  const formatCreatedAt = (createdAt) => formatTime(createdAt, 'hours');

  const expiresAt = activity.expires_at && (
    <div className="expires_at" title={activity.expires_at}>
      <BombIcon className='icon' />
      <span className='ago'>{formatExpiresAt(activity.expires_at)}</span>
    </div>
  );

  return (
    <div className='activity_content_wrap'>
      <div className='activity_avatar'></div>
      <div className='activity_content'>
        <div className='activity_meta'>
          <Link className='activity_identity' to={`/@${activity.handle}`}>
            <div className='display_name'>{activity.display_name}</div>
            <div className="handle">@{activity.handle}</div>
          </Link>
          <div className='activity_times'>
            <div className="created_at" title={activity.created_at}>
              <span className='ago'>{formatCreatedAt(activity.created_at)}</span>
            </div>
            {expiresAt}
          </div>
        </div>
        <div className="message">{activity.message}</div>
      </div>
    </div>
  );
}