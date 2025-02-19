import './ActivityContent.css';
import { Link } from "react-router-dom";
import { ReactComponent as BombIcon } from './svg/bomb.svg';
import { format_datetime, time_ago } from '../lib/DateTimeFormats';

export default function ActivityContent({ activity }) {
  const formatExpiresAt = (expiresAt) => format_datetime(expiresAt, 'minutes');
  //  const formatCreatedAt = (createdAt) => format_datetime(createdAt, 'hours');

  const expiresAt = activity.expires_at && (
    <div className="expires_at" title={activity.expires_at}>
      <BombIcon className='icon' />
      <span className='ago'>{formatExpiresAt(activity.expires_at)}</span>
    </div>
  );

  return (
    <div className='activity_content_wrap'>
      <Link className='activity_avatar' to={`/@` + activity.handle}></Link>
      <div className='activity_content'>
        <div className='activity_meta'>
          <div className='activity_identity'>
            <Link className='display_name' to={`/@${activity.handle}`}>{activity.display_name}</Link>
            <Link className="handle" to={`/@${activity.handle}`}>@{activity.handle}</Link>
          </div>
          <div className='activity_times'>
            <div className="created_at" title={format_datetime(activity.created_at)}>
              <span className='ago'>{time_ago(activity.created_at)}</span>
            </div>
            {expiresAt}
          </div>
        </div>
        <div className="message">{activity.message}</div>
      </div>
    </div>
  );
}