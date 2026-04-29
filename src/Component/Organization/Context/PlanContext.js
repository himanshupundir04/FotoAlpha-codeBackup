import { createContext, useState } from "react";

export const PlanContext = createContext();

const PlanContextProvider = ({ children }) => {
  const [plan, setPlan] = useState("");
  const [year, setYear] = useState("");
  const [planid, setPlanid] = useState("");
  const [type, setType] = useState("");
  const [pricedetail, setPriceDetail] = useState();
  const [userdetail, setUserDetail] = useState();
  const [filldetail, setFillDetail] = useState();

  return (
    <PlanContext.Provider
      value={{
        plan,
        setPlan,
        year,
        setYear,
        planid,
        setPlanid,
        type,
        setType,
        pricedetail,
        setPriceDetail,
        userdetail,
        setUserDetail,
        filldetail,
        setFillDetail,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
};

export default PlanContextProvider;
