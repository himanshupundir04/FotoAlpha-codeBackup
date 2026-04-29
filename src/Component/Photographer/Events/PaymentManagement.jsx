import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CircularProgress,
  TablePagination,
  Popover,
  IconButton,
  Box,
  TextField,
  Button,
} from "@mui/material";
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
  const [event, setEvent] = useState([]);
  const { eventid } = useParams();

  // Popover states
  const [totalAmountAnchor, setTotalAmountAnchor] = useState(null);
  const [paymentAnchor, setPaymentAnchor] = useState(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);

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
        },
      );
      setLoading(false);
      setPayment(response.data);
      const totalAmount = response.data.payments.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
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
      // Check if total amount is set before allowing payment save
      if (!event?.totalAmount) {
        toast.error("Please set total amount first before recording payments", {
          toastId: "no-total-amount",
          autoClose: 2000,
        });
        return;
      }

      setLoadingadd(true);
      try {
        const response = await axios.post(
          `${baseUrl}/event-payment/events/${eventid}/payments`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setLoadingadd(false);
        toast.success(response.data.message || "Payment created successfully", {
          toastId: "add-payment",
          autoClose: 1000,
        });
        formik.resetForm();
        fetchpayment();
         setPaymentAnchor(null);
      } catch (error) {
        console.log(error.response.data);
        toast.error(
          error.response?.data?.message ||
            error.response.data.error ||
            "Something went wrong!",
          { autoClose: 1000 },
        );
        setLoadingadd(false);
      }
    },
  });

  const totalformik = useFormik({
    initialValues: {
      totalAmount: event?.totalAmount || "",
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
          },
        );
        setLoadingtotal(false);
        toast.success(
          response?.data?.message || "Total Payment updated successfully",
          { toastId: "total-payment", autoClose: 1000 },
        );
        totalformik.resetForm();
        setTotalAmountAnchor(null);
        setIsEditingTotal(false);
        fetchEvents();
      } catch (error) {
        console.log(error.response.data);
        toast.error(
          error.response?.data?.message ||
            error.response.data.error ||
            "Something went wrong!",
          { autoClose: 1000 },
        );
        setLoadingtotal(false);
      }
    },
  });

  // Handle opening total amount popover
  const handleTotalAmountClick = (e) => {
    setTotalAmountAnchor(e.currentTarget);
    if (event?.totalAmount) {
      totalformik.setFieldValue("totalAmount", event.totalAmount);
      setIsEditingTotal(true);
    } else {
      totalformik.setFieldValue("totalAmount", "");
      setIsEditingTotal(false);
    }
  };

  // Handle total amount change to prevent negative values
  const handleTotalAmountChange = (e) => {
    const value = e.target.value;
    if (value < 0) {
      return;
    }
    totalformik.handleChange(e);
  };

  // Handle payment amount change to prevent negative values
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value < 0) {
      return;
    }
    formik.handleChange(e);
  };

  // Handle closing popovers
  const handleCloseTotalAmount = () => {
    setTotalAmountAnchor(null);
    setIsEditingTotal(false);
    totalformik.resetForm();
  };

  const handlePaymentClick = (event) => {
    setPaymentAnchor(event.currentTarget);
  };

  const handleClosePayment = () => {
    setPaymentAnchor(null);
    formik.resetForm();
  };

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
        <div className="flex justify-between items-center">
          <h2 className="font-normal text-lg text-slate-700 dark:text-white">
            Financial Overview
          </h2>
          {/* Total Amount Section with Button */}
          <div>
            {event?.totalAmount ? (
              <button
                className="bg-blue text-white font-normal rounded py-2 px-3 text-sm hover:bg-blueHover flex items-center gap-2"
                onClick={handleTotalAmountClick}
              >
                Edit Total Amount
              </button>
            ) : (
              <button
                className="bg-blue text-white font-normal rounded py-2 px-3 text-sm hover:bg-blueHover flex items-center gap-2"
                onClick={handleTotalAmountClick}
              >
                Add Total Amount
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex flex-col mt-2">
            <h2 className="text-slate-700 font-normal dark:text-white">
              Total Amount
            </h2>
            <p className="text-slate-700 font-normal text-lg dark:text-white">
              ₹{event?.totalAmount}
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
              ₹{Math.max(0, (event?.totalAmount || 0) - (totalpayment || 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Record New Payment Button */}
      <div className="bg-white rounded p-4 mt-4 dark:bg-slate-800">
        <div className="flex flex-col text-start">
          <div className="flex items-center">
            <h2 className="text-slate-700 font-normal text-xl dark:text-white">
              Payment Records
            </h2>
          </div>
          <p className="text-slate-700 font-normal dark:text-slate-400">
            Log a new payment received for this event.
          </p>
        </div>
        <button
          className={`text-white font-normal rounded py-2 px-3 text-sm mt-4 flex items-center gap-2 ${
            event?.totalAmount
              ? "bg-blue hover:bg-blueHover"
              : "bg-gray-400 cursor-not-allowed"
          }`}
          onClick={handlePaymentClick}
          disabled={!event?.totalAmount}
        >
          Record New Payment
        </button>
      </div>

      {/* Total Amount Popover */}
      <Popover
        open={Boolean(totalAmountAnchor)}
        anchorEl={totalAmountAnchor}
        onClose={handleCloseTotalAmount}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
      >
        <Box p={3} className="dark:bg-slate-800">
          <form
            onSubmit={totalformik.handleSubmit}
            className="flex flex-col gap-3"
          >
            <h2 className="text-slate-700 font-normal text-lg dark:text-white">
              {isEditingTotal ? "Edit Total Amount" : "Add Total Amount"}
            </h2>
            <TextField
              label="Total Amount (₹)"
              type="number"
              name="totalAmount"
              required
              value={totalformik.values.totalAmount}
              onChange={handleTotalAmountChange}
              onBlur={totalformik.handleBlur}
              inputProps={{ min: 0 }}
              className="dark:text-white"
              size="small"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loadingtotal}
                size="small"
              >
                {loadingtotal ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCloseTotalAmount}
                size="small"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Box>
      </Popover>

      {/* Record New Payment Popover */}
      <Popover
        open={Boolean(paymentAnchor)}
        anchorEl={paymentAnchor}
        onClose={handleClosePayment}
        anchorOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "center",
          horizontal: "center",
        }}
      >
        <Box p={3} className="dark:bg-slate-800">
          <form onSubmit={formik.handleSubmit} className="flex flex-col gap-3">
            <h2 className="text-slate-700 font-normal text-lg dark:text-white">
              Record New Payment
            </h2>
            <TextField
              label="Amount (₹)"
              type="number"
              name="amount"
              required
              value={formik.values.amount}
              onChange={handleAmountChange}
              onBlur={formik.handleBlur}
              inputProps={{ min: 0 }}
              className="dark:text-white"
              size="small"
            />
            <TextField
              label="Payment Date"
              type="date"
              name="date"
              required
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="dark:text-white"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description (Optional)"
              type="text"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="dark:text-white"
              size="small"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loadingadd}
                size="small"
              >
                {loadingadd ? "Adding..." : "Add Payment"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleClosePayment}
                size="small"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Box>
      </Popover>

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

