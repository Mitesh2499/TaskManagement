import { useEffect, useState } from "react";
import { getUsers } from "@/api/users";
import type { User } from "@/types/user";

/**
 * The team's user list rarely changes within a session, so this fetches it once
 * and shares it — used to populate every "Assigned to" dropdown/filter.
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount, standard data-sync effect.
    setIsLoading(true);
    getUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { users, isLoading };
}
