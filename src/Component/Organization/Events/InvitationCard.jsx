import React, { useContext, useRef } from "react";
import { PortfolioEventContext } from "../Context/PortfolioEventContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import DownloadIcon from "@mui/icons-material/Download";
import { Button } from "@mui/material";

function InvitationCard() {
  const { portfolioevent } = useContext(PortfolioEventContext);
  const cardRef = useRef(null);

  const downloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      // Create canvas from the invitation card
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: "transparent",
        scale: 2,
        logging: false,
      });

      // Create PDF with A5 size (invitation card size)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5", // A5 is a good size for invitation cards (148 x 210 mm)
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit the image in the PDF
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${portfolioevent?.name || "invitation"}-card.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const shareOnWhatsApp = () => {
    const dateInfo = getEventDateInfo();
    const eventName = portfolioevent?.name || "Event";
    const eventType = portfolioevent?.timeSlots?.[0]?.eventSubCategory?.name || "Event";
    const hostName = portfolioevent?.hostName || "Host";
    const date = dateInfo.date;
    const time = dateInfo.time;
    const location = portfolioevent?.location || "Location TBD";
    const phone = portfolioevent?.hostMobile ? `${portfolioevent?.countryCode || '+91'} ${portfolioevent.hostMobile}` : "Contact host";

    const message = `📮 *You're Invited!*\n\n*${eventName}*\n${hostName} invites you to ${eventType} Celebration\n\n📅 *${date}*\n🕐 *${time}*\n📍 *${location}*\n\n📱 *RSVP: ${phone}*\n\n_Download the invitation card from the event page to view full details!_`;

    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  // Extract date info from timeSlots or fallback to other date fields
  const getEventDateInfo = () => {
    const timeSlot = portfolioevent?.timeSlots?.[0];
    const dateString = timeSlot?.date || portfolioevent?.start_date;
    
    if (!dateString) {
      return {
        dayName: "TBD",
        date: "TBD",
        time: "TBD"
      };
    }

    const eventDate = new Date(dateString);
    const dayName = eventDate.toLocaleDateString("en-US", { weekday: "long" });
    const date = eventDate.getDate();
    const month = eventDate.toLocaleDateString("en-US", { month: "short" });
    const year = eventDate.getFullYear();
    
    const time = eventDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      dayName,
      date: `${month} ${date}`,
      year,
      time
    };
  };

  const dateInfo = getEventDateInfo();
  
  // Get event sub-category (like Haldi, Wedding, etc.)
  const eventSubCategory = portfolioevent?.timeSlots?.[0]?.eventSubCategory?.name;
  const hostName = portfolioevent?.hostName || "Host";
  const hostMobile = portfolioevent?.hostMobile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-6 flex flex-col items-center justify-center">
      {/* Action Buttons */}
      <div className="mb-8 flex gap-4 flex-wrap justify-center">
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={downloadPDF}
          sx={{
            backgroundColor: "#8b7355",
            "&:hover": {
              backgroundColor: "#6b5344",
            },
            textTransform: "none",
            fontSize: "16px",
            padding: "10px 24px"
          }}
        >
          Download PDF
        </Button>
        
        <Button
          variant="contained"
          onClick={shareOnWhatsApp}
          sx={{
            backgroundColor: "#25D366",
            "&:hover": {
              backgroundColor: "#20BA58",
            },
            textTransform: "none",
            fontSize: "16px",
            padding: "10px 24px"
          }}
        >
          📱 Share on WhatsApp
        </Button>
      </div>

      {/* Invitation Card */}
      <div
        ref={cardRef}
        className="w-full max-w-md bg-gradient-to-b from-amber-50 to-orange-50 rounded-3xl shadow-2xl overflow-hidden relative"
        style={{
          aspectRatio: "4 / 5.5",
          position: "relative"
        }}
      >
        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 opacity-30 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <text x="10" y="50" fontSize="80" opacity="0.2">🌿</text>
          </svg>
        </div>
        <div className="absolute top-0 right-0 opacity-30 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <text x="30" y="50" fontSize="80" opacity="0.2">🌿</text>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 opacity-30 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <text x="10" y="80" fontSize="80" opacity="0.2">🌿</text>
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 opacity-30 pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <text x="30" y="80" fontSize="80" opacity="0.2">🌿</text>
          </svg>
        </div>

        {/* Main Content */}
        <div className="h-full flex flex-col justify-between p-8 text-center relative z-10">
          {/* Top Section - Event Name and Subtitle */}
          <div className="space-y-2">
            {/* Event Name */}
            <h1 className="text-3xl font-serif text-amber-900" style={{fontFamily: "'Playfair Display', serif"}}>
              {portfolioevent?.name || "Event"}
            </h1>
            
            {/* Subtitle */}
            <p className="text-sm text-amber-800 tracking-wide">
              Hosted by {hostName}
            </p>
            {eventSubCategory && (
              <p className="text-sm text-amber-900 font-semibold tracking-wide">
                {eventSubCategory} Celebration
              </p>
            )}
          </div>

          {/* Middle Section - Decorative Separator and Date/Time Info */}
          <div className="space-y-4">
            {/* Decorative separator */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-amber-700"></div>
              <span className="text-amber-700">❤</span>
              <div className="w-8 h-px bg-amber-700"></div>
            </div>

            {/* Date Time Info */}
            <div className="space-y-2">
              <div className="flex justify-center items-center gap-4 text-amber-900">
                <div className="text-center">
                  <p className="text-xs font-semibold tracking-widest">{dateInfo.dayName}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{dateInfo.date}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{dateInfo.time}</p>
                </div>
              </div>
            </div>

            {/* Decorative separator */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-amber-700"></div>
              <span className="text-amber-700">❤</span>
              <div className="w-8 h-px bg-amber-700"></div>
            </div>
          </div>

          {/* Bottom Section - Event Details and RSVP */}
          <div className="space-y-4">
            {/* Location or Event Details */}
            {portfolioevent?.location && (
              <div>
                <p className="text-xs text-amber-700 tracking-wide">VENUE</p>
                <p className="text-xs font-semibold text-amber-900">
                  {portfolioevent.location}
                </p>
              </div>
            )}

            {/* Event Code / Reference */}
            {portfolioevent?.eventCode && (
              <div>
                <p className="text-xs text-amber-700 tracking-widest">EVENT CODE</p>
                <p className="text-xs font-semibold text-amber-900">
                  {portfolioevent.eventCode}
                </p>
              </div>
            )}

            {/* RSVP Section with Host Name */}
            <div className="pt-1">
              <p className="text-xs text-amber-700 tracking-widest font-semibold mb-1">RSVP</p>
              <p className="text-xs text-amber-900 font-semibold">
                {hostName}
              </p>
              {hostMobile && (
                <p className="text-xs font-semibold text-amber-900">
                  {portfolioevent?.countryCode || '+91'} {hostMobile}
                </p>
              )}
              {portfolioevent?.hostEmail && (
                <p className="text-xs text-amber-900 break-all">
                  {portfolioevent.hostEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="mt-8 text-center text-sm text-amber-900">
        <p className="font-semibold">Invitation Card Preview</p>
        <p className="text-xs text-amber-700 mt-1">
          Click "Download as PDF" to save and print
        </p>
      </div>
    </div>
  );
}

export default InvitationCard;
