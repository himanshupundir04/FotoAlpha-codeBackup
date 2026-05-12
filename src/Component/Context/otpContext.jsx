import { createContext, useState } from "react";

export const EmailContext = createContext();

const EmailContextProvider = ({ children }) => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserid] = useState("");

  return (
    <EmailContext.Provider
      value={{
        email,
        setEmail,
        role,
        setRole,
        userId,
        setUserid,
        phone,
        setPhone,
        countryCode,
        setCountryCode,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
};

export default EmailContextProvider;
