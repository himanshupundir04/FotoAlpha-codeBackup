import { createContext, useState } from "react";

export const PhotographerEventContext = createContext();

const PhotographerEventContextProvider = ({ children }) => {
  const [Photographerevent, setPhotographerEvent] = useState(null);
  const [joinevent, setjoinevent] = useState();
  const [photourl, setPhotourl] = useState();
  const [photoId, setPhotoId] = useState();
  const [payment, setPayment] = useState();
  const [categoryname, setCategoryname] = useState();
  const [notification, setNotification] = useState();
  const [profile, setProfile] = useState();
  const [coinsglobal, setCoinsglobal] = useState(0);
  return (
    <PhotographerEventContext.Provider
      value={{
        Photographerevent,
        setPhotographerEvent,
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
        coinsglobal,
        setCoinsglobal,
      }}
    >
      {children}
    </PhotographerEventContext.Provider>
  );
};

export default PhotographerEventContextProvider;
