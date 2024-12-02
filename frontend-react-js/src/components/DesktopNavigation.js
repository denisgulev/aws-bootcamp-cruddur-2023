import './DesktopNavigation.css';
import { ReactComponent as Logo } from './svg/logo.svg';
import DesktopNavigationLink from '../components/DesktopNavigationLink';
import CrudButton from '../components/CrudButton';
import ProfileInfo from '../components/ProfileInfo';

export default function DesktopNavigation({ user, active, setPopped }) {
  const renderUserLinks = () => {
    if (!user) return null;

    const handleUrl = `/@${user.handle}`;
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
          url={handleUrl}
          name="Profile"
          handle="profile"
          active={active}
        />
        <CrudButton setPopped={setPopped} />
        <ProfileInfo user={user} />
      </>
    );
  };

  return (
    <nav>
      <Logo className="logo" />
      <DesktopNavigationLink
        url="/"
        name="Home"
        handle="home"
        active={active}
      />
      {renderUserLinks()}
      <DesktopNavigationLink
        url="/#"
        name="More"
        handle="more"
        active={active}
      />
    </nav>
  );
}