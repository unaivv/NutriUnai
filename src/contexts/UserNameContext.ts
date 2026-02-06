import React from 'react';

interface IUserNameContext {
    name: string;
}

const defaultUserName: IUserNameContext = { name: 'Unaí' };

const UserNameContext = React.createContext<IUserNameContext>(defaultUserName);

export { UserNameContext };