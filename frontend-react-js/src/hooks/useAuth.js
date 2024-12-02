import { useState, useEffect } from "react";
import { fetchUserAttributes } from "aws-amplify/auth";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const attributes = await fetchUserAttributes();
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