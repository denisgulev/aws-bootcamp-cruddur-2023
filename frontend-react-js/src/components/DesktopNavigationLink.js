import { Link } from "react-router-dom";
import { ReactComponent as HomeIcon } from './svg/home.svg';
import { ReactComponent as NotificationsIcon } from './svg/notifications.svg';
import { ReactComponent as ProfileIcon } from './svg/profile.svg';
import { ReactComponent as MoreIcon } from './svg/more.svg';
import { ReactComponent as MessagesIcon } from './svg/messages.svg';

const iconMap = {
  home: <HomeIcon className='icon' />,
  notifications: <NotificationsIcon className='icon' />,
  profile: <ProfileIcon className='icon' />,
  more: <MoreIcon className='icon' />,
  messages: <MessagesIcon className='icon' />
};

export default function DesktopNavigationLink({ handle, active, url, name }) {
  const isActive = handle === active;

  return (
    <Link to={url} className={`primary ${isActive ? 'active' : ''}`}>
      {iconMap[handle]}
      <span>{name}</span>
    </Link>
  );
}