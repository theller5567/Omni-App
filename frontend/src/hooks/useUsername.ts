import { useState, useEffect } from 'react';
import axios from 'axios';

// Cache object to store usernames
const usernameCache: { [key: string]: string } = {};

interface UsernameResponse {
  username: string;
}

export const useUsername = (userId: string | undefined) => {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!userId) {
        setUsername('');
        setLoading(false);
        return;
      }

      // Check cache first
      if (usernameCache[userId]) {
        setUsername(usernameCache[userId]);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get<UsernameResponse>(`http://localhost:5002/api/user/username/${userId}`);
        const fetchedUsername = response.data.username;
        // Store in cache
        usernameCache[userId] = fetchedUsername;
        setUsername(fetchedUsername);
      } catch (error) {
        console.error('Error fetching username:', error);
        setError('Unknown user');
        setUsername('Unknown user');
      } finally {
        setLoading(false);
      }
    };

    fetchUsername();
  }, [userId]);

  return { username, loading, error };
}; 