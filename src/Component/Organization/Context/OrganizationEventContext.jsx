import { createContext, useState } from "react";

export const OrganizationEventContext = createContext();

const OrganizationEventContextProvider = ({ children }) => {
  const [Organizationevent, setOrganizationEvent] = useState(null);
  const [joinevent, setjoinevent] = useState();
  const [photourl, setPhotourl] = useState();
  const [photoId, setPhotoId] = useState();
  const [payment, setPayment] = useState();
  const [categoryname, setCategoryname] = useState();
  const [notification, setNotification] = useState();
  const [profile, setProfile] = useState();
  return (
    <OrganizationEventContext.Provider
      value={{
        Organizationevent,
        setOrganizationEvent,
        joinevent,
        setjoinevent,
        photourl,
        setPhotourl,
        photoId,
        setPhotoId,
        payment,
        setPayment,
        categoryname,
        setCategoryname,
        notification,
        setNotification,
        profile,
        setProfile,
      }}
    >
      {children}
    </OrganizationEventContext.Provider>
  );
};

export default OrganizationEventContextProvider;
