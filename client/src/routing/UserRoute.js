import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { buildLoginPath } from '../utils/authRedirect';

const PrivateRoute = ({ component: Component, ...rest }) => {
    const isLogin = localStorage.getItem(process.env.REACT_APP_TOKEN + "_user")

    return (
        <Route {...rest} render={props => (
            isLogin ?
                <Component {...props} />
                : <Redirect to={buildLoginPath(props.location.pathname + props.location.search)} />
        )} />
    );
};

export default PrivateRoute;
