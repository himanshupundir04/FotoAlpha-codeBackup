import React, { useEffect, useState } from "react";
import { CircularProgress, Divider } from "@mui/material";
import MUIDataTable from "mui-datatables";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchCurrentSubscription,
  getSubscriptionStatus,
} from "../../../services/subscriptionService";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { SubscriptIcon } from "lucide-react";

const baseURL = process.env.REACT_APP_BASE_URL;
const token = localStorage.getItem("token");
function Billing({ paydata }) {
  const [loading, setLoading] = useState(false);
  const [latestEndDate, setLatestEndDate] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const navigate = useNavigate();
  const [id, setId] = useState();
  const [autoloading, setAutoloading] = useState(false);
  const [renew, setRenew] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState("");

  const statusInfo = subscription ? getSubscriptionStatus(subscription) : null;

  // console.log("status",statusInfo)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const result = await fetchCurrentSubscription(token);

    if (result instanceof Error || result?.response) {
      const message =
        result?.response?.data?.message || "Unable to fetch subscription";

      // console.log("ERROR 👉", message);
      setSubscription(null); // ✅ keep type clean
      setSubscriptionError(message); // ✅ store message separately
      return;
    }

    // ✅ success
    const subscriptionData = result?.data?.data;

    // console.log("SUBSCRIPTION 👉", subscriptionData);
    // console.log("SUBSCRIPTION", subscriptionData.id);
    setId(subscriptionData?.id);
    setSubscription(subscriptionData);
    setSubscriptionError(""); // clear old error
  };

  // console.log(paydata);

  const Data = paydata?.map((item) => ({
    amount: item?.amount,
    referenceid: item?.transaction_reference,
    createdAt:
      item?.subscription_id?.created_at || item?.subscription_id?.createdAt,
    payment_method: item?.payment_method,
    endDate:
      item?.subscription_id?.current_period_end ||
      item?.subscription_id?.end_date,
    status: item?.status,
  }));

  const columns = [
    {
      name: "amount",
      label: "Amount",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">₹{value}</span>
        ),
      },
    },
    {
      name: "createdAt",
      label: "Date",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">
            {value ? format(new Date(value), "d MMM yyyy") : "—"}
          </span>
        ),
      },
    },
    {
      name: "payment_method",
      label: "Method",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white uppercase">{value}</span>
        ),
      },
    },

    {
      name: "referenceid",
      label: "Reference Id",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(value);
              toast.success("Reference ID copied", { autoClose: 1000 });
            } catch {
              toast.error("Failed to copy");
            }
          };

          return (
            <div className="group relative inline-flex items-center gap-2">
              {/* Reference ID */}
              <span className="dark:text-white truncate max-w-[160px]">
                {value}
              </span>

              {/* Copy icon (hover only) */}
              <button
                onClick={handleCopy}
                title="Copy Reference ID"
                className="
              opacity-0 group-hover:opacity-100
              transition-opacity
              text-slate-500 hover:text-blue-500
            "
              >
                <ContentCopyIcon fontSize="small" />
              </button>
            </div>
          );
        },
      },
    },

    {
      name: "status",
      label: "Status",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white text-green-600">{value}</span>
        ),
      },
    },
    {
      name: "endDate",
      label: "End Date",
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <span className="dark:text-white">
            {value ? format(new Date(value), "d MMM yyyy") : "—"}
          </span>
        ),
      },
    },
  ];

  const options = {
    responsive: "standard",
    filterType: "checkbox",
    selectableRows: "none",
    print: false,
    download: true,
    viewColumns: false,
    filter: true,
    search: true,
    pagination: true,
  };

  const handleCancel = async () => {
    const cancelAtPeriodEnd = true;
    setAutoloading(true);
    try {
      const response = await axios.post(
        `${baseURL}/mysubscriptions/${id}/cancel`,
        { cancelAtPeriodEnd },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAutoloading(false);
      toast.success("Subscription Cancel Successfully");
      fetchData();
    } catch (error) {
      console.error(error);
      setAutoloading(false);
      toast.error(
        error?.response?.data?.message,
        "Something went wrong while canceling"
      );
      // alert("Something went wrong while canceling");
    } finally {
      setAutoloading(false);
      setLoading(false);
    }
  };

  const hasSubscription = !!subscription;
  const isTrial = subscription?.status === "trial";
  const isCanceledOrPending = ["canceled", "pending"].includes(
    subscription?.status
  );
  const isActive = subscription?.status === "active";

  return (
    <section className="text-start">
      <div className="bg-white rounded p-4 dark:bg-slate-800">
        <h2 className="font-normal text-slate-700 text-xl dark:text-white">
          Billing & Subscription
        </h2>
        <p className="text-slate-500">
          Manage your subscription plan and payment methods.
        </p>

        <div className="mt-4 mb-5">
          <h2 className="text-slate-700 font-normal text-lg dark:text-white">
            Current Plan
          </h2>

          {/* ❌ NO SUBSCRIPTION */}
          {!hasSubscription && subscriptionError && (
            <>
              <p className="text-red-600">{subscriptionError}</p>
              <button
                className="btn text-white bg-blue mt-2 py-1 px-3 rounded"
                onClick={() => navigate("/organization/upgrade_plan")}
              >
                Upgrade Plan
              </button>
            </>
          )}

          {/* 🧪 TRIAL / ❌ CANCELED / ⏳ PENDING */}
          {(isTrial || isCanceledOrPending) && (
            <>
              {statusInfo?.statusMessage && (
                <p className="text-yellow-600 mt-2">
                  {statusInfo.statusMessage}
                </p>
              )}

              <button
                className="btn text-white bg-blue mt-3 py-1 px-3 rounded"
                onClick={() => navigate("/organization/upgrade_plan")}
              >
                Upgrade Plan
              </button>
            </>
          )}

          {/* ✅ ACTIVE SUBSCRIPTION */}
          {isActive && (
            <>
              <p className="text-blue font-normal text-lg">
                {subscription?.plan?.name}
              </p>

              <p className="text-slate-700 font-normal">
                ₹
                {(
                  Number(subscription?.metadata?.plan_price || 0) +
                  Number(subscription?.metadata?.gst_amount || 0)
                ).toFixed(2)}
                /month · Renews on{" "}
                {subscription?.current_period_end
                  ? format(
                      new Date(subscription.current_period_end),
                      "d MMM yyyy"
                    )
                  : "—"}
              </p>

              <div className="flex gap-3 mt-4">
                <button
                  className="btn text-white bg-red-700 py-1 px-3 rounded"
                  onClick={handleCancel}
                  disabled={autoloading}
                >
                  {autoloading ? "Canceling..." : "Cancel Auto-Renewal"}
                </button>
              </div>
            </>
          )}
        </div>

        <Divider className="dark:text-white" />
        <div className="mt-5">
          <h2 className="text-slate-700 font-normal text-lg dark:text-white">
            Billing History
          </h2>
          {loading ? (
            <div className="flex justify-center mt-5">
              <CircularProgress />
            </div>
          ) : (
            <MUIDataTable
              data={Data}
              columns={columns}
              options={options}
              className="dark:bg-slate-800 dark:text-white mt-3"
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default Billing;
