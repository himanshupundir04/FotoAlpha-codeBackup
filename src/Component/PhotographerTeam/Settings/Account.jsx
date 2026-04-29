import React, { useState } from "react";
import ChangePassword from "./ChangePassword"

function Account() {
   const [open, setOpen] = useState(false);
      const handleClosed = () => setOpen(false);
  return (
    <>
      <section>
        <div className="bg-white rounded p-4 dark:bg-slate-800 text-start">
          <p className="font-bold text-slate-700 text-xl dark:text-white">
            Account Settings
          </p>
          <span className="text-slate-500">
            Manage your email, password, and account security.
          </span>
        <div className="mb-4">
            <button className="btn bg-blue text-white rounded text-sm p-2 font-normal mt-3 hover:bg-blueHover" onClick={() => {setOpen(true)}}>
              Change Password
            </button>
          </div>      
          
        </div>
      </section>
      <ChangePassword open={open} handleClose={handleClosed}/>
    </>
  );
}

export default Account;
