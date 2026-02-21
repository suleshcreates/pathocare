import { useState } from 'react';
import type { UserRole } from '@/types';
import { currentUser } from '@/data/mockData';

export function useRole() {
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [user] = useState(currentUser);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  return { role, user, switchRole };
}
