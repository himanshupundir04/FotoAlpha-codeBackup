import { createContext, useState } from "react";

export const EventContext = createContext();

const EventContextProvider = ({ children }) => {
  const [singleevent, setSingleEvent] = useState();
  const [event, setEvent] = useState();
  const [audit, setAudit] = useState();

  return (
    <EventContext.Provider
      value={{ event, setEvent, singleevent, setSingleEvent, setAudit, audit }}
    >
      {children}
    </EventContext.Provider>
  );
};

export default EventContextProvider;
