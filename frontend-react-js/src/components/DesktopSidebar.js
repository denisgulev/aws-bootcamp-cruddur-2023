import './DesktopSidebar.css';
import Search from '../components/Search';
import TrendingSection from '../components/TrendingsSection';
import SuggestedUsersSection from '../components/SuggestedUsersSection';
import JoinSection from '../components/JoinSection';

const TRENDING = [
  { hashtag: "100DaysOfCloud", count: 2053 },
  { hashtag: "CloudProject", count: 8253 },
  { hashtag: "AWS", count: 9053 },
  { hashtag: "FreeWillyReboot", count: 7753 }
];

const SUGGESTED_USERS = [
  { display_name: "Andrew Brown", handle: "andrewbrown" }
];

export default function DesktopSidebar({ user }) {
  return (
    <section>
      <Search />
      {user ? (
        <>
          <TrendingSection trendingList={TRENDING} />
          <SuggestedUsersSection users={SUGGESTED_USERS} />
        </>
      ) : (
        <JoinSection />
      )}
      <footer>
        <a href="#">About</a>
        <a href="#">Terms of Service</a>
        <a href="#">Privacy Policy</a>
      </footer>
    </section>
  );
}