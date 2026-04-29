import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "react-phone-input-2/lib/style.css";
import reportWebVitals from "./reportWebVitals";
import EmailContextProvider from "./Component/Context/otpContext";
import EventContextProvider from "./Component/Context/EventContext";
import PortfolioEventContextProvider from "./Component/Photographer/Context/PortfolioEventContext";
import OrganizationPortfolioEventContextProvider from "./Component/Organization/Context/PortfolioEventContext";
import PhotographerTeamEventContextProvider from "./Component/PhotographerTeam/Context/PhotographerTeamEventContext";
import { PortfolioProvider } from "./Component/Photographer/Context/PortfolioContext";
import { OrganizationPortfolioProvider } from "./Component/Organization/Context/PortfolioContext";
import PlanContextProvider from "./Component/Photographer/Context/PlanContext";
import OrganizationPlanContextProvider from "./Component/Organization/Context/PlanContext";
import PhotographerEventContextProvider from "./Component/Photographer/Context/PhotographerEventContext";
import OrganizationEventContextProvider from "./Component/Organization/Context/OrganizationEventContext";
import UploadContextProvider from "./Component/PhotographerTeam/Context/UploadContext";
import { UploadVideoProvider } from "./Component/Photographer/Context/UploadVideoContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <EmailContextProvider>
      <EventContextProvider>
        <PortfolioEventContextProvider>
          <UploadVideoProvider>
            <OrganizationPortfolioEventContextProvider>
              <PhotographerEventContextProvider>
                <OrganizationEventContextProvider>
                  <PhotographerTeamEventContextProvider>
                    <UploadContextProvider>
                      <PortfolioProvider>
                        <OrganizationPortfolioProvider>
                          <PlanContextProvider>
                            <OrganizationPlanContextProvider>
                              <App />
                            </OrganizationPlanContextProvider>
                          </PlanContextProvider>
                        </OrganizationPortfolioProvider>
                      </PortfolioProvider>
                    </UploadContextProvider>
                  </PhotographerTeamEventContextProvider>
                </OrganizationEventContextProvider>
              </PhotographerEventContextProvider>
            </OrganizationPortfolioEventContextProvider>
          </UploadVideoProvider>
        </PortfolioEventContextProvider>
      </EventContextProvider>
    </EmailContextProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
