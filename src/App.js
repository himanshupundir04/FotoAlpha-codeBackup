import "./App.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./Component/login/Login";
import Register from "./Component/Register/Register";
import Verify from "./Component/Register/Verify/Verify";

//Photographer
import CreatePortfolio from "./Component/Photographer/CreatePortfolio";
import PhotographerLayout from "./Component/Photographer/PhotographerLayout";
import PhotographerMain from "./Component/Photographer/Dashboard/Main/Main";
import Portfolio from "./Component/Photographer/Portfolio/Portfolio";
import ViewPhotos from "./Component/Photographer/Portfolio/ViewPhotos";
import EventsCategory from "./Component/Photographer/Events/EventsCategory";
import CreateEvents from "./Component/Photographer/Events/CreateEvents";
import EditEvents from "./Component/Photographer/Events/EditEvents";
import PhotographerEvents from "./Component/Photographer/Events/Event";
import PhotographerSingleEvent from "./Component/Photographer/Events/SingleEvent";
import PhotographerAccount from "./Component/Photographer/Myaccount/Account";
import Publicview from "./Component/Photographer/Portfolio/Publicview";
import Calendar from "./Component/Photographer/Calendar/Calendar";
import PaymentManagement from "./Component/Photographer/Events/PaymentManagement";
import Settings from "./Component/Photographer/Settings/Settings";
import SyncPhotos from "./Component/Photographer/Events/SyncPhotos";
import Album from "./Component/Photographer/Album/Album";
import ManageTeam from "./Component/Photographer/Events/ManageTeam";
import Team from "./Component/Photographer/Team/Team";
import Search from "./Component/Photographer/Dashboard/Search/Search";
import Billing from "./Component/Photographer/Billing/Billing"
import CoinsPage from "./Component/Photographer/Coins/CoinsPage";
import ReferralDashboard from "./Component/Photographer/Referrals/ReferralDashboard";
import Feedback from "./Component/Photographer/Feedback/Feedback";
import PrintOrders from "./Component/Photographer/PrintOrders/Orders"

//Photographer
import OrganizationLayout from "./Component/Organization/OrganizationLayout";
import OrganizationMain from "./Component/Organization/Dashboard/Main/Main";
import OrganizationPortfolio from "./Component/Organization/Portfolio/Portfolio";
import OrganizationViewPhotos from "./Component/Organization/Portfolio/ViewPhotos";
import OrganizationEventsCategory from "./Component/Organization/Events/EventsCategory";
import OrganizationCreateEvents from "./Component/Organization/Events/CreateEvents";
import OrganizationEditEvents from "./Component/Organization/Events/EditEvents";
import OrganizationEvents from "./Component/Organization/Events/Event";
import OrganizationSingleEvent from "./Component/Organization/Events/SingleEvent";
import OrganizationAccount from "./Component/Organization/Myaccount/Account";
import OrganizationPublicview from "./Component/Organization/Portfolio/Publicview";
import OrganizationCalendar from "./Component/Organization/Calendar/Calendar";
import OrganizationPaymentManagement from "./Component/Organization/Events/PaymentManagement";
import OrganizationSettings from "./Component/Organization/Settings/Settings";
import OrganizationSyncPhotos from "./Component/Organization/Events/SyncPhotos";
import OrganizationAlbum from "./Component/Organization/Album/Album";
import OrganizationManageTeam from "./Component/Organization/Events/ManageTeam";
import OrganizationTeam from "./Component/Organization/Team/Team";
import OrganizationSearch from "./Component/Organization/Dashboard/Search/Search";
import OrganizationBilling from "./Component/Organization/Billing/Billing"
import OrganizationCoinsPage from "./Component/Organization/Coins/CoinsPage";
import OrganizationReferralDashboard from "./Component/Organization/Referrals/ReferralDashboard";
import OrganizationSubCategory from "./Component/Organization/UploadPhotos/SubCategory";
import OrganizationAlbumimg from "./Component/Organization/Album/Albumimg";
import OrganizationUpgradePlan from "./Component/Organization/Dashboard/UpgradePlan/UpgradePlan";
import OrganizationEventLists from "./Component/Organization/Events/EventLists";
import OrganizationCreateEvent from "./Component/Organization/UploadPhotos/CreateEvent";

//Photographer-Team
import PhotographerTeamLayout from "./Component/PhotographerTeam/PhotographerTeamLayout";
import PhotographerTeamMain from "./Component/PhotographerTeam/Dashboard/Main/Main";
import PhotographerTeamEvents from "./Component/PhotographerTeam/Events/Event";
import PhotographerTeamSingleEvent from "./Component/PhotographerTeam/Events/SingleEvent";
import PhotographerTeamAccount from "./Component/PhotographerTeam/Myaccount/Account";
import PhotographerTeamCalendar from "./Component/PhotographerTeam/Calendar/Calendar";
import PhotographerTeamSettings from "./Component/PhotographerTeam/Settings/Settings";
import PhotographerPhotos from "./Component/PhotographerTeam/Events/Photos";
import PhotographerTeamSyncPhotos from "./Component/PhotographerTeam/Events/SyncPhotos";
import Events from "./Component/Photographer/UploadPhotos/Events";
import SubCategory from "./Component/Photographer/UploadPhotos/SubCategory";
import Albumimg from "./Component/Photographer/Album/Albumimg";
import Searchteam from "./Component/PhotographerTeam/Dashboard/Search/Search";
import UpgradePlan from "./Component/Photographer/Dashboard/UpgradePlan/UpgradePlan";
import EventLists from "./Component/Photographer/Events/EventLists";
import CreateEvent from "./Component/Photographer/UploadPhotos/CreateEvent";
import NotFound from "./Component/login/NotFound";
import PhotoVideo from "./Component/Photographer/Events/PhotoVideo";

function App() {
  const router = createHashRouter([
    {
      path: "/",
      element: <Login />,
    },
    {
      path: "*",
      element: <NotFound/>,
    },
    {
      index: true,
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/register/verify",
      element: <Verify />,
    },
    {
      path: "create_portfolio",
      element: <CreatePortfolio />,
    },
    {
      path: "/photographer",
      element: (
        <PhotographerLayout />       
      ),
      children: [
        {
          index: true,
          element: <PhotographerMain />,
        },
        {
          path: "dashboard",
          element: <PhotographerMain />,
        },
        {
          path: "search/:name",
          element: <Search />,
        },
        {
          path: "public_portfolio",
          element: <Publicview />,
        },
        {
          path: "manage_portfolio",
          element: <Portfolio />,
        },
        {
          path: "add_portfolio/view-photos/:name/:id",
          element: <ViewPhotos />,
        },
        {
          path: "events_category",
          element: <EventsCategory />,
        },
        {
          path: "events_category/:id",
          element: <PhotographerEvents />,
        },
        {
          path: "events_category/:id/create_event",
          element: <CreateEvents />,
        },
        {
          path: "event/:eventid/edit_event",
          element: <EditEvents />,
        },
        {
          path: "event/:eventid",
          element: <PhotographerSingleEvent />,
        },
        {
          path: "events_list",
          element: <EventLists />,
        },
        {
          path: "create_event",
          element: <CreateEvent />,
        },
        {
          path: "event/:eventId/subevent/:subeventId/sync_photos",
          element: <SyncPhotos/>,
        },
        {
          path: "event/:id/Payment_management",
          element: <PaymentManagement />,
        },
        {
          path: "event/:id/team_management",
          element: <ManageTeam />,
        },
        {
          path: "album",
          element: <Album />,
        },
        {
          path: "album/:id",
          element: <Albumimg />,
        },
        {
          path: "print_orders",
          element: <PrintOrders />,
        },
        {
          path: "team",
          element: <Team />,
        },
        {
          path: "upload_photos",
          element: <Events />,
        },
        {
          path: "upload_photos/:id",
          element: <SubCategory />,
        },
        {
          path: "upload_photos/:eventId/subevent/:subeventId/sync_photos",
          element: <SyncPhotos />,
        },
        {
          path: "profile",
          element: <PhotographerAccount />,
        },
        {
          path: "calendar",
          element: <Calendar />,
        },
        {
          path: "feedback",
          element: <Feedback/>,
        },
        {
          path: "upgrade_plan",
          element: <UpgradePlan />,
        },
        {
          path: "billing",
          element: <Billing/>,
        },
        {
          path: "coins",
          element: <CoinsPage />,
        },
        {
          path: "referrals",
          element: <ReferralDashboard />,
        },
        {
          path: "settings",
          element: <Settings />,
        },
      ],
    },
     {
      path: "/organization",
      element: (
        <OrganizationLayout />       
      ),
      children: [
        {
          index: true,
          element: <OrganizationMain />,
        },
        {
          path: "dashboard",
          element: <OrganizationMain />,
        },
        {
          path: "search/:name",
          element: <OrganizationSearch />,
        },
        {
          path: "public_portfolio",
          element: <OrganizationPublicview />,
        },
        {
          path: "manage_portfolio",
          element: <OrganizationPortfolio />,
        },
        {
          path: "add_portfolio/view-photos/:name/:id",
          element: <OrganizationViewPhotos />,
        },
        {
          path: "events_category",
          element: <OrganizationEventsCategory />,
        },
        {
          path: "events_category/:id",
          element: <OrganizationEvents />,
        },
        {
          path: "events_category/:id/create_event",
          element: <OrganizationCreateEvents />,
        },
        {
          path: "event/:eventid/edit_event",
          element: <OrganizationEditEvents />,
        },
        {
          path: "event/:eventid",
          element: <OrganizationSingleEvent />,
        },
        {
          path: "events_list",
          element: <OrganizationEventLists />,
        },
        {
          path: "create_event",
          element: <OrganizationCreateEvent />,
        },
        {
          path: "event/:eventId/subevent/:subeventId/sync_photos",
          element: <OrganizationSyncPhotos />,
        },
        {
          path: "event/:id/Payment_management",
          element: <OrganizationPaymentManagement />,
        },
        {
          path: "event/:id/team_management",
          element: <OrganizationManageTeam />,
        },
        {
          path: "album",
          element: <OrganizationAlbum />,
        },
        {
          path: "album/:id",
          element: <OrganizationAlbumimg />,
        },
        {
          path: "team",
          element: <OrganizationTeam />,
        },
        {
          path: "upload_photos",
          element: <OrganizationEvents />,
        },
        {
          path: "upload_photos/:id",
          element: <OrganizationSubCategory />,
        },
        {
          path: "upload_photos/:eventId/subevent/:subeventId/sync_photos",
          element: <OrganizationSyncPhotos />,
        },
        {
          path: "profile",
          element: <OrganizationAccount />,
        },
        {
          path: "calendar",
          element: <OrganizationCalendar />,
        },
        {
          path: "upgrade_plan",
          element: <OrganizationUpgradePlan />,
        },
        {
          path: "billing",
          element: <OrganizationBilling/>,
        },
        {
          path: "coins",
          element: <OrganizationCoinsPage />,
        },
        {
          path: "referrals",
          element: <OrganizationReferralDashboard />,
        },
        {
          path: "settings",
          element: <OrganizationSettings />,
        },
      ],
    },
    {
      path: "/photographer_team",
      element: <PhotographerTeamLayout />,
      children: [
        {
          index: true,
          element: <PhotographerTeamMain />,
        },
        {
          path: "dashboard",
          element: <PhotographerTeamMain />,
        },
        {
          path: "search/:name",
          element: <Searchteam />,
        },
        {
          path: "events",
          element: <PhotographerTeamEvents />,
        },
        {
          path: "event/:id",
          element: <PhotographerTeamSingleEvent />,
        },
        {
          path: "event/:id/subevent/:subid/",
          element: <PhotographerPhotos />,
        },
        {
          path: "event/:eventId/subevent/:subeventId/sync_photos",
          element: <PhotographerTeamSyncPhotos />,
        },
        {
          path: "profile",
          element: <PhotographerTeamAccount />,
        },
        {
          path: "calendar",
          element: <PhotographerTeamCalendar />,
        },
        {
          path: "settings",
          element: <PhotographerTeamSettings />,
        },
      ],
    },
  ]);

  return (
    <div className="App">
      <RouterProvider router={router} />
      <ToastContainer />
    </div>
  );
}

export default App;
