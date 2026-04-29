import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CircularProgress, TablePagination } from "@mui/material";
import MUIDataTable from "mui-datatables";
import axios from "axios";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { format } from "date-fns";

const baseUrl = process.env.REACT_APP_BASE_URL;

function PaymentManagement() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [loadingadd, setLoadingadd] = useState(false);
  const [loadingtotal, setLoadingtotal] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [payment, setPayment] = useState();
  const [totalpayment, setTotalPayment] = useState();
  const { eventid } = useParams();
   const [event, setEvent] = useState([]);

  // console.log(Photographerevent)

  useEffect(() => {
    fetchpayment();
    fetchEvents();
  }, []);

  const fetchpayment = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseUrl}/event-payment/events/${eventid}/payments`,
        {
          params: {
            page: page + 1,
            pageSize: rowsPerPage,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setLoading(false);
      setPayment(response.data);
      const totalAmount = response.data.payments.reduce(
        (sum, item) => sum + Number(item.amount),
        0
      );
      setTotalPayment(totalAmount);
      // console.log("Total Amount:", totalAmount);
      // console.log(response.data);
    } catch (error) {
      setLoading(false);
      console.log(error.response.data.message);
    }
  };

    const fetchEvents = async () => {
    axios
      .get(`${baseUrl}/events/${eventid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "ngrok-skip-browser-warning": "69420",
        },
      })
      .then((response) => {
        
        setEvent(response.data.event);
        // console.log(response.data.event);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const formik = useFormik({
    initialValues: {
      amount: "",
      date: "",
      description: "",
    },
    onSubmit: async (values) => {
      setLoadingadd(true);
      try {
        const response = await axios.post(
          `${baseUrl}/event-payment/events/${eventid}/payments`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLoadingadd(false);
        toast.success(response.data.message || "Payment created successfully", {
          toastId: "add-payment",
          autoClose: 1000,
        });
        formik.resetForm();
        fetchpayment();
      } catch (error) {
        console.log(error.response.data);
        toast.error(
          error.response?.data?.message ||
            error.response.data.error ||
            "Something went wrong!",
          { autoClose: 1000 }
        );
        setLoadingadd(false);
      }
    },
  });

  const totalformik = useFormik({
    initialValues: {
      totalAmount: "",
    },
    onSubmit: async (values) => {
      setLoadingtotal(true);
      try {
        const response = await axios.put(
          `${baseUrl}/events/${eventid}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setLoadingtotal(false);
        toast.success(
          response?.data?.message || "Total Payment created successfully",
          { toastId: "total-payment", autoClose: 1000 }
        );
        totalformik.resetForm();
        fetchEvents();
      } catch (error) {
        console.log(error.response.data);
        toast.error(
          error.response?.data?.message ||
            error.response.data.error ||
            "Something went wrong!",
          { autoClose: 1000 }
        );
        setLoadingtotal(false);
      }
    },
  });

  const data = payment?.payments;
  const columns = [
    {
      name: "date",
      label: "Date",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <>
              <span className="dark:text-white">
                {format(new Date(value), "MMM dd, yyyy")}
              </span>
            </>
          );
        },
      },
    },
    {
      name: "description",
      label: "Description",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value) => {
          return (
            <>
              <span className="dark:text-white">{value}</span>
            </>
          );
        },
      },
    },
    {
      name: "amount",
      label: "Amount",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return <span className="text-green-600 font-normal">₹{value}</span>;
        },
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
    pagination: false,
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <style>
        {`
            .no-shadow {
            box-shadow: none !important;
            }
            .MuiTableCell-root.MuiTableCell-head{
                font-weight: bold !important;
                color: #212935ff;
            }
            .css-1fnc9ax-MuiButtonBase-root-MuiButton-root{
              padding: 5px 0px;
              justify-content: start;
            }
        `}
      </style>
      <div className="bg-white rounded p-4 dark:bg-slate-800 text-start">
        <h2 className="font-normal text-lg text-slate-700 dark:text-white">
          Financial Overview
        </h2>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex flex-col mt-2">
            <h2 className="text-slate-700 font-normal dark:text-white">
              Total Amount
            </h2>
            <p className="text-slate-700 font-normal text-lg dark:text-white">
              ₹{event?.totalAmount || 0}
            </p>
          </div>
          <div className="flex flex-col mt-2">
            <h2 className="text-slate-700 font-normal dark:text-white">
              Amount Received
            </h2>
            <p className="text-green-600 font-normal text-lg">
              ₹{totalpayment || 0}
            </p>
          </div>
          <div className="flex flex-col mt-2 ">
            <h2 className="text-slate-700 font-normal dark:text-white">
              Remaining Balance
            </h2>
            <p className="text-red-500 font-normal text-lg">
              ₹{event?.totalAmount - totalpayment || 0}
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded p-4 mt-4 dark:bg-slate-800 text-start">
        <form onSubmit={totalformik.handleSubmit}>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h2 className="text-slate-700 font-normal text-xl dark:text-white">
                Add Total Payment
              </h2>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-3 mt-4">
            <div className="flex flex-col md:w-1/3">
              <label className="text-slate-700 font-normal dark:text-white">
                Total Amount(₹)
              </label>
              <input
                type="number"
                placeholder="amount"
                min={0}
                name="totalAmount"
                value={totalformik.values.totalAmount}
                onChange={totalformik.handleChange}
                onBlur={totalformik.handleBlur}
                onKeyDown={(e) => {
    if (e.key === "-" || e.key === "e") {
      e.preventDefault();
    }
  }}
                className="dark:text-white border border-slate-300 text-sm rounded p-2 bg-transparent"
              />
            </div>
          </div>
          <button
            className="bg-blue text-white font-normal rounded py-2 px-3 text-sm mt-5 hover:bg-blueHover flex items-center gap-2"
            type="submit"
            disabled={loadingtotal}
          >
            {loadingtotal ? "Adding Total Payment..." : "Add Total Payment"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded p-4 mt-4 dark:bg-slate-800 text-start">
        <form onSubmit={formik.handleSubmit}>
          <div className="flex flex-col">
            <div className="flex items-center">
              <h2 className="text-slate-700 font-normal text-xl dark:text-white">
                Record New Payment
              </h2>
            </div>
            <p className="text-slate-700 font-normal dark:text-slate-400">
              Log a new payment received for this event.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-3 mt-4">
            <div className="flex flex-col md:w-1/2">
              <label className="text-slate-700 font-normal dark:text-white">
                Amount(₹)
              </label>
              <input
                type="number"
                placeholder="amount"
                name="amount"
                min={0}
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                onKeyDown={(e) => {
    if (e.key === "-" || e.key === "e") {
      e.preventDefault();
    }
  }}
                className="dark:text-white border border-slate-300 text-sm rounded p-2 bg-transparent"
              />
            </div>
            <div className="flex flex-col md:w-1/2">
              <label className="text-slate-700 font-normal dark:text-white">
                Payment Date
              </label>
              <input
                type="date"
                placeholder="date"
                name="date"
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="dark:text-white border w-full border-slate-300 text-sm rounded p-2 bg-transparent"
              />
            </div>
            <div className="flex flex-col md:w-1/2">
              <label className="text-slate-700 font-normal dark:text-white">
                Description(Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Secound Installment"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="dark:text-white border border-slate-300 text-sm rounded p-2 bg-transparent"
              />
            </div>
          </div>
          <button
            className="bg-blue text-white font-normal rounded py-2 px-3 text-sm mt-5 hover:bg-blueHover flex items-center gap-2"
            type="submit"
            disabled={loadingadd}
          >
            {loadingadd ? "Adding Payment..." : "Add Payment"}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 ">
          <CircularProgress className="text-blue-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Loading payments...
          </p>
        </div>
      ) : (
        <>
          <MUIDataTable
            title={
              <div>
                <div className="text-xl font-normal text-slate-700 text-start dark:text-white">
                  Payment History
                </div>
                <div className="text-sm text-slate-700 text-start dark:text-white">
                  A deatiled log of all payments for this event.
                </div>
              </div>
            }
            data={data}
            columns={columns}
            options={options}
            className="no-shadow bg-white dark:bg-slate-800 dark:text-white mt-5"
          />
          <div>
            <TablePagination
              component="div"
              count={payment?.pagination?.totalPages}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 15, 20, 50, 100]}
              className="bg-white text-black dark:bg-slate-800 dark:text-white"
              sx={{
                "& .MuiTablePagination-actions svg": {
                  color: "black",
                },
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

export default PaymentManagement;

