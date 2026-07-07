import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const PrivateRoute = ({ component: Component, ...rest }) => {
    const isLogin = localStorage.getItem(process.env.REACT_APP_TOKEN + "_admin")

    return (
        <Route {...rest} render={props => (
            isLogin ?
                <Component {...props} />
                : <Redirect to="/admin/login" />
        )} />
    );
};

export default PrivateRoute;