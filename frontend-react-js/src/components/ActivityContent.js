import './ActivityContent.css';
import { Link } from "react-router-dom";
import { ReactComponent as BombIcon } from './svg/bomb.svg';
import { format_datetime, time_ago } from '../lib/DateTimeFormats';

export default function ActivityContent({ activity }) {
  const formatExpiresAt = (expiresAt) => format_datetime(expiresAt, 'minutes');

  const expiresAt = activity.expires_at && (
    <div className="activity-content__expires" title={activity.expires_at}>
      <BombIcon className='icon' />
      <span className='ago'>{formatExpiresAt(activity.expires_at)}</span>
    </div>
  );

  return (
    <div className='activity-content'>
      <Link className='activity-content__avatar' to={`/@${activity.handle}`} />
      <div className='activity-content__body'>
        <div className='activity-content__meta'>
          <div className='activity-content__identity'>
            <Link className='activity-content__display-name' to={`/@${activity.handle}`}>
              {activity.display_name}
            </Link>
            <Link className="activity-content__handle" to={`/@${activity.handle}`}>
              @{activity.handle}
            </Link>
          </div>
          <div className='activity-content__times'>
            <div className="activity-content__created-at" title={format_datetime(activity.created_at)}>
              <span className='ago'>{time_ago(activity.created_at)}</span>
            </div>
            {expiresAt}
          </div>
        </div>
        <div className="activity-content__message">{activity.message}</div>
      </div>
    </div>
  );
}