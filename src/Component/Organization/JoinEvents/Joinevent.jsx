import React from "react";
import demo from "../../image/demo.jpg";

function Joinevent() {
  return (
    <>
      <section>       
        <div className="flex justify-center items-center h-[90vh]">
          <div className="w-1/2 bg-blue h-full">
           <h1 className="text-3xl text-slate-700 font-bold text-center mt-4 mb-5">
          Welcome to Joinevent
        </h1>
            <div className="text-center border border-slate-300 rounded-lg w-max mx-auto shadow-lg mt-5">
              <img
                src={demo}
                alt="demo"
                className="h-44 w-44 mx-auto rounded-t-lg"
              />
              <h3 className="font-bold text-2xl text-slate-700 p-2 bg-white rounded-b-lg">
                John Doe
              </h3>
            </div>
          </div>
          <div className="w-1/2 h-full">
            <form className="mx-auto w-max mt-10 border border-slate-300 rounded-md p-4">
              <div className="flex flex-col gap-1 w-80 mt-3">
                <label className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  name="name"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <div className="flex flex-col gap-1 w-80 mt-3">
                <label className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                  Phone No
                </label>
                <input
                  type="number"
                  placeholder="Enter your phone no."
                  name="phone"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>
              <button className="bg-blue text-white text-lg px-4 py-1 rounded mt-4">
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default Joinevent;
