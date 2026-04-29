import React, { useContext, useEffect, useState } from "react";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import DiamondIcon from "@mui/icons-material/Diamond";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { PlanContext } from "../../Context/PlanContext";
import PaymentDetails from "./Pricing/PaymentDetails";
import { useFormik } from "formik";
import Calculateprice from "./Calculateprice";
import * as yup from "yup";

const baseURL = process.env.REACT_APP_BASE_URL;

function UpgradePlan() {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const currentUser = users.find((u) => u.isCurrent);
  // console.log(currentUser.currentSubscriptionId.plan_id)
  const token = localStorage.getItem("token");
  const { setPlan, setYear, setPlanid, setPriceDetail, setFillDetail } =
    useContext(PlanContext);
  const [annual, setAnnual] = useState([]);
  const [open, setopen] = useState(false);
  const handleClose = () => setopen(false);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paydata, setPayData] = useState([]);
  const [opend, setOpend] = useState(false);
  const handleClosed = () => setOpend(false);
  const [latestData, setLatestData] = useState(null);
  const [plans, setPlans] = useState("monthly");
  const [allplan, setAllPlan] = useState([]);

  const handleOpen = (plan, year, id, discount) => {
    setopen(true);
    setPlan(plan);
    setYear(year);
    setPlanid(id);
    setDiscount(discount);
    // console.log(plan, year, id);
  };

  const id = currentUser?._id;

  useEffect(() => {
    if (paydata.length) {
      const latestDate = new Date(
        Math.max(
          ...paydata.map((item) => new Date(item?.subscription_id?.end_date))
        )
      );
      const latestRecord = paydata.find(
        (item) =>
          new Date(item?.subscription_id?.end_date).getTime() ===
          latestDate.getTime()
      );
      setLatestData(latestRecord);
      // console.log(latestRecord);
    }
  }, [paydata]);

  const fetchPayment = async () => {
    setLoading(true);
    try {
      const respons = await axios.get(`${baseURL}/transactions/user/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setPayData(respons.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // setPlanId(currentUser.currentSubscriptionId.plan_id)

  useEffect(() => {
    fetchPlans();
    fetchPayment();
  }, []);

  const fetchPlans = () => {
    axios
      .get(`${baseURL}/mysubscriptions/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69418",
        },
      })
      .then((res) => {
        const plans = res.data.data.plans;
        setPlan(plans);
        setAllPlan(plans);
        // console.log(halfYearly);
        // console.log(res.data.data.plans.plantype);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [activeTab, setActiveTab] = useState("monthly");
  const tabs = [
    { id: "monthly", label: "Starter" },
    { id: "halfyearly", label: "Pro" },
    // { id: "annual", label: "Annually" },
    { id: "myop", label: "MYOP" },
  ];

  const cardColors = ["green", "blue", "yellow"];

  const borderColorClass = {
    green: "border-green-700",
    blue: "border-blue",
    yellow: "border-yellow-600",
  };

  const textColorClass = {
    green: "text-green-700",
    blue: "text-blue",
    yellow: "text-yellow-600",
  };

  const cardimg = [FormatListBulletedIcon, DiamondIcon, LocalPoliceIcon];

  const validationSchema = yup.object().shape({
    validityInMonths: yup.number()
        .min(1, "Month must be at least 1")
        .required("Month is required"),
      numberOfEvents: yup.number()
        .min(3, "Events must be at least 3")
        .required("Events is required"),
      uploadPhotos: yup.number()
        .min(5000, "Photos must be at least 5000")
        .required("Photos is required"),
      storageGB: yup.string()
        .required("Storage is required"), 
  });

  const formik = useFormik({
    initialValues: {
      validityInMonths: "",
      numberOfEvents: "",
      uploadPhotos: "",
      storageGB: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setFillDetail(values);
      // console.log(values);
      try {
        const response = await axios.post(
          `${baseURL}/mysubscriptions/myop/calculate-price`,
          values,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69418",
            },
          }
        );
        setLoading(false);
        setPriceDetail(response.data);
        setOpend(true);
        // console.log(response.data);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    },
  });

  const options = [
    { label: "250 GB", value: 250 },
    { label: "500 GB", value: 500 },
    { label: "1 TB", value: 1024 },
    { label: "2 TB", value: 2048 },
    { label: "3 TB", value: 3072 },
    { label: "4 TB", value: 4096 },
    { label: "5 TB", value: 5120 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "monthly":
        return (
          <>
            <div className="slider-container w-full m-auto">
              {/* <div className="mt-5 flex flex-wrap md:flex-nowrap justify-between gap-5 mb-5"> */}
              {allplan
                .filter(
                  (p) => p.planType === plans && p.planName.includes("Plus") // filter here
                )
                .map((plan, index) => {
                  const color = cardColors[index % cardColors.length];
                  return (
                    <div
                      className={`bg-white relative h-[400px] rounded-lg border p-3 group dark:bg-slate-800 m-auto md:w-1/2 ${borderColorClass[color]}`}
                      key={index}
                    >
                      <div className="flex justify-between items-center"></div>
                      <div className="flex flex-col text-start">
                        <h3
                          className={`text-2xl font-normal ${textColorClass[color]}`}
                        >
                          {plan?.planName === "Plus"
                            ? "Starter"
                            : plan?.planName}
                        </h3>
                        <span className="text-slate-500 h-12">
                          Best for solo photographers or small teams handling a
                          few events.
                        </span>
                        <div className="flex items-center gap-3 mb-3 mt-2">
                          <button
                            className={`border w-28 rounded py-1 px-2 font-medium ${
                              plans === "monthly"
                                ? "bg-blue text-white border-blue"
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                            onClick={() => {
                              setPlans("monthly");
                            }}
                          >
                            Monthly
                          </button>
                          <button
                            className={`border w-28 rounded py-1 px-2 font-medium ${
                              plans === "halfYearly"
                                ? "bg-blue text-white border-blue"
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                            onClick={() => {
                              setPlans("halfYearly");
                            }}
                          >
                            Half Yearly
                          </button>
                          <button
                            className={`border w-28 rounded py-1 px-2 font-medium ${
                              plans === "yearly"
                                ? "bg-blue text-white border-blue"
                                : "border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                            onClick={() => {
                              setPlans("yearly");
                            }}
                          >
                            Yearly
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col text-start mb-2">
                        <span className="text-3xl font-normal text-slate-700 ms-2 dark:text-slate-500">
                          ₹{plan?.price}
                          <span className="text-xs">
                            + {plan?.gstInPercent}% GST
                          </span>{" "}
                          <span className="text-slate-400 text-lg text-semibold">
                            / {plan?.planType}
                          </span>
                        </span>
                      </div>
                      <hr />
                      <div className="mt-5">
                        <div className="flex justify-between items-center">
                          <div className="flex mb-1">
                            <CheckCircleIcon
                              className="text-blue"
                              sx={{ fontSize: "20px" }}
                            />
                            <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                              Validity
                            </span>
                          </div>
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            {plan?.validity} days
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex mb-1">
                            <CheckCircleIcon
                              className="text-blue"
                              sx={{ fontSize: "20px" }}
                            />
                            <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                              Events Covered
                            </span>
                          </div>
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            {plan?.events === -1 ? "Unlimited" : plan?.events}{" "}
                            events
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex mb-1">
                            <CheckCircleIcon
                              className="text-blue"
                              sx={{ fontSize: "20px" }}
                            />
                            <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                              Uploading limit
                            </span>
                          </div>
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            {plan?.uploadPhotos?.toLocaleString()} photos
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex mb-1">
                            <CheckCircleIcon
                              className="text-blue"
                              sx={{ fontSize: "20px" }}
                            />
                            <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                              Optimized Storage
                            </span>
                          </div>
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            {formatBytes(plan?.storage)}
                          </span>
                        </div>
                      </div>
                      {latestData?.plan_id?._id != plan?._id ? (
                        <div className=" w-full">
                          <button
                            className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white"
                            onClick={() =>
                              handleOpen(
                                plan?.price,
                                plan?.planType,
                                plan?._id,
                                plan?.gstInPercent
                              )
                            }
                          >
                            Select Plan
                          </button>
                        </div>
                      ) : (
                        <div className=" w-full">
                          <button className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white">
                            Current Plan
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        );
      case "halfyearly":
        return (
          <div className="slider-container w-full m-auto">
            {allplan
              .filter(
                (p) => p.planType === plans && p.planName.includes("Pro") // filter here
              )
              .map((plan, index) => {
                const color = cardColors[index % cardColors.length];
                return (
                  <div
                    className={`bg-white relative h-max rounded-lg border p-3 group dark:bg-slate-800 m-auto md:w-1/2 ${borderColorClass[color]}`}
                    key={index}
                  >
                    <div className="flex justify-between items-center"></div>
                    <div className="flex flex-col text-start">
                      <h3
                        className={`text-2xl font-normal ${textColorClass[color]}`}
                      >
                        {plan?.planName === "Plus" ? "Starter" : plan?.planName}
                      </h3>
                      <span className="text-slate-500 h-12">
                        Best for solo photographers or small teams handling a
                        few events.
                      </span>
                      <div className="flex items-center gap-3 mb-3 mt-2">
                        <button
                          className={`border w-28 rounded py-1 px-2 font-medium ${
                            plans === "monthly"
                              ? "bg-blue text-white border-blue"
                              : "border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setPlans("monthly");
                          }}
                        >
                          Monthly
                        </button>
                        <button
                          className={`border w-28 rounded py-1 px-2 font-medium ${
                            plans === "halfYearly"
                              ? "bg-blue text-white border-blue"
                              : "border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setPlans("halfYearly");
                          }}
                        >
                          Half Yearly
                        </button>
                        <button
                          className={`border w-28 rounded py-1 px-2 font-medium ${
                            plans === "yearly"
                              ? "bg-blue text-white border-blue"
                              : "border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            setPlans("yearly");
                          }}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col text-start mb-2">
                      <span className="text-3xl font-normal text-slate-700 ms-2 dark:text-slate-500">
                        ₹{plan?.price}
                        <span className="text-xs">
                          + {plan?.gstInPercent}% GST
                        </span>{" "}
                        <span className="text-slate-400 text-lg text-semibold">
                          / {plan?.planType}
                        </span>
                      </span>
                    </div>
                    <hr />
                    <div className="mt-5">
                      <div className="flex justify-between items-center">
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "20px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Validity
                          </span>
                        </div>
                        <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                          {plan?.validity} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "20px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Events Covered
                          </span>
                        </div>
                        <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                          {plan?.events === -1 ? "Unlimited" : plan?.events}{" "}
                          events
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "20px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Uploading limit
                          </span>
                        </div>
                        <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                          {plan?.uploadPhotos?.toLocaleString()} photos
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "20px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Optimized Storage
                          </span>
                        </div>
                        <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                          {formatBytes(plan?.storage)}
                        </span>
                      </div>
                    </div>
                    {latestData?.plan_id?._id != plan?._id ? (
                      <div className="w-full">
                        <button
                          className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white"
                          onClick={() =>
                            handleOpen(
                              plan?.price,
                              plan?.planType,
                              plan?._id,
                              plan?.gstInPercent
                            )
                          }
                        >
                          Select Plan
                        </button>
                      </div>
                    ) : (
                      <div className=" w-full">
                        <button className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white">
                          Current Plan
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      case "annual":
        return (
          <>
            <div className="slider-container w-full md:w-[95%] m-auto">
              {annual &&
                annual.map((plan, index) => {
                  const Icon = cardimg[index % cardimg.length];
                  const color = cardColors[index % cardColors.length];
                  return (
                    <div
                      className={`bg-white h-max relative rounded-lg border p-3 group dark:bg-slate-800 md:w-1/2 ${borderColorClass[color]}`}
                      key={index}
                    >
                      <div className="flex justify-between items-center">
                        <Icon
                          sx={{ fontSize: "40px" }}
                          className={`${textColorClass[color]}`}
                        />
                      </div>
                      <div className="flex flex-col text-start">
                        <h3
                          className={`text-2xl font-normal ${textColorClass[color]}`}
                        >
                          {plan?.planName}
                        </h3>
                        <span className="text-slate-500 h-12">
                          Best for solo photographers or small teams handling a
                          few events.
                        </span>
                      </div>
                      <div className="flex flex-col text-start mb-2">
                        <span className="text-3xl font-normal text-slate-700 ms-2 dark:text-slate-500">
                          ₹{plan?.price}{" "}
                          <span className="text-slate-400 text-lg text-semibold">
                            / {plan?.planType}
                          </span>
                        </span>
                      </div>
                      <hr />
                      <div className="mt-5 mb-18">
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Valid for {plan?.validity} day
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Events up to {plan?.events}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Upload Photos up to {plan?.uploadPhotos}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Storage {formatBytes(plan?.storage)}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Photo Recogniostion using AI
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            QR Code for all events
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Business Branding (Logo)
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Customised Gallery{" "}
                            {plan?.planName === "Plus" && (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                Limited
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Customer Support{" "}
                            {plan?.planName === "Plus" && (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                Limited
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Photo Editing{" "}
                            {plan?.planName === "Plus" && (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                Limited
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Download Permissions
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Analysis and Suggestions
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Portfolio Creation
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Portfolio Management{" "}
                            {plan?.planName === "Plus" && (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                Limited
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Team Management{" "}
                            {plan?.planName === "Plus" ? (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                upto 4 member
                              </span>
                            ) : (
                              <span className="text-green-600 text-sm font-normal">
                                {" "}
                                upto 10 member
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Lead Management
                          </span>
                        </div>
                        {plan?.planName !== "Plus" && (
                          <div className="flex mb-1">
                            <CheckCircleIcon
                              className="text-blue"
                              sx={{ fontSize: "18px" }}
                            />
                            <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                              Account Management
                            </span>
                          </div>
                        )}
                        <div className="flex mb-1">
                          <CheckCircleIcon
                            className="text-blue"
                            sx={{ fontSize: "18px" }}
                          />
                          <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                            Calender Management
                          </span>
                        </div>
                      </div>
                      {latestData?.plan_id?._id != plan?._id ? (
                        <div className="absolute bottom-3 w-[90%]">
                          <button
                            className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white"
                            onClick={() =>
                              handleOpen(plan?.price, plan?.planType, plan?._id)
                            }
                          >
                            Select Plan
                          </button>
                        </div>
                      ) : (
                        <div className=" w-full">
                          <button className="btn border-2  border-blue w-full py-2 mt-5 rounded-md text-blue font-normal hover:bg-blueHover hover:text-white">
                            Current Plan
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        );
      case "myop":
        return (
          <>
            <div className="bg-white relative h-max rounded-lg border border-red-700 p-3 group dark:bg-slate-800 mt-4 md:mt-0 w-full md:w-[50%] m-auto">
              <div className="flex flex-col text-start mb-2">
                <span className="text-xl font-normal text-slate-700 ms-2 dark:text-slate-500">
                  Make your own plan ( MYOP)
                </span>
              </div>
              <hr />
              <form onSubmit={formik.handleSubmit}>
                <div className="flex flex-col text-start mb-4 mt-3">
                  <div className="flex mb-3 md:mb-1">
                    <CheckCircleIcon
                      className="text-blue"
                      sx={{ fontSize: "18px" }}
                    />
                    <div className="w-full">
                      <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                        Valid for Month:
                      </span>
                      <input
                        type="number"
                        name="validityInMonths"
                        placeholder="Month"
                        value={formik.values.validityInMonths}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="outline-none border border-slate-300 py-1 px-2 rounded w-full"
                      />
                      {formik.touched.validityInMonths &&
                      formik.errors.validityInMonths ? (
                        <p className="text-red-500 text-sm">
                          {formik.errors.validityInMonths}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex mb-3 md:mb-1 mt-2">
                    <CheckCircleIcon
                      className="text-blue"
                      sx={{ fontSize: "18px" }}
                    />
                    <div className="w-full">
                      <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                        Events Up to:
                      </span>
                      <input
                        type="number"
                        name="numberOfEvents"
                        placeholder="Events"
                        value={formik.values.numberOfEvents}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="outline-none border border-slate-300 py-1 px-2 rounded w-full"
                      />
                      {formik.touched.numberOfEvents &&
                      formik.errors.numberOfEvents ? (
                        <p className="text-red-500 text-sm">
                          {formik.errors.numberOfEvents}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex mb-3 md:mb-1 mt-2">
                    <CheckCircleIcon
                      className="text-blue"
                      sx={{ fontSize: "18px" }}
                    />
                    <div className="w-full">
                      <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                        Upload Photos Up to:
                      </span>
                      <input
                        type="number"
                        name="uploadPhotos"
                        placeholder="Photos"
                        value={formik.values.uploadPhotos}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="outline-none border border-slate-300 py-1 px-2 rounded w-full"
                      />
                      {formik.touched.uploadPhotos &&
                      formik.errors.uploadPhotos ? (
                        <p className="text-red-500 text-sm">
                          {formik.errors.uploadPhotos}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex mb-3 md:mb-1 mt-2">
                    <CheckCircleIcon
                      className="text-blue"
                      sx={{ fontSize: "18px" }}
                    />
                    <div className="w-full">
                      <span className="text-slate-700 text-sm ms-2 dark:text-slate-500">
                        Storage GB:
                      </span>
                      <select
                        name="storageGB"
                        value={formik.values.storageGB}
                        onChange={formik.handleChange}
                        className="outline-none border border-slate-300 py-1 px-2 rounded w-full"
                      >
                        <option value="">Select Storage</option>
                        {options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {formik.touched.storageGB && formik.errors.storageGB ? (
                        <p className="text-red-500 text-sm">
                          {formik.errors.storageGB}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className=" w-full">
                    <button
                      className="bg-blue text-white rounded py-2 mt-3 w-full hover:bg-blueHover"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Calculate..." : "Calculate"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <section className="px-2">
        <div className="flex items-center justify-center">
          <ul className="flex flex-wrap font-normal text-center rounded-lg shadow-md mt-5 mb-5 gap-3">
            {tabs.map((tab) => (
              <li key={tab.id} className="">
                <button
                  className={`inline-block py-1 px-2 w-20 rounded-lg text-black dark:text-gray-180 font-normal ${
                    activeTab === tab.id
                      ? "text-white bg-blue"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {renderContent()}
      </section>
      <PaymentDetails
        payopen={open}
        payclose={handleClose}
        discountamnt={discount}
      />
      <Calculateprice open={opend} handleClose={handleClosed} />
    </>
  );
}

export default UpgradePlan;

