import { useHistory } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';

export function usePendingModule() {
  const history = useHistory();
  const { username, logout } = useUser();

  const signOut = () => {
    logout();
    history.replace('/login');
  };

  return { username, signOut };
}

export type PendingModuleVM = ReturnType<typeof usePendingModule>;
