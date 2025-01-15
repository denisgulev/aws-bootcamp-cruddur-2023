import { useState, useEffect } from "react";
import { fetchUserAttributes, fetchAuthSession } from "aws-amplify/auth";

export async function setAccessToken() {
  const session = await fetchAuthSession({ forceRefresh: true });
  const { accessToken } = session.tokens ?? {};
  localStorage.setItem('access_token', accessToken);
}

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const attributes = await fetchUserAttributes();
        await setAccessToken();

        setUser({
          display_name: attributes.name,
          handle: attributes.preferred_username,
        });
      } catch (err) {
        console.error("Error fetching user attributes:", err);
      }
    };

    checkAuth();
  }, []);

  return { user };
}