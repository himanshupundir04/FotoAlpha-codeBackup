import React from 'react'

function Footer() {
  return (
    <>
        <footer className="bg-white px-5 py-1 border-y-2 dark:border-slate-800 border-slate-200 flex flex-wrap items-center justify-between dark:bg-slate-900 bg-white">
            <p className='text-slate-500 font-semibold dark:text-white text-sm md:text-base'> {new Date().getFullYear()} FotoAlpha.All rights reserved</p>
            <div className='flex'>
            {/* <p className='text-slate-500 font-semibold dark:text-white text-sm md:text-base'>Tearms of Service</p>
            <p className='text-slate-500 font-semibold dark:text-white mx-6 text-sm md:text-base'>Privacy Policy</p>
            <p className='text-slate-500 font-semibold dark:text-white text-sm md:text-base'>Help Center</p> */}
            </div>
        </footer>
    </>
  )
}

export default Footer