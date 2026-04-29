import { CircularProgress } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import demo from "../../../image/demo.jpg"

const baseURL = process.env.REACT_APP_BASE_URL;

function Search() {
  const { name } = useParams();
  const [events, setevents] = useState([]);
  const navigate = useNavigate();
  const [loading, setloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(name);

  useEffect(() => {
    fecthSearch();
  }, [name]);

  const fecthSearch = () => {
    setloading(true);
    axios
      .get(`${baseURL}/photographer-team/search/${name}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setloading(false);
        // console.log(response.data.events);
        setevents(response.data.events);
      })
      .catch((error) => {
        setloading(false);
        console.log(error);
      });
  };


  const handlesearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch();
    }
  };

  const performSearch = () => {
    // console.log("Searching for:", searchTerm);
    navigate(`/photographer_team/search/${searchTerm}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <>
      <style>
        {`
            .no-shadow {
            box-shadow: none !important;
            }
            .tss-1h9t3sl-MUIDataTableHeadCell-sortAction{
                font-weight: bold !important;
            }
            .MuiTableCell-head {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            .css-1fnc9ax-MuiButtonBase-root-MuiButton-root{
             padding: 5px 0px;
              justify-content: start;
            }
            .tss-1vd39vz-MUIDataTableBodyCell-stackedCommon:nth-last-of-type(2){
            display:none;
            }
        `}
      </style>
      <div className="flex justify-between items-center">
        <ArrowBackIcon
          sx={{ fontSize: "30px" }}
          className="bg-slate-300 p-1 rounded text-white cursor-pointer"
          onClick={handleBack}
        />
        <div className="bg-white flex items-center py-2 px-3 dark:bg-slate-800 rounded-md mt-5 text-start md:w-1/2">
          <SearchIcon className="text-slate-400 dark:text-white " />
          <input
            type="text"
            name="search"
            value={searchTerm}
            placeholder="Search events...."
            onChange={handlesearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-full ms-2 border-none outline-none bg-transparent dark:text-white"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center mt-5">
          <CircularProgress />
        </div>
      ) : events && events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 mt-4 gap-3">
            {events &&
              events.map((data, index) => (
                <div
                  className="relative rounded shadow-md p-3 bg-white dark:bg-slate-800 cursor-pointer"
                  onClick={() => navigate(`/photographer_team/event/${data._id}`)}
                >
                  <img
                    src={data?.firstPhotoSignedUrl || demo}
                    alt=""
                    className="h-40 w-full object-contain"
                  />
                  <h3 className="text-slate-700 font-normal text-center capitalize w-full dark:text-white line-clamp-2">
                    {data.name}
                  </h3>
                  <p
                    className={`absolute top-0 right-0 rounded p-1 px-2 text-white text-center text-[10px] 
                            ${
                              data?.photoCount === 0
                                ? "bg-red-600"
                                : "bg-green-600"
                            }`}
                  >
                    {data?.photoCount} Photos
                  </p>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center mt-10 text-slate-500">
          <p className="text-lg font-medium">No events found</p>
        </div>
      )}
    </>
  );
}

export default Search;
