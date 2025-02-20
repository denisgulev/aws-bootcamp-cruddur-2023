import './DesktopNavigation.css';
import { ReactComponent as Logo } from './svg/logo.svg';
import DesktopNavigationLink from '../components/DesktopNavigationLink';
import CrudButton from '../components/CrudButton';
import ProfileInfo from '../components/ProfileInfo';

function UserLinks({ user, active, setPopped }) {
  if (!user) return null;

  return (
    <>
      <DesktopNavigationLink
        url="/notifications"
        name="Notifications"
        handle="notifications"
        active={active}
      />
      <DesktopNavigationLink
        url="/messages"
        name="Messages"
        handle="messages"
        active={active}
      />
      <DesktopNavigationLink
        url={`/@${user.handle}`}
        name="Profile"
        handle="profile"
        active={active}
      />
      <CrudButton setPopped={setPopped} />
      <ProfileInfo user={user} />
    </>
  );
}

export default function DesktopNavigation({ user, active, setPopped }) {
  return (
    <nav className="desktop-navigation">
      <Logo className="desktop-navigation__logo" />
      <DesktopNavigationLink
        url="/"
        name="Home"
        handle="home"
        active={active}
      />
      <UserLinks
        user={user}
        active={active}
        setPopped={setPopped}
      />
      <DesktopNavigationLink
        url="/#"
        name="More"
        handle="more"
        active={active}
      />
    </nav>
  );
}