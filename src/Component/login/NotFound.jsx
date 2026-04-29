import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-8xl font-extrabold text-slate-900">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-slate-800">
            Page not found
          </h2>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Sorry, the page you’re looking for doesn’t exist or has been moved.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            {/* <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-blue px-6 py-3 text-sm font-medium text-white transition hover:bg-blueHover"
            >
              Go to home
            </Link> */}
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;
