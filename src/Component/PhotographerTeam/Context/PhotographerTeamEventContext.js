import { createContext, useState } from "react";

export const PhotographerTeamEventContext = createContext();

const PhotographerTeamEventContextProvider = ({ children }) => {
  const [photographerteamevent, setPhotographerTeamEvent] = useState(null);
  const [notification, setNotification] = useState([])


  return (
    <PhotographerTeamEventContext.Provider
      value={{ photographerteamevent, setPhotographerTeamEvent, notification, setNotification }}
    >
      {children}
    </PhotographerTeamEventContext.Provider>
  );
};

export default PhotographerTeamEventContextProvider;
