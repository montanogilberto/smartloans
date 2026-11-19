import React from 'react';
import { Redirect, Route, RouteProps, RouteComponentProps } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

interface PrivateRouteProps extends Omit<RouteProps, 'component' | 'render'> {
  component: React.ComponentType<RouteComponentProps<any>>;
}

/** Signed-in only; anyone else goes to /login. */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated } = useUser();
  return (
    <Route
      {...rest}
      render={props => (isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />)}
    />
  );
};

export default PrivateRoute;
