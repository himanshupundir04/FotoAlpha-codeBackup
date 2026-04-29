import { createContext, useState } from "react";

export const PortfolioEventContext = createContext();

const PortfolioEventContextProvider = ({ children }) => {
  const [portfolioevent, setPortfolioEvent] = useState(null);
  const [subId, setSubId] = useState("");
  const [notification, setNotification] = useState("");
  return (
    <PortfolioEventContext.Provider
      value={{
        portfolioevent,
        setPortfolioEvent,
        subId,
        setSubId, 
        notification,
        setNotification,
      }}
    >
      {children}
    </PortfolioEventContext.Provider>
  );
};

export default PortfolioEventContextProvider;
